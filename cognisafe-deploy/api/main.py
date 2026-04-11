import sys
import os
import time
import uuid
import subprocess
from datetime import datetime

# Make sure pipeline modules are importable
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import tempfile
import shutil

from pipeline.transcription import transcribe_audio
from pipeline.acoustic      import extract_acoustic_features
from pipeline.nlp           import analyze_text
from pipeline.anomaly       import run_anomaly_pipeline
from pipeline.risk          import merge_biomarkers

# ── App Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CogniSafe AI Pipeline",
    description="Voice biomarker analysis API for cognitive health monitoring",
    version="1.0.0"
)

# Allow frontend to call this API from browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "ok",
        "service": "CogniSafe AI Pipeline",
        "timestamp": datetime.utcnow().isoformat()
    }


# ── Main Analyze Endpoint ─────────────────────────────────────────────────────
@app.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    user_id: str = Form(default="demo_user")
):
    """
    Main pipeline endpoint.
    Accepts an audio file (WAV, MP3, M4A, WebM, OGG, FLAC, OPUS),
    converts to WAV if needed, runs full analysis,
    returns 14 biomarkers + risk tier.
    """
    start_time = time.time()

    # ── Step 1: Validate file format ─────────────────────────────────────────
    SUPPORTED = ('.wav', '.mp3', '.m4a', '.ogg', '.flac', '.webm', '.weba', '.opus')
    filename_lower = (audio.filename or '').lower()

    if not filename_lower.endswith(SUPPORTED):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED)}"
        )

    # ── Step 2: Save uploaded file, convert to WAV if needed ─────────────────
    temp_dir  = tempfile.mkdtemp()
    ext       = os.path.splitext(filename_lower)[-1] or '.webm'
    raw_path  = os.path.join(temp_dir, f"audio_raw_{uuid.uuid4().hex}{ext}")
    temp_path = os.path.join(temp_dir, f"audio_{uuid.uuid4().hex}.wav")

    try:
        # Save the uploaded file as-is
        with open(raw_path, 'wb') as f:
            shutil.copyfileobj(audio.file, f)

        print(f"\n[API] Received: {audio.filename} ({ext}) → {raw_path}")

        # Convert to WAV using ffmpeg if not already WAV
        if ext != '.wav':
            print(f"[API] Converting {ext} → WAV via ffmpeg...")
            result = subprocess.run(
                [
                    'ffmpeg', '-y',          # overwrite output if exists
                    '-i', raw_path,          # input file
                    '-ar', '16000',          # 16kHz sample rate (Whisper optimal)
                    '-ac', '1',              # mono channel
                    '-f', 'wav',             # force WAV format
                    temp_path                # output file
                ],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode != 0:
                print(f"[ffmpeg ERROR] {result.stderr[-500:]}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Audio conversion failed: {result.stderr[-200:]}"
                )
            print("[API] Conversion done ✅")
        else:
            # Already WAV — use directly
            temp_path = raw_path

        # ── Step 3: Transcription ─────────────────────────────────────────────
        print("[API] Running Whisper transcription...")
        transcript = transcribe_audio(temp_path)

        # ── Step 4: Acoustic Features ─────────────────────────────────────────
        print("[API] Extracting acoustic features...")
        acoustic = extract_acoustic_features(temp_path, transcript_data=transcript)

        # ── Step 5: NLP Analysis ──────────────────────────────────────────────
        print("[API] Running NLP analysis...")
        nlp_scores = analyze_text(transcript)

        # ── Step 6: Merge all 14 biomarkers ──────────────────────────────────
        all_biomarkers = merge_biomarkers(acoustic, nlp_scores)

        # ── Step 7: Anomaly Detection + Risk Tier ─────────────────────────────
        print("[API] Running anomaly detection...")
        anomaly_result = run_anomaly_pipeline(user_id, all_biomarkers)

        # ── Step 8: Build final response ──────────────────────────────────────
        processing_time = round(time.time() - start_time, 2)
        print(f"[API] ✅ Done in {processing_time}s — Risk Tier: {anomaly_result['risk_tier']}")

        return {
            "session_id":              str(uuid.uuid4()),
            "user_id":                 user_id,
            "timestamp":               datetime.utcnow().isoformat(),
            "processing_time_seconds": processing_time,
            "biomarkers":              all_biomarkers,
            "anomaly_flags":           anomaly_result['anomaly_flags'],
            "risk_tier":               anomaly_result['risk_tier'],
            "confidence_intervals":    anomaly_result['confidence_intervals'],
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"[API ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Always clean up temp files
        shutil.rmtree(temp_dir, ignore_errors=True)


# ── Compare Endpoint (v1.1) ───────────────────────────────────────────────────
@app.post("/compare")
async def compare(
    session_a: dict,
    session_b: dict
):
    """
    Compare two session biomarker JSONs.
    Returns diff showing which biomarkers changed and by how much.
    """
    biomarkers_a = session_a.get('biomarkers', {})
    biomarkers_b = session_b.get('biomarkers', {})

    diff = {}
    for key in biomarkers_a:
        val_a  = biomarkers_a.get(key, 0.0)
        val_b  = biomarkers_b.get(key, 0.0)
        change = round(val_b - val_a, 4)
        pct    = round((change / val_a * 100), 2) if val_a != 0 else 0.0

        diff[key] = {
            'session_a':  val_a,
            'session_b':  val_b,
            'change':     change,
            'change_pct': pct,
            'direction':  'up' if change > 0 else ('down' if change < 0 else 'stable')
        }

    return {
        "timestamp_a": session_a.get('timestamp', ''),
        "timestamp_b": session_b.get('timestamp', ''),
        "diff":        diff
    }


# ── Startup ───────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("🚀 Starting CogniSafe AI Pipeline on port 7860...")
    uvicorn.run("main:app", host="0.0.0.0", port=7860, reload=False)
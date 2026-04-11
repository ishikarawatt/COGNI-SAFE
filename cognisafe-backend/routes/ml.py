import uuid
import threading
import httpx
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

ml_router = APIRouter(prefix="/api/ml", tags=["ml"])

HF_BASE = "https://alamfarzann-cognisafe-ml.hf.space"  # Replace with your actual HF Space URL in production

# ── In-memory job store ────────────────────────────────────────────────────────
# Shape: { job_id: { status, stage, result, error, created_at } }
# Statuses: "queued" → "processing" → "done" | "failed"
# Stages:   "uploading" → "transcribing" → "acoustic" → "nlp" → "risk" → "done"
_jobs: dict = {}


def _run_analysis(job_id: str, audio_bytes: bytes, user_id: str):
    """Runs in a background thread. Updates _jobs[job_id] as each stage completes."""
    try:
        _set_stage(job_id, "transcribing")

        # Single call to HF Space — the pipeline runs all stages internally.
        # We update the stage label every few seconds to keep the UI moving.
        # If you later split the HF Space into separate endpoints per stage,
        # you can call each one here and update the stage between calls.
        import time

        # Fire the request — up to 6 minutes
        with httpx.Client(timeout=360.0) as client:

            # Small trick: stream the response so we can update stage labels
            # while the server is still processing. Since HF returns one JSON
            # blob at the end, we can't get true per-stage events — so we
            # simulate progress by advancing the stage label on a timer thread.
            stage_timer = _StageAdvancer(job_id)
            stage_timer.start()

            try:
                response = client.post(
                    f"{HF_BASE}/analyze",
                    files={"audio": ("recording.wav", audio_bytes, "audio/wav")},
                    data={"user_id": user_id},
                )
                stage_timer.stop()
                response.raise_for_status()
            except Exception:
                stage_timer.stop()
                raise

        result = response.json()
        _jobs[job_id]["status"] = "done"
        _jobs[job_id]["stage"]  = "done"
        _jobs[job_id]["result"] = result

    except httpx.TimeoutException:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"]  = "ML service timed out after 6 minutes."
    except httpx.HTTPStatusError as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"]  = f"ML service error {e.response.status_code}: {e.response.text[:200]}"
    except Exception as e:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"]  = str(e)


def _set_stage(job_id: str, stage: str):
    if job_id in _jobs:
        _jobs[job_id]["stage"]  = stage
        _jobs[job_id]["status"] = "processing"


class _StageAdvancer(threading.Thread):
    """
    Advances the stage label on a timer so the frontend progress bar moves
    even though we can't get real per-stage events from the HF Space.
    Timing is based on typical observed pipeline durations:
      transcribing ~20s, acoustic ~15s, nlp ~30s, risk ~5s
    """
    STAGES = [
        ("transcribing", 20),
        ("acoustic",     15),
        ("nlp",          30),
        ("risk",          5),
    ]

    def __init__(self, job_id: str):
        super().__init__(daemon=True)
        self.job_id = job_id
        self._stop_event = threading.Event()

    def run(self):
        import time
        for stage, delay in self.STAGES:
            _set_stage(self.job_id, stage)
            # Wait for `delay` seconds, but bail early if stopped
            if self._stop_event.wait(timeout=delay):
                return

    def stop(self):
        self._stop_event.set()


# ── POST /api/ml/analyze ───────────────────────────────────────────────────────
@ml_router.post("/analyze")
async def analyze(
    audio: UploadFile = File(...),
    user_id: str = Form(...),
):
    """
    Accepts audio + user_id, immediately returns a job_id.
    Processing happens in a background thread.
    Poll GET /api/ml/status/{job_id} for progress.
    """
    audio_bytes = await audio.read()
    job_id = str(uuid.uuid4())

    _jobs[job_id] = {
        "status":     "queued",
        "stage":      "uploading",
        "result":     None,
        "error":      None,
        "created_at": datetime.utcnow().isoformat(),
        "user_id":    user_id,
    }

    thread = threading.Thread(
        target=_run_analysis,
        args=(job_id, audio_bytes, user_id),
        daemon=True,
    )
    thread.start()

    return {"job_id": job_id, "status": "queued"}


# ── GET /api/ml/status/{job_id} ───────────────────────────────────────────────
@ml_router.get("/status/{job_id}")
def get_status(job_id: str):
    """
    Poll this endpoint to check job progress.

    Returns:
      { job_id, status, stage, result?, error? }

    status values : "queued" | "processing" | "done" | "failed"
    stage  values : "uploading" | "transcribing" | "acoustic" | "nlp" | "risk" | "done"
    """
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return {
        "job_id": job_id,
        "status": job["status"],
        "stage":  job["stage"],
        "result": job["result"] if job["status"] == "done"    else None,
        "error":  job["error"]  if job["status"] == "failed"  else None,
    }


# ── GET /api/ml/warmup ────────────────────────────────────────────────────────
@ml_router.get("/warmup")
async def warmup():
    """Call this before recording to wake up the HF Space."""
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            r = await client.get(f"{HF_BASE}/health")
            return {"status": "warmed", "hf": r.json()}
    except Exception as e:
        return {"status": "warming", "detail": str(e)}
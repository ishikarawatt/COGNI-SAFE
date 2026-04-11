import whisper
import numpy as np
import os
import warnings
warnings.filterwarnings("ignore")


# Load model once at module level (so it doesn't reload every call)
print("[Whisper] Loading model...")
MODEL = whisper.load_model("base")
print("[Whisper] Model loaded ✅")


def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribe audio using Whisper and extract:
    - Full transcript text
    - Word-level timestamps
    - Pause events (gaps > 200ms between words)
    
    Note: Requires ffmpeg to be installed on your system.
    Windows: choco install ffmpeg  or  download from https://ffmpeg.org/download.html
    """

    if not os.path.exists(audio_path):
        print(f"[Whisper ERROR] File not found: {audio_path}")
        return _fallback_transcript()

    try:
        # ── Step 1: Transcribe with word timestamps ──────────────────────────
        result = MODEL.transcribe(
            audio_path,
            word_timestamps=True,
            language='en'
        )

        transcript_text = result['text'].strip()

        # ── Step 2: Extract word-level timestamps ────────────────────────────
        words = []
        for segment in result['segments']:
            for word_info in segment.get('words', []):
                words.append({
                    'word':  word_info['word'].strip(),
                    'start': round(word_info['start'], 3),
                    'end':   round(word_info['end'], 3),
                })

        # ── Step 3: Detect pauses between words ─────────────────────────────
        pause_events = []
        for i in range(1, len(words)):
            gap = words[i]['start'] - words[i - 1]['end']
            if gap > 0.2:  # 200ms threshold
                pause_events.append({
                    'after_word':     words[i - 1]['word'],
                    'before_word':    words[i]['word'],
                    'duration':       round(gap, 3),
                    'start_time':     words[i - 1]['end'],
                })

        print(f"[Whisper] Transcribed {len(words)} words, {len(pause_events)} pauses detected")

        return {
            'text':         transcript_text,
            'words':        words,
            'pause_events': pause_events,
            'word_count':   len(words),
            'duration':     result['segments'][-1]['end'] if result['segments'] else 0,
        }

    except FileNotFoundError as e:
        if "ffmpeg" in str(e).lower() or "winerror 2" in str(e).lower():
            print("[Whisper ERROR] ffmpeg is not installed or not in PATH")
            print("  Windows users: Install ffmpeg using one of these methods:")
            print("    1. Using Chocolatey: choco install ffmpeg")
            print("    2. Download from: https://ffmpeg.org/download.html")
            print("    3. Using winget: winget install Gyan.FFmpeg")
            print("  After installation, restart your terminal/IDE")
        else:
            print(f"[Whisper ERROR] File not found: {e}")
        return _fallback_transcript()
    except Exception as e:
        print(f"[Whisper ERROR] {e}")
        return _fallback_transcript()


def _fallback_transcript() -> dict:
    """Returns safe defaults if transcription fails — prevents pipeline crash."""
    return {
        'text':         '',
        'words':        [],
        'pause_events': [],
        'word_count':   0,
        'duration':     0,
    }
import librosa
import numpy as np


def extract_acoustic_features(audio_path: str, transcript_data: dict = None) -> dict:
    """
    Extract acoustic biomarkers using librosa only.
    No openSMILE dependency — works on any platform.
    """
    try:
        y, sr = librosa.load(audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        if duration < 1.0:
            return _fallback_acoustic()

        # ── Pitch features ────────────────────────────────────────────────────
        f0, voiced_flag, _ = librosa.pyin(
            y, fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7')
        )
        voiced_f0 = f0[voiced_flag] if voiced_flag is not None else np.array([])
        pitch_mean  = float(np.mean(voiced_f0))  if len(voiced_f0) > 0 else 0.0
        pitch_range = float(np.ptp(voiced_f0))   if len(voiced_f0) > 0 else 0.0

        # ── Jitter (pitch period perturbation) ────────────────────────────────
        if len(voiced_f0) > 1:
            periods   = 1.0 / (voiced_f0 + 1e-9)
            jitter    = float(np.mean(np.abs(np.diff(periods))) / np.mean(periods))
        else:
            jitter = 0.0

        # ── Shimmer (amplitude perturbation) ─────────────────────────────────
        rms        = librosa.feature.rms(y=y)[0]
        if len(rms) > 1:
            shimmer = float(np.mean(np.abs(np.diff(rms))) / (np.mean(rms) + 1e-9))
        else:
            shimmer = 0.0

        # ── HNR (Harmonics-to-Noise Ratio approximation) ──────────────────────
        harmonics  = librosa.effects.harmonic(y)
        noise      = y - harmonics
        hnr_val    = float(
            10 * np.log10(
                (np.sum(harmonics**2) + 1e-9) / (np.sum(noise**2) + 1e-9)
            )
        )

        # ── Pause + Speech Rate ───────────────────────────────────────────────
        pause_freq, pause_dur_mean, filled_pause_rate, \
            speech_rate, articulation_rate = compute_pause_and_rate(
                y, sr, duration, transcript_data
            )

        return {
            'speech_rate':         round(speech_rate, 4),
            'articulation_rate':   round(articulation_rate, 4),
            'pause_frequency':     round(pause_freq, 4),
            'pause_duration_mean': round(pause_dur_mean, 4),
            'filled_pause_rate':   round(filled_pause_rate, 4),
            'pitch_mean':          round(pitch_mean, 4),
            'pitch_range':         round(pitch_range, 4),
            'jitter':              round(jitter, 6),
            'shimmer':             round(shimmer, 6),
            'HNR':                 round(hnr_val, 4),
        }

    except Exception as e:
        print(f"[Acoustic ERROR] {e}")
        return _fallback_acoustic()


def compute_pause_and_rate(y, sr, duration, transcript_data=None):
    intervals      = librosa.effects.split(y, top_db=30)
    speech_samples = sum(end - start for start, end in intervals)
    speech_duration = speech_samples / sr

    pauses = []
    for i in range(1, len(intervals)):
        gap = (intervals[i][0] - intervals[i-1][1]) / sr
        if gap > 0.2:
            pauses.append(gap)

    pause_freq     = len(pauses) / (duration / 60) if duration > 0 else 0.0
    pause_dur_mean = float(np.mean(pauses)) if pauses else 0.0

    word_count = 0
    if transcript_data and 'words' in transcript_data:
        word_count = len(transcript_data['words'])

    speech_rate       = (word_count / duration) * 60 if duration > 0 else 0.0
    articulation_rate = (word_count / speech_duration) * 60 if speech_duration > 0 else 0.0

    filled_pauses = 0
    if transcript_data and 'text' in transcript_data:
        text = transcript_data['text'].lower()
        filled_pauses = text.count(' uh ') + text.count(' um ') + \
                        text.count(' uh,') + text.count(' um,')
    filled_pause_rate = filled_pauses / (duration / 60) if duration > 0 else 0.0

    return pause_freq, pause_dur_mean, filled_pause_rate, speech_rate, articulation_rate


def _fallback_acoustic():
    return {
        'speech_rate': 0.0, 'articulation_rate': 0.0,
        'pause_frequency': 0.0, 'pause_duration_mean': 0.0,
        'filled_pause_rate': 0.0, 'pitch_mean': 0.0,
        'pitch_range': 0.0, 'jitter': 0.0,
        'shimmer': 0.0, 'HNR': 0.0,
    }
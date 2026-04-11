const API    = import.meta.env.VITE_API_URL    || "http://localhost:8000";
const HF_URL = "https://alamfarzann-cognisafe-ml.hf.space";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ── Check if user already recorded today ──────────────────────────────────────
export const checkToday = async (token) => {
  const res = await fetch(`${API}/api/sessions/today`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to check today");
  return data;
};

// ── Convert audio blob → File named .wav ─────────────────────────────────────
const blobToWav = async (blob) =>
  new File([blob], "recording.wav", { type: "audio/wav" });

// ── Stage label map (for the progress bar UI) ─────────────────────────────────
export const STAGE_LABELS = {
  uploading:    "Uploading audio...",
  transcribing: "Transcribing speech (Whisper)...",
  acoustic:     "Extracting acoustic features...",
  nlp:          "Analysing language patterns...",
  risk:         "Computing risk tier...",
  done:         "Analysis complete ✓",
};

export const STAGE_ORDER = ["uploading", "transcribing", "acoustic", "nlp", "risk", "done"];

// ── Simulate stage progression while HF Space processes ──────────────────────
// HF Space returns one blob at the end, so we advance stages on a timer
// based on typical observed durations.
const STAGE_TIMINGS = [
  { stage: "transcribing", delay: 20000 },
  { stage: "acoustic",     delay: 15000 },
  { stage: "nlp",          delay: 30000 },
  { stage: "risk",         delay: 5000  },
];

// ── Submit audio DIRECTLY to HF Space and poll stage labels on a timer ────────
export const submitAudioJob = async (audioBlob, userId, onStageChange) => {
  const formData = new FormData();
  const audioFile = await blobToWav(audioBlob);
  formData.append("audio",   audioFile);
  formData.append("user_id", String(userId));

  // Start stage advancement timer in parallel
  let stopped = false;
  const advanceStages = async () => {
    for (const { stage, delay } of STAGE_TIMINGS) {
      await new Promise(r => setTimeout(r, delay));
      if (stopped) return;
      onStageChange?.(stage);
    }
  };
  advanceStages();

  try {
    // Direct call to HF Space — up to 8 minutes
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 480000); // 8 min

    const res = await fetch(`${HF_URL}/analyze`, {
      method: "POST",
      body:   formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    stopped = true;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HF Space error ${res.status}`);
    }

    onStageChange?.("done");
    return normalizeAIResult(await res.json());

  } catch (err) {
    stopped = true;
    if (err.name === "AbortError")
      throw new Error("Analysis timed out after 8 minutes — please try again.");
    throw err;
  }
};

// ── Normalise ML response → consistent internal shape ────────────────────────
export const normalizeAIResult = (raw) => {
  const bm = raw.biomarkers || {};
  return {
    risk_tier: raw.risk_tier || "Green",
    biomarkers: {
      semantic_coherence:   bm.semantic_coherence   ?? null,
      lexical_diversity:    bm.lexical_diversity     ?? null,
      idea_density:         bm.idea_density          ?? null,
      syntactic_complexity: bm.syntactic_complexity  ?? null,
      speech_rate:          bm.speech_rate           ?? null,
      pause_frequency:      bm.pause_frequency       ?? null,
      pause_duration:       bm.pause_duration_mean   ?? null,
      pitch_mean:           bm.pitch_mean            ?? null,
      pitch_range:          bm.pitch_range           ?? null,
      jitter:               bm.jitter                ?? null,
      shimmer:              bm.shimmer               ?? null,
      hnr:                  bm.HNR                   ?? null,
      articulation_rate:    bm.articulation_rate     ?? null,
      emotional_entropy:    bm.emotional_entropy      ?? null,
      filled_pause_rate:    bm.filled_pause_rate     ?? null,
    },
    anomaly_flags:        raw.anomaly_flags          || [],
    session_id:           raw.session_id             || null,
    timestamp:            raw.timestamp              || null,
    processing_time:      raw.processing_time_seconds ?? null,
    user_id:              raw.user_id                || null,
    confidence_intervals: raw.confidence_intervals   || null,
  };
};

// ── Save AI result to Render backend ─────────────────────────────────────────
export const saveSession = async (token, aiResult) => {
  const bm = aiResult.biomarkers || {};
  const payload = {
    risk_tier:            aiResult.risk_tier,
    semantic_coherence:   bm.semantic_coherence   ?? null,
    lexical_diversity:    bm.lexical_diversity     ?? null,
    idea_density:         bm.idea_density          ?? null,
    speech_rate:          bm.speech_rate           ?? null,
    pause_frequency:      bm.pause_frequency       ?? null,
    pause_duration:       bm.pause_duration        ?? null,
    pitch_mean:           bm.pitch_mean            ?? null,
    pitch_range:          bm.pitch_range           ?? null,
    jitter:               bm.jitter                ?? null,
    shimmer:              bm.shimmer               ?? null,
    hnr:                  bm.hnr                   ?? null,
    syntactic_complexity: bm.syntactic_complexity  ?? null,
    articulation_rate:    bm.articulation_rate     ?? null,
    emotional_entropy:    bm.emotional_entropy      ?? null,
    has_anomaly:          (aiResult.anomaly_flags?.length ?? 0) > 0,
    anomaly_flags:        JSON.stringify(aiResult.anomaly_flags || []),
  };

  const res = await fetch(`${API}/api/sessions`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to save session");
  return data;
};
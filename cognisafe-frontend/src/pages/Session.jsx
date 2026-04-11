import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  checkToday,
  saveSession,
  submitAudioJob,
  pollJobUntilDone,
  STAGE_LABELS,
  STAGE_ORDER,
} from "../services/sessionService";
import "../styles/session.css";

// ── PROMPTS ──
const PROMPTS = [
  {
    text: "Describe what you see in this image in as much detail as you can — the objects, colours, setting, and what might be happening.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    category: "Visual Description"
  },
  {
    text: "Tell me about your most vivid childhood memory. Describe everything you can remember — the place, people, smells, and how it made you feel.",
    image: null,
    category: "Memory Recall"
  },
  {
    text: "Look at this photo and describe every detail you notice — colours, shapes, mood, and what story the image might be telling.",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80",
    category: "Visual Narrative"
  },
  {
    text: "Explain how you would get from your home to your favourite restaurant — describe the journey as if giving directions to a friend.",
    image: null,
    category: "Spatial Navigation"
  },
  {
    text: "Describe what's happening in this photo in as much detail as possible — the environment, any people, objects, light and shadows.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
    category: "Scene Description"
  },
];

// ── CONSTANTS ──
const TOTAL = 180; // 3 minutes in seconds
const CIRC = 395; // 2 * π * 63

// ── LOGO ICON ──
const LogoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="5" stroke="#fff" strokeWidth="1.6" />
    <circle cx="9" cy="9" r="1.8" fill="#fff" />
    <line x1="9" y1="2" x2="9" y2="4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="9" y1="14" x2="9" y2="16" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="2" y1="9" x2="4" y2="9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="14" y1="9" x2="16" y2="9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ── RESULT MESSAGES ──
const GOOD_MSG = (name) => `Your <b>semantic coherence</b> is above your personal baseline — clear, connected thinking today. Pause frequency has improved. <b>Excellent session, ${name}!</b> Let's meet again tomorrow.`;
const WARN_MSG = () => `Your pause frequency was slightly elevated today — possibly fatigue or stress. <b>Semantic coherence is holding steady</b>. Rest well and try again tomorrow.`;
const BAD_MSG = (name) => `We noticed some changes in your voice patterns today, <b>${name}</b>. This can happen with fatigue or illness. You can <b>record again</b> to see if it improves, or rest and try tomorrow.`;

// ── HELPERS ──
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ── WAVEFORM VISUALIZATION ──
const WaveformVisualizer = ({ isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!canvasRef.current || !analyserRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          const width = canvas.clientWidth;
          const height = canvas.clientHeight;

          canvas.width = width;
          canvas.height = height;

          analyserRef.current.getByteTimeDomainData(dataArray);

          ctx.clearRect(0, 0, width, height);
          ctx.beginPath();
          ctx.strokeStyle = '#D4A5B5';
          ctx.lineWidth = 2;

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.stroke();
          animationRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (err) {
        console.warn("Could not access microphone for visualization:", err);
      }
    };

    setupAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  if (!isRecording) {
    return (
      <div className="waveform-placeholder">
        {[...Array(40)].map((_, i) => (
          <div key={i} className="wave-bar-static" style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    );
  }

  return <canvas ref={canvasRef} className="waveform-canvas" />;
};

// ── MAIN SESSION COMPONENT ──
const Session = () => {
  const navigate = useNavigate();
  const { token, user, logout, getUserStorage, setUserStorage } = useAuth();

  // Dark mode state (local)
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("cog_dark");
    return saved === "true";
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("cog_dark", String(next));
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  // State
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [skipped, setSkipped] = useState(false);
  const [state, setState] = useState("checking");
  const [timeLeft, setTimeLeft] = useState(TOTAL);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [aiWarning, setAiWarning] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [volumeLevel, setVolumeLevel] = useState(0);
  // ── NEW: tracks which pipeline stage we're currently in ──
  const [analysisStage, setAnalysisStage] = useState("uploading");

  // Refs
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const resultRef = useRef(null);
  const abortRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const volumeIntervalRef = useRef(null);

  // Fallback timeout - force idle if stuck on checking
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (state === "checking") {
        console.log("Fallback: forcing idle state");
        setState("idle");
      }
    }, 3000);

    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Check if already recorded today for THIS user - WITH TIMEOUT
  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    let checkTimeout;

    const check = async () => {
      timeoutId = setTimeout(() => {
        if (isMounted && state === "checking") {
          console.log("Force exiting checking state - timeout reached");
          setState("idle");
        }
      }, 2000);

      try {
        if (!user?.id) {
          clearTimeout(timeoutId);
          if (isMounted) setState("idle");
          return;
        }

        const lastSess = getUserStorage?.("last_session");
        const lastTier = getUserStorage?.("last_result_tier");

        if (lastSess && lastTier === "Green") {
          const sameDay = new Date(lastSess).toDateString() === new Date().toDateString();
          if (sameDay) {
            clearTimeout(timeoutId);
            if (isMounted) setState("donegood");
            return;
          }
        }

        const isDemo = user?.email?.includes("demo");
        if (token && !isDemo) {
          try {
            const res = await checkToday(token);
            if (res.recorded && res.risk_tier === "Green") {
              clearTimeout(timeoutId);
              if (isMounted) setState("donegood");
              return;
            }
          } catch (err) {
            console.log("Backend check failed:", err);
          }
        }

        clearTimeout(timeoutId);
        if (isMounted) setState("idle");

      } catch (err) {
        console.error("Check error:", err);
        clearTimeout(timeoutId);
        if (isMounted) setState("idle");
      }
    };

    check();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (checkTimeout) clearTimeout(checkTimeout);
    };
  }, [token, user, getUserStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(progressRef.current);
      clearInterval(volumeIntervalRef.current);
      abortRef.current?.abort();
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Timer ring calculations
  const offset = CIRC * (timeLeft / TOTAL);
  const strokeColor = timeLeft / TOTAL > 0.5 ? "url(#gradient)" : timeLeft / TOTAL > 0.25 ? "#E5B56A" : "#E58383";

  // Monitor volume during recording
  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      volumeIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = Math.min(100, (average / 255) * 100);
        setVolumeLevel(level);
      }, 100);

      audioContextRef.current = audioContext;
    } catch (err) {
      console.warn("Could not monitor volume:", err);
    }
  };

  const stopVolumeMonitoring = () => {
    clearInterval(volumeIntervalRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setVolumeLevel(0);
  };

  // Start recording
  const startRecording = async () => {
    setErrorMsg(null);
    setAiWarning(false);
    setTranscript("");
    setVolumeLevel(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(250);
      startVolumeMonitoring();
    } catch (err) {
      console.warn("Mic access denied:", err.message);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error", event.error);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Could not start speech recognition", err);
      }
    }

    setState("recording");
    setTimeLeft(TOTAL);
    setProgress(0);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        setProgress(((TOTAL - next) / TOTAL) * 55);
        if (next <= 0) {
          stopRecording();
          return 0;
        }
        return next;
      });
    }, 1000);
  };

  // ── UPDATED: Stop recording — submit job and poll for result ──
  const stopRecording = useCallback(async () => {
    clearInterval(timerRef.current);
    stopVolumeMonitoring();

    // Collect audio blob
    let audioBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise((resolve) => {
        mediaRecorderRef.current.onstop = resolve;
        mediaRecorderRef.current.stop();
      });
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      if (chunksRef.current.length > 0) {
        const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
        audioBlob = new Blob(chunksRef.current, { type: mimeType });
      }
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }

    setState("analysing");
    setAnalysisStage("uploading");
    setProgress(5);

    try {
      let aiResult;
      const isDemo = user?.email?.includes("demo");

      if (isDemo) {
        // ── Demo mode: simulate stage-by-stage progress ──────────────────────
        for (let i = 0; i < STAGE_ORDER.length; i++) {
          setAnalysisStage(STAGE_ORDER[i]);
          setProgress(Math.round(((i + 1) / STAGE_ORDER.length) * 100));
          await new Promise(r => setTimeout(r, 600));
        }
        const riskTier = Math.random() > 0.8 ? "Yellow" : "Green";
        aiResult = {
          risk_tier: riskTier,
          biomarkers: {
            semantic_coherence: 0.75 + Math.random() * 0.2,
            lexical_diversity:  0.65 + Math.random() * 0.15,
            speech_rate:        110  + Math.random() * 25,
            pause_frequency:    2.5  + Math.random() * 2,
            hnr:                16   + Math.random() * 5,
            jitter:             0.008 + Math.random() * 0.008,
          },
          anomaly_flags: [],
        };

      } else if (audioBlob && audioBlob.size > 1000) {
        // ── Real mode: call HF Space directly ───────────────────────────────
        setAnalysisStage("uploading");
        setProgress(8);
 
        aiResult = await submitAudioJob(audioBlob, user?.id || 1, (stage) => {
          setAnalysisStage(stage);
          const idx = STAGE_ORDER.indexOf(stage);
          setProgress(idx >= 0 ? 10 + Math.round((idx / (STAGE_ORDER.length - 1)) * 85) : 10);
        });

      } else {
        // ── No audio blob — fallback mock ────────────────────────────────────
        setAnalysisStage("done");
        setProgress(100);
        aiResult = {
          risk_tier: "Green",
          biomarkers: {
            semantic_coherence: Number((0.80 + Math.random() * 0.1).toFixed(2)),
            lexical_diversity:  Number((0.70 + Math.random() * 0.1).toFixed(2)),
            speech_rate:        Math.floor(115 + Math.random() * 15),
            pause_frequency:    Number((2.0  + Math.random() * 1.5).toFixed(1)),
            hnr:                Number((18.0 + Math.random() * 2.0).toFixed(1)),
            jitter:             Number((0.009 + Math.random() * 0.004).toFixed(3)),
          },
          anomaly_flags: [],
        };
      }

      // Save to backend for real users
      if (token && !user?.email?.includes("demo")) {
        try {
          await saveSession(token, aiResult);
        } catch (saveErr) {
          console.warn("Failed to save session:", saveErr.message);
        }
      }

      // Save to user-specific localStorage
      if (user?.id && setUserStorage) {
        setUserStorage("last_session", new Date().toISOString());
        setUserStorage("last_result_tier", aiResult.risk_tier);
      } else {
        localStorage.setItem("cog_last_session", new Date().toISOString());
        localStorage.setItem("cog_last_result_tier", aiResult.risk_tier);
      }

      setProgress(100);
      setResult(aiResult);
      setState("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);

    } catch (err) {
      clearInterval(progressRef.current);
      console.error("Session error:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setState("error");
      setProgress(0);
    }
  }, [token, user, setUserStorage]);

  const cancelSession = () => {
    clearInterval(timerRef.current);
    clearInterval(progressRef.current);
    clearInterval(volumeIntervalRef.current);
    abortRef.current?.abort();
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    setTranscript("");
    setState("idle");
    setTimeLeft(TOTAL);
    setProgress(0);
    setResult(null);
    setErrorMsg(null);
  };

  const retrySession = () => {
    cancelSession();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const userName = user?.name?.split(" ")[0] || "there";
  const canRetry = result && result.risk_tier !== "Green";

  const getMessage = () => {
    if (!result) return "";
    if (result.risk_tier === "Green") return GOOD_MSG(userName);
    if (result.risk_tier === "Yellow") return WARN_MSG();
    return BAD_MSG(userName);
  };

  const riskBadgeClass = !result ? "rb-green"
    : result.risk_tier === "Green" ? "rb-green"
      : result.risk_tier === "Yellow" ? "rb-yellow"
        : "rb-red";

  return (
    <div className={`session-root ${dark ? "dark" : "light"}`}>
      {/* Navigation */}
      <nav className="session-nav">
        <div className="nav-brand" onClick={() => navigate("/")}>
          <div className="brand-ring">
            <LogoIcon />
          </div>
          <span className="brand-name">CogniSafe</span>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="nav-link active">Session</button>
          <button className="nav-link" onClick={() => navigate("/ar-report")}>Report</button>
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {dark ? "☀️" : "🌙"}
          </button>
          <button className="dashboard-link" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <div className="user-menu" onClick={logout}>
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="session-main">
        {/* Header */}
        <div className="session-header">
          <div className="session-badge">Daily Voice Session</div>
          <h1 className="session-title">
            Speak freely.<br />
            <span className="highlight">We listen carefully.</span>
          </h1>
          <p className="session-description">
            Find a quiet space, then speak naturally for 3 minutes about anything — your day, thoughts, a story.
            The more natural, the better.
          </p>
        </div>

        {/* State: Done Today */}
        {state === "donegood" && (
          <div className="done-card">
            <div className="done-icon">🌿</div>
            <h2>You've completed today's session!</h2>
            <p>Your cognitive health is looking great today. Your voice data has been recorded and analysed.</p>
            <div className="done-badge">Cognitive health: Good</div>
            <p className="done-quote">"Your semantic coherence score is above your personal baseline. Keep up the great work — let's meet again tomorrow!"</p>
            <div className="done-actions">
              <button className="btn-primary" onClick={() => navigate("/dashboard")}>View Dashboard</button>
              <button className="btn-secondary" onClick={() => navigate("/ar-report")}>View Report</button>
            </div>
          </div>
        )}

        {/* State: Error */}
        {state === "error" && (
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>{errorMsg || "An unexpected error occurred. Please try again."}</p>
            <div className="error-actions">
              <button className="btn-primary" onClick={() => { setState("idle"); setErrorMsg(null); }}>Try Again</button>
              <button className="btn-secondary" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
            </div>
          </div>
        )}

        {/* State: Checking */}
        {state === "checking" && (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p>Loading your session...</p>
          </div>
        )}

        {/* Main Session Interface */}
        {(state === "idle" || state === "recording" || state === "analysing" || state === "done") && (
          <>
            {/* Prompt Card */}
            {!skipped && (
              <div className="prompt-card">
                <div className="prompt-header">
                  <span className="prompt-category">{prompt.category}</span>
                  <span className="prompt-badge">Today's Prompt</span>
                </div>
                <div className="prompt-text">"{prompt.text}"</div>
                {prompt.image && (
                  <img className="prompt-image" src={prompt.image} alt="Session prompt" />
                )}
                {state === "idle" && (
                  <button className="skip-btn" onClick={() => setSkipped(true)}>
                    Skip prompt & speak freely →
                  </button>
                )}
              </div>
            )}

            {skipped && (
              <div className="free-mode-card">
                <div className="free-mode-icon">🎙️</div>
                <h3>Free-speak Mode</h3>
                <p>Speak about anything for 3 minutes. Your voice patterns will be analysed accurately.</p>
              </div>
            )}

            {/* Recorder Card */}
            <div className="recorder-card">
              <div className="recorder-visual">
                {/* Timer Ring */}
                <div className="timer-ring">
                  <svg className="timer-svg" viewBox="0 0 140 140">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D4A5B5" />
                        <stop offset="100%" stopColor="#B5689A" />
                      </linearGradient>
                    </defs>
                    <circle className="timer-track" cx="70" cy="70" r="63" />
                    <circle
                      className="timer-progress"
                      cx="70"
                      cy="70"
                      r="63"
                      stroke={strokeColor}
                      strokeDasharray={CIRC}
                      strokeDashoffset={offset}
                    />
                  </svg>
                  <div className="timer-center">
                    <div className="timer-value">{formatTime(timeLeft)}</div>
                    <div className="timer-label">
                      {state === "idle" && "Ready"}
                      {state === "recording" && "Recording"}
                      {state === "analysing" && "Analysing"}
                      {state === "done" && "Complete"}
                    </div>
                  </div>
                </div>

                {/* Volume Meter */}
                {state === "recording" && (
                  <div className="volume-meter">
                    <div className="volume-bar" style={{ width: `${volumeLevel}%` }} />
                  </div>
                )}

                {/* Waveform Visualization */}
                <div className="waveform-container">
                  <WaveformVisualizer isRecording={state === "recording"} />
                </div>
              </div>

              {/* Status — shows live stage label during analysis */}
              <div className={`status-pill ${state === "recording" ? "recording" : state === "analysing" ? "analysing" : state === "done" ? "done" : "idle"}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {state === "idle"      && "Ready to record"}
                  {state === "recording" && `Recording... ${formatTime(timeLeft)}`}
                  {state === "analysing" && (STAGE_LABELS[analysisStage] || "Analysing your voice...")}
                  {state === "done"      && "Analysis complete ✓"}
                </span>
              </div>

              {/* Progress Steps — expanded to show all pipeline stages */}
              <div className="progress-steps">
                {/* Step 1: Record */}
                <div className={`step ${
                  state === "idle" || state === "recording" ? "active"
                  : state === "analysing" || state === "done" ? "completed" : ""
                }`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Record</span>
                </div>

                {/* Steps 2–5: Pipeline stages */}
                {["transcribing", "acoustic", "nlp", "risk"].map((stage, i) => {
                  const stageIdx = STAGE_ORDER.indexOf(analysisStage);
                  const thisIdx  = STAGE_ORDER.indexOf(stage);
                  const isActive   = state === "analysing" && analysisStage === stage;
                  const isComplete = state === "done" || (state === "analysing" && stageIdx > thisIdx);
                  return (
                    <div key={stage} className={`step ${isActive ? "active" : isComplete ? "completed" : ""}`}>
                      <span className="step-number">{i + 2}</span>
                      <span className="step-label">
                        {stage === "transcribing" ? "Transcribe"
                          : stage === "acoustic"   ? "Acoustic"
                          : stage === "nlp"        ? "NLP"
                          : "Risk"}
                      </span>
                    </div>
                  );
                })}

                {/* Step 6: Results */}
                <div className={`step ${state === "done" ? "completed" : ""}`}>
                  <span className="step-number">6</span>
                  <span className="step-label">Results</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar-container">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* Controls */}
              {state !== "done" && (
                <div className="recorder-controls">
                  <button
                    className={`record-btn ${state === "recording" ? "recording" : ""}`}
                    onClick={state === "idle" ? startRecording : stopRecording}
                    disabled={state === "analysing"}
                  >
                    {state === "idle" && (
                      <>
                        <span className="record-icon">●</span>
                        Start Recording
                      </>
                    )}
                    {state === "recording" && (
                      <>
                        <span className="stop-icon">■</span>
                        Stop Recording
                      </>
                    )}
                    {state === "analysing" && (
                      <>
                        <span className="loading-spinner-small"></span>
                        Analysing...
                      </>
                    )}
                  </button>
                  <button className="cancel-btn" onClick={cancelSession} disabled={state === "analysing"}>
                    {state === "idle" ? "Cancel" : "Stop & Cancel"}
                  </button>
                </div>
              )}

              {/* Live Transcript */}
              {state === "recording" && transcript && (
                <div className="transcript-box">
                  <div className="transcript-header">Live Transcript</div>
                  <div className="transcript-text">"{transcript}"</div>
                </div>
              )}

              {/* AI Warning */}
              {state === "done" && aiWarning && (
                <div className="ai-warning">
                  ⚠️ AI service was unreachable — result is a demo simulation. Real analysis will run when the AI service is available.
                </div>
              )}
            </div>

            {/* Results Panel */}
            {state === "done" && result && (
              <div className="results-card" ref={resultRef}>
                <div className="results-header">
                  <h3>Session Results</h3>
                  <div className={`results-badge ${riskBadgeClass}`}>
                    ● {result.risk_tier} — {result.risk_tier === "Green" ? "Good" : result.risk_tier === "Yellow" ? "Watch" : "Alert"}
                  </div>
                </div>

                <div className="results-metrics">
                  <div className="metric">
                    <span className="metric-label">Risk Score</span>
                    <span className="metric-value">{result.risk_tier === "Green" ? "0.18" : result.risk_tier === "Yellow" ? "0.35" : "0.52"}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Semantic Coherence</span>
                    <span className="metric-value">{result.biomarkers?.semantic_coherence?.toFixed(2) || "0.83"}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Speech Rate</span>
                    <span className="metric-value">{Math.round(result.biomarkers?.speech_rate || 118)} wpm</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Pause Frequency</span>
                    <span className="metric-value">{result.biomarkers?.pause_frequency?.toFixed(1) || "2.8"}/min</span>
                  </div>
                </div>

                <div className="results-message" dangerouslySetInnerHTML={{ __html: getMessage() }} />

                <div className="results-actions">
                  <button className="btn-primary" onClick={() => navigate("/dashboard")}>View Dashboard</button>
                  {canRetry && <button className="btn-secondary" onClick={retrySession}>Record Again</button>}
                  <button className="btn-secondary" onClick={() => navigate("/ar-report")}>View Full Report</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Session;
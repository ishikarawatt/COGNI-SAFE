import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLatestSession, getTrajectory } from "../services/dashboardService";
import "../styles/brain.css";

// ── STATIC DATA (used as fallback if API unavailable) ──
const MONTHS_LABELS_EMPTY = [];
const SCORES_STATIC_EMPTY = [];

const MONTHS_LABELS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Now"];
const SCORES_STATIC = [78, 79, 81, 80, 82, 84];

const REGIONS_EMPTY = [
  { name: "Prefrontal", score: "—", color: "#10B981", status: "ok", desc: "Controls working memory..." },
  { name: "Temporal",   score: "—", color: "#10B981", status: "ok", desc: "Responsible for language comprehension..." },
  { name: "Parietal",   score: "—", color: "#10B981", status: "ok", desc: "Spatial processing and sensory integration." },
  { name: "Broca's",    score: "—", color: "#10B981", status: "ok", desc: "Speech production area." },
  { name: "Wernicke's", score: "—", color: "#10B981", status: "ok", desc: "Language comprehension is healthy." },
  { name: "Cerebellum", score: "—", color: "#10B981", status: "ok", desc: "Motor coordination and speech rhythm." },
];

const REGIONS = [
  { name: "Prefrontal", score: 88, color: "#10B981", status: "ok", desc: "Controls working memory, decision-making and executive function." },
  { name: "Temporal",   score: 72, color: "#EF4444", status: "bad", desc: "Responsible for language comprehension and verbal memory. Monitor closely." },
  { name: "Parietal",   score: 91, color: "#10B981", status: "ok", desc: "Spatial processing and sensory integration are excellent." },
  { name: "Broca's",    score: 79, color: "#F59E0B", status: "warn", desc: "Speech production area is slightly below baseline." },
  { name: "Wernicke's", score: 85, color: "#10B981", status: "ok", desc: "Language comprehension is healthy." },
  { name: "Cerebellum", score: 94, color: "#10B981", status: "ok", desc: "Motor coordination and speech rhythm are excellent." },
];

// Map biomarker keys → brain region indices (for real data integration)
const BIOMARKER_TO_REGION = {
  semantic_coherence:   [0, 2],     // Prefrontal + Parietal
  lexical_diversity:    [1, 4],     // Temporal + Wernicke's
  idea_density:         [0],        // Prefrontal
  speech_rate:          [3],        // Broca's
  pause_frequency:      [3],        // Broca's
  pause_duration:       [5],        // Cerebellum
  pitch_mean:           [5],        // Cerebellum
  articulation_rate:    [5],        // Cerebellum
  syntactic_complexity: [0, 1],     // Prefrontal + Temporal
  emotional_entropy:    [2],        // Parietal
};

const ANOMALIES_STATIC = [
  { icon: "🧠", name: "Semantic coherence", val: "0.81", status: "ok",   label: "Normal"   },
  { icon: "🗣️", name: "Speech rate",        val: "118",  status: "ok",   label: "Normal"   },
  { icon: "⏸️", name: "Pause frequency",    val: "3.2",  status: "warn", label: "Elevated" },
  { icon: "🎵", name: "Pitch mean F0",       val: "182",  status: "ok",   label: "Normal"   },
  { icon: "📊", name: "Lexical diversity",   val: "0.74", status: "warn", label: "Watch"    },
  { icon: "⚡", name: "HNR ratio",           val: "18.4", status: "ok",   label: "Normal"   },
];

// ── LOGO ──
const LogoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="5" stroke="#fff" strokeWidth="1.6"/>
    <circle cx="9" cy="9" r="1.8" fill="#fff"/>
    <line x1="9" y1="2"  x2="9"  y2="4"  stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="9" y1="14" x2="9"  y2="16" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="2" y1="9"  x2="4"  y2="9"  stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="14" y1="9" x2="16" y2="9"  stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

// ── BRAIN CANVAS ──
const BrainCanvas = ({ dark, selected, onSelect, onHover }) => {
  const canvasRef  = useRef(null);
  const regionsRef = useRef([]);
  const rafRef     = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth;
    const H   = 260;
    if (canvas.width !== W * dpr) {
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = W / 2, cy = H / 2 - 10;
    const t  = Date.now() / 1200;

    // Background
    ctx.fillStyle = dark ? "#061A10" : "#E8FFF4";
    ctx.fillRect(0, 0, W, H);

    // Brain outline glow
    ctx.save();
    ctx.shadowColor = dark ? "rgba(110,231,183,0.15)" : "rgba(16,185,129,0.12)";
    ctx.shadowBlur  = 24;
    ctx.beginPath();
    ctx.ellipse(cx, cy, W * 0.38, H * 0.43, 0, 0, Math.PI * 2);
    ctx.fillStyle   = dark ? "rgba(16,185,129,0.04)" : "rgba(16,185,129,0.06)";
    ctx.fill();
    ctx.strokeStyle = dark ? "rgba(110,231,183,0.3)" : "rgba(16,185,129,0.25)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();

    // Midline dashes
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = dark ? "rgba(110,231,183,0.12)" : "rgba(16,185,129,0.15)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - H * 0.38);
    ctx.lineTo(cx, cy + H * 0.32);
    ctx.stroke();
    ctx.setLineDash([]);

    // Region definitions (relative to canvas size)
    const RX = [
      { cx: cx - W*0.15, cy: cy - H*0.22, rx: W*0.14, ry: H*0.17, i: 0 },
      { cx: cx + W*0.15, cy: cy - H*0.22, rx: W*0.14, ry: H*0.17, i: 1 },
      { cx: cx,          cy: cy + H*0.04, rx: W*0.16, ry: H*0.16, i: 2 },
      { cx: cx - W*0.18, cy: cy + H*0.18, rx: W*0.10, ry: H*0.12, i: 3 },
      { cx: cx + W*0.18, cy: cy + H*0.18, rx: W*0.10, ry: H*0.12, i: 4 },
      { cx: cx,          cy: cy + H*0.32, rx: W*0.10, ry: H*0.09, i: 5 },
    ];
    regionsRef.current = RX;

    // Draw each region
    RX.forEach(reg => {
      const r      = REGIONS[reg.i];
      const isSel  = selected === reg.i;
      const pulse  = Math.sin(t + reg.i);
      const alpha  = isSel ? 0.55 : 0.28 + pulse * 0.06;
      const alphaH = Math.round(Math.max(0, Math.min(255, alpha * 255)))
        .toString(16).padStart(2, "0");

      ctx.save();
      if (isSel) {
        ctx.shadowColor = r.color;
        ctx.shadowBlur  = 22;
      }
      ctx.beginPath();
      ctx.ellipse(reg.cx, reg.cy, reg.rx, reg.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle   = r.color + alphaH;
      ctx.fill();
      ctx.strokeStyle = r.color + (isSel ? "CC" : "66");
      ctx.lineWidth   = isSel ? 2.5 : 1.2;
      ctx.stroke();
      ctx.restore();

      // Score label
      ctx.font      = `bold ${isSel ? 13 : 11}px Plus Jakarta Sans,sans-serif`;
      ctx.fillStyle = dark ? "#E0FFF0" : "#051A10";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(r.score, reg.cx, reg.cy);

      // Region name
      ctx.font      = `500 ${isSel ? 10 : 9}px Plus Jakarta Sans,sans-serif`;
      ctx.fillStyle = r.color;
      ctx.fillText(r.name, reg.cx, reg.cy + (isSel ? 16 : 14));
    });

    rafRef.current = requestAnimationFrame(draw);
  }, [dark, selected]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // Hit testing
  const getRegionAt = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !regionsRef.current.length) return null;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.offsetWidth / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleX;
    for (const reg of regionsRef.current) {
      const dx = (mx - reg.cx) / reg.rx;
      const dy = (my - reg.cy) / reg.ry;
      if (dx * dx + dy * dy <= 1) return reg.i;
    }
    return null;
  }, []);

  return (
    <div className="brain-canvas-container" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        className="brain-canvas"
        height={260}
        onMouseMove={e => {
          const i = getRegionAt(e);
          onHover(i, e);
          if (canvasRef.current)
            canvasRef.current.style.cursor = i !== null ? "pointer" : "crosshair";
        }}
        onMouseLeave={() => onHover(null, null)}
        onClick={e => {
          const i = getRegionAt(e);
          if (i !== null) onSelect(i);
        }}
      />
    </div>
  );
};

// ── TRAJECTORY CANVAS ──
const TrajCanvas = ({ dark, month, scores, labels }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.offsetWidth || 400;
    const H   = 80;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    if (!scores || scores.length < 2) {
      ctx.fillStyle = dark ? "#9CA3AF" : "#6B7280";
      ctx.font = "12px Plus Jakarta Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(scores?.length === 1 ? "1 session recorded. Need 1 more to plot trajectory." : "No trajectory history found. Record more sessions.", W/2, H/2);
      return;
    }

    const min  = Math.min(...scores) - 2;
    const max  = Math.max(...scores) + 2;
    const range = max - min || 1;

    const pts = scores.map((s, i) => ({
      x: (i / (scores.length - 1)) * W,
      y: H - ((s - min) / range) * (H - 16) - 8,
    }));

    // Area fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, dark ? "rgba(110,231,183,0.25)" : "rgba(16,185,129,0.18)");
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    const lg = ctx.createLinearGradient(0, 0, W, 0);
    lg.addColorStop(0,   "#10B981");
    lg.addColorStop(0.5, "#6366F1");
    lg.addColorStop(1,   "#F59E0B");
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = lg;
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = "round";
    ctx.lineCap     = "round";
    ctx.stroke();

    // Dots
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === month ? 6 : 3.5, 0, Math.PI * 2);
      if (i === month) { ctx.shadowColor = "#F59E0B"; ctx.shadowBlur = 10; }
      ctx.fillStyle = i === month ? "#F59E0B" : dark ? "#6EE7B7" : "#10B981";
      ctx.fill();
      ctx.shadowBlur = 0;

      if (i === month) {
        ctx.font         = "bold 10px Plus Jakarta Sans,sans-serif";
        ctx.fillStyle    = dark ? "#FDE68A" : "#1A0D00";
        ctx.textAlign    = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(scores[i], p.x, p.y - 8);
      }
    });
  }, [dark, month, scores, labels]);

  return <canvas ref={ref} className="traj-canvas" height={80} />;
};

// ── MAIN ──
const Brain = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [dark, setDark]           = useState(() => localStorage.getItem("cog_dark") === "true");
  const [selected, setSelected]   = useState(null);
  const [hovered, setHovered]     = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [month, setMonth]         = useState(5);

  const isDemo = user?.email?.includes("demo");

  // API data
  const [scores, setScores]       = useState(isDemo ? SCORES_STATIC : SCORES_STATIC_EMPTY);
  const [monthLabels, setMonthLabels] = useState(isDemo ? MONTHS_LABELS : MONTHS_LABELS_EMPTY);
  const [regions, setRegions]     = useState(isDemo ? REGIONS : REGIONS_EMPTY);
  const [anomalies, setAnomalies] = useState(ANOMALIES_STATIC);
  const [latestSession, setLatestSession] = useState(null);
  const [fetching, setFetching]   = useState(true);

  const toggleDark = () => {
    const n = !dark;
    setDark(n);
    localStorage.setItem("cog_dark", String(n));
  };

  // ── Fetch real data ──
  useEffect(() => {
    if (!token) { setFetching(false); return; }

    const fetchAll = async () => {
      try {
        const [traj, latest] = await Promise.all([
          getTrajectory(token, 6),
          getLatestSession(token),
        ]);

        // Update trajectory chart
        if (traj && traj.length > 0 && !isDemo) {
          setScores(traj.map(t => t.score));
          setMonthLabels(traj.map(t => {
            const d = new Date(t.month + "-01");
            return d.toLocaleString("en-US", { month: "short" });
          }));
          setMonth(traj.length - 1);
        }

        // Update latest session
        if (latest) {
          setLatestSession(latest);

          // Build anomaly grid from real biomarkers
          const bm = latest.biomarkers || latest;
          const flags = (() => {
            try {
              return Array.isArray(latest.anomaly_flags)
                ? latest.anomaly_flags
                : JSON.parse(latest.anomaly_flags || "[]");
            } catch { return []; }
          })();

          const anomalyData = [
            { icon: "🧠", name: "Semantic coherence", key: "semantic_coherence", unit: "",  normal: [0.7, 1.0] },
            { icon: "🗣️", name: "Speech rate",        key: "speech_rate",        unit: "",  normal: [90, 150]  },
            { icon: "⏸️", name: "Pause frequency",    key: "pause_frequency",    unit: "",  normal: [0, 4.0]   },
            { icon: "🎵", name: "Pitch mean F0",       key: "pitch_mean",         unit: "Hz",normal: [120, 220] },
            { icon: "📊", name: "Lexical diversity",   key: "lexical_diversity",  unit: "",  normal: [0.65, 1.0]},
            { icon: "⚡", name: "HNR ratio",           key: "hnr",                unit: "dB",normal: [15, 25]   },
          ];

          const realAnomalies = anomalyData.map(a => {
            const rawVal = bm?.[a.key];
            const isFlagged = flags.includes(a.key);
            const val = rawVal != null
              ? (typeof rawVal === "number" ? rawVal.toFixed(rawVal < 10 ? 2 : 0) : rawVal)
              : "—";
            const inRange = rawVal != null
              ? (rawVal >= a.normal[0] && rawVal <= a.normal[1])
              : true;
            return {
              icon:   a.icon,
              name:   a.name,
              val,
              status: isFlagged ? "warn" : inRange ? "ok" : "warn",
              label:  isFlagged ? "Flagged" : inRange ? "Normal" : "Watch",
            };
          });
          setAnomalies(realAnomalies);

          if (bm && Object.keys(bm).length > 0 && !isDemo) {
            const updatedRegions = [...REGIONS_EMPTY];
            
            // 0: Prefrontal (Idea density)
            if (bm.idea_density != null) {
              const sc = Math.min(100, Math.max(0, Math.round(bm.idea_density * 180)));
              updatedRegions[0] = { ...updatedRegions[0], score: sc, status: sc < 70 ? "bad" : "ok", color: sc < 70 ? "#EF4444" : "#10B981" };
            }
            // 1: Temporal (Lexical diversity)
            if (bm.lexical_diversity != null) {
              const sc = Math.min(100, Math.max(0, Math.round(bm.lexical_diversity * 100)));
              updatedRegions[1] = { ...updatedRegions[1], score: sc, status: sc < 65 ? "bad" : sc < 72 ? "warn" : "ok", color: sc < 65 ? "#EF4444" : sc < 72 ? "#F59E0B" : "#10B981" };
            }
            // 2: Parietal (Semantic coherence)
            if (bm.semantic_coherence != null) {
              const sc = Math.min(100, Math.max(0, Math.round(bm.semantic_coherence * 100)));
              updatedRegions[2] = { ...updatedRegions[2], score: sc, status: sc < 75 ? "warn" : "ok", color: sc < 75 ? "#F59E0B" : "#10B981" };
            }
            // 3: Broca's (Pause frequency)
            if (bm.pause_frequency != null) {
              const bs = Math.max(0, Math.min(100, Math.round(100 - (bm.pause_frequency - 2.5) * 10)));
              updatedRegions[3] = { ...updatedRegions[3], score: bs, status: bs < 70 ? "bad" : bs < 80 ? "warn" : "ok", color: bs < 70 ? "#EF4444" : bs < 80 ? "#F59E0B" : "#10B981" };
            }
            // 4: Wernicke's (Syntactic complexity)
            if (bm.syntactic_complexity != null) {
               const sc = Math.min(100, Math.max(0, Math.round((bm.syntactic_complexity / 7) * 100)));
               updatedRegions[4] = { ...updatedRegions[4], score: sc, status: sc < 60 ? "warn" : "ok", color: sc < 60 ? "#F59E0B" : "#10B981" };
            }
            // 5: Cerebellum (Articulation_rate)
            if (bm.articulation_rate != null) {
              const cs = Math.round(Math.min(100, Math.max(0, (bm.articulation_rate / 5.5) * 100)));
              updatedRegions[5] = { ...updatedRegions[5], score: cs, status: cs < 70 ? "bad" : cs < 80 ? "warn" : "ok", color: cs < 70 ? "#EF4444" : cs < 80 ? "#F59E0B" : "#10B981" };
            }
            setRegions(updatedRegions);
          }
        }
      } catch (err) {
        console.error("Brain page fetch error:", err);
        if (err.message?.includes("401")) logout();
        // Keep static fallback data
      } finally {
        setFetching(false);
      }
    };

    fetchAll();
  }, [token]);

  // ── Hover handler ──
  const handleHover = useCallback((i, e) => {
    setHovered(i);
    if (e && i !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top  - 8,
      });
    }
  }, []);

  // ── Status badge helpers ──
  const statusBg = (status) => ({
    ok:   ["rgba(16,185,129,0.12)", "rgba(16,185,129,0.3)", "var(--success)"],
    warn: ["rgba(245,158,11,0.12)", "rgba(245,158,11,0.3)", "var(--warn)"],
    bad:  ["rgba(239,68,68,0.12)",  "rgba(239,68,68,0.3)",  "var(--danger)"],
  }[status] || ["rgba(16,185,129,0.12)", "rgba(16,185,129,0.3)", "var(--success)"]);

  const selRegion = selected !== null ? regions[selected] : null;
  const hovRegion = hovered  !== null ? regions[hovered]  : null;

  const cardSubText = hovRegion
    ? `${hovRegion.name} lobe — Score ${hovRegion.score}/100`
    : selRegion
    ? `${selRegion.name} lobe — Score ${selRegion.score}/100`
    : "Hover or click a region to inspect";

  // Overall score from trajectory
  const overallScore = scores.length > 0 && scores[month] !== undefined ? scores[month] : "—";
  const scoreDelta   = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

  // Weakest / strongest regions
  const valid_regions = regions.filter(r => typeof r.score === 'number');
  const sortedRegions = valid_regions.sort((a, b) => a.score - b.score);
  const weakestRegion = sortedRegions.length > 0 ? sortedRegions[0] : { name: "—", score: "—" };
  const strongestRegion = sortedRegions.length > 0 ? sortedRegions[sortedRegions.length - 1] : { name: "—", score: "—" };

  // NAV LINKS
  const NAV_LINKS = [
    ["Dashboard", "/dashboard"],
    ["Session",   "/session"],
    ["Brain",     "/brain"],
    ["Report",    "/ar-report"],
  ];

  return (
    <div className={`brain-root ${dark ? "dm" : "lm"}`}>

      {/* ── NAV ── */}
      <nav className="dash-nav">
        <a href="/dashboard" className="nav-logo">
          <div className="nav-logo-box"><LogoIcon /></div>
          <span className="nav-logo-name">CogniSafe</span>
        </a>
        <div className="nav-links">
          {NAV_LINKS.map(([label, path]) => (
            <button key={label}
              className={`nav-link ${window.location.pathname === path ? "active" : ""}`}
              onClick={() => navigate(path)}>
              {label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <button className="nav-mode-btn" onClick={toggleDark}>
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button className="nav-session-btn" onClick={() => navigate("/session")}>
            + Start session
          </button>
          <div className="nav-avatar"
            title="Click to logout"
            style={{ cursor: "pointer" }}
            onClick={logout}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </nav>

      {/* ── PAGE ── */}
      <div className="brain-page">
        <div className="page-sub">Neural heatmap · real-time</div>
        <div className="page-title">Your <em>brain health</em> visualised</div>

        {/* ── STATS ROW ── */}
        <div className="brain-stats">
          <div className="brain-stat bs-score">
            <div className="bs-label">Overall brain score</div>
            <div className="bs-value">{overallScore}</div>
            <div className="bs-sub">
              {overallScore >= 85 ? "85th+ percentile" : overallScore >= 75 ? "70–85th percentile" : "Below average"}
            </div>
            <div className="bs-badge">
              {scoreDelta >= 0 ? `▲ +${scoreDelta} pts this period` : `▼ ${scoreDelta} pts this period`}
            </div>
          </div>
          <div className="brain-stat bs-weak">
            <div className="bs-label">Weakest region</div>
            <div className="bs-value" style={{ fontSize: 22, marginTop: 6 }}>{weakestRegion.name}</div>
            <div className="bs-sub">Score {weakestRegion.score} · needs monitoring</div>
            <div className="bs-badge">⚠ Watch closely</div>
          </div>
          <div className="brain-stat bs-strong">
            <div className="bs-label">Strongest region</div>
            <div className="bs-value" style={{ fontSize: 22, marginTop: 6 }}>{strongestRegion.name}</div>
            <div className="bs-sub">Score {strongestRegion.score} · excellent</div>
            <div className="bs-badge">✦ Excellent</div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="brain-main">

          {/* LEFT — BRAIN MAP + REGION LIST */}
          <div className="b-card">
            <div className="b-card-title">Neural heatmap</div>
            <div className="b-card-sub">{cardSubText}</div>

            {/* Brain canvas with tooltip */}
            <div style={{ position: "relative" }}>
              <BrainCanvas
                dark={dark}
                selected={selected}
                onSelect={setSelected}
                onHover={handleHover}
              />
              {hovered !== null && (
                <div className="brain-tooltip" style={{
                  left: tooltipPos.x,
                  top:  tooltipPos.y,
                  opacity: 1,
                }}>
                  {regions[hovered].name} lobe: {regions[hovered].score}/100
                </div>
              )}
            </div>

            {/* Region list */}
            <div className="region-list">
              {regions.map((r, i) => (
                <div
                  key={r.name}
                  className={`region-row ${selected === i ? "active" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <div className="region-dot" style={{ background: r.color }} />
                  <span className="region-name">{r.name}</span>
                  <div className="region-bar-track">
                    <div className="region-bar-fill" style={{
                      width:      `${r.score}%`,
                      background: r.color,
                    }} />
                  </div>
                  <span className="region-score" style={{ color: r.color }}>{r.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — INSIGHT + TRAJECTORY */}
          <div className="brain-right">

            {/* INSIGHT CARD */}
            <div className="b-card">
              <div className="b-card-title">Region insights</div>
              <div className="b-card-sub">Click any region on the brain map</div>

              {selRegion ? (() => {
                const [bg, bc, tc] = statusBg(selRegion.status);
                const label = selRegion.status === "ok" ? "✦ Healthy"
                  : selRegion.status === "warn" ? "⚠ Watch" : "⚠ Alert";
                return (
                  <div className="insight-inner">
                    <div className="insight-region">{selRegion.name} lobe</div>
                    <div className="insight-badge" style={{
                      background: bg,
                      border: `1px solid ${bc}`,
                      color: tc,
                    }}>
                      {label}
                    </div>
                    <div className="insight-score-row">
                      <div className="insight-score" style={{ color: selRegion.color }}>
                        {selRegion.score}
                      </div>
                      <div className="insight-score-label">/ 100<br />percentile score</div>
                    </div>
                    <div className="insight-bar-track">
                      <div className="insight-bar-fill" style={{
                        width:      `${selRegion.score}%`,
                        background: selRegion.color,
                      }} />
                    </div>
                    <div className="insight-desc">{selRegion.desc}</div>
                  </div>
                );
              })() : (
                <div className="insight-empty">
                  No region selected — hover the brain map above
                </div>
              )}
            </div>

            {/* TRAJECTORY CARD */}
            <div className="b-card">
              <div className="b-card-title">6-month trajectory</div>
              <div className="traj-header">
                <div className="b-card-sub" style={{ marginBottom: 0 }}>
                  Overall brain health score
                </div>
                <div className="traj-delta">
                  {scoreDelta >= 0 ? `▲ +${scoreDelta}` : `▼ ${scoreDelta}`} pts
                </div>
              </div>

              {fetching ? (
                <div style={{
                  height: 80, background: "var(--border)", borderRadius: 8,
                  margin: "10px 0", animation: "shimmer 1.4s infinite",
                  backgroundSize: "200% 100%",
                  backgroundImage: "linear-gradient(90deg,var(--border) 25%,var(--card2) 50%,var(--border) 75%)"
                }} />
              ) : (
                <TrajCanvas dark={dark} month={month} scores={scores} labels={monthLabels} />
              )}

              {/* Time dots */}
              <div className="time-dots">
                {monthLabels.map((_, i) => (
                  <div key={i} className={`time-dot ${i <= month ? "active" : ""}`} />
                ))}
              </div>

              {/* Slider */}
              <input
                type="range"
                className="month-slider"
                min={0}
                max={monthLabels.length - 1}
                value={month}
                step={1}
                onChange={e => setMonth(Number(e.target.value))}
              />
              <div className="month-labels">
                {monthLabels.map(m => <span key={m}>{m}</span>)}
              </div>
              <div className="viewing-label">
                Viewing: <b>{monthLabels[month]}</b> — Score: <b>{scores[month]}</b>/100
              </div>
            </div>

          </div>
        </div>

        {/* ── ANOMALY GRID ── */}
        <div className="b-card">
          <div className="b-card-title">Biomarker anomaly scan</div>
          <div className="b-card-sub">
            {latestSession
              ? `Last session · ${new Date(latestSession.recorded_at || latestSession.created_at || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric" })} · 6 key voice biomarkers vs your personal baseline`
              : "Last session · 6 key voice biomarkers compared to your personal baseline"}
          </div>
          <div className="anomaly-grid">
            {anomalies.map(a => (
              <div key={a.name} className={`anomaly-item ${a.status}`}>
                <div className="anomaly-icon">{a.icon}</div>
                <div className="anomaly-name">{a.name}</div>
                <div className="anomaly-value">{a.val}</div>
                <div className="anomaly-status">
                  {a.status === "ok" ? "▲" : "⚠"} {a.label}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Shimmer keyframe */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
};

export default Brain;
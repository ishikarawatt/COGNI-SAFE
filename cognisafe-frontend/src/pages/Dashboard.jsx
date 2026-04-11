import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getProfile, getSessionHistory, getLatestSession, getWeeklyReport, getTrajectory } from "../services/dashboardService";
import "../styles/dashboard.css";

// ── ANIMATED SVG COMPONENTS ──
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

// ── WAVEFORM ANIMATION ──
const Waveform = ({ active = true }) => (
  <div className={`waveform-mini ${active ? 'active' : ''}`}>
    {[...Array(20)].map((_, i) => (
      <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.05}s` }} />
    ))}
  </div>
);

// ── PROGRESS RING ──
const ProgressRing = ({ value, size = 80, strokeWidth = 6, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="progress-ring"
      />
    </svg>
  );
};

// ── SESSION DETAIL MODAL ──
const SessionDetailModal = ({ session, onClose }) => {
  if (!session) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-header">
          <div className={`modal-tier tier-${session.risk_tier?.toLowerCase() || 'green'}`}>
            <span className="tier-dot"></span>
            {session.risk_tier || 'Green'} Risk
          </div>
          <div className="modal-date">{session.date}</div>
        </div>
        <h3 className="modal-title">Session Details</h3>

        <div className="modal-stats">
          <div className="modal-stat">
            <span className="stat-label">Risk Score</span>
            <span className="stat-value">{session.score?.toFixed(2) || '—'}</span>
            <span className="stat-unit">/ 1.0</span>
          </div>
          <div className="modal-stat">
            <span className="stat-label">Semantic Coherence</span>
            <span className="stat-value">{session.semantic_coherence?.toFixed(2) || '—'}</span>
          </div>
          <div className="modal-stat">
            <span className="stat-label">Speech Rate</span>
            <span className="stat-value">{session.speech_rate ? Math.round(session.speech_rate) : '—'}</span>
            <span className="stat-unit">wpm</span>
          </div>
        </div>

        <div className="modal-biomarkers">
          <h4>Key Biomarkers</h4>
          <div className="biomarkers-list">
            <div className="biomarker-row">
              <span>Lexical Diversity</span>
              <span>{session.lexical_diversity?.toFixed(2) || '—'}</span>
            </div>
            <div className="biomarker-row">
              <span>Pause Frequency</span>
              <span>{session.pause_frequency?.toFixed(1) || '—'} /min</span>
            </div>
            <div className="biomarker-row">
              <span>HNR</span>
              <span>{session.hnr?.toFixed(1) || '—'} dB</span>
            </div>
            <div className="biomarker-row">
              <span>Jitter</span>
              <span>{session.jitter ? (session.jitter * 100).toFixed(1) : '—'}%</span>
            </div>
          </div>
        </div>

        <button className="modal-action" onClick={() => onClose()}>
          Close
        </button>
      </div>
    </div>
  );
};

// ── BIOMARKER CARD ──
const BiomarkerCard = ({ name, value, status, trend }) => (
  <div className="biomarker-card">
    <div className="biomarker-header">
      <span className="biomarker-name">{name}</span>
      <span className={`biomarker-status ${status}`}></span>
    </div>
    <div className="biomarker-value">{value || '—'}</div>
    <div className={`biomarker-trend ${trend?.type || 'flat'}`}>
      {trend?.arrow || '●'} {trend?.text || 'Stable'}
    </div>
    <div className="biomarker-progress">
      <div className={`progress-fill ${status}`} style={{ width: `${trend?.percentage || 50}%` }} />
    </div>
  </div>
);

// ── DEMO DATA GENERATOR ──
const generateDemoData = () => {
  // Generate random but realistic-looking session history
  const dates = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    if (date.getDay() !== 0 && date.getDay() !== 6) { // Weekdays only
      dates.push(date);
    }
  }

  // Generate scores that trend downward (improving) with some noise
  let baseScore = 0.45;
  const sessions = dates.map((date, idx) => {
    const improvement = idx / dates.length * 0.25; // Gradual improvement
    const noise = (Math.random() - 0.5) * 0.04;
    let score = Math.max(0.12, Math.min(0.48, baseScore - improvement + noise));

    // Determine tier based on score
    let tier = "Green";
    if (score > 0.35) tier = "Yellow";
    if (score > 0.42) tier = "Orange";

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toLocaleDateString(),
      score: score,
      risk_tier: tier,
      semantic_coherence: 0.75 + (1 - score) * 0.2 + (Math.random() - 0.5) * 0.05,
      lexical_diversity: 0.68 + (1 - score) * 0.1 + (Math.random() - 0.5) * 0.04,
      speech_rate: 110 + (1 - score) * 20 + (Math.random() - 0.5) * 8,
      pause_frequency: 4.2 - (1 - score) * 2 + (Math.random() - 0.5) * 0.5,
      hnr: 16 + (1 - score) * 4 + (Math.random() - 0.5) * 1.5,
      jitter: 0.012 - (1 - score) * 0.006 + (Math.random() - 0.5) * 0.002,
    };
  });

  const latestSession = sessions[sessions.length - 1];

  // Generate biomarkers based on latest session
  const biomarkers = [
    { name: "Semantic Coherence", value: latestSession.semantic_coherence.toFixed(2), status: latestSession.semantic_coherence > 0.85 ? "good" : "warning", trend: { type: "up", arrow: "▲", text: "+2.1%", percentage: (latestSession.semantic_coherence * 100) } },
    { name: "Lexical Diversity", value: latestSession.lexical_diversity.toFixed(2), status: latestSession.lexical_diversity > 0.72 ? "good" : "warning", trend: { type: latestSession.lexical_diversity > 0.72 ? "up" : "down", arrow: latestSession.lexical_diversity > 0.72 ? "▲" : "▼", text: latestSession.lexical_diversity > 0.72 ? "+0.8%" : "-0.5%", percentage: latestSession.lexical_diversity * 100 } },
    { name: "Speech Rate", value: Math.round(latestSession.speech_rate) + " wpm", status: latestSession.speech_rate > 115 ? "good" : "warning", trend: { type: "up", arrow: "▲", text: "+1.2%", percentage: Math.min(100, (latestSession.speech_rate / 140) * 100) } },
    { name: "Pause Frequency", value: latestSession.pause_frequency.toFixed(1) + "/min", status: latestSession.pause_frequency < 3.5 ? "good" : "warning", trend: { type: latestSession.pause_frequency < 3.5 ? "down" : "up", arrow: latestSession.pause_frequency < 3.5 ? "▼" : "▲", text: latestSession.pause_frequency < 3.5 ? "-5.2%" : "+3.1%", percentage: Math.min(100, (latestSession.pause_frequency / 6) * 100) } },
    { name: "Pitch Mean", value: "142 Hz", status: "good", trend: { type: "up", arrow: "▲", text: "+0.6%", percentage: 72 } },
    { name: "HNR", value: latestSession.hnr.toFixed(1) + " dB", status: latestSession.hnr > 18 ? "good" : "warning", trend: { type: "up", arrow: "▲", text: "+1.8%", percentage: (latestSession.hnr / 25) * 100 } },
    { name: "Articulation Rate", value: "5.1 syl/s", status: "good", trend: { type: "up", arrow: "▲", text: "+0.3%", percentage: 68 } },
    { name: "Jitter", value: (latestSession.jitter * 100).toFixed(1) + "%", status: latestSession.jitter < 0.01 ? "good" : "warning", trend: { type: "down", arrow: "▼", text: "-0.4%", percentage: 80 } },
    { name: "Shimmer", value: "3.2%", status: "good", trend: { type: "up", arrow: "▲", text: "+0.2%", percentage: 75 } },
    { name: "Idea Density", value: "0.44", status: "good", trend: { type: "up", arrow: "▲", text: "+1.2%", percentage: 60 } },
    { name: "Syntactic Complexity", value: "0.68", status: "good", trend: { type: "up", arrow: "▲", text: "+0.9%", percentage: 68 } },
    { name: "Pitch Range", value: "64 Hz", status: "warning", trend: { type: "down", arrow: "▼", text: "-2.3%", percentage: 55 } },
    { name: "Pause Duration", value: "0.42s", status: "good", trend: { type: "down", arrow: "▼", text: "-1.1%", percentage: 65 } },
    { name: "Emotional Entropy", value: "0.65", status: "good", trend: { type: "up", arrow: "▲", text: "+1.2%", percentage: 70 } },
  ];

  return { sessions, latestSession, biomarkers };
};

// ── MAIN DASHBOARD ──
const Dashboard = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [dark, setDark] = useState(() => localStorage.getItem("cog_dark") === "true");
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Real data from backend
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [latest, setLatest] = useState(null);
  const [report, setReport] = useState(null);
  const [trajectory, setTrajectory] = useState([]);

  // Demo data
  const [demoData, setDemoData] = useState(null);

  const isDemo = user?.email?.includes("demo");

  useEffect(() => {
    if (isDemo) {
      // Generate demo data
      const data = generateDemoData();
      setDemoData(data);
      setLoading(false);
      return;
    }

    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [prof, hist, lat, rep, traj] = await Promise.all([
          getProfile(token),
          getSessionHistory(token, 3),
          getLatestSession(token),
          getWeeklyReport(token),
          getTrajectory(token, 6)
        ]);
        setProfile(prof);
        setHistory(hist || []);
        setLatest(lat);
        setReport(rep);
        setTrajectory(traj || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (err.message?.includes("401")) logout();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, logout, isDemo]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("cog_dark", String(next));
  };

  const handlePointClick = (session) => {
    setSelectedSession(session);
  };

  // Use demo data if in demo mode
  const displayProfile = isDemo ? {
    name: user?.name || "Demo User",
    cognitive_age: 52,
    biological_age: 58,
    streak: 14,
    sessions_total: 24,
    risk_tier: "Green",
    sessions_this_week: 5
  } : profile;

  const displayLatest = isDemo ? demoData?.latestSession : latest;
  const displayHistory = isDemo ? demoData?.sessions : history;
  const displayBiomarkers = isDemo ? demoData?.biomarkers : null;
  const displayNarrative = isDemo ? "Your cognitive health is showing consistent improvement across all metrics. Semantic coherence and lexical diversity are above baseline. Keep up the great work!" : report?.narrative;

  const firstName = displayProfile?.name?.split(" ")[0] || user?.name?.split(" ")[0] || "there";
  const riskTier = displayProfile?.risk_tier || displayLatest?.risk_tier || "Green";
  const streak = displayProfile?.streak || 0;
  const totalSessions = displayProfile?.sessions_total || 0;
  const cognitiveAge = displayProfile?.cognitive_age || '—';
  const biologicalAge = displayProfile?.biological_age || (displayProfile?.dob ? new Date().getFullYear() - new Date(displayProfile.dob).getFullYear() : 58);
  const latestRiskScore = displayLatest?.score || displayLatest?.risk_score || '—';
  const sessionsThisWeek = displayProfile?.sessions_this_week || 0;

  // Prepare session history for chart
  const sessionHistory = (displayHistory || []).map(session => ({
    date: session.date,
    fullDate: session.fullDate || session.date,
    score: session.score,
    risk_tier: session.risk_tier,
    semantic_coherence: session.semantic_coherence,
    lexical_diversity: session.lexical_diversity,
    speech_rate: session.speech_rate,
    pause_frequency: session.pause_frequency,
    hnr: session.hnr,
    jitter: session.jitter
  }));

  const latestSession = sessionHistory[sessionHistory.length - 1] || null;
  const minScore = Math.min(...sessionHistory.map(s => s.score).filter(s => s !== null && s !== undefined), 0.12);
  const maxScore = Math.max(...sessionHistory.map(s => s.score).filter(s => s !== null && s !== undefined), 0.48);

  // Prepare biomarkers list
  let biomarkersList = [];

  if (isDemo && displayBiomarkers) {
    biomarkersList = displayBiomarkers;
  } else if (displayLatest) {
    biomarkersList = [
      { name: "Semantic Coherence", value: displayLatest.semantic_coherence?.toFixed(2), status: displayLatest.semantic_coherence > 0.85 ? "good" : "warning", trend: { type: "up", arrow: "▲", text: "Above baseline", percentage: (displayLatest.semantic_coherence || 0.7) * 100 } },
      { name: "Lexical Diversity", value: displayLatest.lexical_diversity?.toFixed(2), status: displayLatest.lexical_diversity < 0.7 ? "warning" : "good", trend: { type: displayLatest.lexical_diversity < 0.7 ? "down" : "up", arrow: displayLatest.lexical_diversity < 0.7 ? "▼" : "▲", text: displayLatest.lexical_diversity < 0.7 ? "Watch" : "Normal", percentage: (displayLatest.lexical_diversity || 0.7) * 100 } },
      { name: "Speech Rate", value: displayLatest.speech_rate ? Math.round(displayLatest.speech_rate) + " wpm" : "—", status: "good", trend: { type: "up", arrow: "▲", text: "Normal range", percentage: 70 } },
      { name: "Pause Frequency", value: displayLatest.pause_frequency?.toFixed(1) + "/min", status: displayLatest.pause_frequency > 4 ? "warning" : "good", trend: { type: displayLatest.pause_frequency > 4 ? "down" : "up", arrow: displayLatest.pause_frequency > 4 ? "▼" : "▲", text: displayLatest.pause_frequency > 4 ? "Elevated" : "Normal", percentage: Math.min(100, (displayLatest.pause_frequency || 3) * 15) } },
      { name: "Pitch Mean", value: displayLatest.pitch_mean ? Math.round(displayLatest.pitch_mean) + " Hz" : "—", status: "good", trend: { type: "up", arrow: "▲", text: "Stable", percentage: 65 } },
      { name: "HNR", value: displayLatest.hnr?.toFixed(1) + " dB", status: displayLatest.hnr > 18 ? "good" : "warning", trend: { type: "up", arrow: "▲", text: "Good", percentage: (displayLatest.hnr / 25) * 100 } },
      { name: "Articulation Rate", value: displayLatest.articulation_rate?.toFixed(1) + " syl/s", status: "good", trend: { type: "up", arrow: "▲", text: "Normal", percentage: 70 } },
      { name: "Jitter", value: displayLatest.jitter ? (displayLatest.jitter * 100).toFixed(1) + "%" : "—", status: displayLatest.jitter < 0.01 ? "good" : "warning", trend: { type: "down", arrow: "▼", text: "Low", percentage: 80 } },
      { name: "Shimmer", value: displayLatest.shimmer ? (displayLatest.shimmer * 100).toFixed(1) + "%" : "—", status: "good", trend: { type: "up", arrow: "▲", text: "Stable", percentage: 72 } },
      { name: "Idea Density", value: displayLatest.idea_density?.toFixed(2), status: "good", trend: { type: "up", arrow: "▲", text: "Good", percentage: 60 } },
      { name: "Syntactic Complexity", value: displayLatest.syntactic_complexity?.toFixed(2), status: "good", trend: { type: "up", arrow: "▲", text: "Normal", percentage: 68 } },
      { name: "Pitch Range", value: displayLatest.pitch_range ? Math.round(displayLatest.pitch_range) + " Hz" : "—", status: displayLatest.pitch_range < 60 ? "warning" : "good", trend: { type: "down", arrow: "▼", text: "Watch", percentage: 55 } },
      { name: "Pause Duration", value: displayLatest.pause_duration?.toFixed(2) + "s", status: "good", trend: { type: "down", arrow: "▼", text: "Normal", percentage: 65 } },
      { name: "Emotional Entropy", value: displayLatest.emotional_entropy?.toFixed(2), status: "good", trend: { type: "up", arrow: "▲", text: "Stable", percentage: 70 } },
    ];
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Chart dimensions
  const width = 800;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding;

  const getX = (index) => padding + (index / (sessionHistory.length - 1 || 1)) * chartWidth;
  const getY = (score) => {
    if (score === null || score === undefined) return padding + chartHeight / 2;
    return padding + chartHeight - ((score - minScore) / (maxScore - minScore || 1)) * chartHeight;
  };

  const points = sessionHistory.map((s, i) => ({ x: getX(i), y: getY(s.score), session: s }));

  return (
    <div className={`dashboard ${dark ? "dark" : "light"}`}>
      {/* Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-brand" onClick={() => navigate("/")}>
          <div className="brand-ring">
            <LogoIcon />
          </div>
          <span className="brand-name">CogniSafe</span>
        </div>

        <div className="nav-links">
          <button className="nav-link active">Dashboard</button>
          <button className="nav-link" onClick={() => navigate("/session")}>Session</button>
          <button className="nav-link" onClick={() => navigate("/ar-report")}>Report</button>
        </div>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleDark}>
            {dark ? "☀️" : "🌙"}
          </button>
          <button className="new-session" onClick={() => navigate("/session")}>
            <span>+</span> New Session
          </button>
          <div className="user-menu" onClick={logout}>
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your cognitive health data...</p>
          </div>
        ) : (
          <>
            {/* Welcome Header */}
            <div className="welcome-header">
              <div className="welcome-text">
                <div className="greeting">
                  <span className="greeting-wave">👋</span>
                  {getGreeting()}, {firstName}
                  {isDemo && <span className="demo-badge">Demo Mode</span>}
                </div>
                <h1 className="welcome-title">
                  Your Cognitive <span className="highlight">Health Dashboard</span>
                </h1>
                <p className="welcome-date">
                  {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className={`risk-chip ${riskTier?.toLowerCase() || 'green'}`}>
                <span className="risk-pulse"></span>
                Current Risk: {riskTier || 'Green'}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🧠</div>
                <div className="stat-info">
                  <div className="stat-label">Cognitive Age</div>
                  <div className="stat-value">{cognitiveAge !== '—' ? cognitiveAge : '—'}</div>
                  <div className="stat-compare">vs {biologicalAge} biological</div>
                  {cognitiveAge !== '—' && biologicalAge !== '—' && (
                    <div className="stat-trend positive">▼ {Math.abs(biologicalAge - cognitiveAge)} years younger</div>
                  )}
                </div>
                <ProgressRing value={65} size={70} strokeWidth={5} color="#D4A5B5" />
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-label">Latest Risk Score</div>
                  <div className="stat-value">{latestRiskScore !== '—' ? latestRiskScore.toFixed(2) : '—'}</div>
                  <div className="stat-compare">out of 1.0</div>
                </div>
                <ProgressRing value={latestRiskScore !== '—' ? (1 - latestRiskScore) * 100 : 50} size={70} strokeWidth={5} color="#7FB77E" />
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <div className="stat-label">Current Streak</div>
                  <div className="stat-value">{streak}</div>
                  <div className="stat-compare">consecutive days</div>
                </div>
                <Waveform active={streak > 0} />
              </div>

              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <div className="stat-label">Total Sessions</div>
                  <div className="stat-value">{totalSessions}</div>
                  <div className="stat-compare">since joining</div>
                  <div className="stat-trend positive">▲ {sessionsThisWeek} this week</div>
                </div>
                <div className="session-badge">🏆</div>
              </div>
            </div>

            {/* Interactive Risk Trend Chart */}
            {sessionHistory.length > 0 && (
              <div className="trend-chart">
                <div className="chart-header">
                  <div>
                    <h3>Risk Score Trend</h3>
                    <p>Click on any point to view session details — lower is better</p>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-dot green"></span>
                    <span>Green - Low Risk</span>
                    <span className="legend-dot yellow"></span>
                    <span>Yellow - Moderate</span>
                  </div>
                </div>

                <div className="chart-container">
                  <svg className="risk-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((level, i) => {
                      const y = padding + chartHeight * (1 - level);
                      return (
                        <g key={i}>
                          <line
                            x1={padding}
                            y1={y}
                            x2={width - padding}
                            y2={y}
                            stroke="var(--border)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={padding - 8}
                            y={y + 4}
                            fill="var(--text-tertiary)"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {level.toFixed(2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area under the line */}
                    <path
                      className="chart-area"
                      d={`M${points[0]?.x || padding},${getY(points[0]?.session?.score)} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1]?.x || width - padding},${height - padding} L${points[0]?.x || padding},${height - padding} Z`}
                      fill="url(#areaGradient)"
                    />

                    {/* The line */}
                    <path
                      className="chart-line"
                      d={`M${points[0]?.x || padding},${getY(points[0]?.session?.score)} ${points.map(p => `L${p.x},${p.y}`).join(' ')}`}
                    />

                    {/* Points - Clickable */}
                    {points.map((point, idx) => (
                      <g
                        key={idx}
                        className="chart-point-group"
                        onClick={() => handlePointClick(point.session)}
                        onMouseEnter={() => setHoveredPoint(point.session)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="6"
                          className={`chart-point ${point.session.risk_tier?.toLowerCase() || 'green'}`}
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="10"
                          className="chart-point-hover"
                        />
                        {hoveredPoint === point.session && (
                          <g>
                            <rect
                              x={point.x - 40}
                              y={point.y - 35}
                              width="80"
                              height="28"
                              rx="4"
                              fill="var(--bg-card)"
                              stroke="var(--accent-primary)"
                              strokeWidth="1"
                            />
                            <text
                              x={point.x}
                              y={point.y - 20}
                              textAnchor="middle"
                              fill="var(--text)"
                              fontSize="10"
                              fontWeight="500"
                            >
                              Score: {point.session.score?.toFixed(2) || '—'}
                            </text>
                          </g>
                        )}
                      </g>
                    ))}

                    {/* Date Labels */}
                    {sessionHistory.map((session, idx) => (
                      <text
                        key={idx}
                        x={getX(idx)}
                        y={height - padding + 20}
                        textAnchor="middle"
                        fill="var(--text-tertiary)"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {session.date}
                      </text>
                    ))}

                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}

            {/* Latest Session Insight */}
            {displayNarrative && (
              <div className="latest-insight">
                <div className="insight-header">
                  <span className="insight-icon">✨</span>
                  <h3>{isDemo ? "Demo Insight" : "Weekly Insight"}</h3>
                </div>
                <div className="insight-content">
                  <p>{displayNarrative}</p>
                </div>
              </div>
            )}

            {/* Biomarkers Section */}
            <div className="biomarkers-section">
              <div className="section-header">
                <div>
                  <h3>14 Voice Biomarkers</h3>
                  <p>Clinical-grade cognitive health metrics from your latest session</p>
                </div>
                <div className="biomarker-summary">
                  <span className="summary-badge good">Stable</span>
                </div>
              </div>
              <div className="biomarkers-grid">
                {biomarkersList.map((bm, idx) => (
                  <BiomarkerCard key={bm.name} {...bm} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-btn primary" onClick={() => navigate("/session")}>
                <span>🎙️</span> Start New Session
              </button>
              <button className="action-btn" onClick={() => navigate("/ar-report")}>
                <span>📄</span> Download Full Report
              </button>
            </div>
          </>
        )}
      </main>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
};

export default Dashboard;
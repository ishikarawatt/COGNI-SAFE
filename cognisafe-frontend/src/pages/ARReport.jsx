import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getWeeklyReport, getLatestSession, getProfile, getSessionHistory } from "../services/dashboardService";
import "../styles/arreport.css";
import { jsPDF } from "jspdf";

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

// ── REAL QR CODE GENERATOR ──
const RealQRCode = ({ data, size = 140 }) => {
  const canvasRef = useRef(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      if (!data) return;

      try {
        // Dynamic import of QR code library
        const QRCodeLib = await import('qrcode');
        const canvas = canvasRef.current;
        if (canvas) {
          // Generate QR code with the report URL/data
          QRCodeLib.default.toCanvas(canvas, data, {
            width: size,
            margin: 2,
            color: {
              dark: '#9B4F7A',
              light: '#FFFFFF'
            }
          }, (error) => {
            if (error) console.error('QR generation error:', error);
            else setQrGenerated(true);
          });
        }
      } catch (err) {
        console.warn('QR library not available, using fallback:', err);
        // Fallback to visual QR
        drawFallbackQR(canvasRef.current);
      }
    };

    generateQR();
  }, [data, size]);

  const drawFallbackQR = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const modules = 25;
    const cell = Math.floor(size / modules);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#9B4F7A";

    // Draw position markers
    [[0, 0], [0, modules - 7], [modules - 7, 0]].forEach(([row, col]) => {
      ctx.fillRect(col * cell, row * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect((col + 1) * cell, (row + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = "#9B4F7A";
      ctx.fillRect((col + 2) * cell, (row + 2) * cell, 3 * cell, 3 * cell);
    });

    // Draw pattern
    const hash = (s, i) => {
      let h = 0;
      for (let j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j) + i) & 0xFFFFFF;
      return h;
    };

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        const inFinder = (r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8);
        if (!inFinder && hash(data || "cognisafe", r * modules + c) % 4 === 0) {
          ctx.fillRect(c * cell, r * cell, cell - 1, cell - 1);
        }
      }
    }
  };

  return <canvas ref={canvasRef} className="qr-canvas" width={size} height={size} />;
};

// ── SKELETON LOADER ──
const Skeleton = ({ width = "100%", height = 16, radius = 8 }) => (
  <div className="skeleton" style={{ width, height, borderRadius: radius }} />
);

// ── METRIC ROW ──
const MetricRow = ({ icon, name, value, trend, type, delay = 0 }) => {
  const getTrendColor = () => {
    if (type === "up") return "trend-up";
    if (type === "down") return "trend-down";
    return "trend-flat";
  };

  const getTrendIcon = () => {
    if (type === "up") return "▲";
    if (type === "down") return "▼";
    return "●";
  };

  return (
    <div className="metric-row animate-slide-right" style={{ animationDelay: `${delay}s` }}>
      <div className="metric-left">
        <div className={`metric-icon ${type}`}>
          <span>{icon}</span>
        </div>
        <div className="metric-info">
          <span className="metric-name">{name}</span>
          <span className={`metric-trend ${getTrendColor()}`}>
            {getTrendIcon()} {trend}
          </span>
        </div>
      </div>
      <div className="metric-value-wrapper">
        <span className="metric-value">{value}</span>
      </div>
    </div>
  );
};

// ── REAL PDF GENERATION with dynamic data ──
const generateRealPDF = async (data) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, M = 20;

  // Header with logo effect
  doc.setFillColor(212, 165, 181);
  doc.rect(0, 0, W, 35, "F");
  doc.setFillColor(181, 104, 154);
  doc.rect(0, 0, W, 8, "F");

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CogniSafe", M, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("WEEKLY COGNITIVE REPORT", W - M, 20, { align: "right" });
  doc.text(`Report ID: ${data.reportId || "COG-" + Date.now()}`, W - M, 28, { align: "right" });

  // User info
  doc.setTextColor(46, 21, 37);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.name || "CogniSafe User", M, 48);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 79, 99);
  doc.text(`${data.weekLabel} · Session streak: ${data.streak} days`, M, 55);
  doc.text(`Generated: ${new Date().toLocaleString()}`, M, 61);

  // Risk tier section
  const riskColor = data.riskTier === "Green" ? [127, 183, 126] :
    data.riskTier === "Yellow" ? [229, 181, 106] :
      data.riskTier === "Orange" ? [229, 154, 106] : [229, 131, 131];
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(M, 68, W - 2 * M, 16, 3, 3, "F");
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`● RISK TIER: ${data.riskTier} — Cognitive health: ${data.riskHealth}`, M + 4, 77);

  // Summary stats
  doc.setTextColor(46, 21, 37);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", M, 92);
  doc.setDrawColor(212, 165, 181);
  doc.line(M, 94, W - M, 94);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryY = 100;
  doc.text(`• Total Sessions: ${data.totalSessions || "—"}`, M + 4, summaryY);
  doc.text(`• Weekly Average: ${data.weeklyAverage || "—"}`, M + 4, summaryY + 6);
  doc.text(`• Best Score: ${data.bestScore || "—"}`, M + 4, summaryY + 12);
  doc.text(`• Current Streak: ${data.streak} days`, M + 4, summaryY + 18);

  // Biomarker summary
  doc.setTextColor(46, 21, 37);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Biomarker Summary", M, 126);
  doc.line(M, 128, W - M, 128);

  // Table
  doc.setFontSize(8);
  data.metrics.forEach(([name, val, note, status], i) => {
    const y = 134 + i * 7;
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(M, y - 3, W - 2 * M, 7, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 79, 99);
    doc.text(name, M + 2, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 21, 37);
    doc.text(String(val), M + 70, y);
    doc.setFont("helvetica", "normal");
    const noteColor = status === "good" ? [127, 183, 126] : status === "warning" ? [229, 181, 106] : [229, 131, 131];
    doc.setTextColor(noteColor[0], noteColor[1], noteColor[2]);
    doc.text(String(note), M + 95, y);
  });

  const startY = 134 + data.metrics.length * 7 + 8;

  // AI Insights
  doc.setTextColor(46, 21, 37);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("AI-Generated Insights", M, startY);
  doc.line(M, startY + 2, W - M, startY + 2);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  data.insights.forEach((ins, i) => {
    const y = startY + 8 + i * 7;
    doc.setTextColor(212, 165, 181);
    doc.text("●", M + 2, y);
    doc.setTextColor(107, 79, 99);
    const clean = typeof ins === "string" ? ins.replace(/<[^>]+>/g, "") : ins;
    const lines = doc.splitTextToSize(clean, W - 2 * M - 12);
    doc.text(lines[0] || clean, M + 7, y);
  });

  // Recommendations
  const recY = startY + 8 + data.insights.length * 7 + 8;
  if (data.recommendations && data.recommendations.length) {
    doc.setTextColor(46, 21, 37);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendations", M, recY);
    doc.line(M, recY + 2, W - M, recY + 2);

    doc.setFontSize(8);
    data.recommendations.forEach((rec, i) => {
      const y = recY + 8 + i * 6;
      doc.setTextColor(212, 165, 181);
      doc.text("→", M + 2, y);
      doc.setTextColor(107, 79, 99);
      doc.text(rec, M + 8, y);
    });
  }

  // Footer
  doc.setFillColor(212, 165, 181);
  doc.rect(0, 277, W, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("CogniSafe · AI-Powered Cognitive Health Monitoring", M, 287);
  doc.text("Confidential Health Report", M, 292);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, W - M, 287, { align: "right" });

  // Save with user name and date
  const fileName = `CogniSafe_Report_${data.name.replace(/\s/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);

  return true;
};

// ── DEMO DATA GENERATOR for realistic reports ──
const generateDemoReportData = (userName) => {
  const randomScore = (Math.random() * 0.3 + 0.15).toFixed(2);
  const riskTier = parseFloat(randomScore) < 0.25 ? "Green" : parseFloat(randomScore) < 0.4 ? "Yellow" : "Orange";

  const riskHealth = riskTier === "Green" ? "Good" : riskTier === "Yellow" ? "Watch" : "Elevated";

  const metrics = [
    { name: "Semantic Coherence", value: (0.75 + Math.random() * 0.2).toFixed(2), trend: "+2.1%", status: "good" },
    { name: "Lexical Diversity", value: (0.68 + Math.random() * 0.12).toFixed(2), trend: "-0.8%", status: "warning" },
    { name: "Speech Rate", value: Math.floor(110 + Math.random() * 20), trend: "+0.6%", status: "good" },
    { name: "Pause Frequency", value: (2.5 + Math.random() * 1.5).toFixed(1), trend: "+5.2%", status: "warning" },
    { name: "Pitch Mean", value: Math.floor(130 + Math.random() * 30), trend: "+0.6%", status: "good" },
    { name: "HNR", value: (16 + Math.random() * 4).toFixed(1), trend: "+1.8%", status: "good" },
    { name: "Articulation Rate", value: (4.5 + Math.random() * 1).toFixed(1), trend: "+0.3%", status: "good" },
  ];

  const insights = [
    `Your ${metrics[0].name} is ${metrics[0].value} — ${metrics[0].value > 0.85 ? "above average" : "within normal range"}.`,
    `Consistent sessions show ${metrics[1].value > 0.7 ? "stable" : "slightly variable"} lexical diversity.`,
    `Your voice patterns indicate ${riskTier === "Green" ? "healthy cognitive function" : riskTier === "Yellow" ? "mild variations worth monitoring" : "some patterns that may benefit from lifestyle adjustments"}.`,
    `Maintaining a ${metrics[2].value > 115 ? "good" : "consistent"} speech rate with proper articulation.`
  ];

  const recommendations = riskTier === "Green" ? [
    "Continue your daily sessions to maintain cognitive health",
    "Consider adding reading aloud exercises to enhance lexical diversity",
    "Stay hydrated before sessions for optimal voice quality"
  ] : riskTier === "Yellow" ? [
    "Ensure adequate sleep before sessions",
    "Practice mindful breathing exercises",
    "Consider reducing caffeine intake before recording"
  ] : [
    "Consult with a healthcare provider for personalized advice",
    "Take a 5-minute relaxation break before sessions",
    "Focus on slower, more deliberate speech patterns"
  ];

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleString("en-US", { month: "long", year: "numeric" })}`;

  return {
    name: userName,
    weekLabel,
    streak: Math.floor(Math.random() * 30) + 5,
    riskTier,
    riskHealth,
    totalSessions: Math.floor(Math.random() * 30) + 10,
    weeklyAverage: (Math.random() * 0.3 + 0.2).toFixed(2),
    bestScore: (Math.random() * 0.25 + 0.12).toFixed(2),
    metrics: metrics.map(m => [m.name, m.value, m.trend, m.status]),
    insights,
    recommendations,
    reportId: `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  };
};

// ── MAIN AR REPORT COMPONENT ──
const ARReport = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [dark, setDark] = useState(() => localStorage.getItem("cog_dark") === "true");
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [qrData, setQrData] = useState("");

  const [profile, setProfile] = useState(null);
  const [report, setReport] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("cog_dark", String(next));
  };

  // Fetch data
  useEffect(() => {
    if (!token) {
      setFetching(false);
      return;
    }

    // Skip API calls for demo users (demo token is not a valid JWT)
    if (user?.email?.includes("demo")) {
      setFetching(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const results = await Promise.allSettled([
          getProfile(token),
          getWeeklyReport(token),
          getLatestSession(token),
          getSessionHistory(token, 3)
        ]);

        const prof = results[0].status === "fulfilled" ? results[0].value : null;
        const rep  = results[1].status === "fulfilled" ? results[1].value : null;
        const lat  = results[2].status === "fulfilled" ? results[2].value : null;
        const hist = results[3].status === "fulfilled" ? results[3].value : [];

        setProfile(prof);
        setReport(rep);
        setLatest(lat);
        setHistory(hist || []);

        // Generate QR code data with report URL
        const reportUrl = `${window.location.origin}/report/${prof?.id || user?.id || "user"}`;
        setQrData(reportUrl);

        // Check if any critical call returned 401
        const has401 = results.some(
          r => r.status === "rejected" && r.reason?.message?.includes("401")
        );
        if (has401) logout();
      } catch (err) {
        console.error("AR Report fetch error:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchAll();
  }, [token, logout, user]);

  const isDemo = user?.email?.includes("demo");

  // Prepare real data from backend
  const prepareRealReportData = () => {
    try {
      const biomarkers = latest?.biomarkers || latest || {};
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const weekLabel = `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.toLocaleString("en-US", { month: "long", year: "numeric" })}`;

      const metrics = [
        ["Semantic Coherence", biomarkers.semantic_coherence ? Number(biomarkers.semantic_coherence).toFixed(2) : "—", biomarkers.semantic_coherence ? "Above baseline" : "—", (Number(biomarkers.semantic_coherence) || 0) > 0.85 ? "good" : "warning"],
        ["Cognitive Age", profile?.cognitive_age || "—", profile?.cognitive_age ? "Stable" : "—", "good"],
        ["Speech Rate", biomarkers.speech_rate ? Math.round(Number(biomarkers.speech_rate)) : "—", biomarkers.speech_rate ? "Normal" : "—", "good"],
        ["Pause Frequency", biomarkers.pause_frequency ? Number(biomarkers.pause_frequency).toFixed(1) : "—", (Number(biomarkers.pause_frequency) || 0) > 4 ? "Elevated" : "Normal", (Number(biomarkers.pause_frequency) || 0) > 4 ? "warning" : "good"],
        ["Lexical Diversity", biomarkers.lexical_diversity ? Number(biomarkers.lexical_diversity).toFixed(2) : "—", (Number(biomarkers.lexical_diversity) || 0) < 0.7 ? "Watch" : "Normal", (Number(biomarkers.lexical_diversity) || 0) < 0.7 ? "warning" : "good"],
        ["HNR", biomarkers.hnr ? Number(biomarkers.hnr).toFixed(1) : "—", biomarkers.hnr ? "Good" : "—", (Number(biomarkers.hnr) || 0) > 18 ? "good" : "warning"],
        ["Jitter", biomarkers.jitter ? (Number(biomarkers.jitter) * 100).toFixed(1) + "%" : "—", biomarkers.jitter ? "Low" : "—", "good"],
      ];

      // Backend returns insights as {color, text} objects — extract the text string
      let rawInsights = report?.insights;
      if (Array.isArray(rawInsights) && rawInsights.length > 0) {
        rawInsights = rawInsights.map(i => (typeof i === "object" && i !== null) ? (i.text || String(i)) : String(i));
      } else if (report?.narrative) {
        rawInsights = [report.narrative];
      } else {
        rawInsights = ["No insights available yet. Complete more sessions to see AI-generated insights."];
      }
      let safeInsights = Array.isArray(rawInsights) ? rawInsights : [rawInsights];

      let rawRecommendations = report?.recommendations || [
        "Continue daily sessions to maintain cognitive health",
        "Stay hydrated before recording for better voice quality",
        "Practice in a quiet environment for accurate analysis"
      ];
      let safeRecommendations = Array.isArray(rawRecommendations) ? rawRecommendations : [rawRecommendations];

      const safeHistory = Array.isArray(history) ? history : [];
      const scores = safeHistory.filter(s => s?.risk_score).map(s => Number(s.risk_score));
      const validScores = scores.filter(s => !isNaN(s));
      const bestScore = validScores.length ? Math.min(...validScores).toFixed(2) : "—";
      const weeklyAverage = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2) : "—";

      // Determine risk tier from report or latest session
      const riskTier = report?.risk_tier || latest?.risk_tier || "Green";

      return {
        name: user?.name || "CogniSafe User",
        weekLabel,
        streak: profile?.streak || 0,
        riskTier,
        riskHealth: riskTier === "Green" ? "Good" : riskTier === "Yellow" ? "Watch" : "Alert",
        totalSessions: profile?.sessions_total || 0,
        weeklyAverage,
        bestScore,
        metrics,
        insights: safeInsights.slice(0, 4),
        recommendations: safeRecommendations,
        reportId: `COG-${profile?.id || user?.id}-${Date.now()}`
      };
    } catch (err) {
      console.error("Data Preparation Error:", err);
      return {
        name: user?.name || "User",
        weekLabel: "This Week",
        streak: 0,
        riskTier: "Green",
        riskHealth: "Good",
        totalSessions: 0,
        weeklyAverage: "—",
        bestScore: "—",
        metrics: [],
        insights: ["Your report will appear here after your first session."],
        recommendations: ["Record your first session to get started.", "Speak naturally for about 1-2 minutes.", "Use a quiet environment for accurate analysis."],
        reportId: `COG-${user?.id || "new"}-${Date.now()}`
      };
    }
  };

  // Get display data
  const displayData = isDemo ? generateDemoReportData(user?.name || "Demo User") : prepareRealReportData();
  const displayMetrics = displayData.metrics;
  const displayInsights = displayData.insights;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateRealPDF(displayData);
      showToast("✓ PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF error:", err);
      showToast("⚠ PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (method) => {
    if (method === "Copy Link") {
      const shareUrl = qrData || window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      showToast("✓ Report link copied to clipboard!");
    } else if (method === "Email") {
      window.location.href = `mailto:?subject=CogniSafe Health Report&body=Check out my cognitive health report: ${window.location.href}`;
      showToast("Opening email...");
    } else if (method === "WhatsApp") {
      window.open(`https://wa.me/?text=Check out my CogniSafe health report: ${window.location.href}`, '_blank');
      showToast("Opening WhatsApp...");
    } else if (method === "Print") {
      window.print();
      showToast("Preparing print...");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const shareOptions = [
    { icon: "📧", label: "Email", sub: "Send to doctor", action: "Email", color: "#6366F1" },
    { icon: "💬", label: "WhatsApp", sub: "Share instantly", action: "WhatsApp", color: "#25D366" },
    { icon: "🔗", label: "Copy Link", sub: "Shareable URL", action: "Copy Link", color: "#D4A5B5" },
    { icon: "🖨️", label: "Print", sub: "Physical copy", action: "Print", color: "#E58383" },
  ];

  const getRiskText = () => {
    if (displayData.riskTier === "Green") return "No significant anomalies detected this week. Your cognitive health is stable.";
    if (displayData.riskTier === "Yellow") return "Some voice pattern changes detected. Continue monitoring daily.";
    if (displayData.riskTier === "Orange") return "Elevated deviations detected. Consider lifestyle assessment.";
    return "Significant deviations detected. Medical consultation recommended.";
  };

  return (
    <div className={`report-root ${dark ? "dark" : "light"}`}>
      {/* Navigation */}
      <nav className="report-nav">
        <div className="nav-brand" onClick={() => navigate("/")}>
          <div className="brand-ring">
            <LogoIcon />
          </div>
          <span className="brand-name">CogniSafe</span>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button className="nav-link" onClick={() => navigate("/session")}>Session</button>
          <button className="nav-link active">Report</button>
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
      <main className="report-main">
        {/* Header */}
        <div className="report-header">
          <div className="report-badge">Weekly Cognitive Report</div>
          <h1 className="report-title">
            Your Health <span className="highlight">Summary</span>
          </h1>
          <p className="report-date">
            {displayData.weekLabel} · Session streak: {displayData.streak} days 🔥
          </p>
          {isDemo && <div className="demo-badge-large">Demo Mode - Sample Data</div>}
        </div>

        {/* Risk Banner */}
        <div className={`risk-banner ${displayData.riskTier.toLowerCase()}`}>
          <div className="risk-icon">🧠</div>
          <div className="risk-content">
            <div className="risk-label">Current Risk Tier</div>
            <div className="risk-value">Cognitive health: {displayData.riskHealth}</div>
            <div className="risk-description">{getRiskText()}</div>
          </div>
          <div className={`risk-pill ${displayData.riskTier.toLowerCase()}`}>
            ● {displayData.riskTier}
          </div>
        </div>

        {/* Mini Stats */}
        <div className="mini-stats">
          <div className="mini-stat">
            <div className="mini-stat-label">Cognitive Age</div>
            {fetching && !isDemo ? (
              <Skeleton width="80px" height="36px" />
            ) : (
              <div className="mini-stat-value">{profile?.cognitive_age || (isDemo ? "52" : "—")}</div>
            )}
            <div className="mini-stat-sub">Biological age: {profile?.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : (isDemo ? "58" : "—")}</div>
          </div>
          <div className="mini-stat">
            <div className="mini-stat-label">Sessions This Week</div>
            {fetching && !isDemo ? (
              <Skeleton width="60px" height="36px" />
            ) : (
              <div className="mini-stat-value">{report?.sessions_this_week || (isDemo ? "5" : "0")}/7</div>
            )}
            <div className="mini-stat-sub">Streak: {displayData.streak} days 🔥</div>
            <div className="mini-stat-trend positive">▲ On track — keep going!</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="report-grid">
          {/* Metrics Card */}
          <div className="report-card metrics-card">
            <div className="card-accent"></div>
            <h3 className="card-title">Weekly Biomarker Summary</h3>
            <p className="card-subtitle">Powered by 14 voice biomarkers · latest session</p>
            <div className="metrics-list">
              {fetching && !isDemo ? (
                <>
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} height="64px" style={{ marginBottom: "12px" }} />
                  ))}
                </>
              ) : (
                displayMetrics.map((metric, idx) => (
                  <MetricRow
                    key={metric[0]}
                    icon={getMetricIcon(metric[0])}
                    name={metric[0]}
                    value={metric[1]}
                    trend={metric[2]}
                    type={metric[3] === "good" ? "up" : metric[3] === "warning" ? "down" : "flat"}
                    delay={idx * 0.05}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="report-right">
            {/* PDF Card with Real QR */}
            <div className="report-card pdf-card">
              <h3 className="card-title">Download PDF Report</h3>
              <p className="card-subtitle">Scan QR code or tap button to download</p>
              <div className="qr-section">
                <div className="qr-container">
                  <RealQRCode data={qrData || window.location.href} size={120} />
                </div>
                <p className="qr-hint">Scan with your phone camera to view/download this report</p>
                <button
                  className="download-btn"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <span className="spinner-small"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      ⬇ Download PDF Report
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Card */}
            <div className="report-card share-card">
              <h3 className="card-title">Share Your Report</h3>
              <p className="card-subtitle">Send to your doctor or care team</p>
              <div className="share-options">
                {shareOptions.map(opt => (
                  <div
                    key={opt.label}
                    className="share-option"
                    onClick={() => handleShare(opt.action)}
                  >
                    <div className="share-icon" style={{ background: `${opt.color}15` }}>
                      {opt.icon}
                    </div>
                    <div className="share-info">
                      <div className="share-label">{opt.label}</div>
                      <div className="share-sub">{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="report-card insights-card">
          <div className="card-accent"></div>
          <div className="insights-header">
            <h3 className="card-title">AI-Generated Weekly Insights</h3>
            <span className="insights-badge">✨ AI Powered</span>
          </div>
          <p className="card-subtitle">Based on your {report?.sessions_this_week || (isDemo ? "5" : "0")} sessions this week</p>
          <div className="insights-list">
            {fetching && !isDemo ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height="70px" style={{ marginBottom: "12px" }} />
                ))}
              </>
            ) : (
              displayInsights.map((insight, idx) => (
                <div key={idx} className="insight-item animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="insight-dot"></div>
                  <p className="insight-text">{insight}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations Card */}
        {displayData.recommendations && displayData.recommendations.length > 0 && (
          <div className="report-card recommendations-card">
            <div className="card-accent"></div>
            <h3 className="card-title">Personalized Recommendations</h3>
            <p className="card-subtitle">Based on your latest voice patterns</p>
            <div className="recommendations-list">
              {displayData.recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-item">
                  <span className="rec-icon">💡</span>
                  <span className="rec-text">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="report-actions">
          <button className="action-btn primary" onClick={() => navigate("/session")}>
            <span>🎙️</span> Start New Session
          </button>
          <button className="action-btn" onClick={() => navigate("/dashboard")}>
            <span>📊</span> View Dashboard
          </button>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}
    </div>
  );
};

// Helper function for metric icons
const getMetricIcon = (name) => {
  const icons = {
    "Semantic Coherence": "🧠",
    "Cognitive Age": "👤",
    "Speech Rate": "🎙️",
    "Pause Frequency": "⏸️",
    "Lexical Diversity": "📊",
    "HNR": "🎵",
    "Jitter": "📈",
    "Articulation Rate": "🗣️",
    "Pitch Mean": "🎼",
    "Idea Density": "💡"
  };
  return icons[name] || "📊";
};

export default ARReport;
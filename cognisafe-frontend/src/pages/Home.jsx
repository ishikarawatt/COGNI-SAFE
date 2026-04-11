import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  // Force light mode for Home page
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Scroll reveal
  useEffect(() => {

    // Scroll reveal observer
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07 }
    );

    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // Nav shadow on scroll
    const handleScroll = () => {
      const nav = document.querySelector(".home-nav");
      if (nav) {
        nav.style.boxShadow =
          window.scrollY > 48 ? "0 4px 28px var(--shadow)" : "none";
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      io.disconnect();
    };
  }, []);

  const goToPage = (page) => {
    if (page === "session") {
      if (isLoggedIn) {
        navigate("/session");
      } else {
        navigate("/auth", { state: { redirectTo: "/session" } });
      }
    } else if (page === "auth") {
      navigate("/auth");
    } else if (page === "dashboard") {
      if (isLoggedIn) {
        navigate("/dashboard");
      } else {
        navigate("/auth", { state: { redirectTo: "/dashboard" } });
      }
    } else if (page === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="home-root">

      {/* Navigation */}
      <nav className="home-nav" id="home-nav">
        <div className="nav-logo" onClick={() => goToPage("home")}>
          <div className="logo-ring"></div>
          CogniSafe
        </div>
        <div className="nav-right">
          <div className="nav-cta" onClick={() => goToPage("auth")}>
            {isLoggedIn ? "Sign In" : "Sign In"}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <div className="eyebrow">
            <div className="eyebrow-dash"></div>
            <div className="eyebrow-txt">Voice Biomarker Intelligence · Team FAIV</div>
          </div>
          <h1 className="hero-title">
            <span className="w-reg">Your voice</span>
            <span className="w-italic">speaks</span>
            <span className="w-stroke">before</span>
            <span className="w-bold">you do.</span>
          </h1>
          <p className="hero-sub">
            CogniSafe extracts <strong>14 clinical biomarkers</strong> from 3 minutes of daily speech — detecting early
            cognitive decline <strong>18 months before symptoms appear.</strong>
          </p>
          <div className="hero-ctas">
            <div className="btn-p" onClick={() => goToPage("auth")}>
              Start Free Session
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 7.5h11M9 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-n">14</div>
              <div className="stat-l">Voice biomarkers</div>
            </div>
            <div className="stat-item">
              <div className="stat-n">18mo</div>
              <div className="stat-l">Before symptoms</div>
            </div>
            <div className="stat-item">
              <div className="stat-n">3 min</div>
              <div className="stat-l">Daily session</div>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-card">
            <div className="fc fc1">
              Processing <b>14 biomarkers</b>
            </div>
            <div className="fc fc2">
              Result: <b>● Green tier</b>
            </div>
            <div className="a-card">
              <div className="a-card-top">
                <span className="a-card-lbl">CogniSafe // Live Analysis</span>
                <span className="rec-pill">
                  <span className="rec-dot"></span> Recording
                </span>
              </div>
              <div className="a-card-body">
                <div className="waveform" style={{ marginBottom: 14 }}>
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="wb"></div>
                  ))}
                </div>
                <div className="bm-mini-grid">
                  <div className="bm-mini">
                    <div className="bm-mini-v">142Hz</div>
                    <div className="bm-mini-k">Pitch</div>
                  </div>
                  <div className="bm-mini">
                    <div className="bm-mini-v">0.8%</div>
                    <div className="bm-mini-k">Jitter</div>
                  </div>
                  <div className="bm-mini">
                    <div className="bm-mini-v">3.2/m</div>
                    <div className="bm-mini-k">Pauses</div>
                  </div>
                  <div className="bm-mini">
                    <div className="bm-mini-v">0.72</div>
                    <div className="bm-mini-k">Lex Div</div>
                  </div>
                  <div className="bm-mini">
                    <div className="bm-mini-v">0.91</div>
                    <div className="bm-mini-k">Semantic</div>
                  </div>
                  <div className="bm-mini">
                    <div className="bm-mini-v">18.4</div>
                    <div className="bm-mini-k">HNR</div>
                  </div>
                </div>
                <div className="risk-row">
                  <div>
                    <div className="risk-lbl">Overall Risk Score</div>
                    <div className="risk-val">0.18 / 1.0</div>
                  </div>
                  <div className="risk-tag">● Green</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <div className="section" id="how">
        <div className="dark-panel reveal" style={{ padding: "68px 52px" }}>
          <div className="s-label" style={{ color: "#D9B8CC" }}>
            <span
              style={{
                background: "#D9B8CC",
                width: 28,
                height: 1,
                display: "inline-block",
                marginRight: 12,
              }}
            ></span>
            Process
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 44,
              alignItems: "end",
            }}
          >
            <h2 className="s-title" style={{ color: "var(--text-inv)" }}>
              From raw audio<br />to risk score
            </h2>
            <p className="s-sub" style={{ color: "rgba(217,184,204,.5)" }}>
              No hospital. No equipment. A four-stage AI pipeline that listens the way a neurologist would — in
              seconds.
            </p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-n">01</div>
              <div className="step-ico">🎙️</div>
              <div className="step-t">Record</div>
              <div className="step-d">
                3-min browser session. MediaRecorder API captures audio — .webm auto-converted to .wav.
              </div>
              <div className="step-sep"></div>
            </div>
            <div className="step-card">
              <div className="step-n">02</div>
              <div className="step-ico">📝</div>
              <div className="step-t">Transcribe</div>
              <div className="step-d">
                Whisper ASR converts speech to full text transcript with high accuracy across accents.
              </div>
              <div className="step-sep"></div>
            </div>
            <div className="step-card">
              <div className="step-n">03</div>
              <div className="step-ico">🔬</div>
              <div className="step-t">Extract</div>
              <div className="step-d">
                openSMILE → 9 acoustic features. spaCy + SBERT → 4 NLP features. 14 biomarkers total.
              </div>
              <div className="step-sep"></div>
            </div>
            <div className="step-card">
              <div className="step-n">04</div>
              <div className="step-ico">⚡</div>
              <div className="step-t">Detect & Track</div>
              <div className="step-d">
                XGBoost flags anomalies. FastAPI stores results. Dashboard renders risk trend over months.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Biomarkers Section */}
      <div className="section reveal">
        <div className="s-label">Clinical Science</div>
        <h2 className="s-title">14 Voice Biomarkers</h2>
        <div className="bm-layout-grid">
          <div>
            <div className="bm-big">14</div>
            <div className="bm-real">14</div>
            <div className="bm-tag-line">Clinical biomarkers per session</div>
            <p className="bm-note">
              The same speech signals clinical researchers use to identify Alzheimer's and MCI — measured
              automatically, every session, without specialist equipment.
            </p>
          </div>
          <div className="bm-groups">
            <div className="bm-group">
              <div className="bm-g-lbl">Acoustic / Temporal</div>
              <div className="bm-chips">
                <span className="bm-chip">Speech Rate</span>
                <span className="bm-chip">Articulation Rate</span>
                <span className="bm-chip">Pause Frequency</span>
                <span className="bm-chip">Pause Duration</span>
                <span className="bm-chip">Filled Pause Rate</span>
              </div>
            </div>
            <div className="bm-group">
              <div className="bm-g-lbl">Prosody / Voice Quality</div>
              <div className="bm-chips">
                <span className="bm-chip">Pitch Mean</span>
                <span className="bm-chip">Pitch Range</span>
                <span className="bm-chip">Jitter</span>
                <span className="bm-chip">Shimmer</span>
                <span className="bm-chip">HNR</span>
              </div>
            </div>
            <div className="bm-group">
              <div className="bm-g-lbl">NLP / Cognitive-Linguistic</div>
              <div className="bm-chips">
                <span className="bm-chip">Lexical Diversity</span>
                <span className="bm-chip">Semantic Coherence</span>
                <span className="bm-chip">Idea Density</span>
                <span className="bm-chip">Syntactic Complexity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Tiers Section */}
      <div className="section" style={{ paddingTop: 20 }}>
        <div className="surface-panel reveal" style={{ padding: "68px 52px" }}>
          <div className="s-label">Risk Assessment</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 44,
              alignItems: "end",
            }}
          >
            <h2 className="s-title">Four-tier classification</h2>
            <p className="s-sub">
              Every session returns a trackable risk tier. See your cognitive trajectory over weeks and months.
            </p>
          </div>
          <div className="tiers-grid">
            <div className="tier t-g">
              <div className="tier-dot"></div>
              <div className="tier-name">Green</div>
              <div className="tier-desc">
                All 14 biomarkers within normal range. Cognitive health is stable and consistent.
              </div>
            </div>
            <div className="tier t-y">
              <div className="tier-dot"></div>
              <div className="tier-name">Yellow</div>
              <div className="tier-desc">
                Mild deviations in 1–3 markers. Monitor closely over the next few sessions.
              </div>
            </div>
            <div className="tier t-o">
              <div className="tier-dot"></div>
              <div className="tier-name">Orange</div>
              <div className="tier-desc">
                Elevated deviation across multiple markers. Lifestyle assessment recommended.
              </div>
            </div>
            <div className="tier t-r">
              <div className="tier-dot"></div>
              <div className="tier-name">Red</div>
              <div className="tier-desc">
                Significant deviation. Consultation with a medical professional is strongly advised.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why It Works Section */}
      <div className="section reveal" style={{ paddingTop: 40 }}>
        <div className="s-label">Why It Works</div>
        <h2 className="s-title">The science of listening</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-idx">01</div>
            <div className="why-t">Voice changes 18 months early</div>
            <div className="why-d">
              Measurable speech changes appear up to 18 months before any clinical symptom. CogniSafe catches the
              signal — not the damage.
            </div>
          </div>
          <div className="why-card">
            <div className="why-idx">02</div>
            <div className="why-t">No equipment needed</div>
            <div className="why-d">
              Just a browser and a microphone. No hospital, no referral, no cost barrier to getting started.
            </div>
          </div>
          <div className="why-card">
            <div className="why-idx">03</div>
            <div className="why-t">Longitudinal tracking</div>
            <div className="why-d">
              A single session is a snapshot. A month of sessions is a trajectory. CogniSafe shows the trend.
            </div>
          </div>
          <div className="why-card">
            <div className="why-idx">04</div>
            <div className="why-t">Private by design</div>
            <div className="why-d">
              Every session is tied to your account with JWT authentication. Your cognitive health data is yours
              alone.
            </div>
          </div>
          <div className="why-card">
            <div className="why-idx">05</div>
            <div className="why-t">Results in seconds</div>
            <div className="why-d">
              Speak for 3 minutes. A full 14-biomarker report is generated and added to your dashboard instantly.
            </div>
          </div>
          <div className="why-card">
            <div className="why-idx">06</div>
            <div className="why-t">Clinical-grade science</div>
            <div className="why-d">
              Every biomarker is grounded in published cognitive health research. We made it accessible to everyone.
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="section reveal" style={{ paddingTop: 20, paddingBottom: 52 }}>
        <div className="s-label">Built With</div>
        <h2 className="s-title">The Stack</h2>
        <div className="stack-grid">
          <div className="stack-item">
            <span className="s-ico">⚛️</span>
            <div>
              <div className="s-name">React 18 + Vite</div>
              <div className="s-layer">Frontend</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">⚡</span>
            <div>
              <div className="s-name">FastAPI</div>
              <div className="s-layer">Backend API</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">🐘</span>
            <div>
              <div className="s-name">PostgreSQL</div>
              <div className="s-layer">Database</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">🔊</span>
            <div>
              <div className="s-name">OpenAI Whisper</div>
              <div className="s-layer">Transcription</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">📊</span>
            <div>
              <div className="s-name">openSMILE</div>
              <div className="s-layer">Acoustic Features</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">🧩</span>
            <div>
              <div className="s-name">spaCy + SBERT</div>
              <div className="s-layer">NLP Analysis</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">🌲</span>
            <div>
              <div className="s-name">XGBoost</div>
              <div className="s-layer">Anomaly Detection</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">🔐</span>
            <div>
              <div className="s-name">JWT + bcrypt</div>
              <div className="s-layer">Auth</div>
            </div>
          </div>
          <div className="stack-item">
            <span className="s-ico">▲</span>
            <div>
              <div className="s-name">Vercel + Render</div>
              <div className="s-layer">Deployment</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section reveal" style={{ paddingTop: 0 }}>
        <div className="cta-block">
          <div
            className="s-label"
            style={{
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
              color: "#D9B8CC",
            }}
          >
            <span
              style={{
                background: "#D9B8CC",
                width: 28,
                height: 1,
                display: "inline-block",
                marginRight: 12,
              }}
            ></span>
            Team FAIV · 2026
          </div>
          <h2 className="cta-title">
            Early detection doesn't<br />require a <em>hospital</em>
          </h2>
          <p className="cta-sub">
            55 million people live with dementia. Most were diagnosed too late. CogniSafe is the tool the world was
            missing.
          </p>
          <div className="cta-quote">
            "It only requires <span>listening.</span>"
          </div>
          <div className="cta-btns">
            <div className="btn-p-inv" onClick={() => goToPage("auth")}>
              Begin Your First Session{" "}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M2 7.5h11M9 3.5l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {/* <div className="btn-g-inv" onClick={() => goToPage("auth")}>
              Sign In
            </div> */}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="f-logo">CogniSafe</div>
        <div className="f-note">Built by Team FAIV · 2026</div>
        <div className="f-note">Voice Intelligence for Brain Health</div>
      </footer>
    </div>
  );
};

export default Home;
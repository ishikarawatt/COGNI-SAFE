import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser, registerUser } from "../services/authService";
import "../styles/auth.css";

// ── NEURAL CANVAS - Rose Gold Theme ──
const useNeuralCanvas = (ref, isDark) => {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, nodes = [];

    const resize = () => {
      const p = canvas.parentElement.getBoundingClientRect();
      canvas.width = p.width;
      canvas.height = p.height;
      nodes = Array.from({ length: 32 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.016;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x,
            dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const color = isDark ? "212,165,181" : "155,79,122";
            ctx.strokeStyle = `rgba(${color}, ${(1 - d / 120) * 0.2})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        const g = 0.5 + 0.5 * Math.sin(n.pulse);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + g * 0.8, 0, Math.PI * 2);
        const color = isDark ? "212,165,181" : "155,79,122";
        ctx.fillStyle = `rgba(${color}, ${0.3 + g * 0.35})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [ref, isDark]);
};

// ── SVG ICONS ──
const LogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="5" stroke="#fff" strokeWidth="1.6" />
    <circle cx="9" cy="9" r="1.8" fill="#fff" />
    <line x1="9" y1="2" x2="9" y2="4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="9" y1="14" x2="9" y2="16" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="2" y1="9" x2="4" y2="9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="14" y1="9" x2="16" y2="9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#8AAACA">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M6.5 10h2v7.5h-2V10zm1-3a1.25 1.25 0 110 2.5A1.25 1.25 0 017.5 7zm4.5 3h1.9v1h.02C14.28 10.4 15.14 10 16.1 10c2.1 0 2.9 1.38 2.9 3.17V17.5h-2v-4c0-.76-.01-1.73-1.06-1.73-1.06 0-1.22.83-1.22 1.68V17.5H12V10z" fill="#fff" />
  </svg>
);

// ── STRENGTH BAR ──
const getStr = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

const StrengthBar = ({ password }) => {
  const score = getStr(password);
  const colors = ["#EF4444", "#F59E0B", "#F59E0B", "#10B981"];
  return (
    <div className="strength">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="str-seg"
          style={{ background: i < score ? colors[score - 1] : "var(--border)" }}
        />
      ))}
    </div>
  );
};

// ── MAIN COMPONENT ──
const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("auth_theme");
    return saved === "dark";
  });
  const [mode, setMode] = useState("login");
  const [state, setState] = useState("form");
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", dob: "" });
  const [errors, setErrors] = useState({ email: "", password: "", dob: "" });
  const [toast, setToast] = useState(null);

  useNeuralCanvas(canvasRef, dark);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("auth_theme", dark ? "dark" : "light");
  }, [dark]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const isReg = mode === "register";
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const errs = { email: "", password: "", dob: "" };
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (isReg && form.password && form.password.length < 8)
      errs.password = "Minimum 8 characters required";
    if (isReg && !form.dob) errs.dob = "Required";
    setErrors(errs);
    return !errs.email && !errs.password && !errs.dob;
  };

  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!validate()) return;
    setState("loading");
    const emailTrimmed = form.email.trim();
    const passwordTrimmed = form.password.trim();
    const firstNameTrimmed = form.firstName.trim();
    const lastNameTrimmed = form.lastName.trim();

    try {
      let tokenData;
      if (isReg) {
        tokenData = await registerUser(
          firstNameTrimmed + " " + lastNameTrimmed,
          emailTrimmed,
          passwordTrimmed,
          form.dob || null
        );
      } else {
        tokenData = await loginUser(emailTrimmed, passwordTrimmed);
      }
      login(tokenData);
      setState("success");
      let p = 0;
      const iv = setInterval(() => {
        p += 2;
        setProgress(p);
        if (p >= 100) {
          clearInterval(iv);
          const redirectTo = location.state?.redirectTo || "/dashboard";
          setTimeout(() => navigate(redirectTo), 300);
        }
      }, 40);
    } catch (err) {
      setState("form");
      setErrors((prev) => ({ ...prev, email: err.message }));
    }
  };

  const handleDemoLogin = () => {
    setState("loading");
    setTimeout(() => {
      const demoUser = {
        access_token: "demo-token-12345",
        user_id: 999,
        name: "Demo User",
        email: "demo@cognisafe.app",
      };
      login(demoUser);
      setState("success");
      let p = 0;
      const iv = setInterval(() => {
        p += 2;
        setProgress(p);
        if (p >= 100) {
          clearInterval(iv);
          navigate("/dashboard");
        }
      }, 40);
    }, 600);
  };

  const switchMode = (m) => {
    setMode(m);
    setForm({ firstName: "", lastName: "", email: "", password: "", dob: "" });
    setErrors({ email: "", password: "", dob: "" });
  };

  const toggleTheme = () => {
    setDark(!dark);
  };

  return (
    <div className="auth-root">
      {/* LEFT PANEL */}
      <div className="left">
        <canvas ref={canvasRef} className="neural" />
        <div className="mesh">
          <div className="mesh-orb orb1" />
          <div className="mesh-orb orb2" />
          <div className="mesh-orb orb3" />
        </div>
        <div className="grid-lines" />
        <div className="left-content">
          <div className="logo-row" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <div className="logo-box">
              <LogoIcon />
            </div>
            <span className="logo-name">CogniSafe</span>
          </div>
          <div className="hero-block">
            <div className="hero-eyebrow">
              <span className="eyebrow-line" />
              AI-Powered Cognitive Health
            </div>
            <h1 className="hero-title">
              Hear the<br />
              <span>sound</span> of<br />
              your <em>mind.</em>
            </h1>
            <p className="hero-body">
              Voice biomarkers detect cognitive changes up to 18 months before symptoms appear — passively, daily,
              privately.
            </p>
            <div className="feat-pills">
              <span className="pill">
                <span className="pill-dot" />
                14 biomarkers
              </span>
              <span className="pill">3 min daily</span>
              <span className="pill">HIPAA compliant</span>
              <span className="pill">AI-powered</span>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat">
              <span className="stat-num">18mo</span>
              <span className="stat-label">early detection</span>
            </div>
            <div className="stat">
              <span className="stat-num">150M</span>
              <span className="stat-label">at risk by 2050</span>
            </div>
            <div className="stat">
              <span className="stat-num">99%</span>
              <span className="stat-label">encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right">
        <button className="mode-toggle" onClick={toggleTheme}>
          {dark ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>

        {state !== "success" && (
          <div className="form-card">
            <div className="form-top">
              <div className="form-greeting">{isReg ? "Get started for free" : "Welcome back"}</div>
              <div className="form-title">{isReg ? "Create your account" : "Sign in to CogniSafe"}</div>
              <div className="form-sub">
                {isReg ? "Start tracking your cognitive health today" : "Access your cognitive health dashboard"}
              </div>
            </div>

            <div className="seg">
              <button className={`seg-btn ${!isReg ? "act" : ""}`} onClick={() => switchMode("login")}>
                Sign in
              </button>
              <button className={`seg-btn ${isReg ? "act" : ""}`} onClick={() => switchMode("register")}>
                Create account
              </button>
            </div>

            {isReg && (
              <div className="field-row" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label className="f-label">First name</label>
                  <input className="f-input" type="text" placeholder="Arjun" value={form.firstName} onChange={update("firstName")} />
                </div>
                <div className="field">
                  <label className="f-label">Last name</label>
                  <input className="f-input" type="text" placeholder="Sharma" value={form.lastName} onChange={update("lastName")} />
                </div>
              </div>
            )}

            <div className="field">
              <label className="f-label">Email address</label>
              <input
                className="f-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => {
                  update("email")(e);
                  validate();
                }}
              />
              {errors.email && <span className="f-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label className="f-label">Password</label>
              <div className="form-input-wrap">
                <input
                  id={isReg ? "pw-reg" : "pw-login"}
                  className="f-input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => {
                    update("password")(e);
                    validate();
                  }}
                  autoComplete={isReg ? "new-password" : "current-password"}
                />
                <div className="input-icon" onClick={() => {
                  const input = document.getElementById(isReg ? "pw-reg" : "pw-login");
                  if (input) input.type = input.type === "password" ? "text" : "password";
                }}>👁</div>
              </div>
              {isReg && form.password && <StrengthBar password={form.password} />}
              {errors.password && <span className="f-error">{errors.password}</span>}
            </div>

            {isReg && (
              <div className="field" style={{ marginBottom: 16 }}>
                <label className="f-label">Date of birth</label>
                <input className="f-input" type="date" value={form.dob} onChange={update("dob")} />
                {errors.dob && <span className="f-error">{errors.dob}</span>}
              </div>
            )}

            {!isReg && (
              <div className="forgot-row">
                <a href="#" className="forgot">
                  Forgot password?
                </a>
              </div>
            )}

            <button className="submit-btn" onClick={handleSubmit} disabled={state === "loading"}>
              <span className="btn-shine" />
              {state === "loading" ? (
                <>
                  <span className="spinner" />
                  {isReg ? "Creating account…" : "Signing in…"}
                </>
              ) : isReg ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </button>

            <div className="divider">
              <div className="div-line" />
              <span className="div-text">or continue with</span>
              <div className="div-line" />
            </div>

            <div className="socials">
              <button className="soc-btn" onClick={() => showToast("Google login coming soon")}>
                <GoogleIcon />
                Google
              </button>
              <button className="soc-btn" onClick={() => showToast("GitHub login coming soon")}>
                <GithubIcon />
                GitHub
              </button>
              <button className="soc-btn" onClick={() => showToast("LinkedIn login coming soon")}>
                <LinkedInIcon />
                LinkedIn
              </button>
            </div>

            <button className="demo-btn" onClick={handleDemoLogin}>
              Continue with Demo Account
            </button>

            <p className="switch-txt">
              {isReg ? (
                <>
                  Already have an account?{" "}
                  <span className="switch-link" onClick={() => switchMode("login")}>
                    Sign in →
                  </span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span className="switch-link" onClick={() => switchMode("register")}>
                    Create one free →
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {state === "success" && (
          <div className="success-card" style={{ display: "flex" }}>
            <div className="success-orb">✓</div>
            <div className="form-title">Welcome to CogniSafe!</div>
            <div className="form-sub" style={{ textAlign: "center", lineHeight: 1.65 }}>
              Your account is ready. Taking you to
              <br />
              your cognitive health dashboard…
            </div>
            <div style={{ width: "100%", maxWidth: 280 }}>
              <div
                style={{
                  height: 4,
                  background: "var(--border)",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #9B4F7A, #B5689A)",
                    borderRadius: 4,
                    transition: "width 0.1s linear",
                  }}
                />
              </div>
            </div>
            <button className="success-btn" onClick={() => navigate("/dashboard")}>
              Open Dashboard →
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className="toast">
          <span>💬</span> {toast}
        </div>
      )}
    </div>
  );
};

export default Auth;
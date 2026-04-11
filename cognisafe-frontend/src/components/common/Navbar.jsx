import { useNavigate, useLocation } from "react-router-dom";

const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="5" stroke="#fff" strokeWidth="1.6"/>
    <circle cx="9" cy="9" r="1.8" fill="#fff"/>
    <line x1="9" y1="2"  x2="9"  y2="4"  stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="9" y1="14" x2="9"  y2="16" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="2" y1="9"  x2="4"  y2="9"  stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="14" y1="9" x2="16" y2="9"  stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.replace("/", "") || "dashboard";

  return (
    <nav className="shared-nav">
      <a href="/dashboard" className="nav-logo">
        <div className="nav-logo-box"><LogoIcon /></div>
        <span className="nav-logo-name">CogniSafe</span>
      </a>
      <div className="nav-links">
        {["dashboard","session","brain","ar-report"].map(p => (
          <button
            key={p}
            className={`nav-link ${active === p ? "active" : ""}`}
            onClick={() => navigate(`/${p}`)}
          >
            {p === "ar-report" ? "AR Report" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <button className="nav-session-btn" onClick={() => navigate("/session")}>+ Start session</button>
        <div className="nav-avatar">AS</div>
      </div>
    </nav>
  );
};

export default Navbar;
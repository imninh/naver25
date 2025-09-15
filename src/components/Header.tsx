import { Link, useLocation } from "react-router-dom";
import HackathonLogo from "../assets/hackathon-graphic.svg";
import ReactLogo from "../assets/react.svg";
import "../index.css"; 
import CopycatLogo from "../assets/copycat-logo.png";

export default function Header() {
  const location = useLocation();
  const navItems = [
    { to: "/", label: "List", icon: "📝" },
    { to: "/calendar", label: "Calendar", icon: "📅" },
    { to: "/analytics", label: "Analytics", icon: "📊" },
  ];

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo">
            <img src={ReactLogo} alt="React" className="w-8 h-8" />
          </div>
          <div className="brand-text">
            <h1 className="brand-name">Student Companion</h1>
            <p className="brand-tagline">Your all-in-one study management solution</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${location.pathname === item.to ? "nav-item-active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="tech-logos">
          <div className="tech-logo">
            <img src={HackathonLogo} alt="Hackathon" className="h-6" />
            <span className="text-xs text-gray-400 ml-2">NAVER Vietnam AI HACKATHON 2025</span>
          </div>
        </div>
      </div>

      <div className="hackathon-info">
        <p className="manager-text">Task Management Application</p>
      </div>
    </header>
  );
}
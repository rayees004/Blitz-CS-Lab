import React from "react";
import {
  Zap, Home, GraduationCap, FlaskConical, CalendarDays, BookOpen,
  TrendingUp, Trophy, Award, Rocket, LogOut, LayoutDashboard,
} from "lucide-react";
import "./smart.css";

// Smart UI icons per student page (falls back to the item's own icon)
const ICONS = {
  dashboard: Home,
  learning: GraduationCap,
  labs: FlaskConical,
  attendance: CalendarDays,
  materials: BookOpen,
  progress: TrendingUp,
  leaderboard: Trophy,
  certificates: Award,
};

export default function SmartSidebar({ items, active, onSelect, onSignOut, onToggleView = null }) {
  return (
    <aside className="smart-sidebar smart-ui" aria-label="Main navigation">
      <div className="smart-brand">
        <Zap className="smart-brand-icon" size={32} color="#f5a623" fill="#f5a623" strokeWidth={1.4} />
        <div className="smart-brand-text">
          <div className="smart-brand-name">
            BLITZ<span>/</span>CYBER
            <br />
            LAB
          </div>
          <div className="smart-brand-tag">Learn • Practice • Grow</div>
        </div>
      </div>

      <nav className="smart-nav">
        {items.map((it) => {
          const Icon = ICONS[it.key] || it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              type="button"
              className={`smart-nav-item${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              title={it.label}
              onClick={() => onSelect(it.key)}
            >
              <Icon
                size={17}
                strokeWidth={isActive ? 2.3 : 1.9}
                color={isActive ? "#f5a623" : "#8a93a1"}
                fill={isActive && it.key === "dashboard" ? "#f5a623" : "none"}
              />
              <span className="smart-label">{it.label}</span>
            </button>
          );
        })}
      </nav>

      <button type="button" className="smart-promo" onClick={() => onSelect("labs")} title="Go to Labs">
        <Rocket size={26} color="#f5a623" strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <div style={{ position: "relative" }}>
          <div className="smart-promo-title">Keep Learning!</div>
          <div className="smart-promo-sub">
            Build Skills.
            <br />
            Grow Together.
          </div>
        </div>
      </button>

      <div className="smart-foot">
        {onToggleView && (
          <button type="button" className="smart-foot-item" onClick={onToggleView} title="Admin Dashboard">
            <LayoutDashboard size={15} color="#f5a623" />
            <span className="smart-label">Admin Dashboard</span>
          </button>
        )}
        <button type="button" className="smart-foot-item" onClick={onSignOut} title="Sign out">
          <LogOut size={15} color="#8a93a1" />
          <span className="smart-label">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

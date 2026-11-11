import React from "react";
import {
  Zap, Home, GraduationCap, FlaskConical, CalendarDays, BookOpen,
  TrendingUp, Trophy, Award, Rocket, LogOut, LayoutDashboard, Eye, Shield, ExternalLink,
} from "lucide-react";
import { DJANGO_ADMIN_URL } from "../../api/client";
import "./smart.css";

// Smart UI icons per page (falls back to the item's own icon)
const ICONS = {
  dashboard: Home,
  learning: GraduationCap,
  labs: FlaskConical,
  attendance: CalendarDays,
  materials: BookOpen,
  progress: TrendingUp,
  leaderboard: Trophy,
  certificates: Award,
  "a-dashboard": Home,
};

const HOME_KEYS = new Set(["dashboard", "a-dashboard"]);

/**
 * Smart UI sidebar for every role.
 * viewMode "student": student panel (with the "Keep Learning" card).
 * viewMode "admin": admin / instructor console.
 * onToggleView: admins only, switches between the admin console and the student preview.
 */
export default function SmartSidebar({
  items,
  active,
  onSelect,
  onSignOut,
  onToggleView = null,
  viewMode = "student",
  tagline = "Learn • Practice • Grow",
  canAccessDjangoAdmin = false,
}) {
  const isStudentView = viewMode === "student";

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
          <div className="smart-brand-tag">{tagline}</div>
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
                fill={isActive && HOME_KEYS.has(it.key) ? "#f5a623" : "none"}
              />
              <span className="smart-label">{it.label}</span>
            </button>
          );
        })}
      </nav>

      {isStudentView && (
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
      )}

      <div className="smart-foot">
        {canAccessDjangoAdmin && (
          <a
            className="smart-foot-item is-django"
            href={DJANGO_ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Django Administration Portal (/admin/)"
          >
            <Shield size={15} color="#34d399" />
            <span className="smart-label">Django Admin</span>
            <ExternalLink className="smart-label" size={11} color="#34d399" style={{ marginLeft: "auto" }} />
          </a>
        )}
        {onToggleView && (
          <button
            type="button"
            className="smart-foot-item"
            onClick={onToggleView}
            title={isStudentView ? "Return to Admin Dashboard" : "Preview Student View"}
          >
            {isStudentView ? <LayoutDashboard size={15} color="#f5a623" /> : <Eye size={15} color="#3fd8c8" />}
            <span className="smart-label">{isStudentView ? "Admin Dashboard" : "Student View"}</span>
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

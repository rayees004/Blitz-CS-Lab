import React from "react";
import { Bell, Shield, ExternalLink, Eye } from "lucide-react";
import { DJANGO_ADMIN_URL } from "../../api/client";
import "./smart.css";

const ROLE_BADGE = {
  admin: { label: "ADMIN", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.35)" },
  instructor: { label: "INSTRUCTOR", color: "#c084fc", bg: "rgba(192, 132, 252, 0.14)", border: "rgba(192, 132, 252, 0.35)" },
  student: { label: "STUDENT", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.35)" },
};

/**
 * Smart UI top bar for every role.
 * canAccessDjangoAdmin / onPreviewStudent: admin console quick actions (left side).
 */
export default function SmartTopbar({ name, role, userType = "student", canAccessDjangoAdmin = false, onPreviewStudent = null }) {
  const badge = ROLE_BADGE[userType] || ROLE_BADGE.student;
  const hasActions = canAccessDjangoAdmin || onPreviewStudent;

  return (
    <header className="smart-topbar smart-ui">
      {hasActions && (
        <div className="smart-top-actions">
          {canAccessDjangoAdmin && (
            <a
              className="smart-top-action is-django"
              href={DJANGO_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Django Administration Panel (/admin/)"
            >
              <Shield size={13} />
              <span>Django Admin</span>
              <ExternalLink size={11} style={{ opacity: 0.8 }} />
            </a>
          )}
          {onPreviewStudent && (
            <button type="button" className="smart-top-action" onClick={onPreviewStudent} title="Preview Platform as Student">
              <Eye size={13} />
              <span>Preview Student View</span>
            </button>
          )}
        </div>
      )}

      <Bell size={18} color="#aab2bf" strokeWidth={1.9} aria-hidden="true" />
      <div style={{ width: 1, height: 24, background: "#232a35" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className={`smart-avatar is-${userType}`} aria-hidden="true">
          {name ? name[0].toUpperCase() : "U"}
        </div>
        <div className="smart-user-text" style={{ lineHeight: 1.3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#fff" }}>{name}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "1px 6px",
                borderRadius: 5,
                color: badge.color,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
              }}
            >
              {badge.label}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: "#9ba3b0" }}>{role}</div>
        </div>
      </div>
    </header>
  );
}

import React from "react";
import { Bell } from "lucide-react";
import UiModeSwitch from "../layout/UiModeSwitch";
import "./smart.css";

const ROLE_BADGE = {
  admin: { label: "ADMIN", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.35)" },
  instructor: { label: "INSTRUCTOR", color: "#c084fc", bg: "rgba(192, 132, 252, 0.14)", border: "rgba(192, 132, 252, 0.35)" },
  student: { label: "STUDENT", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.35)" },
};

export default function SmartTopbar({ name, role, userType = "student", uiMode, onUiModeChange }) {
  const badge = ROLE_BADGE[userType] || ROLE_BADGE.student;
  return (
    <header className="smart-topbar smart-ui">
      {onUiModeChange && <UiModeSwitch mode={uiMode} onChange={onUiModeChange} />}

      <Bell size={22} color="#aab2bf" strokeWidth={1.9} aria-hidden="true" />
      <div style={{ width: 1, height: 30, background: "#232a35" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="smart-avatar" aria-hidden="true">
          {name ? name[0].toUpperCase() : "U"}
        </div>
        <div className="smart-user-text" style={{ lineHeight: 1.3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{name}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "2px 7px",
                borderRadius: 6,
                color: badge.color,
                background: badge.bg,
                border: `1px solid ${badge.border}`,
              }}
            >
              {badge.label}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "#9ba3b0" }}>{role}</div>
        </div>
      </div>
    </header>
  );
}

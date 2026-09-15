import React from "react";
import { Shield, HelpCircle, Settings, LogOut } from "lucide-react";
import Logo from "./Logo";
import { C, sans } from "../../constants/theme";

export default function Sidebar({ items, active, onSelect, footerExtra, onSwitch, switchLabel }) {
  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: C.panel,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ padding: "20px 18px 16px" }}>
        <Logo />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }}>
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <div
              key={it.key}
              onClick={() => onSelect(it.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 7,
                marginBottom: 2,
                cursor: "pointer",
                fontFamily: sans,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? C.hi : C.mid,
                background: isActive ? C.panel3 : "transparent",
                borderLeft: isActive ? `2px solid ${C.amber}` : "2px solid transparent",
              }}
            >
              <it.icon size={16} strokeWidth={2} color={isActive ? C.amber : C.low} />
              {it.label}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "10px", borderTop: `1px solid ${C.border}` }}>
        {onSwitch && (
          <div
            onClick={onSwitch}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: sans,
              fontSize: 13,
              color: C.cyan,
              marginBottom: 2,
            }}
          >
            <Shield size={16} strokeWidth={2} color={C.cyan} />
            {switchLabel}
          </div>
        )}
        {[
          { label: "Help", icon: HelpCircle },
          { label: "Settings", icon: Settings },
          { label: "Logout", icon: LogOut, onClick: onSwitch },
        ].map((it) => (
          <div
            key={it.label}
            onClick={it.onClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: sans,
              fontSize: 13,
              color: C.mid,
            }}
          >
            <it.icon size={16} strokeWidth={2} color={C.low} />
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}

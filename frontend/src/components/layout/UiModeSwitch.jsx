import React from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { C } from "../../constants/theme";

const OPTIONS = [
  { key: "classic", label: "Classic", icon: LayoutGrid, title: "Switch to the classic interface" },
  { key: "smart", label: "Smart UI", icon: Sparkles, title: "Switch to the new smart interface" },
];

/** Classic / Smart UI switch shown in the student top bar */
export default function UiModeSwitch({ mode, onChange }) {
  return (
    <div
      role="group"
      aria-label="Interface style"
      style={{
        display: "inline-flex",
        padding: 3,
        gap: 2,
        borderRadius: 999,
        background: "rgba(255, 255, 255, 0.04)",
        border: `1px solid ${C.border}`,
      }}
    >
      {OPTIONS.map((opt) => {
        const on = mode === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={on}
            title={opt.title}
            onClick={() => !on && onChange(opt.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              border: "none",
              cursor: on ? "default" : "pointer",
              fontSize: 12,
              fontWeight: 600,
              background: on ? C.amber : "transparent",
              color: on ? "#1a1200" : C.mid,
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            <opt.icon size={13} strokeWidth={2.2} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

import React from "react";
import { C, mono } from "../../constants/theme";

export function Badge({ children, tone = "default" }) {
  const tones = {
    default: { bg: "rgba(155,163,176,0.10)", fg: C.mid, bd: C.border },
    amber: { bg: "rgba(245,166,35,0.12)", fg: C.amber, bd: "rgba(245,166,35,0.35)" },
    cyan: { bg: "rgba(63,216,200,0.12)", fg: C.cyan, bd: "rgba(63,216,200,0.35)" },
    danger: { bg: "rgba(229,83,75,0.12)", fg: C.danger, bd: "rgba(229,83,75,0.35)" },
    warn: { bg: "rgba(240,180,41,0.12)", fg: C.warn, bd: "rgba(240,180,41,0.35)" },
  };
  const t = tones[tone] || tones.default;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 5,
        fontSize: 11,
        fontFamily: mono,
        fontWeight: 500,
        letterSpacing: "0.02em",
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function DiffBadge({ level }) {
  const map = {
    Beginner: "cyan",
    Intermediate: "amber",
    Advanced: "danger",
  };
  return <Badge tone={map[level] || "default"}>{level}</Badge>;
}

export default Badge;

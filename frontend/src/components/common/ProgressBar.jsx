import React from "react";
import { C } from "../../constants/theme";

const TONES = { amber: C.amber, cyan: C.cyan, green: "#4ade80" };

// value: percentage 0-100 (clamped). tone: amber | cyan | green; `color` overrides the tone.
// `pct` is accepted as an alias of `value` (some pages pass pct/color).
export default function ProgressBar({ value, pct, tone = "amber", color, h = 6 }) {
  const raw = Number(value ?? pct);
  const width = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  const fill = color || TONES[tone] || C.mid;
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: C.panel3, overflow: "hidden" }}>
      <div style={{ width: `${width}%`, height: "100%", borderRadius: h, background: fill }} />
    </div>
  );
}

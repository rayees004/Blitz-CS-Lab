import React from "react";
import { C } from "../../constants/theme";

export default function ProgressBar({ value, tone = "amber", h = 6 }) {
  const color = tone === "amber" ? C.amber : tone === "cyan" ? C.cyan : C.mid;
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: C.panel3, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", borderRadius: h, background: color }} />
    </div>
  );
}

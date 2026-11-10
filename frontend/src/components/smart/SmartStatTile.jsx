import React from "react";
import { ArrowRight } from "lucide-react";
import "./smart.css";

// Colour per tile: main tint, deep tint for the icon circle, rgb for translucent fills
const TINTS = {
  blue: ["#3b82f6", "#1e40af", "59, 130, 246"],
  green: ["#22c55e", "#15803d", "34, 197, 94"],
  purple: ["#a855f7", "#6b21a8", "168, 85, 247"],
  amber: ["#f5a623", "#a16207", "245, 166, 35"],
  violet: ["#7c3aed", "#4c1d95", "124, 58, 237"],
  teal: ["#14b8a6", "#0f766e", "20, 184, 166"],
};

const WAVES = [
  "M0 52 C40 52 60 30 100 36 C140 42 160 14 200 8",
  "M0 50 C30 50 50 40 80 42 C120 46 140 20 170 22 C185 23 192 30 200 32",
  "M0 54 C40 54 70 46 100 30 C130 14 160 40 200 26",
];

let waveIds = 0;

/**
 * Coloured stat card of the Smart UI: icon circle, label, value, sub text and a wave.
 * With onClick it is a button with an arrow; `compact` is the smaller size used inside pages.
 */
export default function SmartStatTile({ tint = "blue", icon: Icon, label, value, unit, sub, wave = 0, onClick, compact = false }) {
  const [color, deep, rgb] = TINTS[tint] || TINTS.blue;
  const [gradId] = React.useState(() => `smart-wave-${++waveIds}`);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`smart-stat${compact ? " is-compact" : ""}`}
      onClick={onClick}
      title={onClick ? `${label}: open details` : undefined}
      style={{
        "--tint": color,
        "--tint-deep": deep,
        "--tint-bg": `rgba(${rgb}, 0.13)`,
        "--tint-border": `rgba(${rgb}, 0.3)`,
      }}
    >
      {Icon && (
        <span className="smart-stat-icon">
          <Icon size={compact ? 18 : 22} color="#fff" strokeWidth={2.2} fill={tint === "amber" ? "#fff" : "none"} />
        </span>
      )}
      <span className="smart-stat-text" style={{ minWidth: 0 }}>
        <span className="smart-stat-label">{label}</span>
        <span className="smart-stat-value">
          {value}
          {unit && <small> {unit}</small>}
        </span>
        {sub && <span className="smart-stat-sub">{sub}</span>}
      </span>
      {onClick && (
        <span className="smart-stat-arrow" aria-hidden="true">
          <ArrowRight size={14} strokeWidth={2.4} />
        </span>
      )}
      <svg className="smart-stat-wave" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${WAVES[wave % WAVES.length]} L200 64 L0 64 Z`} fill={`url(#${gradId})`} />
        <path d={WAVES[wave % WAVES.length]} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </Tag>
  );
}

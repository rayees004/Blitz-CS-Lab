import React from "react";
import { C, sans } from "../../constants/theme";

export default function Btn({ children, variant = "primary", onClick, style, icon: Icon, small }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontFamily: sans,
    fontWeight: 600,
    fontSize: small ? 12.5 : 13.5,
    padding: small ? "6px 12px" : "9px 16px",
    borderRadius: 7,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "background 120ms ease, border-color 120ms ease, transform 80ms ease",
  };
  const variants = {
    primary: { background: C.amber, color: "#1A1200", border: `1px solid ${C.amber}` },
    outline: { background: "transparent", color: C.hi, border: `1px solid ${C.borderLight}` },
    ghost: { background: "transparent", color: C.mid, border: "1px solid transparent" },
    subtle: { background: C.panel3, color: C.hi, border: `1px solid ${C.border}` },
  };
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {Icon && <Icon size={small ? 13 : 15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

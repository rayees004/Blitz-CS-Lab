import React from "react";
import { C, sans } from "../../constants/theme";
import { useSmartUi } from "../../utils/uiMode";

export default function Btn({ children, variant = "primary", onClick, style, icon: Icon, small, sm, disabled, type = "button", ...rest }) {
  const isSmall = small || sm;
  const smart = useSmartUi();
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontFamily: sans,
    fontWeight: 600,
    fontSize: isSmall ? 12.5 : 13.5,
    padding: isSmall ? "6px 12px" : "9px 16px",
    borderRadius: 7,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "background 120ms ease, border-color 120ms ease, transform 80ms ease",
  };
  const variants = {
    primary: { background: C.amber, color: "#1A1200", border: `1px solid ${C.amber}` },
    outline: { background: "transparent", color: C.hi, border: `1px solid ${C.borderLight}` },
    ghost: { background: "transparent", color: C.mid, border: "1px solid transparent" },
    subtle: { background: C.panel3, color: C.hi, border: `1px solid ${C.border}` },
  };
  if (smart) {
    // Student panel Smart UI: rounder buttons, glowing gold primary
    base.borderRadius = isSmall ? 8 : 10;
    variants.primary = {
      background: "linear-gradient(180deg, #ffc046, #f5a623)",
      color: "#1A1200",
      border: "1px solid #f5a623",
      boxShadow: "0 5px 14px -7px rgba(245, 166, 35, 0.8)",
    };
    variants.outline = { background: "rgba(255, 255, 255, 0.02)", color: C.hi, border: "1px solid #2c3444" };
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = "scale(1)";
      }}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {Icon && <Icon size={isSmall ? 13 : 15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

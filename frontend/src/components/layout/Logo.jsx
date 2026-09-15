import React from "react";
import { C, mono } from "../../constants/theme";

export default function Logo({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M4 16C4 9.373 9.373 4 16 4s12 5.373 12 12-5.373 12-12 12S4 22.627 4 16Z" stroke={C.borderLight} strokeWidth="1.4" />
        <path d="M17.6 7.5 9.8 17.4h5.1l-1.1 7.1 8-10.3h-5.2l1-6.7Z" fill={C.amber} />
      </svg>
      <span style={{ fontFamily: mono, fontWeight: 600, fontSize: size * 0.62, color: C.hi, letterSpacing: "-0.01em" }}>
        BLITZ<span style={{ color: C.amber }}>/</span>CYBER LAB
      </span>
    </div>
  );
}

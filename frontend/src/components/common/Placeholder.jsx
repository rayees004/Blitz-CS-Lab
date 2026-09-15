import React from "react";
import { C, sans } from "../../constants/theme";

export default function Placeholder({ title, blurb, icon: Icon }) {
  return (
    <div style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>{title}</h1>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: C.panel, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={C.low} />
        </div>
        <div style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, maxWidth: 340, textAlign: "center" }}>{blurb}</div>
      </div>
    </div>
  );
}

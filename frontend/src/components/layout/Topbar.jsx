import React from "react";
import { Bell } from "lucide-react";
import { C, sans, mono } from "../../constants/theme";

export default function Topbar({ name, role }) {
  return (
    <div
      style={{
        height: 58,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 22px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Bell size={17} color={C.mid} strokeWidth={2} style={{ cursor: "pointer" }} />
        <div style={{ width: 1, height: 22, background: C.border }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: C.panel3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: mono,
              fontSize: 12,
              fontWeight: 600,
              color: C.amber,
              border: `1px solid ${C.border}`,
            }}
          >
            {name ? name[0] : "U"}
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>{name}</div>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

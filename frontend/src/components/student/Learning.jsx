import React from "react";
import Panel from "../common/Panel";
import ProgressBar from "../common/ProgressBar";
import { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { CATEGORIES } from "../../data/mockData";

export default function Learning() {
  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Learning</h1>
      <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
        Structured tracks across nine security domains.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
        {CATEGORIES.map((c) => (
          <Panel key={c.name} style={{ padding: 18, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>{c.name}</div>
              <DiffBadge level={c.diff === "Mixed" ? "Beginner" : c.diff} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 8 }}>{c.labs} labs</div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: sans, fontSize: 11.5, color: C.mid }}>Progress</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.hi }}>{c.pct}%</span>
              </div>
              <ProgressBar value={c.pct} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

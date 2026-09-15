import React from "react";
import { Plus } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { CLASSES } from "../../data/mockData";

export default function AdminClasses() {
  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Classes</h1>
        <Btn icon={Plus}>Create Class</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 20 }}>
        {CLASSES.map((c) => (
          <Panel key={c.name} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>{c.name}</div>
              <Badge tone={c.fee === "PAID" ? "cyan" : c.fee === "DUE" ? "danger" : "warn"}>{c.fee}</Badge>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              {["Overview", "Students", "Labs", "Materials", "Activity"].map((t, i) => (
                <span key={t} style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: i === 0 ? C.amber : C.low, cursor: "pointer" }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
              {[["Students", c.students], ["Labs Assigned", c.labs], ["Materials", c.materials]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: mono, fontSize: 17, fontWeight: 600, color: C.hi }}>{v}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>{k}</div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

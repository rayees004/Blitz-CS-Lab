import React from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";

export default function AdminStudents() {
  const students = [
    ["Rohith K.", "Bug Bounty Batch 01", "PAID", "ACTIVE", "62%"],
    ["Anjali S.", "Web Security — Evening", "DUE", "ACTIVE", "48%"],
    ["Marcus T.", "API Security Intensive", "PARTIAL", "RESTRICTED", "30%"],
    ["Priya N.", "OSINT Fundamentals", "PAID", "ACTIVE", "81%"],
    ["Jordan L.", "Bug Bounty Batch 01", "DUE", "SUSPENDED", "12%"],
  ];
  const feeTone = { PAID: "cyan", DUE: "danger", PARTIAL: "warn" };
  const accessTone = { ACTIVE: "cyan", RESTRICTED: "warn", EXPIRED: "default", SUSPENDED: "danger" };

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Students</h1>
        <Btn icon={Plus}>Add Student</Btn>
      </div>
      <Panel style={{ marginTop: 20, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 0.9fr 1fr 0.8fr 0.4fr", padding: "10px 18px", borderBottom: `1px solid ${C.border}`, fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em" }}>
          <div>NAME</div><div>CLASS</div><div>FEE</div><div>ACCESS</div><div>PROGRESS</div><div />
        </div>
        {students.map((s, i) => (
          <div key={s[0]} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 0.9fr 1fr 0.8fr 0.4fr", padding: "13px 18px", alignItems: "center", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: C.panel3, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 11, color: C.amber }}>{s[0][0]}</div>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>{s[0]}</span>
            </div>
            <span style={{ fontFamily: sans, fontSize: 12.5, color: C.mid }}>{s[1]}</span>
            <div><Badge tone={feeTone[s[2]]}>{s[2]}</Badge></div>
            <div><Badge tone={accessTone[s[3]]}>{s[3]}</Badge></div>
            <span style={{ fontFamily: mono, fontSize: 12, color: C.hi }}>{s[4]}</span>
            <MoreHorizontal size={15} color={C.low} style={{ cursor: "pointer" }} />
          </div>
        ))}
      </Panel>
    </div>
  );
}

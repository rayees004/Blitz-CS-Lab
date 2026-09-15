import React from "react";
import { FileText, Download } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";

export default function Materials() {
  const rows = [
    ["Web App Testing Methodology", "Web Security", "Bug Bounty Batch 01", "SQL Injection", "2 days ago"],
    ["Authentication Bypass Patterns", "Authentication", "Web Security — Evening", "JWT Forgery", "1 week ago"],
    ["API Fuzzing Playbook", "API Security", "API Security Intensive", "GraphQL Leak", "2 weeks ago"],
    ["OSINT Reconnaissance Guide", "OSINT", "OSINT Fundamentals", "Subdomain Takeover", "3 weeks ago"],
  ];
  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Study Materials</h1>
      <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>Reference documents linked to your enrolled classes.</p>
      <Panel style={{ marginTop: 20, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div
            key={r[0]}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                background: "rgba(229,83,75,0.1)",
                border: `1px solid rgba(229,83,75,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={15} color={C.danger} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi }}>{r[0]}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 3 }}>
                {r[1]} · {r[2]} · Related: {r[3]}
              </div>
            </div>
            <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>{r[4]}</span>
            <Btn variant="ghost" small icon={FileText}>Read</Btn>
            <Btn variant="outline" small icon={Download}>Download</Btn>
          </div>
        ))}
      </Panel>
    </div>
  );
}

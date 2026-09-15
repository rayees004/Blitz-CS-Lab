import React from "react";
import { Users, Activity, Wallet, TrendingUp } from "lucide-react";
import Panel from "../common/Panel";
import StatCard from "../common/StatCard";
import Badge, { DiffBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { LABS, CLASSES } from "../../data/mockData";

export default function AdminDashboard() {
  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Admin Dashboard</h1>
      <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>Overview across all classes and labs.</p>

      <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
        <StatCard label="Total Students" value="312" icon={Users} />
        <StatCard label="Active Students" value="276" icon={Activity} sub="88% active" tone="cyan" />
        <StatCard label="Fee Due" value="₹1.4L" icon={Wallet} />
        <StatCard label="Avg. Progress" value="47%" icon={TrendingUp} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 24 }}>
        <Panel style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>Lab Completions — 30 Days</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["7D", "30D", "90D"].map((d) => (
                <div
                  key={d}
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    padding: "4px 9px",
                    borderRadius: 5,
                    color: d === "30D" ? "#1A1200" : C.mid,
                    background: d === "30D" ? C.amber : C.panel2,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
            {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85, 70, 95].map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${v}%`,
                  background: i === 11 ? C.amber : C.panel3,
                  borderRadius: "3px 3px 0 0",
                  border: `1px solid ${C.border}`,
                }}
              />
            ))}
          </div>
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 14 }}>Most Popular Labs</div>
          {LABS.slice(0, 4).map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: C.hi }}>{l.name}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>{l.org}</div>
              </div>
              <DiffBadge level={l.diff} />
            </div>
          ))}
        </Panel>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 12 }}>Classes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {CLASSES.map((c) => (
            <Panel key={c.name} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>{c.name}</div>
                <Badge tone={c.fee === "PAID" ? "cyan" : c.fee === "DUE" ? "danger" : "warn"}>{c.fee}</Badge>
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
                {[["Students", c.students], ["Labs", c.labs], ["Materials", c.materials]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: C.hi }}>{v}</div>
                    <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>{k}</div>
                  </div>
                ))}
              </div>
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
    </div>
  );
}

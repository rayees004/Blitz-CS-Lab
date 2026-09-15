import React from "react";
import { CheckCircle2, FlaskConical, TrendingUp, Zap, Trophy, Play, Award } from "lucide-react";
import Panel from "../common/Panel";
import StatCard from "../common/StatCard";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { CATEGORIES } from "../../data/mockData";

export default function StudentDashboard({ go }) {
  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
        Welcome back, Rohith
      </h1>
      <p style={{ fontFamily: sans, fontSize: 14, color: C.mid, marginTop: 6 }}>
        Continue your cybersecurity learning journey.
      </p>

      <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
        <StatCard label="Labs Completed" value="18" icon={CheckCircle2} sub="of 50 total" />
        <StatCard label="Labs Available" value="32" icon={FlaskConical} />
        <StatCard label="Current Progress" value="36%" icon={TrendingUp} sub="+4% this week" tone="cyan" />
        <StatCard label="Total Points" value="2,840" icon={Zap} />
        <StatCard label="Current Rank" value="#12" icon={Trophy} sub="Bug Bounty Batch 01" />
      </div>

      <div style={{ marginTop: 30 }}>
        <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi, marginBottom: 12 }}>
          Continue Learning
        </div>
        <Panel style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 9,
                background: "rgba(245,166,35,0.1)",
                border: `1px solid rgba(245,166,35,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FlaskConical size={20} color={C.amber} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>SQL Injection</span>
                <DiffBadge level="Intermediate" />
              </div>
              <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 4 }}>ShopX · LAB 03 · Web Security</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 160 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.mid }}>65% Complete</span>
              </div>
              <ProgressBar value={65} />
            </div>
            <Btn icon={Play} onClick={() => go("lab-detail")}>Continue Lab</Btn>
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 14 }}>Recent Achievements</div>
          {[["First Blood", "Completed your first lab"], ["Injection Specialist", "5 injection-class labs solved"], ["Streak · 7 Days", "Logged in 7 days in a row"]].map((a) => (
            <div key={a[0]} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${C.border}` }}>
              <Award size={15} color={C.cyan} />
              <div>
                <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: C.hi }}>{a[0]}</div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>{a[1]}</div>
              </div>
            </div>
          ))}
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 14 }}>Category Progress</div>
          {CATEGORIES.slice(0, 4).map((c) => (
            <div key={c.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: sans, fontSize: 12.5, color: C.hi }}>{c.name}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>{c.pct}%</span>
              </div>
              <ProgressBar value={c.pct} tone="cyan" h={5} />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  ChevronRight, Wifi, Clock, AlertTriangle, FileText, Globe, Terminal as TerminalIcon,
  Flag, Play
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { LABS } from "../../data/mockData";

export default function LabDetail({ lab, back }) {
  const l = lab || LABS[0];
  const [flag, setFlag] = useState("");
  const [submitted, setSubmitted] = useState(null); // null | "correct" | "wrong"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          height: 54,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span onClick={back} style={{ cursor: "pointer", color: C.low, display: "flex", alignItems: "center" }}>
          <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
        </span>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: C.low }}>LAB {l.id}</span>
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>{l.name}</span>
        <DiffBadge level={l.diff} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 12, color: C.cyan }}>
            <Wifi size={13} /> TARGET ONLINE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 12, color: C.mid }}>
            <Clock size={13} /> 42:18 remaining
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* left: lab info */}
        <div style={{ width: 300, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: 20, flexShrink: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 8 }}>SCENARIO</div>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>
            {l.org} has deployed a new build to staging. Your objective is to identify and
            exploit the vulnerability planted in this environment, then submit proof of exploitation.
          </p>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>OBJECTIVE</div>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>{l.desc}</p>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>INSTRUCTIONS</div>
          <ol style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
            <li>Launch the target environment.</li>
            <li>Explore the application surface.</li>
            <li>Locate and exploit the vulnerability.</li>
            <li>Submit the flag below to earn points.</li>
          </ol>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>HINTS</div>
          <Panel style={{ padding: 12, background: C.panel2 }}>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, display: "flex", gap: 8 }}>
              <AlertTriangle size={14} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
              1 hint available · costs 10 points
            </div>
          </Panel>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>RESOURCES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Web Security fundamentals", `${l.cat} cheat sheet`].map((r) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 12.5, color: C.cyan, cursor: "pointer" }}>
                <FileText size={13} /> {r}
              </div>
            ))}
          </div>
        </div>

        {/* center: target */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.void }}>
          <div style={{ height: 38, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
            <Globe size={13} color={C.low} />
            <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 10px", fontFamily: mono, fontSize: 11.5, color: C.mid, flex: 1 }}>
              https://{l.org.toLowerCase().replace(/\s+/g, "-")}.blitzlab.internal
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: C.panel, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TerminalIcon size={24} color={C.amber} />
            </div>
            <div style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, textAlign: "center", maxWidth: 320 }}>
              Isolated target environment for <strong style={{ color: C.hi }}>{l.org}</strong> is provisioned per-session.
            </div>
            <Btn icon={Play}>Launch Target</Btn>
          </div>
        </div>

        {/* right: meta */}
        <div style={{ width: 240, borderLeft: `1px solid ${C.border}`, overflowY: "auto", padding: 20, flexShrink: 0 }}>
          {[["Difficulty", l.diff], ["Points", `${l.pts} pts`], ["Category", l.cat], ["Status", l.pct > 0 ? "In Progress" : "Not Started"]].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em" }}>{k.toUpperCase()}</div>
              <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi, marginTop: 4 }}>{v}</div>
            </div>
          ))}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 6 }}>PROGRESS</div>
            <ProgressBar value={l.pct} />
            <div style={{ fontFamily: mono, fontSize: 11, color: C.mid, marginTop: 5 }}>{l.pct}% complete</div>
          </div>
        </div>
      </div>

      {/* flag submission */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 22px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <Flag size={15} color={C.amber} />
        <input
          value={flag}
          onChange={(e) => { setFlag(e.target.value); setSubmitted(null); }}
          placeholder="BLITZ{ submit your flag here }"
          style={{
            flex: 1,
            background: C.panel2,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: "10px 12px",
            fontFamily: mono,
            fontSize: 13,
            color: C.hi,
            outline: "none",
          }}
        />
        <Btn onClick={() => setSubmitted(flag.trim().length > 4 ? "correct" : "wrong")}>
          Submit Flag
        </Btn>
        {submitted === "correct" && <Badge tone="cyan">FLAG ACCEPTED</Badge>}
        {submitted === "wrong" && <Badge tone="danger">INCORRECT FLAG</Badge>}
      </div>
    </div>
  );
}

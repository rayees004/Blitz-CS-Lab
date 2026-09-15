import React from "react";
import { Play } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";

export default function LabCard({ lab, onOpen }) {
  const started = lab.pct > 0 && lab.pct < 100;
  const done = lab.pct === 100;
  return (
    <Panel style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>LAB {lab.id}</span>
        {done ? <Badge tone="cyan">COMPLETED</Badge> : started ? <Badge tone="amber">IN PROGRESS</Badge> : <Badge>NOT STARTED</Badge>}
      </div>
      <div>
        <div style={{ fontFamily: sans, fontSize: 15.5, fontWeight: 700, color: C.hi }}>{lab.name}</div>
        <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 3 }}>{lab.org} · {lab.cat}</div>
      </div>
      <p style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.55, margin: 0, minHeight: 52 }}>
        {lab.desc}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <DiffBadge level={lab.diff} />
        <Badge>{lab.pts} PTS</Badge>
      </div>
      {started && <ProgressBar value={lab.pct} h={5} />}
      <Btn onClick={onOpen} icon={Play} style={{ marginTop: 4 }} variant={done ? "subtle" : "primary"}>
        {done ? "Review Lab" : started ? "Continue Lab" : "Start Lab"}
      </Btn>
    </Panel>
  );
}

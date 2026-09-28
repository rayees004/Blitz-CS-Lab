import React from "react";
import { Play, Lock, Video } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";

export default function LabCard({ lab, onOpen }) {
  const isAttended = Boolean(lab.is_completed || lab.submission_status === "COMPLETED" || (lab.attend_count && lab.attend_count > 0));
  const isLocked = Boolean(lab.is_locked || isAttended);
  const done = Boolean(lab.is_completed || lab.submission_status === "COMPLETED");
  const started = !done && !isAttended && (Boolean(lab.pct > 0) || lab.submission_status === "IN_PROGRESS");

  return (
    <Panel style={{
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      opacity: isLocked ? 0.85 : 1,
      border: isLocked ? `1px dashed rgba(229, 83, 75, 0.35)` : `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>LAB {lab.id}</span>
        {isAttended ? (
          <Badge tone="danger">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Lock size={10} /> LOCKED (ATTENDED)
            </span>
          </Badge>
        ) : isLocked ? (
          <Badge tone="danger">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Lock size={10} /> LOCKED
            </span>
          </Badge>
        ) : started ? (
          <Badge tone="amber">IN PROGRESS</Badge>
        ) : (
          <Badge>NOT STARTED</Badge>
        )}
      </div>
      <div>
        <div style={{ fontFamily: sans, fontSize: 15.5, fontWeight: 700, color: C.hi }}>{lab.name}</div>
        <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 3 }}>
          {lab.cat}
          {lab.org && lab.org !== "BlitzLab" && lab.org !== "Internal" ? ` · ${lab.org}` : ""}
          {lab.subject_name ? ` · Subject: ${lab.subject_name}` : (lab.course_name ? ` · ${lab.course_name}` : "")}
        </div>
      </div>
      <p style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.55, margin: 0, minHeight: 52 }}>
        {lab.desc}
      </p>
      {isLocked && (
        <div style={{
          fontSize: 11, fontFamily: sans, color: "#fca5a5", background: "rgba(229, 83, 75, 0.08)",
          padding: "5px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 5
        }}>
          <Lock size={11} color={C.danger} />
          <span>
            {isAttended
              ? "Already attended. Marks recorded and reopening is locked."
              : (lab.lock_reason || `Requires assignment to subject ${lab.subject_name || 'subject'}`)}
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <DiffBadge level={lab.diff} />
        <Badge>{lab.pts} PTS</Badge>
        {(lab.video_file || lab.video_url) && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: sans,
              fontSize: 10.5,
              color: C.amber,
              background: "rgba(245, 166, 35, 0.12)",
              padding: "2px 6px",
              borderRadius: 4,
              border: `1px solid rgba(245, 166, 35, 0.3)`,
              fontWeight: 600,
            }}
          >
            <Video size={11} /> Video
          </span>
        )}
      </div>
      {started && !isLocked && <ProgressBar value={lab.pct} h={5} />}
      <Btn
        onClick={isLocked ? undefined : onOpen}
        disabled={isLocked}
        icon={isLocked ? Lock : Play}
        style={{ marginTop: 4, cursor: isLocked ? "not-allowed" : "pointer" }}
        variant={isLocked ? "subtle" : "primary"}
      >
        {isAttended
          ? "Locked (Already Attended)"
          : isLocked
          ? "Locked (Subject Required)"
          : started
          ? "Continue Lab"
          : "Start Lab"}
      </Btn>
    </Panel>
  );
}

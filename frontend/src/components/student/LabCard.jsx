import React, { useState } from "react";
import { Play, Lock, Video, CheckCircle2, Clock, FileBadge, RotateCcw, Hourglass } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import CertificateModal from "./CertificateModal";
import { getStoredUser } from "../../api/auth";
import { useTimeLeft, formatTimeLeft } from "../../utils/labTime";

export default function LabCard({ lab, onOpen, onRequestRetake }) {
  const [showCert, setShowCert] = useState(false);
  const currentUser = getStoredUser();
  const studentName =
    lab.student_name ||
    currentUser?.full_name ||
    currentUser?.name ||
    currentUser?.username ||
    "Student";

  // A lab is only completed when all questions are solved or marked completed
  const isCompleted = Boolean(
    lab.is_completed ||
    lab.submission_status === "COMPLETED" ||
    (typeof lab.pct === "number" && lab.pct >= 100)
  );

  // Started but not finished within the 24-hour window: locked until a retake is approved
  const isExpired = !isCompleted && Boolean(lab.is_expired || lab.submission_status === "EXPIRED");

  // A lab is locked ONLY if completed (all questions attended) OR explicitly locked by system/subject/time
  const isLocked = Boolean(lab.is_locked || isCompleted || isExpired);

  // A lab is in-progress/started if attend_count > 0 or in-progress, but NOT completed or timed out
  const isStarted = !isCompleted && !isExpired && Boolean(
    (lab.pct && lab.pct > 0) ||
    lab.submission_status === "IN_PROGRESS" ||
    (lab.attend_count && lab.attend_count > 0)
  );

  const hasPendingRetake = lab.retake_request_status === "PENDING";
  const timeLeft = useTimeLeft(isStarted ? lab.attempt_deadline : null);
  const timeUpNow = timeLeft !== null && timeLeft <= 0; // ran out while the page was open
  const lowTime = timeLeft !== null && timeLeft > 0 && timeLeft < 2 * 3600 * 1000;

  const certData = isCompleted ? {
    certId: `BLITZ-CERT-${String(lab.id).padStart(3, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
    studentName: studentName,
    labName: lab.name,
    labDesc: lab.desc || lab.description || "",
    category: lab.cat || lab.category || "Security",
    subjectName: lab.subject_name || "",
    score: typeof lab.score === "number" ? lab.score : 0,
    maxScore: lab.pts || 100,
    solvedQuestions: typeof lab.solved_questions_count === "number" ? lab.solved_questions_count : 0,
    totalQuestions: lab.question_count || 1,
    completedAt: lab.updated_at || new Date().toISOString(),
  } : null;

  return (
    <>
      <Panel style={{
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: isLocked && !isCompleted ? 0.85 : 1,
        border: isCompleted
          ? `1px solid rgba(0, 230, 118, 0.35)`
          : isLocked
          ? `1px dashed rgba(229, 83, 75, 0.35)`
          : isStarted
          ? `1px solid rgba(245, 166, 35, 0.35)`
          : `1px solid ${C.border}`,
        background: isLocked && !isCompleted ? "rgba(18, 18, 24, 0.7)" : C.panel,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>LAB {lab.id}</span>
          {hasPendingRetake ? (
            <Badge tone="amber">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Clock size={10} /> RETAKE PENDING
              </span>
            </Badge>
          ) : isCompleted ? (
            <Badge tone="green">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <CheckCircle2 size={10} /> COMPLETED
              </span>
            </Badge>
          ) : isExpired ? (
            <Badge tone="danger">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Hourglass size={10} /> TIME UP
              </span>
            </Badge>
          ) : isLocked ? (
            <Badge tone="danger">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <Lock size={10} /> LOCKED
              </span>
            </Badge>
          ) : isStarted ? (
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

        {/* Description clamped strictly to 2 lines */}
        <p
          title={lab.desc}
          style={{
            fontFamily: sans,
            fontSize: 12.5,
            color: C.mid,
            lineHeight: 1.5,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: "3em",
          }}
        >
          {lab.desc}
        </p>

        {/* Notice only if completed or locked by subject */}
        {isCompleted ? (
          <div style={{
            fontSize: 11, fontFamily: sans, color: "#a7f3d0", background: "rgba(0, 230, 118, 0.08)",
            padding: "5px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 5,
            border: "1px solid rgba(0, 230, 118, 0.2)"
          }}>
            <CheckCircle2 size={11} color={C.green} />
            <span>All questions submitted. Lab completed and marks recorded.</span>
          </div>
        ) : isLocked ? (
          <div style={{
            fontSize: 11, fontFamily: sans, color: "#fca5a5", background: "rgba(229, 83, 75, 0.08)",
            padding: "5px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 5
          }}>
            {isExpired ? <Hourglass size={11} color={C.danger} /> : <Lock size={11} color={C.danger} />}
            <span>{lab.lock_reason || `Requires assignment to subject ${lab.subject_name || 'subject'}`}</span>
          </div>
        ) : isStarted && timeLeft !== null ? (
          <div
            title="A started lab must be finished within 24 hours. After that it locks and you need to request a retake."
            style={{
              fontSize: 11, fontFamily: sans, padding: "5px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 5,
              color: timeUpNow || lowTime ? "#fca5a5" : C.amber,
              background: timeUpNow || lowTime ? "rgba(229, 83, 75, 0.08)" : "rgba(245, 166, 35, 0.08)",
            }}
          >
            <Hourglass size={11} />
            <span>
              {timeUpNow
                ? "Time is up — refresh to request a retake."
                : `${formatTimeLeft(timeLeft)} to finish this lab`}
            </span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <DiffBadge level={lab.diff} />
          <Badge>{lab.pts} PTS</Badge>
          {isStarted && (
            <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber, background: "rgba(245, 166, 35, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
              Attended {lab.attend_count || 1}x
            </span>
          )}
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

        {isStarted && !isLocked && <ProgressBar value={lab.pct || 0} h={5} tone="amber" />}

        {isCompleted ? (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowCert(true)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.1) 100%)",
                border: "1px solid rgba(245, 166, 35, 0.45)",
                color: C.amber,
                padding: "8px 14px",
                borderRadius: 6,
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(245, 166, 35, 0.15)",
                transition: "all 0.15s ease",
              }}
            >
              <FileBadge size={14} /> View Certificate
            </button>

            {/* Retake request: only for completed labs */}
            {hasPendingRetake ? (
              <span
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(245, 166, 35, 0.35)",
                  background: "rgba(245, 166, 35, 0.08)",
                  color: C.amber,
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <Clock size={14} /> Retake Pending
              </span>
            ) : onRequestRetake ? (
              <Btn
                icon={RotateCcw}
                variant="outline"
                onClick={() => onRequestRetake(lab)}
                style={{ flex: 1, padding: "8px 14px", fontSize: 12.5 }}
              >
                Request Retake
              </Btn>
            ) : null}
          </div>
        ) : isExpired ? (
          // Time window ran out: the only way back in is an approved retake
          hasPendingRetake ? (
            <span
              style={{
                marginTop: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "8px 14px", borderRadius: 6, border: "1px solid rgba(245, 166, 35, 0.35)",
                background: "rgba(245, 166, 35, 0.08)", color: C.amber, fontFamily: sans, fontSize: 12.5, fontWeight: 600,
              }}
            >
              <Clock size={14} /> Retake Pending
            </span>
          ) : onRequestRetake ? (
            <Btn icon={RotateCcw} variant="outline" onClick={() => onRequestRetake(lab)} style={{ marginTop: 4 }}>
              Request Retake
            </Btn>
          ) : null
        ) : (
          <Btn
            onClick={isLocked || timeUpNow ? undefined : onOpen}
            disabled={isLocked || timeUpNow}
            icon={isLocked || timeUpNow ? Lock : Play}
            style={{ marginTop: 4, cursor: isLocked || timeUpNow ? "not-allowed" : "pointer" }}
            variant={isLocked || timeUpNow ? "subtle" : "primary"}
          >
            {isLocked
              ? "Locked (Subject Required)"
              : timeUpNow
              ? "Time Up"
              : isStarted
              ? "Continue Lab"
              : "Start Lab"}
          </Btn>
        )}
      </Panel>

      {showCert && certData && (
        <CertificateModal
          certificate={certData}
          onClose={() => setShowCert(false)}
        />
      )}
    </>
  );
}

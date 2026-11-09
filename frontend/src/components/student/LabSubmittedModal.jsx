import React, { useState, useEffect } from "react";
import { CheckCircle2, FileBadge, X } from "lucide-react";
import SubjectCertificateModal from "./SubjectCertificateModal";
import { C, sans, mono } from "../../constants/theme";

/**
 * Shown on the labs list after a student's lab is submitted
 * (e.g. automatically when the last question is answered correctly).
 * `result`: { labId, labName, subjectId, subjectName, score, maxScore, solvedQuestions, totalQuestions, ... }
 * "Subject Certificate" opens the certificate of the lab's subject — or, while the subject still
 * has pending labs, the progress towards it (certificates are subject based only).
 */
export default function LabSubmittedModal({ result, onClose }) {
  const [showCert, setShowCert] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !showCert) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, showCert]);

  if (!result) return null;

  const { labName, score = 0, maxScore = 0, solvedQuestions = 0, totalQuestions = 0 } = result;

  if (showCert) {
    return <SubjectCertificateModal subjectId={result.subjectId} onClose={() => setShowCert(false)} />;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 7, 18, 0.8)",
        backdropFilter: "blur(6px)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: C.panel,
          border: "1px solid rgba(0, 230, 118, 0.35)",
          borderRadius: 12,
          padding: "28px 26px 22px",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(0, 230, 118, 0.08)",
          fontFamily: sans,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            color: C.low,
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            margin: "0 auto 14px",
            background: "rgba(0, 230, 118, 0.12)",
            border: "1px solid rgba(0, 230, 118, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle2 size={30} color={C.green} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
          Your lab was submitted successfully
        </h2>
        {labName && (
          <div style={{ fontSize: 13, color: C.mid, marginBottom: 18 }}>{labName}</div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            background: C.panel2,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.low, textTransform: "uppercase" }}>Marks</div>
            <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.green, marginTop: 3 }}>
              {score} / {maxScore}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.low, textTransform: "uppercase" }}>Solved</div>
            <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.cyan, marginTop: 3 }}>
              {solvedQuestions} of {totalQuestions}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowCert(true)}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: C.amber,
              color: "#1a1200",
              border: "none",
              padding: "9px 14px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <FileBadge size={15} /> Subject Certificate
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: C.panel2,
              border: `1px solid ${C.borderLight}`,
              color: C.hi,
              padding: "9px 14px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

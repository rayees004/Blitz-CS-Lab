import React, { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";
import { requestStudentLabRetake } from "../../api/students";

/**
 * Modal for a student to request a retake of a completed lab.
 * Calls onSubmitted(message) after the request is accepted by the server.
 */
export default function RetakeRequestModal({ lab, onClose, onSubmitted }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await requestStudentLabRetake(lab.id, reason);
      onSubmitted?.(res.message || "Retake request submitted! The administrator will review and unlock the lab.");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit retake request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(4px)",
          zIndex: 1200,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 480,
          maxWidth: "92vw",
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: 24,
          zIndex: 1201,
          boxShadow: "0 24px 70px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "rgba(245, 166, 35, 0.12)",
              border: "1px solid rgba(245, 166, 35, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <RotateCcw size={20} color={C.amber} />
          </div>
          <div>
            <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
              Request Lab Retake
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.amber }}>
              {lab.name}
            </div>
          </div>
        </div>

        <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.55, margin: "0 0 16px" }}>
          This lab is completed and marks are locked. Send a retake request to your instructor/admin to unlock this lab and allow you to attempt it again.
        </p>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.hi, marginBottom: 6, fontWeight: 600 }}>
            Reason for Retake (Optional):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Want to attempt challenge again without hints to practice..."
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "10px 12px",
              color: C.hi,
              fontFamily: sans,
              fontSize: 13,
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        {error && (
          <div style={{ fontFamily: sans, fontSize: 12.5, color: "#fca5a5", marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.mid,
              borderRadius: 6,
              padding: "8px 16px",
              fontFamily: sans,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <Btn
            icon={submitting ? Loader2 : RotateCcw}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Send Retake Request"}
          </Btn>
        </div>
      </div>
    </>
  );
}

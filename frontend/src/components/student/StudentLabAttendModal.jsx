import React, { useState, useEffect } from "react";
import {
  X, FlaskConical, CheckCircle2, AlertCircle, HelpCircle,
  Lightbulb, ExternalLink, Copy, Check, Send, Trophy,
  Terminal, ShieldCheck, Clock, Lock, Unlock, RefreshCw
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import {
  attendStudentLab,
  submitStudentLabFlag,
  unlockStudentLabHint,
  finalizeStudentLab
} from "../../api/labs";

export default function StudentLabAttendModal({ lab, onClose, onUpdated }) {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);

  // Per-question flag input state: { [qId]: string }
  const [flagInputs, setFlagInputs] = useState({});
  // Per-question submission loading & feedback: { [qId]: { submitting: bool, msg: string, success: bool } }
  const [feedback, setFeedback] = useState({});
  // Hint unlocking loading: { [hintId]: bool }
  const [unlockingHint, setUnlockingHint] = useState({});
  // Finalizing loading
  const [finalizing, setFinalizing] = useState(false);
  const [finalSuccess, setFinalSuccess] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Load / Start attendance session
  const loadWorkspace = async () => {
    if (!lab?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await attendStudentLab(lab.id);
      setWorkspace(data);

      // Pre-fill already submitted flags
      const initialInputs = {};
      if (data.questions) {
        data.questions.forEach((q) => {
          if (q.submitted_flag) {
            initialInputs[q.id] = q.submitted_flag;
          }
        });
      }
      setFlagInputs((prev) => ({ ...prev, ...initialInputs }));
    } catch (err) {
      setError(err.message || "Failed to start lab session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [lab?.id]);

  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Submit flag for a specific question
  const handleSubmitFlag = async (questionId) => {
    const flagVal = flagInputs[questionId]?.trim();
    if (!flagVal) return;

    setFeedback((prev) => ({
      ...prev,
      [questionId]: { submitting: true, msg: null, success: false },
    }));

    try {
      const res = await submitStudentLabFlag(lab.id, questionId, flagVal);
      setFeedback((prev) => ({
        ...prev,
        [questionId]: {
          submitting: false,
          msg: res.message,
          success: res.is_correct,
        },
      }));

      // Reload fresh workspace state to reflect awarded points
      const updatedData = await attendStudentLab(lab.id);
      setWorkspace(updatedData);
      if (onUpdated) onUpdated();
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [questionId]: {
          submitting: false,
          msg: err.message || "Submission failed.",
          success: false,
        },
      }));
    }
  };

  // Unlock hint
  const handleUnlockHint = async (questionId, hintId, cost) => {
    const confirmed = window.confirm(
      `Unlocking this hint will deduct ${cost} marks from this question's reward. Continue?`
    );
    if (!confirmed) return;

    setUnlockingHint((prev) => ({ ...prev, [hintId]: true }));
    try {
      await unlockStudentLabHint(lab.id, questionId, hintId);
      // Reload workspace
      const updatedData = await attendStudentLab(lab.id);
      setWorkspace(updatedData);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || "Failed to unlock hint.");
    } finally {
      setUnlockingHint((prev) => ({ ...prev, [hintId]: false }));
    }
  };

  // Finalize lab and submit marks
  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const res = await finalizeStudentLab(lab.id);
      setFinalSuccess(res.message || "Lab completed and marks recorded!");
      const updatedData = await attendStudentLab(lab.id);
      setWorkspace(updatedData);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message || "Failed to finalize lab.");
    } finally {
      setFinalizing(false);
    }
  };

  if (!lab) return null;

  const questions = workspace?.questions || [];
  const submission = workspace?.submission || {};
  const labScoreData = workspace?.lab_score || {};
  const currentScore = labScoreData.score ?? submission.score ?? 0;
  const maxScore = labScoreData.max_score ?? lab.points ?? 100;
  const attendCount = labScoreData.attend_count || 1;
  const isCompleted = labScoreData.is_completed || submission.status === "COMPLETED";
  const solvedQuestionsCount = questions.filter((q) => q.is_solved).length;
  const progressPct =
    questions.length > 0
      ? Math.round((solvedQuestionsCount / questions.length) * 100)
      : isCompleted
      ? 100
      : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 7, 18, 0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          maxHeight: "92vh",
          background: C.void,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 40px rgba(0, 229, 255, 0.08)",
        }}
      >
        {/* Modal Topbar */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: C.panel2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "rgba(0, 229, 255, 0.12)",
                border: "1px solid rgba(0, 229, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FlaskConical size={20} color={C.cyan} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                  {lab.name}
                </span>
                <DiffBadge level={lab.difficulty} />
                {lab.subject_name && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 10.5,
                      color: C.cyan,
                      background: "rgba(0, 229, 255, 0.09)",
                      padding: "2px 7px",
                      borderRadius: 4,
                      border: "1px solid rgba(0, 229, 255, 0.25)",
                    }}
                  >
                    Course: {lab.subject_name}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: C.mid,
                    background: C.panel,
                    padding: "2px 7px",
                    borderRadius: 4,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  Attended {attendCount} time{attendCount > 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                {lab.category} · Target Organization: {lab.org || "BlitzLab"} · <span style={{ color: C.cyan }}>Score is lab-based only (repeat visits do not increase score)</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Live Marks Counter */}
            <div
              style={{
                background: isCompleted ? "rgba(0, 230, 118, 0.12)" : "rgba(245, 166, 35, 0.12)",
                border: `1px solid ${isCompleted ? "rgba(0, 230, 118, 0.35)" : "rgba(245, 166, 35, 0.35)"}`,
                padding: "6px 14px",
                borderRadius: 6,
                textAlign: "right",
              }}
            >
              <div style={{ fontFamily: mono, fontSize: 9.5, color: C.mid, textTransform: "uppercase" }}>
                Lab Score (Capped)
              </div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 14,
                  fontWeight: 700,
                  color: isCompleted ? C.green : C.amber,
                }}
              >
                {currentScore} / {maxScore} pts
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: C.low,
                cursor: "pointer",
                padding: 6,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close Workspace"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.mid, fontFamily: sans }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: 12, color: C.cyan }} />
              <div>Connecting to lab environment and loading attendee workspace...</div>
            </div>
          ) : error ? (
            <div
              style={{
                padding: 18,
                borderRadius: 8,
                background: "rgba(255, 77, 77, 0.1)",
                border: "1px solid rgba(255, 77, 77, 0.3)",
                color: C.danger,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <AlertCircle size={20} />
              <div style={{ flex: 1 }}>{error}</div>
              <Btn onClick={loadWorkspace} tone="danger" sm>Retry</Btn>
            </div>
          ) : (
            <>
              {/* Target Environment Banner */}
              <div
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.cyan, boxShadow: `0 0 8px ${C.cyan}` }} />
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan, fontWeight: 700 }}>
                    TARGET ONLINE
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 12, color: C.hi, background: C.void, padding: "4px 10px", borderRadius: 4, border: `1px solid ${C.border}` }}>
                    {lab.target_url || `https://${(lab.org || "blitz").toLowerCase().replace(/\\s+/g, "-")}.blitzlab.internal`}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => handleCopyUrl(lab.target_url || `https://${(lab.org || "blitz").toLowerCase().replace(/\\s+/g, "-")}.blitzlab.internal`)}
                    style={{
                      background: C.void,
                      border: `1px solid ${C.border}`,
                      color: copiedUrl ? C.cyan : C.mid,
                      borderRadius: 6,
                      padding: "6px 10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: sans,
                      fontSize: 12,
                    }}
                  >
                    {copiedUrl ? <Check size={13} /> : <Copy size={13} />}
                    {copiedUrl ? "Copied" : "Copy URL"}
                  </button>

                  <a
                    href={lab.target_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "rgba(0, 229, 255, 0.12)",
                      border: "1px solid rgba(0, 229, 255, 0.35)",
                      color: C.cyan,
                      borderRadius: 6,
                      padding: "6px 12px",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: sans,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <ExternalLink size={13} /> Open Target
                  </a>
                </div>
              </div>

              {/* Scenario Description */}
              <div
                style={{
                  background: C.void,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.06em", marginBottom: 6 }}>
                  MISSION SCENARIO & BRIEFING
                </div>
                <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, lineHeight: 1.6, margin: 0 }}>
                  {lab.description || "In this challenge, your objective is to analyze the target environment, discover security flaws, and capture the proof-of-concept flags to earn marks."}
                </p>
              </div>

              {/* Progress Bar Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0 -8px" }}>
                <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
                  Questions & Proof of Concept Submissions ({solvedQuestionsCount}/{questions.length} Solved)
                </span>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.cyan }}>
                  {progressPct}% Completed
                </span>
              </div>
              <ProgressBar value={progressPct} tone={isCompleted ? "green" : "cyan"} h={6} />

              {/* Finalized Notice if Completed */}
              {isCompleted && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "rgba(0, 230, 118, 0.1)",
                    border: "1px solid rgba(0, 230, 118, 0.3)",
                    color: C.green,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontFamily: sans,
                    fontSize: 13,
                  }}
                >
                  <Trophy size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Lab Completed!</strong> You scored <strong>{currentScore}</strong> out of{" "}
                    <strong>{maxScore}</strong> marks. All proofs have been officially recorded into your student transcript.
                  </div>
                </div>
              )}

              {/* Question List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {questions.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: C.low, fontFamily: sans }}>
                    No specific questions attached to this lab. Use the Finalize button below when you complete your analysis.
                  </div>
                ) : (
                  questions.map((q, idx) => {
                    const fb = feedback[q.id];
                    const isSolved = q.is_solved;
                    const hints = q.hints || [];

                    return (
                      <div
                        key={q.id}
                        style={{
                          background: isSolved ? "rgba(0, 230, 118, 0.04)" : C.panel,
                          border: `1px solid ${isSolved ? "rgba(0, 230, 118, 0.3)" : C.border}`,
                          borderRadius: 8,
                          padding: 18,
                        }}
                      >
                        {/* Question Title & Points */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan, fontWeight: 700 }}>
                                QUESTION {idx + 1}
                              </span>
                              {isSolved ? (
                                <span
                                  style={{
                                    fontFamily: mono,
                                    fontSize: 10,
                                    color: C.green,
                                    background: "rgba(0, 230, 118, 0.12)",
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <CheckCircle2 size={11} /> SOLVED (+{q.points_awarded || q.points} MARKS)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontFamily: mono,
                                    fontSize: 10,
                                    color: C.amber,
                                    background: "rgba(245, 166, 35, 0.12)",
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                  }}
                                >
                                  +{q.points} MARKS AVAILABLE
                                </span>
                              )}
                            </div>
                            <h3 style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi, margin: "6px 0 0" }}>
                              {q.title}
                            </h3>
                          </div>
                        </div>

                        {/* Question Prompt */}
                        {q.description && (
                          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.5, margin: "8px 0 12px" }}>
                            {q.description}
                          </p>
                        )}

                        {/* Hints Section */}
                        {hints.length > 0 && (
                          <div style={{ marginTop: 12, marginBottom: 14 }}>
                            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 6 }}>
                              AVAILABLE HINTS ({hints.length})
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {hints.map((h, hIdx) => {
                                const isUnlocked = h.is_unlocked;
                                return (
                                  <div
                                    key={h.id || hIdx}
                                    style={{
                                      background: isUnlocked ? "rgba(245, 166, 35, 0.08)" : C.panel2,
                                      border: `1px solid ${isUnlocked ? "rgba(245, 166, 35, 0.25)" : C.border}`,
                                      borderRadius: 6,
                                      padding: "10px 12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 12,
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1 }}>
                                      {isUnlocked ? (
                                        <Unlock size={14} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
                                      ) : (
                                        <Lock size={14} color={C.low} style={{ flexShrink: 0, marginTop: 2 }} />
                                      )}
                                      <div>
                                        <div style={{ fontFamily: mono, fontSize: 11, color: isUnlocked ? C.amber : C.mid, fontWeight: 600 }}>
                                          Hint #{hIdx + 1} {isUnlocked ? "(Unlocked · -" + h.cost + " pts)" : `(Locked · costs ${h.cost} pts)`}
                                        </div>
                                        {isUnlocked ? (
                                          <div style={{ fontFamily: sans, fontSize: 12.5, color: C.hi, marginTop: 4 }}>
                                            {h.hint_text}
                                          </div>
                                        ) : (
                                          <div style={{ fontFamily: sans, fontSize: 11.5, color: C.low, marginTop: 2 }}>
                                            Reveal guidance for this exploit step in exchange for marks penalty.
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {!isUnlocked && !isSolved && (
                                      <button
                                        disabled={unlockingHint[h.id]}
                                        onClick={() => handleUnlockHint(q.id, h.id, h.cost)}
                                        style={{
                                          background: "rgba(245, 166, 35, 0.15)",
                                          border: "1px solid rgba(245, 166, 35, 0.4)",
                                          color: C.amber,
                                          borderRadius: 5,
                                          padding: "5px 10px",
                                          cursor: "pointer",
                                          fontFamily: mono,
                                          fontSize: 11,
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 6,
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Lightbulb size={12} />
                                        {unlockingHint[h.id] ? "Unlocking..." : `Unlock (-${h.cost} pts)`}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Flag Submission Input */}
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <input
                              type="text"
                              disabled={isSolved}
                              value={flagInputs[q.id] || ""}
                              onChange={(e) =>
                                setFlagInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !isSolved) {
                                  handleSubmitFlag(q.id);
                                }
                              }}
                              placeholder={isSolved ? "Solved! Flag submitted." : "BLITZ{ enter captured flag }"}
                              style={{
                                flex: 1,
                                background: isSolved ? "rgba(0, 230, 118, 0.08)" : C.void,
                                border: `1px solid ${isSolved ? "rgba(0, 230, 118, 0.4)" : C.borderLight}`,
                                borderRadius: 6,
                                padding: "9px 12px",
                                fontFamily: mono,
                                fontSize: 12.5,
                                color: isSolved ? C.green : C.hi,
                                outline: "none",
                              }}
                            />
                            {!isSolved ? (
                              <Btn
                                sm
                                icon={Send}
                                disabled={fb?.submitting || !flagInputs[q.id]?.trim()}
                                onClick={() => handleSubmitFlag(q.id)}
                              >
                                {fb?.submitting ? "Verifying..." : "Submit Answer"}
                              </Btn>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  fontFamily: mono,
                                  fontSize: 11,
                                  color: C.green,
                                }}
                              >
                                <CheckCircle2 size={16} /> Verified
                              </div>
                            )}
                          </div>

                          {/* Submission Feedback Banner */}
                          {fb?.msg && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: "7px 12px",
                                borderRadius: 5,
                                background: fb.success ? "rgba(0, 230, 118, 0.12)" : "rgba(255, 77, 77, 0.12)",
                                border: `1px solid ${fb.success ? "rgba(0, 230, 118, 0.3)" : "rgba(255, 77, 77, 0.3)"}`,
                                color: fb.success ? C.green : C.danger,
                                fontFamily: sans,
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              {fb.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              <span>{fb.msg}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer / Finalize Bar */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.panel2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldCheck size={16} color={C.cyan} />
            <span style={{ fontFamily: mono, fontSize: 11.5, color: C.mid }}>
              Status: <strong style={{ color: isCompleted ? C.green : C.amber }}>{submission.status || "IN_PROGRESS"}</strong> · Total Score: <strong style={{ color: C.hi }}>{currentScore} / {maxScore}</strong>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Btn onClick={onClose} tone="ghost" sm>
              Close
            </Btn>
            {!isCompleted && (
              <Btn
                icon={Trophy}
                disabled={finalizing || loading}
                onClick={handleFinalize}
                tone="primary"
                sm
              >
                {finalizing ? "Submitting Marks..." : "Finalize & Submit Lab"}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

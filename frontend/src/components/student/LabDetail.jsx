import React, { useState, useEffect } from "react";
import {
  ChevronRight, Wifi, Clock, AlertTriangle, FileText, Globe,
  Terminal as TerminalIcon, Flag, Play, CheckCircle2, Lock,
  Unlock, Lightbulb, Trophy, Send, AlertCircle, RefreshCw, ExternalLink, Video
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

export default function LabDetail({ lab, back }) {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);

  // Per-question inputs & feedbacks
  const [flagInputs, setFlagInputs] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [unlockingHint, setUnlockingHint] = useState({});
  const [finalizing, setFinalizing] = useState(false);

  const labId = lab?.id;

  const loadLabSession = async () => {
    if (!labId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await attendStudentLab(labId);
      setWorkspace(data);

      const inputs = {};
      if (data.questions) {
        data.questions.forEach((q) => {
          if (q.submitted_flag) inputs[q.id] = q.submitted_flag;
        });
      }
      setFlagInputs((prev) => ({ ...prev, ...inputs }));
    } catch (err) {
      setError(err.message || "Failed to attend lab.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabSession();
  }, [labId]);

  const l = workspace?.lab || lab || {};
  const questions = workspace?.questions || [];
  const submission = workspace?.submission || {};
  const isCompleted = submission.status === "COMPLETED";
  const currentScore = submission.score || 0;
  const maxScore = submission.max_score || l.points || 100;
  const solvedCount = questions.filter((q) => q.is_solved).length;
  const progressPct =
    questions.length > 0
      ? Math.round((solvedCount / questions.length) * 100)
      : isCompleted
      ? 100
      : 0;

  const handleSubmitFlag = async (questionId) => {
    const val = flagInputs[questionId]?.trim();
    if (!val) return;

    setFeedbacks((prev) => ({
      ...prev,
      [questionId]: { loading: true, msg: null, success: false },
    }));

    try {
      const res = await submitStudentLabFlag(labId, questionId, val);
      setFeedbacks((prev) => ({
        ...prev,
        [questionId]: { loading: false, msg: res.message, success: res.is_correct },
      }));

      const updated = await attendStudentLab(labId);
      setWorkspace(updated);
    } catch (err) {
      setFeedbacks((prev) => ({
        ...prev,
        [questionId]: { loading: false, msg: err.message || "Submission failed", success: false },
      }));
    }
  };

  const handleUnlockHint = async (questionId, hintId, cost) => {
    const ok = window.confirm(`Unlocking this hint will deduct ${cost} marks. Proceed?`);
    if (!ok) return;

    setUnlockingHint((prev) => ({ ...prev, [hintId]: true }));
    try {
      await unlockStudentLabHint(labId, questionId, hintId);
      const updated = await attendStudentLab(labId);
      setWorkspace(updated);
    } catch (err) {
      alert(err.message || "Failed to unlock hint");
    } finally {
      setUnlockingHint((prev) => ({ ...prev, [hintId]: false }));
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      const res = await finalizeStudentLab(labId);
      alert(res.message || "Lab completed!");
      const updated = await attendStudentLab(labId);
      setWorkspace(updated);
    } catch (err) {
      alert(err.message || "Failed to finalize lab.");
    } finally {
      setFinalizing(false);
    }
  };

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.void, color: C.hi }}>
        <div style={{ height: 54, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 22px", gap: 12, background: C.panel2 }}>
          <span onClick={back} style={{ cursor: "pointer", color: C.low, display: "flex", alignItems: "center", padding: "4px 8px", borderRadius: 4, background: C.panel }}>
            <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
            <span style={{ fontFamily: sans, fontSize: 12, marginLeft: 4 }}>Back to Labs</span>
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{
            maxWidth: 480, width: "100%", background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: 12, background: "rgba(229, 83, 75, 0.12)",
              border: "1px solid rgba(229, 83, 75, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
            }}>
              <Lock size={26} color={C.danger} />
            </div>
            <h2 style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: C.hi, margin: "0 0 10px" }}>
              Lab Access Restricted
            </h2>
            <p style={{ fontFamily: sans, fontSize: 13.5, color: "#fca5a5", lineHeight: 1.6, margin: "0 0 24px" }}>
              {error}
            </p>
            <Btn onClick={back} style={{ padding: "9px 24px" }}>
              Back to Labs
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.void, color: C.hi }}>
      {/* Top Header */}
      <div
        style={{
          height: 54,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 22px",
          gap: 12,
          flexShrink: 0,
          background: C.panel2,
        }}
      >
        <span
          onClick={back}
          style={{
            cursor: "pointer",
            color: C.low,
            display: "flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: 4,
            background: C.panel,
          }}
        >
          <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
          <span style={{ fontFamily: sans, fontSize: 12, marginLeft: 4 }}>Back</span>
        </span>

        <span style={{ fontFamily: mono, fontSize: 11.5, color: C.low }}>
          LAB #{l.id}
        </span>
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>
          {l.name}
        </span>
        <DiffBadge level={l.difficulty} />
        {l.subject_name && (
          <span
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              color: C.cyan,
              background: "rgba(0, 229, 255, 0.08)",
              padding: "2px 7px",
              borderRadius: 4,
              border: "1px solid rgba(0, 229, 255, 0.2)",
            }}
          >
            Course: {l.subject_name}
          </span>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              background: isCompleted ? "rgba(0, 230, 118, 0.12)" : "rgba(245, 166, 35, 0.12)",
              border: `1px solid ${isCompleted ? "rgba(0, 230, 118, 0.3)" : "rgba(245, 166, 35, 0.3)"}`,
              padding: "4px 12px",
              borderRadius: 5,
              fontFamily: mono,
              fontSize: 12,
              fontWeight: 700,
              color: isCompleted ? C.green : C.amber,
            }}
          >
            Marks: {currentScore} / {maxScore} pts
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 12, color: C.cyan }}>
            <Wifi size={13} /> TARGET ONLINE
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Lab Briefing & Instructions */}
        <div style={{ width: 320, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: 20, flexShrink: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 8 }}>
            SCENARIO & MISSION
          </div>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>
            {l.description || "Deploy against the live testbed to discover configuration defects and gain elevated privileges."}
          </p>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>
            EVALUATION RULES
          </div>
          <ol style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
            <li>Navigate to the target environment.</li>
            <li>Identify security vulnerabilities.</li>
            <li>Unlocking progressive hints applies mark deductions.</li>
            <li>Submit proof flags to record awarded marks.</li>
            <li>Finalize the lab once completed.</li>
          </ol>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>
            TARGET INFORMATION
          </div>
          <Panel style={{ padding: 12, background: C.panel2 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.mid }}>
              Target Host:
            </div>
            <a
              href={l.target_url || "#"}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: mono,
                fontSize: 11.5,
                color: C.cyan,
                wordBreak: "break-all",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
                textDecoration: "none",
              }}
            >
              {l.target_url || `https://${(l.org || "blitz").toLowerCase().replace(/\\s+/g, "-")}.blitzlab.internal`}
              <ExternalLink size={11} />
            </a>
          </Panel>

          {/* Teaching Video for Students */}
          {(l.video_file || l.video_url) && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: C.amber, letterSpacing: "0.04em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <Video size={13} /> TEACHING & TUTORIAL VIDEO
              </div>
              <Panel style={{ padding: 10, background: C.panel2, border: `1px solid rgba(245, 166, 35, 0.3)` }}>
                {l.video_file ? (
                  <video
                    controls
                    src={l.video_file}
                    style={{ width: "100%", borderRadius: 6, maxHeight: 180, display: "block", background: "#000" }}
                  >
                    Your browser does not support HTML5 video.
                  </video>
                ) : l.video_url?.includes("youtube.com") || l.video_url?.includes("youtu.be") ? (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 6 }}>
                    <iframe
                      src={
                        l.video_url.includes("watch?v=")
                          ? l.video_url.replace("watch?v=", "embed/")
                          : l.video_url.includes("youtu.be/")
                          ? `https://www.youtube.com/embed/${l.video_url.split("youtu.be/")[1]}`
                          : l.video_url
                      }
                      title="Teaching Video"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={l.video_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: mono,
                      fontSize: 11.5,
                      color: C.amber,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      wordBreak: "break-all",
                      textDecoration: "none",
                    }}
                  >
                    Watch Tutorial Video <ExternalLink size={11} />
                  </a>
                )}
              </Panel>
            </div>
          )}
        </div>

        {/* Center: Live Questions & Flag Submission */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: 24, gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: C.hi, margin: 0 }}>
              Practical Challenges & Flag Submission
            </h2>
            {isCompleted ? (
              <Badge tone="green">COMPLETED ({currentScore}/{maxScore} PTS)</Badge>
            ) : (
              <Badge tone="cyan">IN PROGRESS</Badge>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.mid }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: 8, color: C.cyan }} />
              <div>Connecting to live lab session...</div>
            </div>
          ) : questions.length === 0 ? (
            <Panel style={{ padding: 24, textAlign: "center", color: C.low }}>
              No specific questions attached to this lab.
            </Panel>
          ) : (
            questions.map((q, idx) => {
              const fb = feedbacks[q.id];
              const isSolved = q.is_solved;
              const hints = q.hints || [];

              return (
                <Panel
                  key={q.id}
                  style={{
                    padding: 18,
                    background: isSolved ? "rgba(0, 230, 118, 0.04)" : C.panel,
                    border: `1px solid ${isSolved ? "rgba(0, 230, 118, 0.35)" : C.border}`,
                  }}
                >
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
                            }}
                          >
                            ✓ SOLVED (+{q.points_awarded || q.points} PTS)
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
                            +{q.points} PTS
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi, marginTop: 4 }}>
                        {q.title}
                      </div>
                    </div>
                  </div>

                  {q.description && (
                    <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: "8px 0 14px", lineHeight: 1.5 }}>
                      {q.description}
                    </p>
                  )}

                  {/* Progressive Hints */}
                  {hints.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, marginBottom: 6 }}>
                        HINTS ({hints.length})
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
                                padding: "8px 12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1 }}>
                                {isUnlocked ? <Unlock size={14} color={C.amber} /> : <Lock size={14} color={C.low} />}
                                <div>
                                  <div style={{ fontFamily: mono, fontSize: 11, color: isUnlocked ? C.amber : C.mid }}>
                                    Hint #{hIdx + 1} {isUnlocked ? "(Unlocked · -" + h.cost + " pts)" : `(Locked · ${h.cost} pts)`}
                                  </div>
                                  {isUnlocked && (
                                    <div style={{ fontFamily: sans, fontSize: 12, color: C.hi, marginTop: 3 }}>
                                      {h.hint_text}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {!isUnlocked && !isSolved && (
                                <button
                                  disabled={unlockingHint[h.id]}
                                  onClick={() => handleUnlockHint(q.id, h.id, h.cost)}
                                  style={{
                                    background: "rgba(245, 166, 35, 0.12)",
                                    border: "1px solid rgba(245, 166, 35, 0.3)",
                                    color: C.amber,
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontFamily: mono,
                                    fontSize: 10.5,
                                  }}
                                >
                                  {unlockingHint[h.id] ? "Unlocking..." : `Unlock (-${h.cost} pts)`}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Flag Input */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      disabled={isSolved}
                      value={flagInputs[q.id] || ""}
                      onChange={(e) => setFlagInputs((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isSolved) handleSubmitFlag(q.id);
                      }}
                      placeholder={isSolved ? "Solved! Flag submitted." : "BLITZ{ submit question flag }"}
                      style={{
                        flex: 1,
                        background: isSolved ? "rgba(0, 230, 118, 0.08)" : C.void,
                        border: `1px solid ${isSolved ? "rgba(0, 230, 118, 0.4)" : C.borderLight}`,
                        borderRadius: 6,
                        padding: "8px 12px",
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
                        disabled={fb?.loading || !flagInputs[q.id]?.trim()}
                        onClick={() => handleSubmitFlag(q.id)}
                      >
                        {fb?.loading ? "Verifying..." : "Submit Answer"}
                      </Btn>
                    ) : (
                      <span style={{ fontFamily: mono, fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={14} /> Solved
                      </span>
                    )}
                  </div>

                  {fb?.msg && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "6px 10px",
                        borderRadius: 4,
                        background: fb.success ? "rgba(0, 230, 118, 0.12)" : "rgba(255, 77, 77, 0.12)",
                        border: `1px solid ${fb.success ? "rgba(0, 230, 118, 0.3)" : "rgba(255, 77, 77, 0.3)"}`,
                        color: fb.success ? C.green : C.danger,
                        fontFamily: sans,
                        fontSize: 12,
                      }}
                    >
                      {fb.msg}
                    </div>
                  )}
                </Panel>
              );
            })
          )}
        </div>

        {/* Right: Summary & Finalize */}
        <div style={{ width: 260, borderLeft: `1px solid ${C.border}`, overflowY: "auto", padding: 20, flexShrink: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 10 }}>
            LAB EVALUATION METRICS
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>Completion</span>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan }}>{progressPct}%</span>
            </div>
            <ProgressBar value={progressPct} tone={isCompleted ? "green" : "cyan"} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>MARKS ACCUMULATED</div>
            <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: isCompleted ? C.green : C.amber, marginTop: 4 }}>
              {currentScore} / {maxScore} pts
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>SOLVED CHALLENGES</div>
            <div style={{ fontFamily: mono, fontSize: 13, color: C.hi, marginTop: 4 }}>
              {solvedCount} of {questions.length} questions
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 20 }}>
            {!isCompleted ? (
              <Btn
                icon={Trophy}
                disabled={finalizing || loading}
                onClick={handleFinalize}
                tone="primary"
                style={{ width: "100%" }}
              >
                {finalizing ? "Submitting Marks..." : "Finalize & Submit Lab"}
              </Btn>
            ) : (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 6,
                  background: "rgba(0, 230, 118, 0.1)",
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                  color: C.green,
                  fontFamily: sans,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                ✓ Lab Officially Submitted
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

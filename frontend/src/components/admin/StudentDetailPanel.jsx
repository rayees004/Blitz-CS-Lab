import React, { useState, useEffect, useCallback } from "react";
import {
  X, AlertCircle, Loader2, Mail,
  Phone, Building2, Calendar, Shield, Layers,
  FlaskConical, TrendingUp, ShieldAlert, ShieldCheck, Ban, CheckCircle2, RotateCcw
} from "lucide-react";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentProgress, updateStudent, grantLabRetakePermission } from "../../api/students";

/* ─── Helpers ─────────────────────────────────────────── */

const AVATAR_COLORS = ["#B87A15", "#1A7A6E", "#6B4FBB", "#1A5E8A", "#8A3A3A"];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{ color: C.low, marginTop: 1, flexShrink: 0 }}>
        <Icon size={14} />
      </div>
      <div>
        <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginBottom: 1 }}>{label}</div>
        <div style={{ fontFamily: mono, fontSize: 12.5, color: C.mid }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Main Panel ─────────────────────────────────────── */
export default function StudentDetailPanel({ student, onClose, onStudentUpdate }) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "labs"
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentStudent, setCurrentStudent] = useState(student);
  const [blockingLoading, setBlockingLoading] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReasonInput, setBlockReasonInput] = useState(student?.lab_access_block_reason || "");

  const [retakeModalLab, setRetakeModalLab] = useState(null);
  const [resetScoreChecked, setResetScoreChecked] = useState(true);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [retakeSuccessMsg, setRetakeSuccessMsg] = useState("");

  useEffect(() => {
    setCurrentStudent(student);
    setBlockReasonInput(student?.lab_access_block_reason || "");
  }, [student]);

  const handleToggleLabAccess = async (targetBlock, reason = "") => {
    setBlockingLoading(true);
    try {
      const res = await updateStudent(currentStudent.id, {
        is_lab_access_blocked: targetBlock,
        lab_access_block_reason: targetBlock ? reason : "",
      });
      const updated = res.student || res;
      setCurrentStudent(updated);
      if (onStudentUpdate) onStudentUpdate(updated);
      setShowBlockModal(false);
    } catch (err) {
      setError(err.message || "Failed to update lab access.");
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleGrantRetake = async () => {
    if (!retakeModalLab || !currentStudent?.id) return;
    setRetakeLoading(true);
    try {
      const res = await grantLabRetakePermission(currentStudent.id, retakeModalLab.lab_id, resetScoreChecked);
      setRetakeSuccessMsg(res.message || "Retake permission granted successfully!");
      setRetakeModalLab(null);
      await loadData();
      setTimeout(() => setRetakeSuccessMsg(""), 5000);
    } catch (err) {
      alert(err.message || "Failed to grant retake permission.");
    } finally {
      setRetakeLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    setError("");
    try {
      const progData = await fetchStudentProgress({ student_id: student.id });
      const stProg = (progData.results || []).find((s) => s.student_id === student.id) || (progData.results || [])[0];
      setProgressData(stProg || null);
    } catch (err) {
      setError(err.message || "Failed to load student details.");
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const joinedDate = student?.date_joined
    ? new Date(student.date_joined).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const avatarBg = avatarColor(student?.full_name || student?.username || "");
  const initials = (student?.full_name || student?.username || "?")[0].toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", zIndex: 900 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: 500, height: "100vh",
        background: C.void,
        borderLeft: `1px solid ${C.border}`,
        zIndex: 901,
        display: "flex", flexDirection: "column",
        boxShadow: "-16px 0 60px rgba(0,0,0,0.55)",
        animation: "slideIn 200ms ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 22px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.06em" }}>
            STUDENT PROFILE
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.panel3, border: `1px solid ${C.border}`,
              borderRadius: 6, cursor: "pointer", color: C.mid,
              padding: 5, display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 22px 0" }}>
          {/* Profile card */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}>
            {/* Avatar + name row */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: mono, fontSize: 22, fontWeight: 700, color: "#fff",
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: sans, fontSize: 17, fontWeight: 700, color: C.hi, marginBottom: 3 }}>
                  {student?.full_name || student?.username}
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginBottom: 8 }}>
                  @{student?.username}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge tone={currentStudent?.is_active ? "cyan" : "danger"}>
                    {currentStudent?.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  {currentStudent?.user_type === "admin" && (
                    <Badge tone="cyan">ADMIN</Badge>
                  )}
                  {currentStudent?.user_type === "instructor" && (
                    <Badge tone="amber">INSTRUCTOR</Badge>
                  )}
                  {currentStudent?.user_type === "student" && (
                    <Badge tone="neutral">STUDENT</Badge>
                  )}
                  {currentStudent?.is_lab_access_blocked && (
                    <Badge tone="danger">LABS BLOCKED</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <InfoRow icon={Mail} label="Email Address" value={student?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={student?.phone_number || "—"} />
              <InfoRow icon={Building2} label="Organization" value={student?.organization} />
              <InfoRow icon={Calendar} label="Enrolled On" value={joinedDate} />
              <InfoRow
                icon={Shield}
                label="Account Type"
                value={
                  student?.user_type === "admin"
                    ? "Platform Administrator (Django Admin + Dashboard Access)"
                    : student?.user_type === "instructor"
                    ? "Instructor (Admin Dashboard Access)"
                    : "Student (Student Panel Only)"
                }
              />
            </div>

            {/* Quick Labs & Score Progress Bar */}
            {progressData && (
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontFamily: sans, color: C.mid, display: "flex", alignItems: "center", gap: 5 }}>
                    <TrendingUp size={13} color={C.amber} /> Overall Lab Completion
                  </span>
                  <span style={{ fontFamily: mono, fontWeight: 700, color: C.hi }}>
                    {progressData.total_earned_score} pts ({progressData.progress_pct}%)
                  </span>
                </div>
                <ProgressBar pct={progressData.progress_pct} color={C.cyan} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                  <div style={{ background: C.panel2, padding: "8px 10px", borderRadius: 6 }}>
                    <div style={{ fontFamily: mono, fontSize: 10, color: C.low }}>ATTENDED</div>
                    <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: "#c084fc", marginTop: 2 }}>
                      {progressData.labs_attended_count}
                    </div>
                  </div>
                  <div style={{ background: C.panel2, padding: "8px 10px", borderRadius: 6 }}>
                    <div style={{ fontFamily: mono, fontSize: 10, color: C.low }}>COMPLETED</div>
                    <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: "#4ade80", marginTop: 2 }}>
                      {progressData.labs_completed_count}
                    </div>
                  </div>
                  <div style={{ background: C.panel2, padding: "8px 10px", borderRadius: 6 }}>
                    <div style={{ fontFamily: mono, fontSize: 10, color: C.low }}>TOTAL MARKS</div>
                    <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.amber, marginTop: 2 }}>
                      {progressData.total_earned_score}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Practical Lab Access Security Control Box ─── */}
          <div style={{
            background: currentStudent?.is_lab_access_blocked ? "rgba(229,83,75,0.07)" : "rgba(63,216,200,0.05)",
            border: `1px solid ${currentStudent?.is_lab_access_blocked ? "rgba(229,83,75,0.3)" : "rgba(63,216,200,0.25)"}`,
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  padding: 7,
                  borderRadius: 8,
                  background: currentStudent?.is_lab_access_blocked ? "rgba(229,83,75,0.15)" : "rgba(63,216,200,0.12)",
                  color: currentStudent?.is_lab_access_blocked ? C.danger : C.cyan,
                  marginTop: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {currentStudent?.is_lab_access_blocked ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.hi }}>
                      Practical Lab Access
                    </span>
                    <Badge tone={currentStudent?.is_lab_access_blocked ? "danger" : "cyan"}>
                      {currentStudent?.is_lab_access_blocked ? "LABS BLOCKED" : "LAB ACCESS ENABLED"}
                    </Badge>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 3 }}>
                    {currentStudent?.is_lab_access_blocked
                      ? "Student is currently prohibited from attending, viewing workspaces, or submitting all practical labs."
                      : "Student can freely attend and submit practical labs in their assigned subjects."}
                  </div>
                </div>
              </div>

              {currentStudent?.is_lab_access_blocked ? (
                <button
                  type="button"
                  onClick={() => handleToggleLabAccess(false)}
                  disabled={blockingLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "rgba(63,216,200,0.12)",
                    border: `1px solid ${C.cyan}`,
                    color: C.cyan,
                    fontFamily: sans,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: blockingLoading ? "wait" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {blockingLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck size={13} />}
                  Unblock Access
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  disabled={blockingLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "rgba(229,83,75,0.12)",
                    border: `1px solid ${C.danger}`,
                    color: C.danger,
                    fontFamily: sans,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: blockingLoading ? "wait" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {blockingLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Ban size={13} />}
                  Block Lab Access
                </button>
              )}
            </div>

            {currentStudent?.is_lab_access_blocked && currentStudent?.lab_access_block_reason && (
              <div style={{
                background: "rgba(229,83,75,0.08)",
                border: "1px dashed rgba(229,83,75,0.3)",
                borderRadius: 6,
                padding: "8px 12px",
                fontFamily: sans,
                fontSize: 11.5,
                color: "#fca5a5",
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}>
                <span style={{ fontWeight: 600 }}>Reason:</span>
                <span>{currentStudent.lab_access_block_reason}</span>
              </div>
            )}
          </div>

          {/* Tab Selector: Courses & Subjects VS Attended Labs & Scores */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
            <button
              onClick={() => setActiveTab("overview")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: activeTab === "overview" ? C.panel3 : "transparent",
                color: activeTab === "overview" ? C.hi : C.low,
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Layers size={13} />
              Assigned Subjects
            </button>
            <button
              onClick={() => setActiveTab("labs")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: activeTab === "labs" ? C.panel3 : "transparent",
                color: activeTab === "labs" ? C.amber : C.low,
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              <FlaskConical size={13} />
              Attended Labs & Scores ({progressData?.lab_scores?.length || 0})
            </button>
          </div>

          {activeTab === "labs" ? (
            /* ──────── ATTENDED LABS & SCORES BREAKDOWN ──────── */
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginBottom: 12 }}>
                Verified practical lab attempts, question flags, and scores.
              </div>

              {retakeSuccessMsg && (
                <div style={{
                  marginBottom: 12,
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "rgba(0, 230, 118, 0.12)",
                  border: "1px solid rgba(0, 230, 118, 0.35)",
                  color: C.green,
                  fontFamily: sans,
                  fontSize: 12.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                  <span>{retakeSuccessMsg}</span>
                </div>
              )}

              {(!progressData?.lab_scores || progressData.lab_scores.length === 0) ? (
                <div style={{
                  background: C.panel,
                  border: `1px dashed ${C.border}`,
                  borderRadius: 8,
                  padding: "24px 16px",
                  textAlign: "center",
                  fontFamily: sans,
                  fontSize: 12.5,
                  color: C.low,
                }}>
                  No labs attended yet by this student.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {progressData.lab_scores.map((lab) => (
                    <div
                      key={lab.lab_id}
                      style={{
                        background: C.panel,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi }}>
                            {lab.lab_name}
                          </div>
                          <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                            {lab.subject_name || lab.category} • {lab.difficulty}
                          </div>
                        </div>
                        {lab.is_completed ? (
                          <Badge tone="cyan">COMPLETED (LOCKED)</Badge>
                        ) : (
                          <Badge tone="warn">IN PROGRESS</Badge>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 4px", fontSize: 12 }}>
                        <span style={{ fontFamily: sans, color: C.mid }}>Marks Earned:</span>
                        <span style={{ fontFamily: mono, fontWeight: 700, color: C.amber }}>
                          {lab.score} / {lab.max_score} pts ({lab.score_pct}%)
                        </span>
                      </div>
                      <ProgressBar pct={lab.score_pct} color={lab.is_completed ? "#4ade80" : C.cyan} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11, fontFamily: mono, color: C.low }}>
                        <span>Attended: {lab.attend_count}x session(s)</span>
                        <span>Questions Solved: {lab.solved_questions}/{lab.total_questions}</span>
                      </div>

                      {/* Retake Permission Action Button */}
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: mono, fontSize: 10.5, color: lab.is_completed ? "#fca5a5" : C.low }}>
                          {lab.is_completed ? "Lab completed & blocked for student" : "Lab attempt is currently in progress"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRetakeModalLab(lab);
                            setResetScoreChecked(true);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 11px",
                            borderRadius: 5,
                            background: lab.is_completed ? "rgba(0, 229, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                            border: `1px solid ${lab.is_completed ? "rgba(0, 229, 255, 0.35)" : C.border}`,
                            color: lab.is_completed ? C.cyan : C.mid,
                            fontFamily: mono,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <RotateCcw size={12} />
                          {lab.is_completed ? "Grant Retake Permission" : "Reset / Allow Retake"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ──────── COURSES & SUBJECTS TAB ──────── */
            <>

          {/* Assigned Subjects (Lab Access Gate) */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <div>
                <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, display: "flex", alignItems: "center", gap: 6 }}>
                  <Layers size={14} color={C.amber} /> Assigned Subjects (Lab Access)
                </div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, marginTop: 2 }}>
                  Controls practical lab access — student can only attend labs in assigned subjects
                </div>
              </div>
            </div>

            {(student?.enrolled_subjects || []).length === 0 ? (
              <div style={{
                background: C.panel,
                border: `1px dashed ${C.border}`,
                borderRadius: 8,
                padding: "16px",
                textAlign: "center",
                fontFamily: sans,
                fontSize: 12,
                color: C.low,
              }}>
                No subjects assigned yet. Use <strong>Assign Subjects</strong> from the students list to grant lab access.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {student.enrolled_subjects.map((subj) => (
                  <div
                    key={subj.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: C.panel,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
                        {subj.name}
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, marginTop: 2 }}>
                        {subj.code && <span style={{ color: C.cyan, marginRight: 8 }}>{subj.code}</span>}
                        {subj.course_name && <span>Class: {subj.course_name}</span>}
                      </div>
                    </div>
                    <Badge tone="cyan">LAB ACCESS ACTIVE</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          </>
          )}
        </div>


        {/* Footer */}
        <div style={{
          padding: "14px 22px",
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <Btn variant="outline" onClick={onClose} style={{ width: "100%", padding: "9px 0" }}>
            Close
          </Btn>
        </div>
      </div>

      {/* ── Block Reason Confirmation Modal ── */}
      {showBlockModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "24px 22px",
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(229,83,75,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.danger, flexShrink: 0
              }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>
                  Block Lab Access
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                  Student: @{currentStudent?.username}
                </div>
              </div>
            </div>

            <p style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.5, marginBottom: 16 }}>
              This will immediately lock the student out of all hands-on practical labs, preventing attendance, terminal access, flag submission, and scoring.
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 6 }}>
                Reason for blocking (optional):
              </label>
              <input
                autoFocus
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
                placeholder="e.g. Pending fee clearance, disciplinary hold, etc."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "9px 12px",
                  fontFamily: sans,
                  fontSize: 12.5,
                  color: C.hi,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                disabled={blockingLoading}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 6,
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  color: C.mid,
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleLabAccess(true, blockReasonInput)}
                disabled={blockingLoading}
                style={{
                  flex: 1.5,
                  padding: "9px 0",
                  borderRadius: 6,
                  background: C.danger,
                  border: "none",
                  color: "#fff",
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: blockingLoading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {blockingLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Ban size={14} />}
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Retake Permission Confirmation Modal ── */}
      {retakeModalLab && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "24px 22px",
            width: "100%",
            maxWidth: 450,
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(0,229,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.cyan, flexShrink: 0
              }}>
                <RotateCcw size={18} />
              </div>
              <div>
                <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>
                  Grant Lab Retake Permission
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                  Student: @{currentStudent?.username} • Lab: {retakeModalLab.lab_name}
                </div>
              </div>
            </div>

            <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.5, marginBottom: 16 }}>
              This will remove the completed / blocked lock on this practical lab for the student.
              The student will be allowed to re-enter, open the live workspace, and submit flags.
            </p>

            <div style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 20,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              cursor: "pointer",
            }}
            onClick={() => setResetScoreChecked(!resetScoreChecked)}
            >
              <input
                type="checkbox"
                id="resetScoreCheck"
                checked={resetScoreChecked}
                onChange={(e) => setResetScoreChecked(e.target.checked)}
                style={{ marginTop: 2, cursor: "pointer" }}
              />
              <label htmlFor="resetScoreCheck" style={{ cursor: "pointer", fontFamily: sans, fontSize: 12.5, color: C.hi, lineHeight: 1.4 }}>
                <strong>Reset progress and marks to 0 (Fresh Retake)</strong>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                  Clears previously solved questions and score so the student starts completely fresh.
                </div>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setRetakeModalLab(null)}
                disabled={retakeLoading}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 6,
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  color: C.mid,
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantRetake}
                disabled={retakeLoading}
                style={{
                  flex: 1.6,
                  padding: "9px 0",
                  borderRadius: 6,
                  background: C.cyan,
                  border: "none",
                  color: "#000",
                  fontFamily: sans,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: retakeLoading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {retakeLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RotateCcw size={14} />}
                Confirm & Allow Retake
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

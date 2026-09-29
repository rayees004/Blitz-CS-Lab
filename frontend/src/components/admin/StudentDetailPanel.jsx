import React, { useState, useEffect, useCallback } from "react";
import {
  X, AlertCircle, Loader2, Mail,
  Phone, Building2, Calendar, Shield, Layers,
  FlaskConical, TrendingUp
} from "lucide-react";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentProgress } from "../../api/students";

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
                  <Badge tone={student?.is_active ? "cyan" : "danger"}>
                    {student?.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <InfoRow icon={Mail} label="Email Address" value={student?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={student?.phone_number || "—"} />
              <InfoRow icon={Building2} label="Organization" value={student?.organization} />
              <InfoRow icon={Calendar} label="Enrolled On" value={joinedDate} />
              <InfoRow icon={Shield} label="Account Type" value="Student" />
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
                          <Badge tone="cyan">COMPLETED</Badge>
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

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, fontFamily: mono, color: C.low }}>
                        <span>Attended: {lab.attend_count}x session(s)</span>
                        <span>Questions Solved: {lab.solved_questions}/{lab.total_questions}</span>
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

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, FlaskConical, Zap, Trophy,
  Play, Award, RefreshCw, Filter, HelpCircle,
  Lightbulb, ExternalLink, Activity, ArrowRight,
  ShieldAlert, Sparkles, Check, Clock, Eye, Layers, Lock,
  RotateCcw, Loader2
} from "lucide-react";
import Panel from "../common/Panel";
import StatCard from "../common/StatCard";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import Badge, { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { CATEGORIES } from "../../data/mockData";
import { fetchStudentLabs } from "../../api/labs";
import { requestStudentLabRetake } from "../../api/students";
import StudentLabAttendModal from "./StudentLabAttendModal";

export default function StudentDashboard({ go, onNavigate }) {
  const [labs, setLabs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedLabNotice, setLockedLabNotice] = useState(null);

  // Retake request state
  const [retakeModalLab, setRetakeModalLab] = useState(null);
  const [retakeReason, setRetakeReason] = useState("");
  const [submittingRetake, setSubmittingRetake] = useState(false);
  const [retakeSuccessMsg, setRetakeSuccessMsg] = useState("");

  // Lab modal state for attending and submitting marks
  const [attendingLab, setAttendingLab] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentLabs();
      setLabs(res.labs || []);
      setStats(res.stats || {});
    } catch (err) {
      console.error("Failed to load student dashboard labs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fallbacks when the backend does not send these counts yet
  const assignedLabsCount = labs.filter(
    (l) => !l.is_locked || l.is_completed || (l.submission_status && l.submission_status !== "NOT_STARTED")
  ).length;
  const questionsCompletedCount = labs.reduce((sum, l) => sum + (l.solved_questions_count || 0), 0);

  // Send retake request to instructor/admin
  const handleSendRetakeRequest = async () => {
    if (!retakeModalLab) return;
    setSubmittingRetake(true);
    try {
      const res = await requestStudentLabRetake(retakeModalLab.id, retakeReason);
      setRetakeSuccessMsg(res.message || "Retake request submitted! The administrator will review and unlock the lab.");
      setRetakeModalLab(null);
      setRetakeReason("");
      await loadData();
      setTimeout(() => setRetakeSuccessMsg(""), 6000);
    } catch (err) {
      alert(err.message || "Failed to submit retake request.");
    } finally {
      setSubmittingRetake(false);
    }
  };

  // Dashboard shows only in-progress labs (most recently active first), capped at 10
  const MAX_DASHBOARD_LABS = 10;
  const allInProgressLabs = labs
    .filter((lab) => {
      const isCompleted = lab.submission_status === "COMPLETED" || lab.is_completed;
      return !isCompleted && (lab.submission_status === "IN_PROGRESS" || (lab.attend_count && lab.attend_count > 0));
    })
    .sort((a, b) => new Date(b.last_activity_at || 0) - new Date(a.last_activity_at || 0));
  const dashboardLabs = allInProgressLabs.slice(0, MAX_DASHBOARD_LABS);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
            Welcome back, {stats?.student_name || "Student"}
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 5 }}>
            Cybersecurity hands-on labs evaluation & lab-based marks record.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Btn icon={RefreshCw} tone="ghost" sm onClick={loadData}>
            {loading ? "Syncing..." : "Sync Live Labs & Scores"}
          </Btn>
        </div>
      </div>

      {/* Retake Success Banner */}
      {retakeSuccessMsg && (
        <div
          style={{
            marginTop: 18,
            padding: "12px 18px",
            borderRadius: 8,
            background: "rgba(0, 230, 118, 0.12)",
            border: "1px solid rgba(0, 230, 118, 0.35)",
            color: "#a7f3d0",
            fontFamily: sans,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={16} color={C.green} />
          <span>{retakeSuccessMsg}</span>
        </div>
      )}

      {/* Lab Access Block Notice */}
      {stats?.is_lab_access_blocked && (
        <div
          style={{
            marginTop: 18,
            padding: "14px 18px",
            borderRadius: 8,
            background: "rgba(229, 83, 75, 0.12)",
            border: "1px solid rgba(229, 83, 75, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 4px 20px rgba(229,83,75,0.15)",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: "rgba(229, 83, 75, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={22} color="#f87171" />
          </div>
          <div>
            <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: "#fca5a5", marginBottom: 3 }}>
              Lab Access Blocked By Administrator
            </div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.45 }}>
              {stats.lab_access_block_reason
                ? `Reason: "${stats.lab_access_block_reason}". Practical lab launching, workspaces, and attendance are suspended.`
                : "Your practical lab access is currently suspended. Please contact your instructor or platform administrator."}
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards: 2 rows x 3 cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 22 }}>
        <StatCard
          label="Assigned Labs"
          value={`${stats?.labs_assigned ?? assignedLabsCount}`}
          icon={FlaskConical}
          sub="labs you can attend"
        />
        <StatCard
          label="Completed Labs"
          value={`${stats?.labs_completed ?? 0}`}
          icon={CheckCircle2}
          sub="finished & recorded"
          tone="green"
        />
        <StatCard
          label="In Progress Labs"
          value={`${stats?.labs_in_progress ?? 0}`}
          icon={Activity}
          sub="started, not finished"
          tone="amber"
        />
        <StatCard
          label="Total Points Earned"
          value={`${stats?.total_points_earned ?? 0} pts`}
          icon={Zap}
          sub="across all labs"
          tone="cyan"
        />
        <StatCard
          label="Questions Completed"
          value={`${stats?.total_questions_completed ?? questionsCompletedCount}`}
          icon={HelpCircle}
          sub="correct flags submitted"
          tone="green"
        />
        <StatCard
          label="Attendance Logged"
          value={`${stats?.total_attendances ?? 0}`}
          icon={Layers}
          sub="total lab visits"
        />
      </div>

      {/* In Progress Labs Grid (max 10) */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
              In Progress Labs
            </span>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 2 }}>
              {allInProgressLabs.length > MAX_DASHBOARD_LABS
                ? `Showing your ${MAX_DASHBOARD_LABS} most recent of ${allInProgressLabs.length} labs in progress.`
                : "Labs you have started but not finished yet."}
            </div>
          </div>

          {onNavigate && (
            <Btn icon={FlaskConical} variant="outline" sm onClick={() => onNavigate("labs")}>
              View all labs
            </Btn>
          )}
        </div>

        {/* Labs Grid */}
        {loading ? (
          <Panel style={{ padding: 40, textAlign: "center", color: C.mid, fontFamily: sans }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 10, color: C.cyan }} />
            <div>Loading live labs from database...</div>
          </Panel>
        ) : dashboardLabs.length === 0 ? (
          <Panel style={{ padding: 36, textAlign: "center", color: C.low, fontFamily: sans }}>
            <FlaskConical size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div style={{ fontSize: 14, color: C.mid }}>No labs in progress.</div>
            <div style={{ fontSize: 12, color: C.low, marginTop: 4 }}>Start a lab from the Labs page and it will appear here.</div>
          </Panel>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {dashboardLabs.map((lab) => {
              const isCompleted = Boolean(lab.submission_status === "COMPLETED" || lab.is_completed);
              const isInProgress = Boolean(!isCompleted && (lab.submission_status === "IN_PROGRESS" || (lab.attend_count && lab.attend_count > 0)));
              const isLocked = Boolean(lab.is_locked || isCompleted);
              const hasPendingRetake = lab.retake_request_status === "PENDING";

              return (
                <Panel
                  key={lab.id}
                  style={{
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: isCompleted
                      ? `1px solid rgba(0, 230, 118, 0.35)`
                      : isLocked
                      ? `1px dashed rgba(229, 83, 75, 0.35)`
                      : isInProgress
                      ? `1px solid rgba(245, 166, 35, 0.35)`
                      : `1px solid ${C.border}`,
                    background: isLocked ? "rgba(18, 18, 24, 0.7)" : C.panel,
                    transition: "border-color 0.2s ease",
                    opacity: isLocked && !isCompleted ? 0.88 : 1,
                  }}
                >
                  <div>
                    {/* Lab Top Badges */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <DiffBadge level={lab.difficulty} />
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10,
                            color: C.cyan,
                            background: "rgba(0, 229, 255, 0.08)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid rgba(0, 229, 255, 0.2)",
                          }}
                        >
                          {lab.category}
                        </span>
                      </div>

                      {/* Status Tag */}
                      {isLocked ? (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10.5,
                            color: C.danger,
                            background: "rgba(229, 83, 75, 0.12)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 600,
                            border: "1px solid rgba(229, 83, 75, 0.3)",
                          }}
                        >
                          <Lock size={11} /> LOCKED
                        </span>
                      ) : isCompleted ? (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10.5,
                            color: C.green,
                            background: "rgba(0, 230, 118, 0.12)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle2 size={11} /> {lab.score}/{lab.max_score} PTS
                        </span>
                      ) : isInProgress ? (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10.5,
                            color: C.amber,
                            background: "rgba(245, 166, 35, 0.12)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 600,
                          }}
                        >
                          <Activity size={11} /> {lab.score}/{lab.max_score} PTS
                        </span>
                      ) : (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10.5,
                            color: C.low,
                            background: C.panel2,
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}
                        >
                          {lab.points} MARKS
                        </span>
                      )}
                    </div>

                    {/* Subject Badge if available */}
                    {lab.subject_name && (
                      <div style={{ marginBottom: 6 }}>
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10.5,
                            color: isLocked ? C.low : C.cyan,
                            background: isLocked ? "rgba(255,255,255,0.03)" : "rgba(0, 229, 255, 0.08)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: `1px solid ${isLocked ? C.border : "rgba(0, 229, 255, 0.2)"}`,
                          }}
                        >
                          Subject: {lab.subject_name}{lab.subject_code ? ` (${lab.subject_code})` : ""}
                        </span>
                      </div>
                    )}

                    {/* Title & Description */}
                    <h3 style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
                      {lab.name}
                    </h3>
                    <p
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
                      }}
                    >
                      {lab.description || "Hands-on challenge testing vulnerability assessment, exploitation, and mitigation verification."}
                    </p>

                    {/* Locked Notice Banner */}
                    {isLocked && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 7,
                          background: "rgba(229, 83, 75, 0.08)",
                          border: "1px solid rgba(229, 83, 75, 0.25)",
                          borderRadius: 6,
                          padding: "7px 10px",
                          marginTop: 10,
                          fontFamily: sans,
                          fontSize: 11.5,
                          color: "#fca5a5",
                          lineHeight: 1.4,
                        }}
                      >
                        <Lock size={12} style={{ flexShrink: 0, marginTop: 2, color: C.danger }} />
                        <span>{lab.lock_reason || `Requires assignment to subject ${lab.subject_name || 'assigned subject'}.`}</span>
                      </div>
                    )}

                    {/* Target and Questions Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, fontFamily: mono, fontSize: 11, color: C.low }}>
                      <span>{lab.question_count || 0} Questions</span>
                      <span>·</span>
                      <span style={{ color: isLocked ? C.low : C.cyan }}>
                        {isLocked ? "Access Locked" : "Target Active"}
                      </span>
                      <span>·</span>
                      <span style={{ color: lab.attend_count > 1 ? C.amber : C.low }}>
                        Attended {lab.attend_count || 0}x
                      </span>
                    </div>

                    {/* Progress Bar for In Progress or Completed */}
                    {!isLocked && (isInProgress || isCompleted) && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontFamily: mono, fontSize: 10.5, color: C.mid }}>
                          <span>{lab.solved_questions_count || 0}/{lab.question_count || 0} Questions Solved</span>
                          <span style={{ color: isCompleted ? C.green : C.amber }}>{lab.progress_pct}%</span>
                        </div>
                        <ProgressBar value={lab.progress_pct} tone={isCompleted ? "green" : "amber"} h={4} />
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA Button */}
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: isCompleted ? C.green : isLocked ? C.danger : isInProgress ? C.amber : C.mid }}>
                      {isCompleted ? "Completed (Marks Locked)" : isLocked ? "Enrollment Required" : isInProgress ? "In Progress" : "Not Started"}
                    </span>

                    {isCompleted ? (
                      hasPendingRetake ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 6,
                            border: `1px solid rgba(245, 166, 35, 0.35)`,
                            background: "rgba(245, 166, 35, 0.12)",
                            color: C.amber,
                            fontFamily: sans,
                            fontSize: 11.5,
                            fontWeight: 600,
                          }}
                        >
                          <Clock size={12} /> Retake Pending
                        </span>
                      ) : (
                        <Btn
                          sm
                          icon={RotateCcw}
                          onClick={() => setRetakeModalLab(lab)}
                          variant="outline"
                          style={{
                            border: `1px solid rgba(245, 166, 35, 0.4)`,
                            color: C.amber,
                          }}
                        >
                          Request Retake
                        </Btn>
                      )
                    ) : isLocked ? (
                      <button
                        type="button"
                        onClick={() => setLockedLabNotice(lab)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: `1px solid rgba(229, 83, 75, 0.35)`,
                          background: "rgba(229, 83, 75, 0.1)",
                          color: "#fca5a5",
                          fontFamily: sans,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Lock size={12} /> Locked
                      </button>
                    ) : (
                      <Btn
                        sm
                        icon={Play}
                        onClick={() => setAttendingLab(lab)}
                        tone={isInProgress ? "primary" : "default"}
                      >
                        {isInProgress ? "Continue & Submit" : "Attend Lab"}
                      </Btn>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>

      {/* Locked Lab Notice Modal */}
      {lockedLabNotice && (
        <>
          <div
            onClick={() => setLockedLabNotice(null)}
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
              width: 440,
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
                  background: "rgba(229, 83, 75, 0.12)",
                  border: "1px solid rgba(229, 83, 75, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Lock size={20} color={C.danger} />
              </div>
              <div>
                <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                  Lab Access Locked
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                  {lockedLabNotice.name}
                </div>
              </div>
            </div>

            <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.55, margin: "0 0 16px" }}>
              {lockedLabNotice.lock_reason || `You must be assigned to subject '${lockedLabNotice.subject_name}' to access and attend this practical lab session.`}
            </p>

            <div
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: sans, fontSize: 12, color: C.low }}>Required Subject:</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: C.amber, fontWeight: 600 }}>
                {lockedLabNotice.subject_name || "Assigned Subject"} {lockedLabNotice.subject_code ? `(${lockedLabNotice.subject_code})` : ""}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setLockedLabNotice(null)} style={{ padding: "8px 20px" }}>
                Understood
              </Btn>
            </div>
          </div>
        </>
      )}

      {/* Retake Request Modal */}
      {retakeModalLab && (
        <>
          <div
            onClick={() => setRetakeModalLab(null)}
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
                  {retakeModalLab.name}
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
                value={retakeReason}
                onChange={(e) => setRetakeReason(e.target.value)}
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setRetakeModalLab(null)}
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
                icon={submittingRetake ? Loader2 : RotateCcw}
                onClick={handleSendRetakeRequest}
                disabled={submittingRetake}
                tone="warning"
              >
                {submittingRetake ? "Submitting..." : "Send Retake Request"}
              </Btn>
            </div>
          </div>
        </>
      )}

      {/* Interactive Lab Attendee & Mark Submitting Modal */}
      {attendingLab && (
        <StudentLabAttendModal
          lab={attendingLab}
          onClose={() => setAttendingLab(null)}
          onUpdated={loadData}
        />
      )}
    </div>
  );
}

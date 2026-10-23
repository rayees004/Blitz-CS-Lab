import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, FlaskConical, RefreshCw, Lock, Activity, FileBadge } from "lucide-react";
import CertificateModal from "./CertificateModal";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentLabs } from "../../api/labs";

export default function StudentAttendanceLog() {
  const [labs, setLabs] = useState([]);
  const [labScores, setLabScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingCert, setViewingCert] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentLabs();
      setLabs(res.labs || []);
      setLabScores(res.lab_scores || []);
      setStats(res.stats || {});
    } catch (err) {
      console.error("Failed to load lab attendance log:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
            Lab Attendance Log
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 5 }}>
            Every lab you have attended, with times attended, questions solved and points earned.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan }}>
            {labScores.length} Lab{labScores.length !== 1 ? "s" : ""} Attended · {stats?.total_attendances ?? 0} Visits
          </span>
          <Btn icon={RefreshCw} variant="outline" sm onClick={loadData}>
            {loading ? "Syncing..." : "Refresh"}
          </Btn>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        {loading && labScores.length === 0 ? (
          <Panel style={{ padding: 40, textAlign: "center", color: C.mid, fontFamily: sans }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 10, color: C.cyan }} />
            <div>Loading your attendance log...</div>
          </Panel>
        ) : labScores.length === 0 ? (
          <Panel style={{ padding: 28, textAlign: "center", color: C.mid, background: C.panel }}>
            <FlaskConical size={28} color={C.low} style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: sans, fontSize: 13.5, color: C.hi }}>No labs attended yet.</div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginTop: 4 }}>
              Attend a lab from the Labs page and it will be logged here.
            </div>
          </Panel>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {labScores.map((sc) => {
              const matchingLab = labs.find((l) => String(l.id) === String(sc.lab || sc.lab_id));
              const isCompleted = sc.is_completed;
              const pct = sc.max_score > 0 ? Math.round((sc.score / sc.max_score) * 100) : 0;

              return (
                <Panel
                  key={sc.id}
                  style={{
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    background: isCompleted ? "rgba(0, 230, 118, 0.03)" : C.panel,
                    border: isCompleted ? "1px solid rgba(0, 230, 118, 0.3)" : `1px solid ${C.border}`,
                  }}
                >
                  {/* Left: Lab info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: 1 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: isCompleted ? "rgba(0, 230, 118, 0.12)" : "rgba(245, 166, 35, 0.12)",
                        border: `1px solid ${isCompleted ? "rgba(0, 230, 118, 0.3)" : "rgba(245, 166, 35, 0.3)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} color={C.green} />
                      ) : (
                        <FlaskConical size={18} color={C.amber} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>
                          {sc.lab_name}
                        </span>
                        <DiffBadge level={sc.lab_difficulty} />
                        {sc.subject_name && (
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 10,
                              color: C.cyan,
                              background: "rgba(0, 229, 255, 0.08)",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            Course: {sc.subject_name}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, fontFamily: mono, fontSize: 11, color: C.low }}>
                        <span>Category: {sc.lab_category}</span>
                        <span>·</span>
                        <span
                          style={{
                            color: sc.attend_count > 1 ? C.amber : C.mid,
                            fontWeight: sc.attend_count > 1 ? 700 : 400,
                          }}
                        >
                          Attended {sc.attend_count} time{sc.attend_count > 1 ? "s" : ""}
                        </span>
                        <span>·</span>
                        <span>{sc.solved_questions_count}/{sc.total_questions_count || 1} Solved</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Score meter */}
                  <div style={{ width: 170, flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontFamily: mono, fontSize: 11 }}>
                      <span style={{ color: C.mid }}>Lab Score</span>
                      <span style={{ color: isCompleted ? C.green : C.amber, fontWeight: 700 }}>
                        {sc.score} / {sc.max_score} pts
                      </span>
                    </div>
                    <ProgressBar value={pct} tone={isCompleted ? "green" : "amber"} h={5} />
                    <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, marginTop: 3 }}>
                      {isCompleted ? "Score locked on completion" : "In Progress · Score capped"}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          setViewingCert({
                            certId: `BLITZ-CERT-${String(sc.lab || sc.lab_id).padStart(3, "0")}-${String(sc.id).padStart(4, "0")}`,
                            studentName: stats?.student_name || "Student",
                            labName: sc.lab_name,
                            labDesc: matchingLab?.description || matchingLab?.desc || "Hands-on cybersecurity evaluation.",
                            category: sc.lab_category,
                            subjectName: sc.subject_name || "",
                            score: typeof sc.score === "number" ? sc.score : 0,
                            maxScore: sc.max_score,
                            solvedQuestions: typeof sc.solved_questions_count === "number" ? sc.solved_questions_count : 0,
                            totalQuestions: sc.total_questions_count || 1,
                            completedAt: sc.updated_at || new Date().toISOString(),
                          })
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontFamily: sans,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: C.amber,
                          background: "rgba(245, 166, 35, 0.12)",
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: "1px solid rgba(245, 166, 35, 0.35)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <FileBadge size={13} /> View Certificate
                      </button>
                    )}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: mono,
                        fontSize: 11,
                        color: isCompleted ? C.green : C.amber,
                        background: isCompleted ? "rgba(0, 230, 118, 0.1)" : "rgba(245, 166, 35, 0.1)",
                        padding: "4px 10px",
                        borderRadius: 5,
                        border: isCompleted ? "1px solid rgba(0, 230, 118, 0.25)" : "1px solid rgba(245, 166, 35, 0.3)",
                      }}
                    >
                      {isCompleted ? <Lock size={12} /> : <Activity size={12} />}
                      {isCompleted ? "Completed (Recorded)" : "In Progress"}
                    </span>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>

      {viewingCert && (
        <CertificateModal
          certificate={viewingCert}
          onClose={() => setViewingCert(null)}
        />
      )}
    </div>
  );
}

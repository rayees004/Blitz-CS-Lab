import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, FlaskConical, TrendingUp, Zap, Trophy,
  Play, Award, RefreshCw, Search, Filter, HelpCircle,
  Lightbulb, ExternalLink, Activity, ArrowRight, ShieldCheck,
  ShieldAlert, Sparkles, Check, Clock, Eye, Layers, Lock
} from "lucide-react";
import Panel from "../common/Panel";
import StatCard from "../common/StatCard";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import Badge, { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { CATEGORIES } from "../../data/mockData";
import { fetchStudentLabs } from "../../api/labs";
import StudentLabAttendModal from "./StudentLabAttendModal";

export default function StudentDashboard({ go }) {
  const [labs, setLabs] = useState([]);
  const [labScores, setLabScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | MY_COURSES | IN_PROGRESS | COMPLETED | LOCKED
  const [lockedLabNotice, setLockedLabNotice] = useState(null);

  // Lab modal state for attending and submitting marks
  const [attendingLab, setAttendingLab] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentLabs();
      setLabs(res.labs || []);
      setLabScores(res.lab_scores || []);
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

  // Find most relevant lab to continue (must be attendable, not locked!)
  const inProgressLab = labs.find((l) => l.submission_status === "IN_PROGRESS" && !l.is_locked);
  const heroLab = inProgressLab || labs.find((l) => !l.is_locked) || labs[0];

  // Filtering labs for the Attend section
  const filteredLabs = labs.filter((lab) => {
    const matchSearch =
      searchQuery === "" ||
      lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.subject_name && lab.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lab.subject_code && lab.subject_code.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (statusFilter === "MY_SUBJECTS") return !lab.is_locked;
    if (statusFilter === "LOCKED") return Boolean(lab.is_locked);
    if (statusFilter === "IN_PROGRESS") return lab.submission_status === "IN_PROGRESS" && !lab.is_locked;
    if (statusFilter === "COMPLETED") return lab.submission_status === "COMPLETED";
    if (statusFilter === "NOT_STARTED") return lab.submission_status === "NOT_STARTED" && !lab.is_locked;
    return true;
  });

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

      {/* Real-time Stat Cards */}
      <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
        <StatCard
          label="Labs Completed"
          value={stats ? `${stats.labs_completed}` : "0"}
          icon={CheckCircle2}
          sub={`of ${stats?.labs_available || labs.length} unique labs`}
        />
        <StatCard
          label="Labs In Progress"
          value={stats ? `${stats.labs_in_progress}` : "0"}
          icon={Activity}
          sub="active sessions"
          tone="amber"
        />
        <StatCard
          label="Total Marks Earned"
          value={stats ? `${stats.total_points_earned} pts` : "0 pts"}
          icon={Zap}
          sub="lab-based unique sum"
          tone="cyan"
        />
        <StatCard
          label="Total Attendances Logged"
          value={stats ? `${stats.total_attendances || 0}` : "0"}
          icon={Layers}
          sub="repeat visits do not inflate score"
        />
        <StatCard
          label="Overall Progress"
          value={stats ? `${stats.overall_progress_pct}%` : "0%"}
          icon={TrendingUp}
          sub="curriculum score"
          tone="cyan"
        />
      </div>

      {/* Single-Accrual Policy Security Badge */}
      <div
        style={{
          marginTop: 20,
          padding: "12px 16px",
          borderRadius: 8,
          background: "rgba(0, 229, 255, 0.05)",
          border: "1px solid rgba(0, 229, 255, 0.22)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: sans,
          fontSize: 12.5,
          color: C.mid,
        }}
      >
        <ShieldCheck size={18} color={C.cyan} style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: C.hi }}>Strict Lab-Based Evaluation:</strong> Marks are accrued uniquely per lab using foreign key relationships. Attending a lab one time or multiple times will <strong style={{ color: C.cyan }}>never</strong> duplicate or increase your score. Repeating labs provides practice without inflating academic marks.
        </div>
      </div>

      {/* Section 1: Lab-Based Score List (Foreign Key Relation) */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                Lab-Based Score List & Performance Record
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  color: C.amber,
                  background: "rgba(245, 166, 35, 0.1)",
                  padding: "2px 7px",
                  borderRadius: 4,
                  border: "1px solid rgba(245, 166, 35, 0.25)",
                }}
              >
                Foreign Key Linked
              </span>
            </div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 2 }}>
              Immutable record of scores earned per lab. Repeat attendances increment attempt frequency without multiplying marks.
            </div>
          </div>

          <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan }}>
            {labScores.length} Lab{labScores.length !== 1 ? "s" : ""} Attended
          </span>
        </div>

        {labScores.length === 0 ? (
          <Panel style={{ padding: 28, textAlign: "center", color: C.mid, background: C.panel }}>
            <FlaskConical size={28} color={C.low} style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: sans, fontSize: 13.5, color: C.hi }}>No lab scores recorded yet.</div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginTop: 4 }}>
              Attend any of the available practical labs below to begin earning marks.
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
                  {/* Left: Lab info via ForeignKey */}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Btn
                      sm
                      tone={isCompleted ? "ghost" : "primary"}
                      icon={isCompleted ? Eye : Play}
                      onClick={() => setAttendingLab(matchingLab || { id: sc.lab, name: sc.lab_name, points: sc.max_score })}
                    >
                      {isCompleted ? "Review Lab" : "Continue Lab"}
                    </Btn>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Continue Learning Hero Panel */}
      {heroLab && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>
              {inProgressLab ? "Continue Active Practical Challenge" : "Featured Security Evaluation"}
            </span>
            {heroLab.subject_name && (
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: C.cyan,
                  background: "rgba(0, 229, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(0, 229, 255, 0.2)",
                }}
              >
                Course: {heroLab.subject_name}
              </span>
            )}
          </div>

          <Panel style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 260 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: heroLab.submission_status === "COMPLETED" ? "rgba(0, 230, 118, 0.12)" : "rgba(245,166,35,0.12)",
                  border: `1px solid ${heroLab.submission_status === "COMPLETED" ? "rgba(0, 230, 118, 0.35)" : "rgba(245,166,35,0.35)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FlaskConical size={22} color={heroLab.submission_status === "COMPLETED" ? C.green : C.amber} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                    {heroLab.name}
                  </span>
                  <DiffBadge level={heroLab.difficulty} />
                  {heroLab.submission_status === "COMPLETED" && (
                    <Badge tone="green">COMPLETED</Badge>
                  )}
                  {heroLab.submission_status === "IN_PROGRESS" && (
                    <Badge tone="amber">IN PROGRESS</Badge>
                  )}
                  {heroLab.attend_count > 0 && (
                    <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mid, background: C.void, padding: "2px 6px", borderRadius: 4 }}>
                      Attended {heroLab.attend_count}x
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 4 }}>
                  {heroLab.category} · {heroLab.question_count || 0} Questions · Max Marks: {heroLab.points} pts
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ width: 180 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.mid }}>
                    {heroLab.progress_pct}% Complete
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.amber, fontWeight: 700 }}>
                    {heroLab.score} / {heroLab.max_score} pts
                  </span>
                </div>
                <ProgressBar value={heroLab.progress_pct} tone={heroLab.submission_status === "COMPLETED" ? "green" : "cyan"} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  icon={Play}
                  onClick={() => setAttendingLab(heroLab)}
                >
                  {heroLab.submission_status === "COMPLETED" ? "Review Lab" : heroLab.submission_status === "IN_PROGRESS" ? "Continue Lab & Submit Marks" : "Attend Lab"}
                </Btn>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Section 3: Available Labs to Attend Grid */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
              Available Hands-On Labs
            </div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 2 }}>
              Launch isolated target sandboxes, exploit real vulnerabilities, and submit proof flags for marks.
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.panel,
                border: `1px solid ${C.borderLight}`,
                borderRadius: 6,
                padding: "6px 10px",
                width: 220,
              }}
            >
              <Search size={14} color={C.low} />
              <input
                type="text"
                placeholder="Search labs or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontFamily: sans,
                  fontSize: 12,
                  color: C.hi,
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>

            {/* Status Filter Chips */}
            <div style={{ display: "flex", background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 6, padding: 2, flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: "All Labs" },
                { id: "MY_SUBJECTS", label: "My Subjects" },
                { id: "IN_PROGRESS", label: "In Progress" },
                { id: "COMPLETED", label: "Completed" },
                { id: "LOCKED", label: "Locked" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    background: statusFilter === tab.id ? C.void : "transparent",
                    border: statusFilter === tab.id ? `1px solid ${C.border}` : "none",
                    borderRadius: 5,
                    padding: "4px 10px",
                    fontFamily: sans,
                    fontSize: 11.5,
                    color: statusFilter === tab.id ? C.hi : C.low,
                    cursor: "pointer",
                    fontWeight: statusFilter === tab.id ? 600 : 400,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Labs Grid */}
        {loading ? (
          <Panel style={{ padding: 40, textAlign: "center", color: C.mid, fontFamily: sans }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 10, color: C.cyan }} />
            <div>Loading live labs from database...</div>
          </Panel>
        ) : filteredLabs.length === 0 ? (
          <Panel style={{ padding: 36, textAlign: "center", color: C.low, fontFamily: sans }}>
            <FlaskConical size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div style={{ fontSize: 14, color: C.mid }}>No labs found matching your filters.</div>
          </Panel>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {filteredLabs.map((lab) => {
              const isCompleted = lab.submission_status === "COMPLETED";
              const isInProgress = lab.submission_status === "IN_PROGRESS";
              const isLocked = Boolean(lab.is_locked);

              return (
                <Panel
                  key={lab.id}
                  style={{
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: isLocked
                      ? `1px dashed rgba(229, 83, 75, 0.35)`
                      : isCompleted
                      ? `1px solid rgba(0, 230, 118, 0.35)`
                      : isInProgress
                      ? `1px solid rgba(245, 166, 35, 0.35)`
                      : `1px solid ${C.border}`,
                    background: isLocked ? "rgba(18, 18, 24, 0.7)" : C.panel,
                    transition: "border-color 0.2s ease",
                    opacity: isLocked ? 0.88 : 1,
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
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: isLocked ? C.danger : C.mid }}>
                      {isLocked ? "Enrollment Required" : isCompleted ? "Completed" : isInProgress ? "In Progress" : "Not Started"}
                    </span>

                    {isLocked ? (
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
                        icon={isCompleted ? Check : Play}
                        onClick={() => setAttendingLab(lab)}
                        tone={isCompleted ? "ghost" : isInProgress ? "primary" : "default"}
                      >
                        {isCompleted ? "Review Lab" : isInProgress ? "Continue & Submit" : "Attend Lab"}
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

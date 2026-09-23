import React, { useState, useEffect, useCallback } from "react";
import {
  Activity, Search, RefreshCw, Trophy, FlaskConical,
  Award, CheckCircle2, AlertCircle, Clock, Zap,
  Layers, Filter, ChevronRight, User, ArrowUpRight,
  TrendingUp, BarChart3, ShieldCheck
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import StatCard from "../common/StatCard";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentActivity, fetchStudentProgress } from "../../api/students";

export default function AdminActivity({ onSelectStudent }) {
  const [tab, setTab] = useState("activity"); // "activity" | "progress"
  const [activities, setActivities] = useState([]);
  const [progressData, setProgressData] = useState({ stats: {}, results: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("ALL"); // ALL | lab_completed | flag_solve | lab_attended
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [actRes, progRes] = await Promise.all([
        fetchStudentActivity({ q: searchQuery }),
        fetchStudentProgress(),
      ]);
      setActivities(actRes.results || []);
      setProgressData({
        stats: progRes.stats || {},
        results: progRes.results || [],
      });
    } catch (err) {
      console.error("Failed to load activity & progress data:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (activityFilter === "ALL") return true;
    return act.type === activityFilter;
  });

  // Filter student progress rows
  const filteredProgress = progressData.results.filter((st) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.username.toLowerCase().includes(q) ||
      (st.email && st.email.toLowerCase().includes(q))
    );
  });

  const getEventBadge = (act) => {
    switch (act.type) {
      case "lab_completed":
        return <Badge tone="cyan">COMPLETED</Badge>;
      case "flag_solve":
        return <Badge tone="amber">FLAG SOLVED</Badge>;
      case "hint_unlock":
        return <Badge tone="warn">HINT USED</Badge>;
      case "lab_attended":
        return <Badge tone="purple">ATTENDED</Badge>;
      default:
        return <Badge tone="neutral">ACTIVITY</Badge>;
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "lab_completed":
        return <Trophy size={16} color={C.cyan} />;
      case "flag_solve":
        return <Zap size={16} color={C.amber} />;
      case "hint_unlock":
        return <AlertCircle size={16} color={C.warn} />;
      case "lab_attended":
        return <FlaskConical size={16} color="#c084fc" />;
      default:
        return <Activity size={16} color={C.mid} />;
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "Recently";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(ts);
    }
  };

  return (
    <div style={{ padding: "26px 30px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
            Student Activity & Overall Progress
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: "4px 0 0" }}>
            Real-time feed of student lab attendance, question flags, hint unlocks, and comprehensive marks summary.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Btn>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 22 }}>
        <StatCard
          icon={User}
          label="Active Enrolled Students"
          value={progressData.stats.total_students ?? progressData.results.length}
          sub="Participating in labs"
          tone="amber"
        />
        <StatCard
          icon={FlaskConical}
          label="Total Lab Attendances"
          value={progressData.stats.total_attendances ?? 0}
          sub="Lab sessions initiated"
          tone="purple"
        />
        <StatCard
          icon={Trophy}
          label="Lab Completions"
          value={progressData.stats.total_completions ?? 0}
          sub="100% finished labs"
          tone="cyan"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Progress"
          value={`${progressData.stats.average_progress_pct ?? 0}%`}
          sub="Platform wide completion"
          tone="green"
        />
      </div>

      {/* Tabs & Filters Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "10px 14px",
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setTab("activity")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 6,
              background: tab === "activity" ? C.panel3 : "transparent",
              color: tab === "activity" ? C.amber : C.mid,
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              border: tab === "activity" ? `1px solid ${C.amber}` : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            <Activity size={15} />
            Live Activity Feed ({activities.length})
          </button>
          <button
            onClick={() => setTab("progress")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 6,
              background: tab === "progress" ? C.panel3 : "transparent",
              color: tab === "progress" ? C.cyan : C.mid,
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              border: tab === "progress" ? `1px solid ${C.cyan}` : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            <BarChart3 size={15} />
            Student Progress & Scores ({progressData.results.length})
          </button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tab === "activity" && (
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { label: "All Events", val: "ALL" },
                { label: "Completions", val: "lab_completed" },
                { label: "Flag Solves", val: "flag_solve" },
                { label: "Attends", val: "lab_attended" },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => setActivityFilter(f.val)}
                  style={{
                    padding: "5px 9px",
                    borderRadius: 5,
                    fontFamily: mono,
                    fontSize: 11,
                    background: activityFilter === f.val ? C.panel2 : "transparent",
                    color: activityFilter === f.val ? C.hi : C.low,
                    border: `1px solid ${activityFilter === f.val ? C.border : "transparent"}`,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "6px 10px",
              width: 220,
            }}
          >
            <Search size={14} color={C.low} />
            <input
              type="text"
              placeholder="Search student or lab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontFamily: sans,
                fontSize: 12,
                color: C.hi,
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {tab === "activity" ? (
        /* ──────── LIVE ACTIVITY FEED ──────── */
        <Panel title="Real-Time Event Stream" sub={`${filteredActivities.length} recent lab and platform interactions`}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.mid, fontFamily: sans }}>
              <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12, color: C.amber }} />
              <div>Loading real-time student activity feed...</div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: C.low, fontFamily: sans }}>
              <Activity size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
              <div style={{ fontSize: 14, color: C.mid, fontWeight: 600 }}>No activities recorded yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                When students attend labs, submit CTF flags, or unlock hints, their actions will stream live here.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredActivities.map((act, index) => (
                <div
                  key={act.id || index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderBottom: index < filteredActivities.length - 1 ? `1px solid ${C.border}` : "none",
                    background: index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.panel2)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)")
                  }
                >
                  {/* Left: Icon & Description */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: C.panel3,
                        border: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getEventIcon(act.type)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi }}>
                          {act.student_name}
                        </span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                          (@{act.student_username})
                        </span>
                        {getEventBadge(act)}
                      </div>
                      <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 3 }}>
                        {act.title}
                        {act.subject_name && (
                          <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan, marginLeft: 8 }}>
                            [{act.subject_name}]
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                        {act.description}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Impact & Timestamp */}
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    {act.points !== undefined && act.points !== 0 && (
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 13,
                          fontWeight: 700,
                          color: act.points > 0 ? "#4ade80" : "#f87171",
                          marginBottom: 3,
                        }}
                      >
                        {act.points > 0 ? `+${act.points}` : act.points} pts
                      </div>
                    )}
                    <div style={{ fontFamily: mono, fontSize: 11, color: C.low, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <Clock size={11} />
                      {formatTimestamp(act.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : (
        /* ──────── STUDENT OVERALL PROGRESS & SCORES LISTING ──────── */
        <Panel
          title="Student Progress & Scores Directory"
          sub="Detailed breakdown of labs attended, scores achieved, and completion rates per student"
        >
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.mid, fontFamily: sans }}>
              <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12, color: C.cyan }} />
              <div>Calculating student overall progress and scores...</div>
            </div>
          ) : filteredProgress.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: C.low, fontFamily: sans }}>
              <User size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
              <div style={{ fontSize: 14, color: C.mid, fontWeight: 600 }}>No students found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add students to track their progress and attended labs.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: sans, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.panel2 }}>
                    <th style={{ padding: "12px 16px", fontSize: 11, fontFamily: mono, color: C.low, textTransform: "uppercase" }}>Student</th>
                    <th style={{ padding: "12px 16px", fontSize: 11, fontFamily: mono, color: C.low, textTransform: "uppercase" }}>Labs Attended</th>
                    <th style={{ padding: "12px 16px", fontSize: 11, fontFamily: mono, color: C.low, textTransform: "uppercase" }}>Completed</th>
                    <th style={{ padding: "12px 16px", fontSize: 11, fontFamily: mono, color: C.low, textTransform: "uppercase" }}>Total Marks / Points</th>
                    <th style={{ padding: "12px 16px", fontSize: 11, fontFamily: mono, color: C.low, textTransform: "uppercase", width: 170 }}>Overall Progress</th>
                    <th style={{ padding: "12px 16px", fontSize: 11, fontFamily: mono, color: C.low, textTransform: "uppercase" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProgress.map((st) => (
                    <React.Fragment key={st.student_id}>
                      <tr
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          transition: "background 0.15s ease",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedStudentDetail(selectedStudentDetail === st.student_id ? null : st.student_id)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = C.panel2)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Student Name */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 7,
                                background: C.panel3,
                                border: `1px solid ${C.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: mono,
                                fontSize: 13,
                                fontWeight: 700,
                                color: C.amber,
                              }}
                            >
                              {(st.name || st.username)[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.hi }}>{st.name}</div>
                              <div style={{ fontSize: 11, color: C.low, fontFamily: mono }}>@{st.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Labs Attended */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <FlaskConical size={14} color="#c084fc" />
                            <span style={{ fontFamily: mono, fontSize: 13, color: C.hi, fontWeight: 600 }}>
                              {st.labs_attended_count}
                            </span>
                            <span style={{ fontSize: 11, color: C.low }}>({st.total_attend_times}x sessions)</span>
                          </div>
                        </td>

                        {/* Completed */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={14} color="#4ade80" />
                            <span style={{ fontFamily: mono, fontSize: 13, color: C.hi, fontWeight: 600 }}>
                              {st.labs_completed_count}
                            </span>
                            {st.labs_in_progress_count > 0 && (
                              <span style={{ fontSize: 11, color: C.amber }}>({st.labs_in_progress_count} active)</span>
                            )}
                          </div>
                        </td>

                        {/* Total Score */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontFamily: mono, fontSize: 13.5, fontWeight: 700, color: C.amber }}>
                            {st.total_earned_score}{" "}
                            <span style={{ fontSize: 11, color: C.low, fontWeight: 400 }}>
                              / {st.total_possible_score} pts
                            </span>
                          </div>
                        </td>

                        {/* Progress Bar */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1 }}>
                              <ProgressBar pct={st.progress_pct} color={C.cyan} />
                            </div>
                            <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.hi, minWidth: 34 }}>
                              {st.progress_pct}%
                            </span>
                          </div>
                        </td>

                        {/* Action: Expand Details */}
                        <td style={{ padding: "14px 16px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentDetail(selectedStudentDetail === st.student_id ? null : st.student_id);
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 5,
                              background: selectedStudentDetail === st.student_id ? C.panel3 : C.panel2,
                              border: `1px solid ${C.border}`,
                              color: selectedStudentDetail === st.student_id ? C.amber : C.mid,
                              fontFamily: sans,
                              fontSize: 12,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>{selectedStudentDetail === st.student_id ? "Hide Labs" : "View Labs"}</span>
                            <ChevronRight
                              size={13}
                              style={{
                                transform: selectedStudentDetail === st.student_id ? "rotate(90deg)" : "none",
                                transition: "transform 0.15s ease",
                              }}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row: Lab Scores Breakdown */}
                      {selectedStudentDetail === st.student_id && (
                        <tr style={{ background: "rgba(0, 0, 0, 0.35)" }}>
                          <td colSpan={6} style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontFamily: mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                                <FlaskConical size={13} />
                                ATTENDED LABS & SCORE BREAKDOWN FOR {st.name.toUpperCase()}
                              </div>
                              <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                                {st.lab_scores?.length || 0} Labs Attended • {st.total_earned_score} Total Marks
                              </div>
                            </div>

                            {(!st.lab_scores || st.lab_scores.length === 0) ? (
                              <div style={{ padding: "16px", background: C.panel, borderRadius: 6, textAlign: "center", color: C.low, fontSize: 12 }}>
                                This student has not attended any labs yet.
                              </div>
                            ) : (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                                {st.lab_scores.map((lab) => (
                                  <div
                                    key={lab.lab_id}
                                    style={{
                                      background: C.panel,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 8,
                                      padding: "12px 14px",
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: C.hi }}>{lab.lab_name}</div>
                                      {lab.is_completed ? (
                                        <Badge tone="cyan">COMPLETED</Badge>
                                      ) : (
                                        <Badge tone="warn">IN PROGRESS</Badge>
                                      )}
                                    </div>
                                    <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginBottom: 8 }}>
                                      {lab.subject_name || lab.category} • {lab.difficulty}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                      <span style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>Earned Score:</span>
                                      <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: C.amber }}>
                                        {lab.score} / {lab.max_score} pts
                                      </span>
                                    </div>
                                    <ProgressBar pct={lab.score_pct} color={lab.is_completed ? "#4ade80" : C.amber} />
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, fontFamily: mono, color: C.low }}>
                                      <span>Attended: {lab.attend_count}x</span>
                                      <span>Questions: {lab.solved_questions}/{lab.total_questions}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Users, BookOpen, FlaskConical, HelpCircle,
  Search, Filter, RefreshCw, ChevronDown, ChevronUp,
  Award, Shield, User, Layers, CheckCircle2, Flag, Lightbulb,
  ExternalLink, Calendar, Mail, FileText, ArrowRight, LayoutGrid
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import StatCard from "../common/StatCard";
import { C, sans, mono } from "../../constants/theme";
import { fetchSubjectLabAnalysis } from "../../api/labs";

export default function AdminSubjectLabAnalysis({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [activeTab, setActiveTab] = useState("subject"); // "subject" | "instructor"
  const [search, setSearch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("ALL");
  const [selectedInstructorId, setSelectedInstructorId] = useState("ALL");

  // Expandable items
  const [expandedSubjectIds, setExpandedSubjectIds] = useState(new Set());
  const [expandedInstructorIds, setExpandedInstructorIds] = useState(new Set());
  const [expandedLabIds, setExpandedLabIds] = useState(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSubjectLabAnalysis({
        search,
        subject_id: selectedSubjectId !== "ALL" ? selectedSubjectId : undefined,
        instructor_id: selectedInstructorId !== "ALL" ? selectedInstructorId : undefined,
      });
      setData(res);

      // Auto-expand first 3 subjects by default if not set
      if (res?.subject_analysis?.length && expandedSubjectIds.size === 0) {
        setExpandedSubjectIds(new Set(res.subject_analysis.slice(0, 3).map(s => s.id)));
      }
      if (res?.instructor_analysis?.length && expandedInstructorIds.size === 0) {
        setExpandedInstructorIds(new Set(res.instructor_analysis.slice(0, 3).map(i => i.id)));
      }
    } catch (err) {
      console.warn("Failed to load subject lab analysis:", err);
      setError(err.message || "Failed to load subject-based analysis.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedSubjectId, selectedInstructorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSubjectExpand = (id) => {
    setExpandedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleInstructorExpand = (id) => {
    setExpandedInstructorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleLabExpand = (id) => {
    setExpandedLabIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const summary = data?.summary || {
    total_instructors: 0,
    total_subjects: 0,
    total_labs: 0,
    total_questions: 0,
  };

  const subjectAnalysis = data?.subject_analysis || [];
  const instructorAnalysis = data?.instructor_analysis || [];

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10.5,
                color: C.amber,
                background: "rgba(240, 180, 41, 0.12)",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid rgba(240, 180, 41, 0.25)",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              PLATFORM ADMIN ANALYTICS
            </span>
          </div>
          <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
            Subject & Instructor Lab Analysis
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: 0, maxWidth: 680 }}>
            Comprehensive oversight of curriculum tracks: analyze which instructors created practical labs, question coverage, point allocations, and difficulty metrics grouped by academic subject.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={loadData}
            style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              cursor: "pointer",
              color: C.mid,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              fontFamily: sans,
              fontSize: 12,
              transition: "all 0.15s ease",
            }}
            title="Refresh Analysis"
          >
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 22 }}>
        <StatCard
          label="Total Academic Subjects"
          value={summary.total_subjects}
          icon={BookOpen}
          tone="amber"
          note="Active subjects in platform"
        />
        <StatCard
          label="Faculty / Instructors"
          value={summary.total_instructors}
          icon={Users}
          tone="cyan"
          note="Contributing lab creators"
        />
        <StatCard
          label="Total Practical Labs"
          value={summary.total_labs}
          icon={FlaskConical}
          tone="amber"
          note="Across all courses & tracks"
        />
        <StatCard
          label="Evaluation Questions"
          value={summary.total_questions}
          icon={HelpCircle}
          tone="green"
          note="Total flags & challenges"
        />
      </div>

      {/* Control Bar: View Toggle & Filters */}
      <Panel style={{ padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* View Mode Toggle */}
          <div style={{ display: "flex", gap: 6, background: C.panel2, padding: 3, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <button
              type="button"
              onClick={() => setActiveTab("subject")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: activeTab === "subject" ? C.panel3 : "transparent",
                border: activeTab === "subject" ? `1px solid ${C.amber}` : "1px solid transparent",
                color: activeTab === "subject" ? C.amber : C.mid,
                padding: "6px 14px",
                borderRadius: 6,
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: activeTab === "subject" ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <BookOpen size={14} />
              <span>Group by Subject ({subjectAnalysis.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("instructor")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: activeTab === "instructor" ? C.panel3 : "transparent",
                border: activeTab === "instructor" ? `1px solid ${C.cyan}` : "1px solid transparent",
                color: activeTab === "instructor" ? C.cyan : C.mid,
                padding: "6px 14px",
                borderRadius: 6,
                fontFamily: sans,
                fontSize: 12.5,
                fontWeight: activeTab === "instructor" ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <User size={14} />
              <span>Group by Instructor ({instructorAnalysis.length})</span>
            </button>
          </div>

          {/* Search & Filter Dropdowns */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "6px 10px",
                minWidth: 220,
              }}
            >
              <Search size={14} color={C.low} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, instructor, lab..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: sans,
                  fontSize: 12,
                  color: C.hi,
                  width: "100%",
                }}
              />
            </div>

            {/* Filter by Subject */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Subject:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontFamily: sans,
                  fontSize: 12,
                  color: C.hi,
                  outline: "none",
                  cursor: "pointer",
                  maxWidth: 180,
                }}
              >
                <option value="ALL">All Subjects</option>
                {subjectAnalysis.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code ? `[${s.code}] ` : ""}{s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Instructor */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Instructor:</span>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontFamily: sans,
                  fontSize: 12,
                  color: C.hi,
                  outline: "none",
                  cursor: "pointer",
                  maxWidth: 180,
                }}
              >
                <option value="ALL">All Instructors</option>
                {instructorAnalysis.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (@{i.username})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Panel>

      {/* Loading & Error States */}
      {loading && (
        <Panel style={{ padding: 48, textAlign: "center" }}>
          <RefreshCw size={24} color={C.amber} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <div style={{ fontFamily: sans, fontSize: 14, color: C.hi }}>Compiling subject and instructor analytics...</div>
        </Panel>
      )}

      {error && !loading && (
        <Panel style={{ padding: 24, border: "1px solid rgba(229,83,75,0.3)", background: "rgba(229,83,75,0.08)" }}>
          <div style={{ color: C.danger, fontFamily: sans, fontSize: 13, fontWeight: 600 }}>{error}</div>
          <Btn small onClick={loadData} style={{ marginTop: 10 }}>Retry</Btn>
        </Panel>
      )}

      {/* ── VIEW 1: GROUP BY SUBJECT ─────────────────────────────────── */}
      {!loading && !error && activeTab === "subject" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {subjectAnalysis.length === 0 ? (
            <Panel style={{ padding: 40, textAlign: "center" }}>
              <BookOpen size={32} color={C.low} style={{ marginBottom: 10 }} />
              <div style={{ fontFamily: sans, fontSize: 14, color: C.mid }}>No subjects matched your filter criteria.</div>
            </Panel>
          ) : (
            subjectAnalysis.map((subj) => {
              const isExpanded = expandedSubjectIds.has(subj.id);
              const instructorCount = subj.instructors?.length || 0;

              return (
                <Panel key={subj.id} style={{ padding: 0, overflow: "hidden" }}>
                  {/* Subject Header Bar */}
                  <div
                    onClick={() => toggleSubjectExpand(subj.id)}
                    style={{
                      padding: "16px 20px",
                      background: isExpanded ? C.panel2 : C.panel,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      cursor: "pointer",
                      borderBottom: isExpanded ? `1px solid ${C.border}` : "none",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "rgba(240, 180, 41, 0.14)",
                          border: "1px solid rgba(240, 180, 41, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.amber,
                          flexShrink: 0,
                        }}
                      >
                        <BookOpen size={18} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                          {subj.code && (
                            <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber, fontWeight: 700 }}>
                              [{subj.code}]
                            </span>
                          )}
                          <h3 style={{ margin: 0, fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                            {subj.name}
                          </h3>
                          <Badge tone="subtle">Track: {subj.course_name}</Badge>
                        </div>
                        {subj.description && (
                          <div style={{ fontFamily: sans, fontSize: 12, color: C.low, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 500 }}>
                            {subj.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: C.hi }}>
                          {subj.total_labs} Lab{subj.total_labs !== 1 ? "s" : ""} · {subj.total_questions} Question{subj.total_questions !== 1 ? "s" : ""}
                        </div>
                        <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>
                          {subj.total_points} total marks · {instructorCount} creator{instructorCount !== 1 ? "s" : ""}
                        </div>
                      </div>

                      <div style={{ color: C.mid, padding: 4 }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Subject Content */}
                  {isExpanded && (
                    <div style={{ padding: "18px 20px", background: "rgba(5, 7, 12, 0.4)" }}>
                      {subj.instructors.length === 0 ? (
                        <div style={{ fontFamily: sans, fontSize: 12.5, color: C.low, padding: "12px 0", textAlign: "center" }}>
                          No labs currently added to this subject yet.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {subj.instructors.map((inst) => (
                            <div
                              key={inst.instructor_id}
                              style={{
                                background: C.panel,
                                border: `1px solid ${C.border}`,
                                borderRadius: 8,
                                padding: 16,
                              }}
                            >
                              {/* Instructor Header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "50%",
                                      background: inst.instructor_role === "instructor" ? "rgba(192, 132, 252, 0.16)" : "rgba(63, 216, 200, 0.16)",
                                      border: `1px solid ${inst.instructor_role === "instructor" ? "#c084fc" : C.cyan}`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: inst.instructor_role === "instructor" ? "#c084fc" : C.cyan,
                                      fontFamily: sans,
                                      fontWeight: 700,
                                      fontSize: 12,
                                    }}
                                  >
                                    {inst.instructor_name?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>
                                        {inst.instructor_name}
                                      </span>
                                      <Badge tone={inst.instructor_role === "instructor" ? "amber" : "cyan"}>
                                        {inst.instructor_role === "instructor" ? "Instructor" : "Platform Admin"}
                                      </Badge>
                                    </div>
                                    {inst.instructor_email && (
                                      <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                                        {inst.instructor_email}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontFamily: mono, fontSize: 11.5, color: C.amber, background: "rgba(240, 180, 41, 0.1)", padding: "3px 8px", borderRadius: 4 }}>
                                    {inst.labs_count} Lab{inst.labs_count !== 1 ? "s" : ""} Added
                                  </span>
                                  <span style={{ fontFamily: mono, fontSize: 11.5, color: C.cyan, background: "rgba(63, 216, 200, 0.1)", padding: "3px 8px", borderRadius: 4 }}>
                                    {inst.questions_count} Questions
                                  </span>
                                  <span style={{ fontFamily: mono, fontSize: 11.5, color: C.hi, background: C.panel2, padding: "3px 8px", borderRadius: 4 }}>
                                    {inst.points} PTS
                                  </span>
                                </div>
                              </div>

                              {/* Labs List created by this Instructor */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                                {inst.labs.map((lab) => {
                                  const isLabExpanded = expandedLabIds.has(lab.id);
                                  return (
                                    <div
                                      key={lab.id}
                                      style={{
                                        background: C.panel2,
                                        border: `1px solid ${isLabExpanded ? C.amberDim : C.borderLight}`,
                                        borderRadius: 6,
                                        padding: "10px 14px",
                                      }}
                                    >
                                      <div
                                        onClick={() => toggleLabExpand(lab.id)}
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber, fontWeight: 700 }}>
                                            LAB #{lab.id}
                                          </span>
                                          <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi }}>
                                            {lab.name}
                                          </span>
                                          <DiffBadge level={lab.difficulty} />
                                          <Badge tone="subtle">{lab.category}</Badge>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                          <span style={{ fontFamily: mono, fontSize: 11, color: C.mid }}>
                                            {lab.questions_count} Question{lab.questions_count !== 1 ? "s" : ""} · {lab.points} PTS
                                          </span>
                                          {isLabExpanded ? <ChevronUp size={14} color={C.low} /> : <ChevronDown size={14} color={C.low} />}
                                        </div>
                                      </div>

                                      {/* Question-level subject analysis breakdown */}
                                      {isLabExpanded && (
                                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>
                                          <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.06em", marginBottom: 8 }}>
                                            QUESTIONS & EVALUATION METRICS IN THIS LAB
                                          </div>
                                          {lab.questions.length === 0 ? (
                                            <div style={{ fontFamily: sans, fontSize: 12, color: C.low }}>
                                              No questions configured for this lab yet.
                                            </div>
                                          ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                                              {lab.questions.map((q, qIdx) => (
                                                <div
                                                  key={q.id || qIdx}
                                                  style={{
                                                    background: C.panel,
                                                    border: `1px solid ${C.border}`,
                                                    borderRadius: 5,
                                                    padding: "8px 12px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                  }}
                                                >
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontFamily: mono, fontSize: 10, color: C.amber }}>
                                                      Q{qIdx + 1}
                                                    </span>
                                                    <span style={{ fontFamily: sans, fontSize: 12.5, color: C.hi, fontWeight: 500 }}>
                                                      {q.title}
                                                    </span>
                                                    {q.description && (
                                                      <span style={{ fontFamily: sans, fontSize: 11, color: C.low }}>
                                                        · {q.description}
                                                      </span>
                                                    )}
                                                  </div>

                                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                    {q.has_flag && (
                                                      <span style={{ fontFamily: mono, fontSize: 10, color: C.green, background: "rgba(0, 230, 118, 0.1)", padding: "1px 6px", borderRadius: 3 }}>
                                                        <Flag size={9} style={{ display: "inline", marginRight: 3 }} /> CTF Flag
                                                      </span>
                                                    )}
                                                    {q.hints_count > 0 && (
                                                      <span style={{ fontFamily: mono, fontSize: 10, color: C.cyan, background: "rgba(63, 216, 200, 0.1)", padding: "1px 6px", borderRadius: 3 }}>
                                                        <Lightbulb size={9} style={{ display: "inline", marginRight: 3 }} /> {q.hints_count} Hint{q.hints_count !== 1 ? "s" : ""}
                                                      </span>
                                                    )}
                                                    <span style={{ fontFamily: mono, fontSize: 11, color: C.amber, fontWeight: 600 }}>
                                                      {q.points} PTS
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Panel>
              );
            })
          )}
        </div>
      )}

      {/* ── VIEW 2: GROUP BY INSTRUCTOR ──────────────────────────────── */}
      {!loading && !error && activeTab === "instructor" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {instructorAnalysis.length === 0 ? (
            <Panel style={{ padding: 40, textAlign: "center" }}>
              <Users size={32} color={C.low} style={{ marginBottom: 10 }} />
              <div style={{ fontFamily: sans, fontSize: 14, color: C.mid }}>No instructors matched your filter criteria.</div>
            </Panel>
          ) : (
            instructorAnalysis.map((inst) => {
              const isExpanded = expandedInstructorIds.has(inst.id);

              return (
                <Panel key={inst.id} style={{ padding: 0, overflow: "hidden" }}>
                  {/* Instructor Bar */}
                  <div
                    onClick={() => toggleInstructorExpand(inst.id)}
                    style={{
                      padding: "16px 20px",
                      background: isExpanded ? C.panel2 : C.panel,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      cursor: "pointer",
                      borderBottom: isExpanded ? `1px solid ${C.border}` : "none",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: inst.role === "instructor" ? "rgba(192, 132, 252, 0.16)" : "rgba(63, 216, 200, 0.16)",
                          border: `1.5px solid ${inst.role === "instructor" ? "#c084fc" : C.cyan}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: inst.role === "instructor" ? "#c084fc" : C.cyan,
                          fontFamily: sans,
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {inst.name?.charAt(0) || "U"}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <h3 style={{ margin: 0, fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                            {inst.name}
                          </h3>
                          <Badge tone={inst.role === "instructor" ? "amber" : "cyan"}>
                            {inst.role === "instructor" ? "Instructor / Faculty" : "Platform Admin"}
                          </Badge>
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 11, color: C.low, display: "flex", gap: 10 }}>
                          <span>@{inst.username}</span>
                          {inst.email && <span>· {inst.email}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: C.hi }}>
                          {inst.total_labs} Lab{inst.total_labs !== 1 ? "s" : ""} · {inst.total_questions} Question{inst.total_questions !== 1 ? "s" : ""}
                        </div>
                        <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>
                          {inst.subjects_count} Subject{inst.subjects_count !== 1 ? "s" : ""} Covered · {inst.total_points} PTS
                        </div>
                      </div>

                      <div style={{ color: C.mid, padding: 4 }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Instructor Content */}
                  {isExpanded && (
                    <div style={{ padding: "18px 20px", background: "rgba(5, 7, 12, 0.4)" }}>
                      {inst.subjects.length === 0 ? (
                        <div style={{ fontFamily: sans, fontSize: 12.5, color: C.low, padding: "12px 0", textAlign: "center" }}>
                          No labs currently created by this instructor yet.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {inst.subjects.map((subj) => (
                            <div
                              key={subj.subject_id}
                              style={{
                                background: C.panel,
                                border: `1px solid ${C.border}`,
                                borderRadius: 8,
                                padding: 14,
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <BookOpen size={14} color={C.amber} />
                                  <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.hi }}>
                                    {subj.subject_name}
                                  </span>
                                  {subj.subject_code && (
                                    <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber }}>
                                      [{subj.subject_code}]
                                    </span>
                                  )}
                                  {subj.course_name && (
                                    <Badge tone="subtle">{subj.course_name}</Badge>
                                  )}
                                </div>

                                <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                                  {subj.labs_count} Lab{subj.labs_count !== 1 ? "s" : ""} · {subj.questions_count} Questions · {subj.points} PTS
                                </div>
                              </div>

                              {/* Labs under this subject */}
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {subj.labs.map((lab) => (
                                  <div
                                    key={lab.id}
                                    style={{
                                      background: C.panel2,
                                      border: `1px solid ${C.borderLight}`,
                                      borderRadius: 6,
                                      padding: "8px 12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 12,
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontFamily: mono, fontSize: 10, color: C.amber, fontWeight: 700 }}>
                                        LAB #{lab.id}
                                      </span>
                                      <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
                                        {lab.name}
                                      </span>
                                      <DiffBadge level={lab.difficulty} />
                                      <Badge tone="subtle">{lab.category}</Badge>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <span style={{ fontFamily: mono, fontSize: 11, color: C.mid }}>
                                        {lab.questions_count} Question{lab.questions_count !== 1 ? "s" : ""}
                                      </span>
                                      <span style={{ fontFamily: mono, fontSize: 11, color: C.amber, fontWeight: 600 }}>
                                        {lab.points} PTS
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Panel>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

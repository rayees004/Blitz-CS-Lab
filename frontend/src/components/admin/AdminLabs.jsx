import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical, Plus, Search, Filter, HelpCircle, Lightbulb,
  Trash2, Edit3, CheckCircle, AlertCircle, RefreshCw, Layers,
  Award, Globe, ExternalLink, Flag, BookMarked
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import StatCard from "../common/StatCard";
import { C, sans, mono } from "../../constants/theme";
import { LABS as MOCK_LABS } from "../../data/mockData";
import { fetchLabs, createLab, updateLab, deleteLab } from "../../api/labs";
import { fetchSubjects } from "../../api/subjects";
import AddLabModal from "./AddLabModal";

export default function AdminLabs({ onOpenAddModal = null }) {
  const [labs, setLabs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [filterDiff, setFilterDiff] = useState("ALL");
  const [filterCourse, setFilterCourse] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);


  const loadLabs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, subjectsData] = await Promise.all([
        fetchLabs(),
        fetchSubjects().catch(() => ({ results: [] })),
      ]);
      const serverLabs = data.results || [];
      setCourses(subjectsData.results || []);

      // If server has labs, merge or use them; also include mock labs formatted nicely
      const mappedMock = MOCK_LABS.map((m) => ({
        ...m,
        isMock: true,
        category: m.cat,
        difficulty: m.diff,
        points: m.pts,
        questions: [
          {
            title: `Exploit ${m.name}`,
            description: m.desc,
            flag: `BLITZ{${m.name.toLowerCase().replace(/\s+/g, "_")}}`,
            points: m.pts,
            hints: [
              { hint_text: `Analyze the attack surface for ${m.cat.toLowerCase()}.`, cost: 10 },
            ],
          },
        ],
      }));

      // Combine server labs first, then mock labs
      setLabs([...serverLabs, ...mappedMock]);
    } catch (err) {
      console.warn("Failed to fetch labs from backend, falling back to mock data:", err);
      // Fallback to mock labs
      const fallback = MOCK_LABS.map((m) => ({
        ...m,
        isMock: true,
        category: m.cat,
        difficulty: m.diff,
        points: m.pts,
        questions: [
          {
            title: `Exploit ${m.name}`,
            description: m.desc,
            flag: `BLITZ{${m.name.toLowerCase().replace(/\s+/g, "_")}}`,
            points: m.pts,
            hints: [
              { hint_text: `Analyze the attack surface for ${m.cat.toLowerCase()}.`, cost: 10 },
            ],
          },
        ],
      }));
      setLabs(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const handleSaveLab = async (payload, editId) => {
    if (editId) {
      const res = await updateLab(editId, payload);
      setActionNotice({ type: "success", text: `Lab "${payload.name}" updated successfully!` });
    } else {
      const res = await createLab(payload);
      setActionNotice({ type: "success", text: `Lab "${payload.name}" created successfully!` });
    }
    await loadLabs();
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteLab = async (lab) => {
    if (!window.confirm(`Are you sure you want to archive or delete "${lab.name}"?`)) return;
    try {
      if (lab.isMock) {
        setLabs((prev) => prev.filter((l) => l.id !== lab.id));
      } else {
        await deleteLab(lab.id);
        await loadLabs();
      }
      setActionNotice({ type: "success", text: `Lab "${lab.name}" removed.` });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      setActionNotice({ type: "error", text: err.message || "Failed to delete lab." });
    }
  };

  const filteredLabs = labs.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.description || l.desc || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.org || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "ALL" || (l.category || l.cat) === filterCat;
    const matchesDiff = filterDiff === "ALL" || (l.difficulty || l.diff) === filterDiff;
    const matchesCourse =
      filterCourse === "ALL" ||
      (filterCourse === "STANDALONE" && !l.subject_id && !l.subject && !l.course_id && !l.course) ||
      (String(l.subject_id || l.subject?.id || l.subject) === String(filterCourse));

    return matchesSearch && matchesCat && matchesDiff && matchesCourse;
  });


  const totalQuestions = labs.reduce((acc, l) => acc + (l.questions?.length || l.question_count || 1), 0);
  const totalHints = labs.reduce(
    (acc, l) =>
      acc +
      (l.questions
        ? l.questions.reduce((qAcc, q) => qAcc + (q.hints?.length || 0), 0)
        : 0),
    0
  );

  const categories = Array.from(new Set(labs.map((l) => l.category || l.cat))).filter(Boolean);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
            Lab Management
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            Create and maintain lab targets, multi-step questions, flags, and progressive hints.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="subtle" icon={RefreshCw} onClick={loadLabs} small disabled={loading}>
            Refresh
          </Btn>
          <Btn
            icon={Plus}
            onClick={() => {
              setEditingLab(null);
              setModalOpen(true);
            }}
          >
            Add New Lab
          </Btn>
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: actionNotice.type === "success" ? "rgba(63, 216, 200, 0.12)" : "rgba(229, 83, 75, 0.15)",
            border: `1px solid ${actionNotice.type === "success" ? C.cyan : C.danger}`,
            borderRadius: 8,
            marginBottom: 20,
            color: actionNotice.type === "success" ? C.cyan : C.danger,
            fontFamily: sans,
            fontSize: 13,
          }}
        >
          {actionNotice.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Labs" value={String(labs.length)} icon={FlaskConical} />
        <StatCard label="Total Questions" value={String(totalQuestions)} icon={HelpCircle} tone="cyan" sub="Interactive challenges" />
        <StatCard label="Configured Hints" value={String(totalHints)} icon={Lightbulb} sub="Progressive clues" />
        <StatCard label="Categories" value={String(categories.length)} icon={Layers} />
      </div>

      {/* Filter & Search Bar */}
      <Panel style={{ padding: "14px 18px", marginBottom: 20, display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} color={C.low} style={{ position: "absolute", left: 11, top: 10 }} />
          <input
            type="text"
            placeholder="Search labs by name, description, organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "8px 12px 8px 34px",
              fontFamily: sans,
              fontSize: 12.5,
              color: C.hi,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Category:</span>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12,
              color: C.hi,
              outline: "none",
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Difficulty:</span>
          <select
            value={filterDiff}
            onChange={(e) => setFilterDiff(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12,
              color: C.hi,
              outline: "none",
            }}
          >
            <option value="ALL">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Course:</span>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${filterCourse !== "ALL" ? C.amberDim : C.border}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12,
              color: C.hi,
              outline: "none",
              maxWidth: 200,
            }}
          >
            <option value="ALL">All Tracks / Standalone</option>
            <option value="STANDALONE">Standalone Only</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `[${c.code}] ` : ""}{c.name}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {/* Labs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredLabs.length === 0 ? (
          <Panel style={{ padding: 40, textAlign: "center" }}>
            <FlaskConical size={32} color={C.mid} style={{ marginBottom: 12 }} />
            <div style={{ fontFamily: sans, fontSize: 14, color: C.hi, fontWeight: 600 }}>No labs match your filters</div>
            <p style={{ fontFamily: sans, fontSize: 12.5, color: C.low, margin: "6px 0 16px" }}>
              Try adjusting your search criteria or create a new lab.
            </p>
            <Btn
              icon={Plus}
              onClick={() => {
                setEditingLab(null);
                setModalOpen(true);
              }}
            >
              Add Lab
            </Btn>
          </Panel>
        ) : (
          filteredLabs.map((l, index) => {
            const qList = l.questions || [];
            const qCount = qList.length || l.question_count || 1;
            const hCount = qList.reduce((acc, q) => acc + (q.hints?.length || 0), 0);
            const matchingCourse = courses.find((c) => String(c.id) === String(l.subject_id || l.subject));

            return (
              <Panel
                key={l.id || index}
                style={{
                  padding: 18,
                  border: `1px solid ${C.border}`,
                  transition: "border-color 150ms ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  {/* Left Column: Lab Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          color: C.amber,
                          background: "rgba(245, 166, 35, 0.1)",
                          padding: "2px 7px",
                          borderRadius: 4,
                          border: `1px solid rgba(245, 166, 35, 0.2)`,
                        }}
                      >
                        LAB #{String(l.id || index + 1).padStart(2, "0")}
                      </span>
                      <h3 style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi, margin: 0 }}>
                        {l.name}
                      </h3>
                      <DiffBadge level={l.difficulty || l.diff || "Beginner"} />
                      <Badge tone="cyan">{l.category || l.cat || "Security"}</Badge>
                      {(l.subject_name || matchingCourse) && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontFamily: sans,
                            fontSize: 11,
                            color: C.amber,
                            background: "rgba(245, 166, 35, 0.12)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: `1px solid rgba(245, 166, 35, 0.3)`,
                            fontWeight: 600,
                          }}
                        >
                          <BookMarked size={11} />
                          Course: {l.subject_name || (matchingCourse?.code ? `[${matchingCourse.code}] ` : '') + matchingCourse?.name}
                        </span>
                      )}
                      {!l.isMock && (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10,
                            color: C.cyan,
                            background: "rgba(63, 216, 200, 0.1)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: `1px solid rgba(63, 216, 200, 0.25)`,
                          }}
                        >
                          Custom Lab
                        </span>
                      )}
                    </div>

                    <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: "6px 0 12px", lineHeight: 1.5 }}>

                      {l.description || l.desc || "No description provided."}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: mono, fontSize: 11.5, color: C.low }}>
                      <span>
                        Target: <strong style={{ color: C.hi }}>{l.org || "Internal"}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Reward: <strong style={{ color: C.amber }}>{l.points || l.pts || 100} pts</strong>
                      </span>
                      <span>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <HelpCircle size={13} color={C.cyan} />
                        <strong style={{ color: C.hi }}>{qCount}</strong> Questions
                      </span>
                      <span>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Lightbulb size={13} color={C.amber} />
                        <strong style={{ color: C.amber }}>{hCount}</strong> Hints configured
                      </span>
                    </div>

                    {/* Question Summary pills */}
                    {qList.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                        {qList.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            style={{
                              background: C.panel2,
                              border: `1px solid ${C.border}`,
                              borderRadius: 5,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontFamily: sans,
                              color: C.mid,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span style={{ fontFamily: mono, color: C.amber, fontWeight: 700 }}>Q{qIdx + 1}</span>
                            <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {q.title}
                            </span>
                            {q.hints && q.hints.length > 0 && (
                              <span
                                style={{
                                  background: C.panel3,
                                  border: `1px solid ${C.borderLight}`,
                                  borderRadius: 3,
                                  padding: "1px 5px",
                                  fontSize: 10,
                                  color: C.amber,
                                  fontFamily: mono,
                                }}
                              >
                                {q.hints.length} hints
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLab(l);
                        setModalOpen(true);
                      }}
                      title="Edit Lab"
                      style={{
                        background: C.panel2,
                        border: `1px solid ${C.borderLight}`,
                        color: C.hi,
                        borderRadius: 6,
                        padding: "7px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: sans,
                        fontSize: 12,
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLab(l)}
                      title="Archive Lab"
                      style={{
                        background: "rgba(229, 83, 75, 0.1)",
                        border: `1px solid rgba(229, 83, 75, 0.3)`,
                        color: C.danger,
                        borderRadius: 6,
                        padding: "7px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: sans,
                        fontSize: 12,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })
        )}
      </div>

      {/* Add / Edit Lab Modal */}
      <AddLabModal
        isOpen={modalOpen}
        initialLab={editingLab}
        onClose={() => {
          setModalOpen(false);
          setEditingLab(null);
        }}
        onLabCreated={handleSaveLab}
      />
    </div>
  );
}

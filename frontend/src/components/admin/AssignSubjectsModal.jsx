import React, { useState, useEffect } from "react";
import {
  X, Layers, Check, CheckSquare, Square, Search,
  Loader2, AlertCircle, Sparkles, Shield, CheckCircle2,
  Clock, BookOpen, FlaskConical
} from "lucide-react";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchSubjects, assignStudentSubjects } from "../../api/subjects";

const AVATAR_COLORS = ["#B87A15", "#1A7A6E", "#6B4FBB", "#1A5E8A", "#8A3A3A"];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AssignSubjectsModal({ student, onClose, onUpdated }) {
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Initialize selected subjects from student's enrolled_subjects
  useEffect(() => {
    const initialIds = (student?.enrolled_subjects || []).map((s) => s.id);
    setSelectedSubjectIds(initialIds);
  }, [student]);

  // Load all active platform subjects
  useEffect(() => {
    let mounted = true;
    setLoadingSubjects(true);
    fetchSubjects()
      .then((res) => {
        if (mounted) {
          setSubjects(res.results || []);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load subjects.");
      })
      .finally(() => {
        if (mounted) setLoadingSubjects(false);
      });
    return () => { mounted = false; };
  }, []);

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    setSelectedSubjectIds(subjects.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedSubjectIds([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await assignStudentSubjects(student.id, selectedSubjectIds, true);
      if (onUpdated) {
        onUpdated(res.student);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update subject assignments.");
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const studentName = student?.full_name || student?.username || "Student";
  const bg = avatarColor(studentName);
  const initials = (studentName[0] || "?").toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          zIndex: 1050,
          animation: "fadeIn 150ms ease",
        }}
      />

      {/* Modal Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "92%",
          maxWidth: 680,
          maxHeight: "88vh",
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          zIndex: 1051,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)",
          animation: "modalZoom 200ms ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: mono,
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10.5,
                    color: C.amber,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  SUBJECT ASSIGNMENT
                </span>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: C.cyan,
                    background: "rgba(63,216,200,0.1)",
                    border: "1px solid rgba(63,216,200,0.25)",
                    padding: "1px 6px",
                    borderRadius: 4,
                  }}
                >
                  Lab Access Gate
                </span>
              </div>
              <h2
                style={{
                  fontFamily: sans,
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.hi,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Assign Subjects to {studentName}
              </h2>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                @{student?.username} · {student?.email}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: C.panel3,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              cursor: "pointer",
              color: C.mid,
              padding: 6,
              display: "flex",
              transition: "all 120ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.hi;
              e.currentTarget.style.borderColor = C.hi;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.mid;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice Banner */}
        <div
          style={{
            padding: "10px 24px",
            background: "rgba(240, 180, 41, 0.08)",
            borderBottom: `1px solid rgba(240, 180, 41, 0.2)`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            fontFamily: sans,
            color: "#fde68a",
            flexShrink: 0,
          }}
        >
          <Shield size={15} color={C.amber} style={{ flexShrink: 0 }} />
          <span>
            Students can <strong>only attend labs belonging to their assigned subjects</strong>. Unassigned subject labs are locked.
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              margin: "12px 24px 0",
              padding: "10px 14px",
              background: "rgba(229,83,75,0.12)",
              border: "1px solid rgba(229,83,75,0.35)",
              borderRadius: 8,
              color: "#fca5a5",
              fontSize: 12.5,
              fontFamily: sans,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Controls: Search + Select All/Clear */}
        <div
          style={{
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.void,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: "7px 12px",
            }}
          >
            <Search size={14} color={C.low} />
            <input
              type="text"
              placeholder="Search subjects by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: C.hi,
                fontFamily: sans,
                fontSize: 12.5,
                width: "100%",
              }}
            />
            {searchQuery && (
              <X
                size={13}
                color={C.low}
                style={{ cursor: "pointer" }}
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={handleSelectAll}
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                color: C.cyan,
                fontFamily: mono,
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <CheckSquare size={12} /> Select All
            </button>
            <button
              onClick={handleDeselectAll}
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                color: C.mid,
                fontFamily: mono,
                fontSize: 11,
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Square size={12} /> Clear
            </button>
          </div>
        </div>

        {/* Selection Stats Bar */}
        <div
          style={{
            padding: "8px 24px",
            background: C.panel2,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: mono,
            fontSize: 11,
            color: C.mid,
            flexShrink: 0,
          }}
        >
          <div>
            ASSIGNED:{" "}
            <strong style={{ color: selectedSubjectIds.length > 0 ? C.amber : C.mid }}>
              {selectedSubjectIds.length}
            </strong>{" "}
            of {subjects.length} subjects
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <span>
              Available: <strong style={{ color: C.hi }}>{filteredSubjects.length}</strong>
            </span>
          </div>
        </div>

        {/* Subjects List Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {loadingSubjects && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0",
                gap: 10,
                color: C.low,
                fontFamily: sans,
                fontSize: 13,
              }}
            >
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              Loading subjects catalog...
            </div>
          )}

          {!loadingSubjects && filteredSubjects.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 10px",
                color: C.mid,
                fontFamily: sans,
                fontSize: 13,
              }}
            >
              {searchQuery ? `No subjects match "${searchQuery}".` : "No subjects available in database."}
            </div>
          )}

          {!loadingSubjects &&
            filteredSubjects.map((subj) => {
              const isSelected = selectedSubjectIds.includes(subj.id);
              const alreadyAssigned = (student?.enrolled_subjects || []).some((s) => s.id === subj.id);

              return (
                <div
                  key={subj.id}
                  onClick={() => toggleSubject(subj.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 9,
                    background: isSelected ? "rgba(240, 180, 41, 0.08)" : C.panel2,
                    border: `1px solid ${isSelected ? C.amber : C.border}`,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    boxShadow: isSelected ? "0 2px 10px rgba(240, 180, 41, 0.12)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = C.panel2;
                      e.currentTarget.style.borderColor = C.border;
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: `1.5px solid ${isSelected ? C.amber : C.mid}`,
                      background: isSelected ? C.amber : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                      flexShrink: 0,
                      transition: "all 120ms ease",
                    }}
                  >
                    {isSelected && <Check size={13} color="#000" strokeWidth={3} />}
                  </div>

                  {/* Subject Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontFamily: sans,
                            fontSize: 14,
                            fontWeight: 600,
                            color: isSelected ? C.hi : C.mid,
                          }}
                        >
                          {subj.name}
                        </span>
                        {subj.code && (
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 10,
                              fontWeight: 700,
                              color: C.cyan,
                              background: "rgba(63,216,200,0.12)",
                              border: "1px solid rgba(63,216,200,0.3)",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {subj.code}
                          </span>
                        )}
                        {alreadyAssigned && (
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 9.5,
                              color: C.cyan,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <CheckCircle2 size={11} /> CURRENTLY ASSIGNED
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {subj.credits_or_hours ? (
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 11,
                              color: C.low,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock size={11} /> {subj.credits_or_hours} hrs
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {subj.description && (
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontFamily: sans,
                          fontSize: 12,
                          color: C.low,
                          lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {subj.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontFamily: mono,
                        fontSize: 10.5,
                        color: C.low,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <FlaskConical size={11} color={C.amber} /> {subj.lab_count ?? 0} Labs
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <BookOpen size={11} color={C.cyan} /> {subj.module_count ?? 0} Modules
                      </span>
                      {subj.course_name && (
                        <span>
                          Class: <strong style={{ color: C.mid }}>{subj.course_name}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.panel,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>
            {selectedSubjectIds.length} {selectedSubjectIds.length === 1 ? "subject" : "subjects"} selected
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Btn>
            <Btn
              icon={saving ? Loader2 : Check}
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: 140 }}
            >
              {saving ? "Saving..." : "Save Assignments"}
            </Btn>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalZoom { from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

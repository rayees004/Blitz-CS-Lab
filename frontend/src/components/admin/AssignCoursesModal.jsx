import React, { useState, useEffect } from "react";
import {
  X, BookOpen, Check, CheckSquare, Square, Search,
  Loader2, AlertCircle, Sparkles, Shield, CheckCircle2,
  Clock, DollarSign
} from "lucide-react";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchCourses, assignStudentCourses } from "../../api/courses";

const AVATAR_COLORS = ["#B87A15", "#1A7A6E", "#6B4FBB", "#1A5E8A", "#8A3A3A"];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const FEE_OPTIONS = ["DUE", "PAID", "PARTIAL"];

export default function AssignCoursesModal({ student, onClose, onUpdated }) {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [defaultFeeStatus, setDefaultFeeStatus] = useState("DUE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Initialize selected courses from student's enrolled_courses
  useEffect(() => {
    const initialIds = (student?.enrolled_courses || []).map((c) => c.id);
    setSelectedCourseIds(initialIds);
  }, [student]);

  // Load all active platform courses
  useEffect(() => {
    let mounted = true;
    setLoadingCourses(true);
    fetchCourses()
      .then((res) => {
        if (mounted) {
          setCourses(res.results || []);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load courses.");
      })
      .finally(() => {
        if (mounted) setLoadingCourses(false);
      });
    return () => { mounted = false; };
  }, []);

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCourseIds(courses.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCourseIds([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await assignStudentCourses(student.id, selectedCourseIds, defaultFeeStatus, true);
      if (onUpdated) {
        onUpdated(res.student);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update course assignments.");
    } finally {
      setSaving(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
          backdropFilter: "blur(4px)",
          zIndex: 1100,
        }}
      />

      {/* Modal Container */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 540,
          maxWidth: "92vw",
          maxHeight: "88vh",
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          zIndex: 1101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          animation: "modalFadeIn 160ms cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            background: C.panel2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: mono,
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, margin: 0 }}>
                  Assign Courses
                </h3>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10.5,
                    color: C.amber,
                    background: "rgba(245, 166, 35, 0.1)",
                    border: `1px solid rgba(245, 166, 35, 0.25)`,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {selectedCourseIds.length} Selected
                </span>
              </div>
              <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginTop: 2 }}>
                {studentName} <span style={{ color: C.low, fontFamily: mono }}>({student?.email || `@${student?.username}`})</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: C.panel3,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              cursor: "pointer",
              color: C.mid,
              padding: 6,
              display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Notice Info Box */}
        <div
          style={{
            padding: "10px 24px",
            background: "rgba(63, 216, 200, 0.05)",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 9,
            fontSize: 12,
            fontFamily: sans,
            color: C.mid,
          }}
        >
          <Shield size={14} color={C.cyan} style={{ flexShrink: 0 }} />
          <span>
            Students can <strong style={{ color: C.hi }}>only attend labs</strong> belonging to their assigned courses. Other labs will remain locked.
          </span>
        </div>

        {/* Body content */}
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div
              style={{
                display: "flex",
                gap: 8,
                background: "rgba(229,83,75,0.1)",
                border: "1px solid rgba(229,83,75,0.3)",
                borderRadius: 7,
                padding: "9px 12px",
                marginBottom: 14,
                color: "#fca5a5",
                fontSize: 12,
                fontFamily: sans,
                alignItems: "center",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Search bar & quick select */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "7px 10px",
              }}
            >
              <Search size={13} color={C.low} />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "7px 10px",
                fontFamily: mono,
                fontSize: 11,
                color: C.mid,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Select All
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "7px 10px",
                fontFamily: mono,
                fontSize: 11,
                color: C.low,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </button>
          </div>

          {/* Fee Status Option for newly assigned courses */}
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em" }}>
              DEFAULT FEE STATUS FOR NEW ASSIGNMENTS:
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {FEE_OPTIONS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDefaultFeeStatus(st)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: `1px solid ${defaultFeeStatus === st ? (st === "PAID" ? C.cyan : st === "DUE" ? C.danger : C.amber) : C.border}`,
                    background: defaultFeeStatus === st ? "rgba(255,255,255,0.06)" : C.panel2,
                    color: defaultFeeStatus === st ? (st === "PAID" ? C.cyan : st === "DUE" ? C.danger : C.amber) : C.low,
                    fontFamily: mono,
                    fontSize: 10.5,
                    cursor: "pointer",
                    fontWeight: defaultFeeStatus === st ? 700 : 400,
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Course Checklist */}
          {loadingCourses ? (
            <div style={{ padding: 40, textAlign: "center", color: C.mid, fontFamily: sans }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
              <div>Loading available courses...</div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: C.low,
                fontFamily: sans,
                background: C.panel2,
                borderRadius: 8,
                border: `1px dashed ${C.border}`,
              }}
            >
              {searchQuery ? `No courses match "${searchQuery}".` : "No active courses available."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredCourses.map((course) => {
                const isSelected = selectedCourseIds.includes(course.id);
                const existingEnrollment = (student?.enrolled_courses || []).find(
                  (ec) => ec.id === course.id
                );

                return (
                  <div
                    key={course.id}
                    onClick={() => toggleCourse(course.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? C.amber : C.border}`,
                      background: isSelected ? "rgba(240, 180, 41, 0.06)" : C.panel2,
                      cursor: "pointer",
                      transition: "all 120ms ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ color: isSelected ? C.amber : C.low, display: "flex", flexShrink: 0 }}>
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: isSelected ? C.hi : C.mid }}>
                          {course.name}
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, marginTop: 2, display: "flex", gap: 8 }}>
                          <span>{course.duration_weeks || 8} weeks</span>
                          <span>·</span>
                          <span>₹{Number(course.price || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {existingEnrollment ? (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: existingEnrollment.is_on_hold
                              ? "rgba(229,83,75,0.12)"
                              : "rgba(63,216,200,0.12)",
                            color: existingEnrollment.is_on_hold ? C.danger : C.cyan,
                            border: `1px solid ${existingEnrollment.is_on_hold ? "rgba(229,83,75,0.3)" : "rgba(63,216,200,0.3)"}`,
                          }}
                        >
                          {existingEnrollment.is_on_hold ? "ON HOLD" : `ACTIVE (${existingEnrollment.fee_status})`}
                        </span>
                      ) : isSelected ? (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10,
                            color: C.amber,
                            background: "rgba(240,180,41,0.1)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          NEW ({defaultFeeStatus})
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.panel2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
            {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? "s" : ""} will be assigned
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Btn>
            <Btn
              icon={saving ? Loader2 : Check}
              onClick={handleSave}
              disabled={saving || loadingCourses}
              style={{ minWidth: 140 }}
            >
              {saving ? "Saving..." : "Save Assignments"}
            </Btn>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.97); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}

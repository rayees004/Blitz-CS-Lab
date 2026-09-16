import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, BookOpen, Layers, Clock, Award,
  Loader2, AlertCircle, CheckCircle, RefreshCw, Trash2, Edit2,
  Bookmark, GraduationCap, Filter, BookMarked, ChevronDown
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from "../../api/subjects";
import { fetchCourses } from "../../api/courses";

/* ── Form helpers ────────────────────────────────────────── */
const formField = (label, children, required) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 5, display: "flex", gap: 4 }}>
      {label}{required && <span style={{ color: C.amber }}>*</span>}
    </div>
    {children}
  </div>
);

const inputStyle = (err) => ({
  width: "100%", boxSizing: "border-box",
  border: `1px solid ${err ? C.danger : C.border}`,
  borderRadius: 7, background: C.panel2,
  padding: "9px 12px", fontFamily: mono, fontSize: 12.5, color: C.hi, outline: "none",
  transition: "border-color 120ms",
});

const selectStyle = (err) => ({
  ...inputStyle(err),
  fontFamily: sans,
  appearance: "none",
  cursor: "pointer",
});

const textareaStyle = {
  ...inputStyle(false),
  resize: "vertical",
  minHeight: 80,
  fontFamily: sans,
  fontSize: 12.5,
  lineHeight: 1.5,
};

/* ── Add / Edit Subject Drawer ───────────────────────────── */
const EMPTY_SUBJECT = {
  name: "",
  code: "",
  course_id: "",
  credits_or_hours: "30",
  description: "",
};

function SubjectDrawer({ subject, courses, onClose, onSaved }) {
  const isEdit = Boolean(subject);
  const [form, setForm] = useState(() => {
    if (subject) {
      return {
        name: subject.name || "",
        code: subject.code || "",
        course_id: subject.course ? String(subject.course) : "",
        credits_or_hours: String(subject.credits_or_hours || 30),
        description: subject.description || "",
      };
    }
    return EMPTY_SUBJECT;
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Subject name is required";
    if (!form.credits_or_hours || Number(form.credits_or_hours) <= 0) {
      e.credits_or_hours = "Hours must be greater than 0";
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setGlobalError("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        course_id: form.course_id ? parseInt(form.course_id, 10) : null,
        credits_or_hours: parseInt(form.credits_or_hours, 10) || 30,
        description: form.description.trim(),
      };

      let result;
      if (isEdit) {
        result = await updateSubject(subject.id, payload);
      } else {
        result = await createSubject(payload);
      }
      onSaved(result.subject || result);
    } catch (err) {
      setGlobalError(err.message || "Failed to save subject. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          zIndex: 40, backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 460,
        background: C.panel, borderLeft: `1px solid ${C.borderLight}`,
        zIndex: 50, display: "flex", flexDirection: "column",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.7)",
        animation: "slideIn 180ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, display: "flex", alignItems: "center", gap: 8 }}>
              <BookMarked size={18} color={C.amber} />
              {isEdit ? "Edit Subject" : "Add New Subject"}
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginTop: 2 }}>
              {isEdit ? "Update subject details and assigned course" : "Create a curriculum subject and link to a course"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.low, display: "flex", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>
          {globalError && (
            <div style={{
              background: "rgba(255,68,68,0.1)", border: `1px solid ${C.danger}`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 18,
              display: "flex", gap: 9, alignItems: "flex-start",
            }}>
              <AlertCircle size={15} color={C.danger} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontFamily: sans, fontSize: 12.5, color: C.danger }}>{globalError}</div>
            </div>
          )}

          {formField("Subject Name", (
            <>
              <input
                type="text"
                placeholder="e.g. Network Vulnerability Assessment & Protocol Analysis"
                value={form.name}
                onChange={set("name")}
                style={inputStyle(errors.name)}
                autoFocus
              />
              {errors.name && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{errors.name}</div>}
            </>
          ), true)}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {formField("Subject Code", (
              <>
                <input
                  type="text"
                  placeholder="e.g. NVA-301"
                  value={form.code}
                  onChange={set("code")}
                  style={{ ...inputStyle(false), textTransform: "uppercase" }}
                />
              </>
            ))}

            {formField("Study / Credit Hours", (
              <>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={form.credits_or_hours}
                    onChange={set("credits_or_hours")}
                    style={{ ...inputStyle(errors.credits_or_hours), paddingRight: 32 }}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: mono, fontSize: 11, color: C.low }}>hrs</span>
                </div>
                {errors.credits_or_hours && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{errors.credits_or_hours}</div>}
              </>
            ), true)}
          </div>

          {formField("Assigned Class / Course", (
            <div style={{ position: "relative" }}>
              <select
                value={form.course_id}
                onChange={set("course_id")}
                style={{ ...selectStyle(false), paddingRight: 32 }}
              >
                <option value="">General / Standalone Subject</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} color={C.low} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          ))}

          {formField("Description / Syllabus Summary", (
            <textarea
              placeholder="Provide a summary of concepts covered in this subject, topics, prerequisites, and learning objectives..."
              value={form.description}
              onChange={set("description")}
              style={textareaStyle}
            />
          ))}

          <div style={{
            background: "rgba(0,180,216,0.06)", border: `1px solid rgba(0,180,216,0.2)`,
            borderRadius: 8, padding: "12px 14px", marginTop: 6,
          }}>
            <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.accentCyan, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <GraduationCap size={14} /> Curriculum Integration
            </div>
            <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, lineHeight: 1.45 }}>
              Subjects group related curriculum modules and lab assignments. Students enrolled in the assigned course will have access to all modules under this subject.
            </div>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: "16px 24px", borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 10, flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: "9px 0", background: "none", border: `1px solid ${C.border}`,
              borderRadius: 7, color: C.mid, fontFamily: sans, fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 2, padding: "9px 0", background: C.amber, border: "none",
              borderRadius: 7, color: "#1A1200", fontFamily: sans, fontSize: 13,
              fontWeight: 700, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                <span>{isEdit ? "Updating..." : "Adding Subject..."}</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>{isEdit ? "Save Changes" : "Add Subject"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [drawerState, setDrawerState] = useState(null); // null | { mode: 'add' } | { mode: 'edit', subject }
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, tone = "success") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subsData, coursesData] = await Promise.all([
        fetchSubjects(),
        fetchCourses(),
      ]);
      setSubjects(subsData.results || []);
      setCourses(coursesData.results || []);
    } catch (err) {
      showToast(err.message || "Failed to load subjects data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaved = (savedSubject) => {
    setDrawerState(null);
    showToast(
      drawerState?.mode === "edit"
        ? `Subject "${savedSubject.name}" updated successfully.`
        : `Subject "${savedSubject.name}" added successfully.`
    );
    loadData();
  };

  const handleDelete = async (e, subject) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete subject "${subject.name}"?`)) return;

    setDeletingId(subject.id);
    try {
      await deleteSubject(subject.id);
      showToast(`Subject "${subject.name}" removed.`);
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
    } catch (err) {
      showToast(err.message || "Failed to delete subject", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtering
  const filtered = subjects.filter(s => {
    const q = search.toLowerCase();
    const matchesQuery =
      s.name.toLowerCase().includes(q) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.course_name && s.course_name.toLowerCase().includes(q));

    const matchesCourse =
      selectedCourseFilter === "ALL" ||
      (selectedCourseFilter === "NONE" && !s.course) ||
      String(s.course) === selectedCourseFilter;

    return matchesQuery && matchesCourse;
  });

  const totalHours = subjects.reduce((acc, s) => acc + (s.credits_or_hours || 0), 0);
  const coursesCovered = new Set(subjects.filter(s => s.course).map(s => s.course)).size;

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: toast.tone === "error" ? "#381212" : "#122a18",
          border: `1px solid ${toast.tone === "error" ? C.danger : C.accentGreen}`,
          borderRadius: 8, padding: "11px 18px",
          display: "flex", alignItems: "center", gap: 9,
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          fontFamily: sans, fontSize: 13, color: C.hi,
          animation: "fadeUp 200ms ease",
        }}>
          {toast.tone === "error" ? <AlertCircle size={16} color={C.danger} /> : <CheckCircle size={16} color={C.accentGreen} />}
          {toast.msg}
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Subjects & Curriculum</h1>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.low, marginTop: 4 }}>
            Organize core curriculum subjects, academic hours, and course syllabus structures
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={loadData}
            title="Refresh"
            style={{
              background: C.panel, border: `1px solid ${C.border}`, borderRadius: 7,
              padding: "8px 12px", color: C.mid, cursor: "pointer", display: "flex",
              alignItems: "center", gap: 6, fontFamily: sans, fontSize: 12.5,
            }}
          >
            <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
            Refresh
          </button>
          <Btn icon={Plus} onClick={() => setDrawerState({ mode: "add" })}>Add Subject</Btn>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 22 }}>
        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Subjects</span>
            <BookMarked size={16} color={C.amber} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.hi, marginTop: 8 }}>
            {subjects.length}
          </div>
        </Panel>

        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Classes Covered</span>
            <Layers size={16} color={C.accentCyan} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.hi, marginTop: 8 }}>
            {coursesCovered}
          </div>
        </Panel>

        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Hours</span>
            <Clock size={16} color={C.accentGreen} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.hi, marginTop: 8 }}>
            {totalHours}h
          </div>
        </Panel>

        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Avg Duration</span>
            <Award size={16} color={C.amber} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.hi, marginTop: 8 }}>
            {subjects.length > 0 ? Math.round(totalHours / subjects.length) : 0}h
          </div>
        </Panel>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 260, maxWidth: 360, position: "relative" }}>
          <Search size={14} color={C.low} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              ...inputStyle(false),
              paddingLeft: 33,
              fontSize: 12.5,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.low, cursor: "pointer", display: "flex", padding: 0 }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter by Course */}
        <div style={{ position: "relative", minWidth: 220 }}>
          <select
            value={selectedCourseFilter}
            onChange={e => setSelectedCourseFilter(e.target.value)}
            style={{
              ...inputStyle(false),
              paddingRight: 32,
              fontFamily: sans,
              fontSize: 12.5,
              cursor: "pointer",
              background: C.panel,
            }}
          >
            <option value="ALL">All Classes / Courses</option>
            <option value="NONE">Standalone / Unassigned</option>
            {courses.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <Filter size={13} color={C.low} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>

        <div style={{ fontFamily: mono, fontSize: 12, color: C.low, marginLeft: "auto" }}>
          Showing {filtered.length} of {subjects.length} subjects
        </div>
      </div>

      {/* Content Area */}
      {loading && subjects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.mid, fontFamily: sans }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <div>Loading subjects...</div>
        </div>
      ) : filtered.length === 0 ? (
        <Panel style={{ padding: "50px 20px", textAlign: "center", marginTop: 18 }}>
          <BookMarked size={36} color={C.low} style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: C.hi, marginBottom: 6 }}>
            {search || selectedCourseFilter !== "ALL" ? "No subjects match your filter" : "No subjects added yet"}
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.low, marginBottom: 16 }}>
            {search || selectedCourseFilter !== "ALL"
              ? "Try adjusting your search keywords or course filter"
              : "Get started by adding your first subject to the curriculum."}
          </div>
          {!search && selectedCourseFilter === "ALL" && (
            <Btn icon={Plus} onClick={() => setDrawerState({ mode: "add" })}>Add First Subject</Btn>
          )}
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16, marginTop: 18 }}>
          {filtered.map((s) => {
            const isDeleting = deletingId === s.id;
            return (
              <Panel
                key={s.id}
                style={{
                  padding: 20,
                  border: `1px solid ${C.border}`,
                  transition: "all 150ms ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.amber;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  {/* Top tags & actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {s.code && (
                        <Badge tone="cyan">{s.code}</Badge>
                      )}
                      <Badge tone="warn">{s.credits_or_hours} Hours</Badge>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        title="Edit Subject"
                        onClick={() => setDrawerState({ mode: "edit", subject: s })}
                        style={{
                          background: "none", border: "none", color: C.low, cursor: "pointer",
                          padding: 4, display: "flex", borderRadius: 4,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = C.amber}
                        onMouseLeave={e => e.currentTarget.style.color = C.low}
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        title="Delete Subject"
                        disabled={isDeleting}
                        onClick={(e) => handleDelete(e, s)}
                        style={{
                          background: "none", border: "none", color: C.low, cursor: isDeleting ? "wait" : "pointer",
                          padding: 4, display: "flex", borderRadius: 4,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = C.danger}
                        onMouseLeave={e => e.currentTarget.style.color = C.low}
                      >
                        {isDeleting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ fontFamily: sans, fontSize: 15.5, fontWeight: 700, color: C.hi, marginTop: 12 }}>
                    {s.name}
                  </div>

                  {/* Course tag */}
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Layers size={12} color={C.amber} />
                    <span style={{ fontFamily: sans, fontSize: 12, color: s.course_name ? C.amber : C.low, fontWeight: 600 }}>
                      {s.course_name ? s.course_name : "General / Standalone Subject"}
                    </span>
                  </div>

                  {/* Description */}
                  <div style={{
                    fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 8,
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: 36,
                  }}>
                    {s.description || "No curriculum description provided for this subject."}
                  </div>
                </div>

                {/* Bottom stats row */}
                <div style={{
                  marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <BookOpen size={13} color={C.low} />
                    <span style={{ fontFamily: mono, fontSize: 12, color: C.mid }}>
                      {s.module_count || 0} modules
                    </span>
                  </div>

                  <button
                    onClick={() => setDrawerState({ mode: "edit", subject: s })}
                    style={{
                      background: "none", border: "none", color: C.amber,
                      fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Edit Details →
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Drawer */}
      {drawerState && (
        <SubjectDrawer
          subject={drawerState.subject}
          courses={courses}
          onClose={() => setDrawerState(null)}
          onSaved={handleSaved}
        />
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

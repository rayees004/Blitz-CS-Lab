import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, BookOpen, Layers, Users, Clock, DollarSign,
  Loader2, AlertCircle, CheckCircle, RefreshCw, Trash2, ArrowRight,
  Sparkles, ExternalLink
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchCourses, createCourse, deleteCourse } from "../../api/courses";
import ClassDetailPanel from "./ClassDetailPanel";

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

const textareaStyle = {
  ...inputStyle(false),
  resize: "vertical",
  minHeight: 80,
  fontFamily: sans,
  fontSize: 12.5,
  lineHeight: 1.5,
};

/* ── Add Class Drawer ────────────────────────────────────── */
const EMPTY_CLASS = {
  name: "",
  description: "",
  price: "299.00",
  duration_weeks: "8",
};

function AddClassDrawer({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_CLASS);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Class name is required";
    if (!form.duration_weeks || Number(form.duration_weeks) <= 0) e.duration_weeks = "Duration must be greater than 0";
    if (form.price === "" || Number(form.price) < 0) e.price = "Price must be 0 or greater";
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
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        duration_weeks: parseInt(form.duration_weeks, 10) || 8,
      };
      const res = await createCourse(payload);
      onCreated(res.course);
    } catch (err) {
      setGlobalError(err.message || "Failed to create class. Please try again.");
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
        position: "fixed", top: 0, right: 0, bottom: 0, width: 440,
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
              <BookOpen size={18} color={C.amber} /> Create New Class
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginTop: 2 }}>
              Add a course/batch to your curriculum
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

          {formField("Class / Course Name", (
            <>
              <input
                type="text"
                placeholder="e.g. Advanced Penetration Testing & Red Teaming"
                value={form.name}
                onChange={set("name")}
                style={inputStyle(errors.name)}
                autoFocus
              />
              {errors.name && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{errors.name}</div>}
            </>
          ), true)}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {formField("Duration (Weeks)", (
              <>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="8"
                    value={form.duration_weeks}
                    onChange={set("duration_weeks")}
                    style={{ ...inputStyle(errors.duration_weeks), paddingRight: 32 }}
                  />
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: mono, fontSize: 11, color: C.low }}>wks</span>
                </div>
                {errors.duration_weeks && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{errors.duration_weeks}</div>}
              </>
            ), true)}

            {formField("Price ($)", (
              <>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="299.00"
                    value={form.price}
                    onChange={set("price")}
                    style={{ ...inputStyle(errors.price), paddingLeft: 26 }}
                  />
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: mono, fontSize: 12, color: C.low }}>$</span>
                </div>
                {errors.price && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{errors.price}</div>}
              </>
            ), true)}
          </div>

          {formField("Description", (
            <textarea
              placeholder="Outline the course objectives, target audience, and key learning outcomes..."
              value={form.description}
              onChange={set("description")}
              style={textareaStyle}
            />
          ))}

          <div style={{
            background: "rgba(245,158,11,0.06)", border: `1px solid rgba(245,158,11,0.2)`,
            borderRadius: 8, padding: "12px 14px", marginTop: 8,
          }}>
            <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.amber, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} /> Add Modules Next
            </div>
            <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, lineHeight: 1.45 }}>
              Once created, the Class Detail panel will open immediately so you can add curriculum modules, chapters, and topics.
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
                <span>Creating Class...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Create & Add Modules</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Main Component ──────────────────────────────────────── */
export default function AdminClasses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, tone = "success") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCourses();
      setCourses(data.results || []);
    } catch (err) {
      showToast(err.message || "Failed to load classes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleCreated = (newCourse) => {
    setShowAddDrawer(false);
    showToast(`Class "${newCourse.name}" created successfully! Now you can add modules.`);
    loadCourses();
    setSelectedCourse(newCourse);
  };

  const handleDelete = async (e, course) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to deactivate "${course.name}"?`)) return;

    setDeletingId(course.id);
    try {
      await deleteCourse(course.id);
      showToast(`Class "${course.name}" deactivated.`);
      setCourses(cs => cs.filter(c => c.id !== course.id));
      if (selectedCourse?.id === course.id) {
        setSelectedCourse(null);
      }
    } catch (err) {
      showToast(err.message || "Failed to deactivate class", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
  });

  const totalModules = courses.reduce((acc, c) => acc + (c.module_count || 0), 0);
  const totalEnrolled = courses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Toast */}
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
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Classes & Curricula</h1>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.low, marginTop: 4 }}>
            Create classes, organize curriculum modules, and manage course offerings
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={loadCourses}
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
          <Btn icon={Plus} onClick={() => setShowAddDrawer(true)}>Create Class</Btn>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Active Classes</span>
            <BookOpen size={16} color={C.amber} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.hi, marginTop: 8 }}>
            {courses.length}
          </div>
        </Panel>

        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Modules</span>
            <Layers size={16} color={C.accentCyan} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.hi, marginTop: 8 }}>
            {totalModules}
          </div>
        </Panel>

        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Enrollments</span>
            <Users size={16} color={C.accentGreen} />
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: C.hi, marginTop: 8 }}>
            {totalEnrolled}
          </div>
        </Panel>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{
          flex: 1, maxWidth: 360, position: "relative",
        }}>
          <Search size={14} color={C.low} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search classes by name or topic..."
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
        <div style={{ fontFamily: mono, fontSize: 12, color: C.low }}>
          Showing {filtered.length} of {courses.length} classes
        </div>
      </div>

      {/* Grid of Classes */}
      {loading && courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.mid, fontFamily: sans }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <div>Loading classes...</div>
        </div>
      ) : filtered.length === 0 ? (
        <Panel style={{ padding: "50px 20px", textAlign: "center", marginTop: 18 }}>
          <BookOpen size={36} color={C.low} style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: C.hi, marginBottom: 6 }}>
            {search ? "No classes match your search" : "No classes created yet"}
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.low, marginBottom: 16 }}>
            {search ? "Try searching for a different keyword" : "Get started by creating your first class and adding modules to it."}
          </div>
          {!search && (
            <Btn icon={Plus} onClick={() => setShowAddDrawer(true)}>Create First Class</Btn>
          )}
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16, marginTop: 18 }}>
          {filtered.map((c) => {
            const isDeleting = deletingId === c.id;
            return (
              <Panel
                key={c.id}
                onClick={() => setSelectedCourse(c)}
                style={{
                  padding: 20,
                  cursor: "pointer",
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
                  {/* Top tags & delete */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge tone="warn">{c.duration_weeks} Weeks</Badge>
                      <Badge tone="cyan">${parseFloat(c.price).toFixed(2)}</Badge>
                    </div>
                    <button
                      title="Deactivate class"
                      disabled={isDeleting}
                      onClick={(e) => handleDelete(e, c)}
                      style={{
                        background: "none", border: "none", color: C.low, cursor: isDeleting ? "wait" : "pointer",
                        padding: 3, display: "flex", borderRadius: 4,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = C.danger}
                      onMouseLeave={e => e.currentTarget.style.color = C.low}
                    >
                      {isDeleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
                    </button>
                  </div>

                  {/* Title */}
                  <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, marginTop: 12 }}>
                    {c.name}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 6,
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: 36,
                  }}>
                    {c.description || "No description provided."}
                  </div>
                </div>

                {/* Bottom stats & action */}
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Layers size={13} color={C.amber} />
                      <span style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 600, color: C.hi }}>{c.module_count || 0}</span>
                      <span style={{ fontFamily: sans, fontSize: 11, color: C.low }}>modules</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={13} color={C.accentGreen} />
                      <span style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 600, color: C.hi }}>{c.enrolled_count || 0}</span>
                      <span style={{ fontFamily: sans, fontSize: 11, color: C.low }}>students</span>
                    </div>
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.amber,
                  }}>
                    <span>Manage Modules</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Add Class Drawer */}
      {showAddDrawer && (
        <AddClassDrawer
          onClose={() => setShowAddDrawer(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Class Detail & Module Management Panel */}
      {selectedCourse && (
        <ClassDetailPanel
          course={selectedCourse}
          onClose={() => {
            setSelectedCourse(null);
            loadCourses(); // refresh module counts
          }}
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

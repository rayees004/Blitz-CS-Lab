import React, { useState, useEffect, useCallback } from "react";
import {
  X, BookOpen, Plus, AlertCircle, Loader2, CheckCircle,
  Trash2, GripVertical, Edit2, Clock, DollarSign,
  Users, Layers, ChevronRight, Save, BookMarked
} from "lucide-react";
import { C, sans, mono } from "../../constants/theme";
import { fetchModules, createModule, updateModule, deleteModule } from "../../api/courses";
import { fetchCourseSubjects } from "../../api/subjects";

/* ── helpers ──────────────────────────────────────────── */
const inputStyle = (err) => ({
  width: "100%", boxSizing: "border-box",
  border: `1px solid ${err ? C.danger : C.border}`,
  borderRadius: 7, background: C.panel2,
  padding: "8px 11px", fontFamily: mono, fontSize: 12.5, color: C.hi, outline: "none",
  transition: "border-color 120ms",
});

const textareaStyle = {
  ...inputStyle(false),
  resize: "vertical",
  minHeight: 68,
  fontFamily: sans,
  fontSize: 12.5,
  lineHeight: 1.5,
};

/* ── Module Row ───────────────────────────────────────── */
function ModuleRow({ module, index, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: module.title, description: module.description, duration_hours: module.duration_hours });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await updateModule(module.id, form);
      onUpdate(res.module);
      setEditing(false);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteModule(module.id);
      onDelete(module.id);
    } catch { /* silent */ }
    finally { setDeleting(false); }
  };

  return (
    <div style={{
      background: editing ? C.panel2 : "transparent",
      border: `1px solid ${editing ? C.borderLight : C.border}`,
      borderRadius: 8,
      marginBottom: 8,
      overflow: "hidden",
      transition: "all 150ms",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
        <div style={{ color: C.low, flexShrink: 0 }}><GripVertical size={14} /></div>

        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: C.panel3, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: mono, fontSize: 10, color: C.amber, flexShrink: 0,
        }}>
          {String(index + 1).padStart(2, "0")}
        </div>

        {editing ? (
          <input
            autoFocus
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ ...inputStyle(false), flex: 1, padding: "5px 9px", fontSize: 12.5 }}
          />
        ) : (
          <span style={{ flex: 1, fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>{module.title}</span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} />{module.duration_hours}h
          </div>

          {editing ? (
            <>
              <button onClick={save} disabled={saving} style={{ background: C.amber, border: "none", borderRadius: 5, padding: "5px 10px", color: "#1A1200", fontFamily: sans, fontSize: 11.5, fontWeight: 600, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                {saving ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={11} />} Save
              </button>
              <button onClick={() => { setEditing(false); setForm({ title: module.title, description: module.description, duration_hours: module.duration_hours }); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 8px", color: C.mid, fontFamily: sans, fontSize: 11.5, cursor: "pointer" }}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 7px", color: C.low, cursor: "pointer", display: "flex" }}>
                <Edit2 size={11} />
              </button>
              <button onClick={remove} disabled={deleting} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "5px 7px", color: C.low, cursor: deleting ? "wait" : "pointer", display: "flex" }}>
                {deleting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded edit fields */}
      {editing && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, paddingTop: 12 }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginBottom: 5 }}>Description</div>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What will students learn in this module?"
                style={textareaStyle}
              />
            </div>
            <div>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginBottom: 5 }}>Duration (hours)</div>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.duration_hours}
                onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))}
                style={inputStyle(false)}
              />
            </div>
          </div>
          {module.description && !editing && (
            <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginTop: 6 }}>{module.description}</div>
          )}
        </div>
      )}

      {/* Show description in read mode if exists */}
      {!editing && module.description && (
        <div style={{ padding: "0 14px 11px 46px", fontFamily: sans, fontSize: 11.5, color: C.low, lineHeight: 1.5 }}>
          {module.description}
        </div>
      )}
    </div>
  );
}

/* ── Add Module Form ──────────────────────────────────── */
function AddModuleForm({ courseId, nextOrder, onAdded, onCancel }) {
  const [form, setForm] = useState({ title: "", description: "", duration_hours: "1.5" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Module title is required."); return; }
    setLoading(true); setError("");
    try {
      const res = await createModule(courseId, { ...form, order: nextOrder });
      onAdded(res.module);
    } catch (err) {
      setError(err.message || "Failed to add module.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.borderLight}`,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      animation: "fadeUp 150ms ease",
    }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.amber, letterSpacing: "0.06em", marginBottom: 12 }}>
        ADD MODULE #{String(nextOrder).padStart(2, "0")}
      </div>

      {error && (
        <div style={{ display: "flex", gap: 7, color: "#fca5a5", fontSize: 12, fontFamily: sans, marginBottom: 10, alignItems: "center" }}>
          <AlertCircle size={13} />{error}
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>Module Title *</div>
          <input
            autoFocus
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Introduction to SQL Injection"
            style={inputStyle(false)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>Description</div>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What will students learn in this module?"
              style={textareaStyle}
            />
          </div>
          <div>
            <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>Duration (hrs)</div>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={form.duration_hours}
              onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))}
              style={inputStyle(false)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button" onClick={onCancel}
            style={{ flex: 1, padding: "8px", background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.mid, fontFamily: sans, fontSize: 12.5, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            style={{ flex: 2, padding: "8px", background: C.amber, border: "none", borderRadius: 6, color: "#1A1200", fontFamily: sans, fontSize: 12.5, fontWeight: 600, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {loading ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Adding...</> : <><Plus size={13} /> Add Module</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Main Panel ───────────────────────────────────────── */
export default function ClassDetailPanel({ course, onClose }) {
  const [modules, setModules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const totalHours = modules.reduce((sum, m) => sum + parseFloat(m.duration_hours || 0), 0);

  const loadModules = useCallback(async () => {
    if (!course?.id) return;
    setLoading(true); setError("");
    try {
      const [modulesData, subjectsData] = await Promise.all([
        fetchModules(course.id),
        fetchCourseSubjects(course.id).catch(() => ({ results: [] })),
      ]);
      setModules(modulesData.results || []);
      setSubjects(subjectsData.results || []);
    } catch (err) {
      setError(err.message || "Failed to load modules.");
    } finally {
      setLoading(false);
    }
  }, [course?.id]);

  useEffect(() => { loadModules(); }, [loadModules]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleAdded = (m) => { setModules(prev => [...prev, m]); setShowAddForm(false); };
  const handleUpdate = (updated) => setModules(prev => prev.map(m => m.id === updated.id ? updated : m));
  const handleDelete = (id) => setModules(prev => prev.filter(m => m.id !== id));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", zIndex: 900 }} />

      <div style={{
        position: "fixed", top: 0, right: 0, width: 540, height: "100vh",
        background: C.void, borderLeft: `1px solid ${C.border}`,
        zIndex: 901, display: "flex", flexDirection: "column",
        boxShadow: "-16px 0 60px rgba(0,0,0,0.55)",
        animation: "slideIn 200ms ease",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 22px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.06em", marginBottom: 4 }}>
                CLASS DETAIL
              </div>
              <h2 style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
                {course.name}
              </h2>
              {course.description && (
                <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, lineHeight: 1.5, maxWidth: 420 }}>
                  {course.description}
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: C.panel3, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", color: C.mid, padding: 5, display: "flex", flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            {[
              { icon: Users, label: "Students", value: course.enrolled_count ?? 0 },
              { icon: Layers, label: "Modules", value: modules.length },
              { icon: Clock, label: "Total Hours", value: `${totalHours.toFixed(1)}h` },
              { icon: DollarSign, label: "Price", value: `₹${Number(course.price).toLocaleString("en-IN")}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                <Icon size={13} color={C.low} />
                <div>
                  <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.hi }}>{value}</div>
                  <div style={{ fontFamily: sans, fontSize: 10, color: C.low }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Subjects in this class */}
          {subjects.length > 0 && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 7 }}>
                Curriculum Subjects ({subjects.length})
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {subjects.map(s => (
                  <span key={s.id} style={{
                    background: C.panel2, border: `1px solid ${C.borderLight}`, borderRadius: 5,
                    padding: "3px 8px", fontFamily: sans, fontSize: 11.5, color: C.amber,
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}>
                    <BookMarked size={11} color={C.amber} />
                    {s.code ? <strong>{s.code}: </strong> : null}
                    {s.name}
                    <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>({s.credits_or_hours}h)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modules body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 0" }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>Curriculum Modules</div>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, marginTop: 2 }}>
                {loading ? "Loading..." : `${modules.length} module${modules.length !== 1 ? "s" : ""}`}
              </div>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                  background: C.panel, border: `1px solid ${C.borderLight}`, borderRadius: 7,
                  color: C.hi, fontFamily: sans, fontSize: 12, cursor: "pointer",
                }}
              >
                <Plus size={13} color={C.amber} /> Add Module
              </button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <AddModuleForm
              courseId={course.id}
              nextOrder={modules.length + 1}
              onAdded={handleAdded}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Error */}
          {error && (
            <div style={{ color: "#fca5a5", fontSize: 12, fontFamily: sans, marginBottom: 12, display: "flex", gap: 7, alignItems: "center" }}>
              <AlertCircle size={13} />{error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.low, fontFamily: sans, fontSize: 12, padding: "24px 0" }}>
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading modules...
            </div>
          )}

          {/* Empty state */}
          {!loading && modules.length === 0 && !showAddForm && (
            <div style={{
              background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 10,
              padding: "32px 20px", textAlign: "center",
            }}>
              <BookOpen size={28} color={C.low} style={{ marginBottom: 10 }} />
              <div style={{ fontFamily: sans, fontSize: 13, color: C.mid, marginBottom: 6 }}>No modules yet</div>
              <button
                onClick={() => setShowAddForm(true)}
                style={{ background: "none", border: "none", color: C.amber, fontFamily: sans, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}
              >
                Add the first module →
              </button>
            </div>
          )}

          {/* Module list */}
          {!loading && modules.map((m, i) => (
            <ModuleRow key={m.id} module={m} index={i} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: "100%", padding: "9px 0", background: "none", border: `1px solid ${C.border}`, borderRadius: 7, color: C.mid, fontFamily: sans, fontSize: 13, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

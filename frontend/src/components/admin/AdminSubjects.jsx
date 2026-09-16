import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, BookOpen, Layers, Clock, Award,
  Loader2, AlertCircle, CheckCircle, RefreshCw, Trash2, Edit2,
  Bookmark, GraduationCap, BookMarked, ChevronDown, Save,
  GripVertical, FileText, Sparkles
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchSubjectModules,
  createSubjectModule,
  updateModule,
  deleteModule,
} from "../../api/subjects";

/* ── Form styling helpers ─────────────────────────────────── */
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

/* ── Add / Edit Course Drawer (Standalone - No Class Connection) ── */
const EMPTY_COURSE = {
  name: "",
  code: "",
  credits_or_hours: "30",
  description: "",
};

function CourseDrawer({ course, onClose, onSaved }) {
  const isEdit = Boolean(course);
  const [form, setForm] = useState(() => {
    if (course) {
      return {
        name: course.name || "",
        code: course.code || "",
        credits_or_hours: String(course.credits_or_hours || 30),
        description: course.description || "",
      };
    }
    return EMPTY_COURSE;
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
    if (!form.name.trim()) e.name = "Course name is required";
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
        credits_or_hours: parseInt(form.credits_or_hours, 10) || 30,
        description: form.description.trim(),
      };

      let result;
      if (isEdit) {
        result = await updateSubject(course.id, payload);
      } else {
        result = await createSubject(payload);
      }
      onSaved(result.subject || result);
    } catch (err) {
      setGlobalError(err.message || "Failed to save course. Please try again.");
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
          zIndex: 900, backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 460,
        background: C.panel, borderLeft: `1px solid ${C.borderLight}`,
        zIndex: 901, display: "flex", flexDirection: "column",
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
              <BookOpen size={18} color={C.amber} />
              {isEdit ? "Edit Course Details" : "Add New Course"}
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginTop: 2 }}>
              {isEdit ? "Update course name, code, hours, and description" : "Create a standalone curriculum course with chapters & modules"}
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

          {formField("Course Name", (
            <>
              <input
                type="text"
                placeholder="e.g. AWS IAM Privilege Escalation & Cloud Security"
                value={form.name}
                onChange={set("name")}
                style={inputStyle(errors.name)}
                autoFocus
              />
              {errors.name && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{errors.name}</div>}
            </>
          ), true)}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {formField("Course Code", (
              <input
                type="text"
                placeholder="e.g. CLD-201"
                value={form.code}
                onChange={set("code")}
                style={{ ...inputStyle(false), textTransform: "uppercase" }}
              />
            ))}

            {formField("Estimated Duration", (
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

          {formField("Description", (
            <textarea
              placeholder="Outline concepts covered in this course, hands-on lab prerequisites, and learning objectives..."
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
              <Sparkles size={14} /> Modular Curriculum Structure
            </div>
            <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, lineHeight: 1.45 }}>
              Once created, you can directly add and organize chapters, sections, and hands-on modules inside this course.
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
                <span>{isEdit ? "Saving..." : "Creating Course..."}</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>{isEdit ? "Save Changes" : "Create Course"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Course Modules Drawer (View, Add, Edit & Delete Modules) ── */
function CourseModulesDrawer({ course, onClose, onModulesCountChanged }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // New module form state
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("2.0");
  const [newDescription, setNewDescription] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit module state: { [moduleId]: { title, duration_hours, description } }
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadModules = useCallback(async () => {
    if (!course?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchSubjectModules(course.id);
      const list = res.results || [];
      setModules(list);
      onModulesCountChanged?.(course.id, list.length);
    } catch (err) {
      setError(err.message || "Failed to load modules for this course.");
    } finally {
      setLoading(false);
    }
  }, [course?.id, onModulesCountChanged]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setAddError("Module title is required.");
      return;
    }

    setAddingModule(true);
    setAddError("");

    try {
      const res = await createSubjectModule(course.id, {
        title: newTitle.trim(),
        duration_hours: parseFloat(newDuration) || 1.0,
        description: newDescription.trim(),
        order: modules.length + 1,
      });

      const added = res.module;
      const updated = [...modules, added];
      setModules(updated);
      onModulesCountChanged?.(course.id, updated.length);

      // Reset form
      setNewTitle("");
      setNewDuration("2.0");
      setNewDescription("");
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.message || "Failed to add module. Please try again.");
    } finally {
      setAddingModule(false);
    }
  };

  const startEdit = (mod) => {
    setEditingId(mod.id);
    setEditForm({
      title: mod.title,
      duration_hours: mod.duration_hours,
      description: mod.description || "",
    });
  };

  const handleSaveEdit = async (modId) => {
    setSavingEdit(true);
    try {
      const res = await updateModule(modId, editForm);
      const updatedMod = res.module;
      setModules(prev => prev.map(m => m.id === modId ? updatedMod : m));
      setEditingId(null);
    } catch (err) {
      alert(err.message || "Failed to update module.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteModule = async (modId, modTitle) => {
    if (!window.confirm(`Are you sure you want to remove module "${modTitle}"?`)) return;
    setDeletingId(modId);
    try {
      await deleteModule(modId);
      const updated = modules.filter(m => m.id !== modId);
      setModules(updated);
      onModulesCountChanged?.(course.id, updated.length);
    } catch (err) {
      alert(err.message || "Failed to remove module.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalModuleHours = modules.reduce((acc, m) => acc + parseFloat(m.duration_hours || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          zIndex: 900, backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 540,
        background: C.void, borderLeft: `1px solid ${C.borderLight}`,
        zIndex: 901, display: "flex", flexDirection: "column",
        boxShadow: "-16px 0 50px rgba(0,0,0,0.8)",
        animation: "slideIn 200ms cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {course.code && <Badge tone="cyan">{course.code}</Badge>}
                <Badge tone="warn">{course.credits_or_hours}h Course</Badge>
              </div>
              <h2 style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
                {course.name}
              </h2>
              {course.description && (
                <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, lineHeight: 1.45, maxWidth: 440 }}>
                  {course.description}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                background: C.panel3, border: `1px solid ${C.border}`, borderRadius: 6,
                cursor: "pointer", color: C.mid, padding: 6, display: "flex", flexShrink: 0
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7, background: "rgba(245,158,11,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", color: C.amber
              }}>
                <Layers size={16} />
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.hi }}>
                  {modules.length}
                </div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>Curriculum Modules</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7, background: "rgba(56,189,248,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", color: C.accentCyan
              }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.hi }}>
                  {totalModuleHours.toFixed(1)}h
                </div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>Total Module Hours</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div style={{
          padding: "14px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.panel, flexShrink: 0,
        }}>
          <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
            Course Modules & Syllabus
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                background: C.amber, border: "none", borderRadius: 6,
                color: "#1A1200", fontFamily: sans, fontSize: 12, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> Add Module
            </button>
          )}
        </div>

        {/* Modules List / Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>
          {error && (
            <div style={{
              background: "rgba(255,68,68,0.1)", border: `1px solid ${C.danger}`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              display: "flex", gap: 8, color: C.danger, fontSize: 12.5, fontFamily: sans,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          {/* Add Module Form Panel */}
          {showAddForm && (
            <div style={{
              background: C.panel2, border: `1px solid ${C.borderLight}`,
              borderRadius: 9, padding: "16px 18px", marginBottom: 18,
              animation: "fadeUp 150ms ease",
            }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em", marginBottom: 12, fontWeight: 700 }}>
                ADD MODULE #{String(modules.length + 1).padStart(2, "0")}
              </div>

              {addError && (
                <div style={{ color: C.danger, fontSize: 11.5, fontFamily: sans, marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
                  <AlertCircle size={13} /> {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 4 }}>Module Title *</div>
                  <input
                    type="text"
                    placeholder="e.g. Exploiting Insecure Direct Object References (IDOR)"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    style={inputStyle(false)}
                    autoFocus
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 4 }}>Description / Topics</div>
                    <textarea
                      placeholder="Summary of topics, lab exercises, and practical objectives..."
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      style={{ ...textareaStyle, minHeight: 60 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 4 }}>Duration (hrs)</div>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={newDuration}
                      onChange={e => setNewDuration(e.target.value)}
                      style={inputStyle(false)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setAddError(""); }}
                    style={{
                      padding: "7px 14px", background: "none", border: `1px solid ${C.border}`,
                      borderRadius: 6, color: C.mid, fontFamily: sans, fontSize: 12, cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingModule}
                    style={{
                      padding: "7px 16px", background: C.amber, border: "none",
                      borderRadius: 6, color: "#1A1200", fontFamily: sans, fontSize: 12,
                      fontWeight: 700, cursor: addingModule ? "wait" : "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {addingModule ? (
                      <>
                        <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Add Module</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modules List View */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.mid, fontFamily: sans }}>
              <Loader2 size={22} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
              <div>Loading modules...</div>
            </div>
          ) : modules.length === 0 && !showAddForm ? (
            <div style={{
              textAlign: "center", padding: "48px 20px", border: `1px dashed ${C.border}`,
              borderRadius: 10, background: C.panel, marginTop: 8
            }}>
              <Layers size={34} color={C.low} style={{ marginBottom: 10 }} />
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: C.hi, marginBottom: 4 }}>
                No modules added yet
              </div>
              <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginBottom: 16, maxWidth: 320, margin: "0 auto 16px" }}>
                Break down this course into structured chapters, topics, and lab training exercises.
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: "8px 16px", background: C.amber, border: "none",
                  borderRadius: 6, color: "#1A1200", fontFamily: sans, fontSize: 12.5,
                  fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <Plus size={14} /> Add First Module
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {modules.map((m, idx) => {
                const isEditing = editingId === m.id;
                const isDeleting = deletingId === m.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      background: isEditing ? C.panel2 : C.panel,
                      border: `1px solid ${isEditing ? C.amber : C.border}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      transition: "all 150ms ease",
                    }}
                  >
                    {/* Module row header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 5, background: C.panel3,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: mono, fontSize: 10.5, color: C.amber, fontWeight: 700, flexShrink: 0
                      }}>
                        {String(idx + 1).padStart(2, "0")}
                      </div>

                      {isEditing ? (
                        <input
                          autoFocus
                          value={editForm.title}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          style={{ ...inputStyle(false), flex: 1, padding: "6px 10px", fontSize: 12.5 }}
                        />
                      ) : (
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi }}>
                            {m.title}
                          </span>
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <div style={{
                          fontFamily: mono, fontSize: 11, color: C.mid,
                          display: "flex", alignItems: "center", gap: 4, background: C.panel2,
                          padding: "3px 7px", borderRadius: 4, border: `1px solid ${C.border}`
                        }}>
                          <Clock size={11} color={C.low} />
                          {m.duration_hours}h
                        </div>

                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(m.id)}
                              disabled={savingEdit}
                              style={{
                                background: C.amber, border: "none", borderRadius: 5, padding: "5px 10px",
                                color: "#1A1200", fontFamily: sans, fontSize: 11.5, fontWeight: 700,
                                cursor: savingEdit ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 5
                              }}
                            >
                              {savingEdit ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={11} />}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
                                padding: "5px 8px", color: C.mid, fontFamily: sans, fontSize: 11.5, cursor: "pointer"
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              title="Edit module"
                              onClick={() => startEdit(m)}
                              style={{
                                background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
                                padding: "5px 7px", color: C.low, cursor: "pointer", display: "flex"
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = C.amber}
                              onMouseLeave={e => e.currentTarget.style.color = C.low}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              title="Delete module"
                              disabled={isDeleting}
                              onClick={() => handleDeleteModule(m.id, m.title)}
                              style={{
                                background: "none", border: `1px solid ${C.border}`, borderRadius: 5,
                                padding: "5px 7px", color: C.low, cursor: isDeleting ? "wait" : "pointer", display: "flex"
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = C.danger}
                              onMouseLeave={e => e.currentTarget.style.color = C.low}
                            >
                              {isDeleting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline edit extra fields */}
                    {isEditing && (
                      <div style={{ padding: "0 14px 14px 44px", borderTop: `1px solid ${C.border}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10, paddingTop: 10 }}>
                          <div>
                            <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginBottom: 4 }}>Description</div>
                            <textarea
                              value={editForm.description}
                              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Module summary and objectives..."
                              style={{ ...textareaStyle, minHeight: 50 }}
                            />
                          </div>
                          <div>
                            <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginBottom: 4 }}>Duration (hrs)</div>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={editForm.duration_hours}
                              onChange={e => setEditForm(f => ({ ...f, duration_hours: e.target.value }))}
                              style={inputStyle(false)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Module description display when not editing */}
                    {!isEditing && m.description && (
                      <div style={{
                        padding: "0 14px 10px 48px", fontFamily: sans, fontSize: 12,
                        color: C.mid, lineHeight: 1.45
                      }}>
                        {m.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: C.panel, flexShrink: 0
        }}>
          <span style={{ fontFamily: mono, fontSize: 11.5, color: C.low }}>
            {modules.length} module{modules.length !== 1 ? "s" : ""} • {totalModuleHours.toFixed(1)} hrs total
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "7px 16px", background: "none", border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.hi, fontFamily: sans, fontSize: 12.5, cursor: "pointer"
            }}
          >
            Close Panel
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Main Component (Courses & Modules Management) ────────── */
export default function AdminSubjects() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerState, setDrawerState] = useState(null); // null | { mode: 'add' } | { mode: 'edit', course }
  const [modulesDrawerCourse, setModulesDrawerCourse] = useState(null); // null | course object
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, tone = "success") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSubjects();
      setCourses(res.results || []);
    } catch (err) {
      showToast(err.message || "Failed to load courses data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaved = (savedCourse) => {
    setDrawerState(null);
    showToast(
      drawerState?.mode === "edit"
        ? `Course "${savedCourse.name}" updated successfully.`
        : `Course "${savedCourse.name}" created successfully.`
    );
    loadData();
  };

  const handleDelete = async (e, course) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete course "${course.name}"?`)) return;

    setDeletingId(course.id);
    try {
      await deleteSubject(course.id);
      showToast(`Course "${course.name}" removed.`);
      setCourses(prev => prev.filter(c => c.id !== course.id));
      if (modulesDrawerCourse?.id === course.id) {
        setModulesDrawerCourse(null);
      }
    } catch (err) {
      showToast(err.message || "Failed to delete course", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModulesCountChanged = useCallback((courseId, newCount) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, module_count: newCount } : c));
  }, []);

  // Filtering
  const filtered = courses.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const totalHours = courses.reduce((acc, c) => acc + (c.credits_or_hours || 0), 0);
  const totalModules = courses.reduce((acc, c) => acc + (c.module_count || 0), 0);

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
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Courses</h1>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.low, marginTop: 4 }}>
            Curriculum courses, syllabus modules, and hands-on training tracks
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
          <Btn icon={Plus} onClick={() => setDrawerState({ mode: "add" })}>Add Course</Btn>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 22 }}>
        <Panel style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.low, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Courses</span>
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
            {courses.length > 0 ? Math.round(totalHours / courses.length) : 0}h
          </div>
        </Panel>
      </div>

      {/* Search Bar (Class connection removed) */}
      <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260, maxWidth: 380, position: "relative" }}>
          <Search size={14} color={C.low} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search courses by name or code..."
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

        <div style={{ fontFamily: mono, fontSize: 12, color: C.low, marginLeft: "auto" }}>
          Showing {filtered.length} of {courses.length} courses
        </div>
      </div>

      {/* Content Area */}
      {loading && courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.mid, fontFamily: sans }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 10 }} />
          <div>Loading courses...</div>
        </div>
      ) : filtered.length === 0 ? (
        <Panel style={{ padding: "50px 20px", textAlign: "center", marginTop: 18 }}>
          <BookOpen size={36} color={C.low} style={{ marginBottom: 12 }} />
          <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: C.hi, marginBottom: 6 }}>
            {search ? "No courses match your search" : "No courses created yet"}
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.low, marginBottom: 16 }}>
            {search
              ? "Try checking for spelling errors or searching with a different term"
              : "Create your first curriculum course and add training modules."}
          </div>
          {!search && (
            <Btn icon={Plus} onClick={() => setDrawerState({ mode: "add" })}>Create First Course</Btn>
          )}
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16, marginTop: 18 }}>
          {filtered.map((c) => {
            const isDeleting = deletingId === c.id;
            return (
              <Panel
                key={c.id}
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
                      {c.code && (
                        <Badge tone="cyan">{c.code}</Badge>
                      )}
                      <Badge tone="warn">{c.credits_or_hours} Hours</Badge>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        title="Edit Course Details"
                        onClick={() => setDrawerState({ mode: "edit", course: c })}
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
                        title="Delete Course"
                        disabled={isDeleting}
                        onClick={(e) => handleDelete(e, c)}
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
                  <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, marginTop: 14 }}>
                    {c.name}
                  </div>

                  {/* Description (Class connection row removed completely) */}
                  <div style={{
                    fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 8,
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: 36,
                  }}>
                    {c.description || "No curriculum description provided for this course."}
                  </div>
                </div>

                {/* Bottom stats & Module Management */}
                <div style={{
                  marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <button
                    onClick={() => setModulesDrawerCourse(c)}
                    style={{
                      background: "none", border: "none", padding: 0,
                      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    }}
                  >
                    <BookOpen size={13} color={C.amber} />
                    <span style={{ fontFamily: mono, fontSize: 12, color: C.hi, fontWeight: 600 }}>
                      {c.module_count || 0} module{c.module_count !== 1 ? "s" : ""}
                    </span>
                  </button>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={() => setDrawerState({ mode: "edit", course: c })}
                      style={{
                        background: "none", border: "none", color: C.low,
                        fontFamily: sans, fontSize: 12, cursor: "pointer",
                        padding: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = C.mid}
                      onMouseLeave={e => e.currentTarget.style.color = C.low}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => setModulesDrawerCourse(c)}
                      style={{
                        background: C.panel3, border: `1px solid ${C.borderLight}`,
                        borderRadius: 6, padding: "5px 10px", color: C.amber,
                        fontFamily: sans, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = C.amber;
                        e.currentTarget.style.background = "rgba(245,158,11,0.1)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = C.borderLight;
                        e.currentTarget.style.background = C.panel3;
                      }}
                    >
                      <Layers size={12} />
                      <span>Modules →</span>
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Drawer */}
      {drawerState && (
        <CourseDrawer
          course={drawerState.course}
          onClose={() => setDrawerState(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Modules Management Drawer */}
      {modulesDrawerCourse && (
        <CourseModulesDrawer
          course={modulesDrawerCourse}
          onClose={() => setModulesDrawerCourse(null)}
          onModulesCountChanged={handleModulesCountChanged}
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

export { AdminSubjects as AdminCourses };

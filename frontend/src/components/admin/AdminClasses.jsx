import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, Plus, Search, X, FlaskConical, Users,
  Loader2, AlertCircle, CheckCircle, RefreshCw, Trash2,
  Edit2, Check, ShieldCheck, BookOpen, Layers, UserPlus,
  ArrowRight, Filter, Sparkles
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import {
  fetchClasses,
  fetchClassDetail,
  createClass,
  updateClass,
  deleteClass,
  assignClassLabs,
  assignClassStudents,
  createClassStudent,
} from "../../api/classes";
import { fetchLabs } from "../../api/labs";
import { fetchStudents, updateStudent } from "../../api/students";
import Pagination from "../common/Pagination";

/* ─── Styling helpers ────────────────────────────────────── */
const inputStyle = (err) => ({
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${err ? C.danger : C.border}`,
  borderRadius: 7,
  background: C.panel2,
  padding: "9px 12px",
  fontFamily: mono,
  fontSize: 12.5,
  color: C.hi,
  outline: "none",
  transition: "border-color 120ms",
});

const textareaStyle = {
  ...inputStyle(false),
  resize: "vertical",
  minHeight: 76,
  fontFamily: sans,
  fontSize: 12.5,
  lineHeight: 1.5,
};

const formField = (label, children, required) => (
  <div style={{ marginBottom: 15 }}>
    <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 5, display: "flex", gap: 4 }}>
      {label}{required && <span style={{ color: C.amber }}>*</span>}
    </div>
    {children}
  </div>
);

/* ─── Toast Notification ─────────────────────────────────── */
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28,
      background: type === "success" ? "rgba(16, 50, 36, 0.98)" : "rgba(60, 20, 20, 0.98)",
      border: `1px solid ${type === "success" ? "rgba(63, 216, 200, 0.45)" : "rgba(229, 83, 75, 0.45)"}`,
      borderRadius: 9, padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 10,
      color: type === "success" ? C.cyan : "#fca5a5",
      fontFamily: sans, fontSize: 13, zIndex: 1400,
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      animation: "fadeUp 180ms ease",
    }}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

/* ─── Create / Edit Class Modal ──────────────────────────── */
function ClassFormModal({ isOpen, onClose, onSaved, initialData = null, allLabs = [] }) {
  const isEdit = Boolean(initialData?.id);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    lab_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [labSearch, setLabSearch] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        code: initialData.code || "",
        description: initialData.description || "",
        lab_ids: initialData.lab_ids || (initialData.labs || []).map(l => l.id),
      });
    } else {
      setForm({ name: "", code: "", description: "", lab_ids: [] });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Class name is required.";
    return err;
  };

  const toggleLab = (id) => {
    setForm(f => ({
      ...f,
      lab_ids: f.lab_ids.includes(id) ? f.lab_ids.filter(x => x !== id) : [...f.lab_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        const res = await updateClass(initialData.id, {
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          lab_ids: form.lab_ids,
        });
        onSaved(res, "Class updated successfully!");
      } else {
        const res = await createClass({
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          lab_ids: form.lab_ids,
        });
        onSaved(res, "Class created successfully!");
      }
      onClose();
    } catch (err) {
      setErrors({ global: err.message || "Failed to save class." });
    } finally {
      setLoading(false);
    }
  };

  const filteredLabs = (allLabs || []).filter(l => {
    if (!l) return false;
    const nameMatch = (l.name || "").toLowerCase().includes(labSearch.toLowerCase());
    const catMatch = l.category && l.category.toLowerCase().includes(labSearch.toLowerCase());
    return nameMatch || catMatch;
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 540, maxHeight: "88vh", background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 1201,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(240, 180, 41, 0.12)", border: "1px solid rgba(240, 180, 41, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: C.amber }}>
              <GraduationCap size={18} />
            </div>
            <div>
              <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                {isEdit ? "Edit Class" : "Create New Class"}
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                {isEdit ? `Updating class #${initialData.id}` : "Organize students & assign class-specific practical labs"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.low, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {errors.global && (
            <div style={{ background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.3)", borderRadius: 7, padding: "10px 14px", color: "#fca5a5", fontSize: 12.5, fontFamily: sans, marginBottom: 16 }}>
              {errors.global}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
            {formField("Class Name", (
              <>
                <input
                  style={inputStyle(errors.name)}
                  placeholder="e.g., Cyber Defense Batch A"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                {errors.name && <div style={{ color: C.danger, fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
              </>
            ), true)}

            {formField("Class Code", (
              <input
                style={inputStyle(false)}
                placeholder="e.g., CD-2026-A"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              />
            ))}
          </div>

          {formField("Description", (
            <textarea
              style={textareaStyle}
              placeholder="Brief description or purpose of this class cohort..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          ))}

          {/* Assigned Labs selector */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, fontWeight: 600 }}>
                Assign Practical Labs ({form.lab_ids.length} selected)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, lab_ids: allLabs.map(l => l.id) }))}
                  style={{ background: "none", border: "none", color: C.cyan, fontSize: 11, cursor: "pointer", fontFamily: sans }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, lab_ids: [] }))}
                  style={{ background: "none", border: "none", color: C.low, fontSize: 11, cursor: "pointer", fontFamily: sans }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick filter */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.low }} />
              <input
                style={{ ...inputStyle(false), paddingLeft: 30, fontSize: 12 }}
                placeholder="Search labs to assign..."
                value={labSearch}
                onChange={e => setLabSearch(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: 180, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel2, padding: "6px 8px" }}>
              {filteredLabs.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: C.low, fontSize: 12, fontFamily: sans }}>
                  No labs found matching "{labSearch}".
                </div>
              ) : (
                filteredLabs.map(lab => {
                  const isChecked = form.lab_ids.includes(lab.id);
                  return (
                    <div
                      key={lab.id}
                      onClick={() => toggleLab(lab.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                        background: isChecked ? "rgba(63, 216, 200, 0.08)" : "transparent",
                        marginBottom: 4, transition: "background 100ms",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: `1.5px solid ${isChecked ? C.cyan : C.border}`,
                          background: isChecked ? C.cyan : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#0a0d14",
                        }}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span style={{ fontFamily: sans, fontSize: 12.5, color: isChecked ? C.hi : C.mid, fontWeight: isChecked ? 600 : 400 }}>
                          {lab.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {lab.category && (
                          <span style={{ fontFamily: mono, fontSize: 10, color: C.low, background: "rgba(255,255,255,0.04)", padding: "1px 6px", borderRadius: 3 }}>
                            {lab.category}
                          </span>
                        )}
                        <span style={{ fontFamily: mono, fontSize: 10, color: C.amber }}>
                          {lab.points || 100} pts
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginTop: 6 }}>
              💡 Students in Class-Based access mode will only see and access these assigned labs.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.panel }}>
          <Btn variant="outline" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn icon={loading ? Loader2 : Check} disabled={loading} onClick={handleSubmit}>
            {loading ? "Saving..." : (isEdit ? "Update Class" : "Create Class")}
          </Btn>
        </div>
      </div>
    </>
  );
}

/* ─── Manage Labs Modal ──────────────────────────────────── */
function ManageLabsModal({ isOpen, classObj, onClose, onUpdated, allLabs = [] }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (classObj) {
      setSelectedIds(classObj.lab_ids || (classObj.labs || []).map(l => l.id));
      setError("");
      setSearch("");
    }
  }, [classObj, isOpen]);

  if (!isOpen || !classObj) return null;

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await assignClassLabs(classObj.id, { lab_ids: selectedIds });
      onUpdated(res.class, `Assigned labs updated for ${classObj.name}!`);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update assigned labs.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = allLabs.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.category && l.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 600, maxHeight: "88vh", background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 1201,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                Assign Practical Labs
              </div>
              <Badge tone="cyan">{classObj.code || `CLASS #${classObj.id}`}</Badge>
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginTop: 2 }}>
              Target Class: <strong style={{ color: C.hi }}>{classObj.name}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.low, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Explanatory Banner */}
        <div style={{
          padding: "10px 24px", background: "rgba(240, 180, 41, 0.08)",
          borderBottom: "1px solid rgba(240, 180, 41, 0.2)", display: "flex", gap: 8, alignItems: "center",
          fontFamily: sans, fontSize: 12, color: C.amber,
        }}>
          <FlaskConical size={15} style={{ flexShrink: 0 }} />
          <span>
            Only labs checked below will be visible and accessible to students assigned to this class in <strong>Class-Based Access</strong> mode.
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {error && (
            <div style={{ background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.3)", borderRadius: 7, padding: "9px 13px", color: "#fca5a5", fontSize: 12, marginBottom: 12 }}>
              {error}
            </div>
          )}

          {/* Search + Select All controls */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.low }} />
              <input
                style={{ ...inputStyle(false), paddingLeft: 30, fontSize: 12 }}
                placeholder="Search practical labs by title or category..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Btn variant="outline" size="sm" onClick={() => setSelectedIds(allLabs.map(l => l.id))}>Select All</Btn>
            <Btn variant="outline" size="sm" onClick={() => setSelectedIds([])}>Deselect All</Btn>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11, color: C.low, marginBottom: 8 }}>
            <span>AVAILABLE LABS ({filtered.length})</span>
            <span style={{ color: C.cyan }}>{selectedIds.length} OF {allLabs.length} SELECTED</span>
          </div>

          {/* Lab List */}
          <div style={{ flex: 1, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 9, background: C.panel2, padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: C.low, fontSize: 12.5, fontFamily: sans }}>
                No practical labs found.
              </div>
            ) : (
              filtered.map(lab => {
                const isChecked = selectedIds.includes(lab.id);
                return (
                  <div
                    key={lab.id}
                    onClick={() => toggle(lab.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: 7, cursor: "pointer",
                      background: isChecked ? "rgba(63, 216, 200, 0.08)" : "transparent",
                      border: `1px solid ${isChecked ? "rgba(63, 216, 200, 0.25)" : "transparent"}`,
                      marginBottom: 5, transition: "all 100ms ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `1.5px solid ${isChecked ? C.cyan : C.border}`,
                        background: isChecked ? C.cyan : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#0a0d14", flexShrink: 0,
                      }}>
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: sans, fontSize: 13, fontWeight: isChecked ? 600 : 500, color: isChecked ? C.hi : C.mid, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {lab.name}
                        </div>
                        {lab.description && (
                          <div style={{ fontFamily: sans, fontSize: 11, color: C.low, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {lab.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, marginLeft: 10 }}>
                      {lab.category && (
                        <span style={{ fontFamily: mono, fontSize: 10, color: C.mid, background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                          {lab.category}
                        </span>
                      )}
                      <span style={{ fontFamily: mono, fontSize: 11, color: C.amber, fontWeight: 600 }}>
                        {lab.points || 100} pts
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel }}>
          <div style={{ fontFamily: mono, fontSize: 12, color: C.mid }}>
            {selectedIds.length} labs assigned
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="outline" onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn icon={saving ? Loader2 : Check} disabled={saving} onClick={handleSave}>
              {saving ? "Saving Changes..." : "Save Assigned Labs"}
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Manage Students Modal ──────────────────────────────── */
function ManageStudentsModal({ isOpen, classObj, onClose, onUpdated, allStudents = [], onReloadAllStudents }) {
  const [tab, setTab] = useState("enrolled"); // "enrolled" | "assign" | "create"
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Assign existing state
  const [selectedToAssign, setSelectedToAssign] = useState([]);
  const [assignAccessMode, setAssignAccessMode] = useState("class_based");

  // Create new student state
  const EMPTY_NEW_STUDENT = {
    full_name: "", email: "",
    password: "", confirm_password: "", lab_access_mode: "class_based",
  };
  const [newStudent, setNewStudent] = useState(EMPTY_NEW_STUDENT);
  const [createErrors, setCreateErrors] = useState({});

  const loadEnrolled = useCallback(async () => {
    if (!classObj?.id) return;
    setLoadingList(true);
    try {
      const res = await fetchClassDetail(classObj.id);
      setEnrolledStudents(res.students || []);
    } catch (err) {
      setError(err.message || "Failed to load class students.");
    } finally {
      setLoadingList(false);
    }
  }, [classObj?.id]);

  useEffect(() => {
    if (isOpen && classObj) {
      loadEnrolled();
      setTab("enrolled");
      setSelectedToAssign([]);
      setError("");
      setCreateErrors({});
    }
  }, [isOpen, classObj, loadEnrolled]);

  if (!isOpen || !classObj) return null;

  // Toggle student access mode between class_based and unrestricted
  const handleToggleStudentAccessMode = async (studentId, currentMode) => {
    const nextMode = currentMode === "class_based" ? "unrestricted" : "class_based";
    setActionLoading(true);
    try {
      await updateStudent(studentId, { lab_access_mode: nextMode });
      setEnrolledStudents(prev => prev.map(s => s.id === studentId ? { ...s, lab_access_mode: nextMode } : s));
      if (onReloadAllStudents) onReloadAllStudents();
    } catch (err) {
      alert(err.message || "Failed to change access mode.");
    } finally {
      setActionLoading(false);
    }
  };

  // Remove student from class
  const handleRemoveStudent = async (studentId) => {
    setActionLoading(true);
    try {
      const res = await assignClassStudents(classObj.id, {
        student_ids: [studentId],
        action: "remove",
      });
      setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
      onUpdated(res.class, "Student removed from class.");
      if (onReloadAllStudents) onReloadAllStudents();
    } catch (err) {
      alert(err.message || "Failed to remove student from class.");
    } finally {
      setActionLoading(false);
    }
  };

  // Assign existing students
  const handleAssignSelected = async () => {
    if (selectedToAssign.length === 0) return;
    setActionLoading(true);
    try {
      const res = await assignClassStudents(classObj.id, {
        student_ids: selectedToAssign,
        action: "assign",
        access_mode: assignAccessMode,
      });
      setSelectedToAssign([]);
      await loadEnrolled();
      onUpdated(res.class, `Assigned ${selectedToAssign.length} student(s) to ${classObj.name}!`);
      if (onReloadAllStudents) onReloadAllStudents();
      setTab("enrolled");
    } catch (err) {
      alert(err.message || "Failed to assign students.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create new student directly in class
  const handleCreateStudentInClass = async (e) => {
    e.preventDefault();
    const err = {};
    if (!newStudent.full_name.trim()) err.full_name = "Name is required.";
    if (!newStudent.email.trim()) err.email = "Email is required.";
    if (!newStudent.password) err.password = "Password is required.";
    if (newStudent.password !== newStudent.confirm_password) err.confirm_password = "Passwords do not match.";

    if (Object.keys(err).length > 0) {
      setCreateErrors(err);
      return;
    }

    setActionLoading(true);
    setCreateErrors({});
    try {
      // One name field (first word = first name); the email is used as the username
      const [firstName, ...rest] = newStudent.full_name.trim().split(/\s+/);
      const email = newStudent.email.trim().toLowerCase();
      const res = await createClassStudent(classObj.id, {
        first_name: firstName,
        last_name: rest.join(" "),
        email,
        username: email,
        password: newStudent.password,
        confirm_password: newStudent.confirm_password,
        lab_access_mode: newStudent.lab_access_mode,
      });
      onUpdated(res.class, `Student ${email} created in ${classObj.name}!`);
      if (onReloadAllStudents) onReloadAllStudents();
      await loadEnrolled();
      setNewStudent(EMPTY_NEW_STUDENT);
      setTab("enrolled");
    } catch (err) {
      setCreateErrors({ global: err.message || "Failed to create student in class." });
    } finally {
      setActionLoading(false);
    }
  };

  // Candidates for assigning to this class
  const enrolledIds = new Set(enrolledStudents.map(s => s.id));
  const candidateStudents = allStudents.filter(s =>
    !enrolledIds.has(s.id) &&
    (s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     s.username.toLowerCase().includes(search.toLowerCase()) ||
     s.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 680, maxHeight: "90vh", background: C.panel, border: `1px solid ${C.border}`,
        borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 1201,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                Class Students & Access
              </div>
              <Badge tone="cyan">{classObj.code || `CLASS #${classObj.id}`}</Badge>
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginTop: 2 }}>
              Managing enrollment for <strong style={{ color: C.hi }}>{classObj.name}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.low, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 2, padding: "0 24px", borderBottom: `1px solid ${C.border}`, background: C.panel2 }}>
          {[
            { id: "enrolled", label: `Enrolled Students (${enrolledStudents.length})`, icon: Users },
            { id: "assign", label: "Assign Existing Students", icon: UserPlus },
            { id: "create", label: "Create Student in Class", icon: Plus },
          ].map(t => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "11px 15px", background: "none", border: "none",
                  borderBottom: active ? `2px solid ${C.amber}` : "2px solid transparent",
                  color: active ? C.hi : C.mid, fontFamily: sans, fontSize: 12.5,
                  fontWeight: active ? 600 : 500, cursor: "pointer",
                }}
              >
                <Icon size={14} style={{ color: active ? C.amber : C.low }} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
          {/* TAB 1: ENROLLED STUDENTS */}
          {tab === "enrolled" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>
                  Students currently enrolled in this class ({enrolledStudents.length}):
                </div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>
                  Toggle access mode to switch between Class-Based and Unrestricted
                </div>
              </div>

              {loadingList ? (
                <div style={{ padding: "40px", textAlign: "center", color: C.mid, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Loader2 size={16} className="spin" /> Loading enrolled students...
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", background: C.panel2, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <Users size={28} style={{ color: C.low, margin: "0 auto 10px", display: "block" }} />
                  <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: C.hi, marginBottom: 4 }}>
                    No students enrolled in this class yet
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginBottom: 16 }}>
                    Assign existing platform students or register a new student directly into this class.
                  </div>
                  <Btn size="sm" icon={UserPlus} onClick={() => setTab("assign")}>
                    Assign Existing Students
                  </Btn>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {enrolledStudents.map(st => {
                    const isClassRestricted = st.lab_access_mode === "class_based";
                    return (
                      <div
                        key={st.id}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px", borderRadius: 8, background: C.panel2,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
                              {st.full_name || st.username}
                            </span>
                            <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                              @{st.username}
                            </span>
                          </div>
                          <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginTop: 2 }}>
                            {st.email || "No email"}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {/* Access Mode Pill Toggle */}
                          <div
                            onClick={() => handleToggleStudentAccessMode(st.id, st.lab_access_mode)}
                            title="Click to toggle access mode"
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "4px 10px", borderRadius: 20, cursor: "pointer",
                              background: isClassRestricted ? "rgba(240, 180, 41, 0.12)" : "rgba(63, 216, 200, 0.12)",
                              border: `1px solid ${isClassRestricted ? "rgba(240, 180, 41, 0.35)" : "rgba(63, 216, 200, 0.35)"}`,
                              color: isClassRestricted ? C.amber : C.cyan,
                              fontFamily: mono, fontSize: 10.5, fontWeight: 600,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isClassRestricted ? C.amber : C.cyan }} />
                            {isClassRestricted ? "CLASS-BASED" : "UNRESTRICTED"}
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveStudent(st.id)}
                            disabled={actionLoading}
                            title="Remove from class"
                            style={{
                              background: "rgba(229,83,75,0.08)", border: "1px solid rgba(229,83,75,0.25)",
                              borderRadius: 6, padding: "5px 8px", color: "#fca5a5", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: sans,
                            }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSIGN EXISTING STUDENTS */}
          {tab === "assign" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12, marginBottom: 14 }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.low }} />
                  <input
                    style={{ ...inputStyle(false), paddingLeft: 30, fontSize: 12 }}
                    placeholder="Search students to assign..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {/* Access mode selection */}
                <div>
                  <select
                    style={inputStyle(false)}
                    value={assignAccessMode}
                    onChange={e => setAssignAccessMode(e.target.value)}
                  >
                    <option value="class_based">Class-Based Access (Recommended)</option>
                    <option value="unrestricted">Unrestricted Access</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontFamily: mono, fontSize: 11, color: C.low }}>
                <span>STUDENTS ({candidateStudents.length})</span>
                <span style={{ color: C.cyan }}>{selectedToAssign.length} SELECTED</span>
              </div>

              <div style={{ maxHeight: 250, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel2, padding: 6, marginBottom: 16 }}>
                {candidateStudents.length === 0 ? (
                  <div style={{ padding: "28px", textAlign: "center", color: C.low, fontSize: 12.5, fontFamily: sans }}>
                    No other students available to assign.
                  </div>
                ) : (
                  candidateStudents.map(st => {
                    const isChecked = selectedToAssign.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedToAssign(prev => isChecked ? prev.filter(x => x !== st.id) : [...prev, st.id])}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 12px", borderRadius: 6, cursor: "pointer",
                          background: isChecked ? "rgba(63, 216, 200, 0.08)" : "transparent",
                          marginBottom: 4, transition: "background 100ms",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: 4,
                            border: `1.5px solid ${isChecked ? C.cyan : C.border}`,
                            background: isChecked ? C.cyan : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#0a0d14",
                          }}>
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <div>
                            <span style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: isChecked ? C.hi : C.mid }}>
                              {st.full_name || st.username}
                            </span>
                            <span style={{ fontFamily: mono, fontSize: 11, color: C.low, marginLeft: 8 }}>
                              @{st.username}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>
                          {st.assigned_class_name ? `Currently in ${st.assigned_class_name}` : "Unassigned"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Btn
                  icon={actionLoading ? Loader2 : UserPlus}
                  disabled={actionLoading || selectedToAssign.length === 0}
                  onClick={handleAssignSelected}
                >
                  {actionLoading ? "Assigning..." : `Assign Selected (${selectedToAssign.length}) to Class`}
                </Btn>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW STUDENT IN CLASS */}
          {tab === "create" && (
            <form onSubmit={handleCreateStudentInClass}>
              {createErrors.global && (
                <div style={{ background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.3)", borderRadius: 7, padding: "9px 13px", color: "#fca5a5", fontSize: 12, marginBottom: 14 }}>
                  {createErrors.global}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {formField("Student Name", (
                  <>
                    <input
                      style={inputStyle(createErrors.full_name)}
                      placeholder="Jane Doe"
                      value={newStudent.full_name}
                      onChange={e => setNewStudent(s => ({ ...s, full_name: e.target.value }))}
                    />
                    {createErrors.full_name && <div style={{ color: C.danger, fontSize: 11, marginTop: 3 }}>{createErrors.full_name}</div>}
                  </>
                ), true)}

                {formField("Email (used as username)", (
                  <>
                    <input
                      type="email"
                      style={inputStyle(createErrors.email)}
                      placeholder="jane@example.com"
                      value={newStudent.email}
                      onChange={e => setNewStudent(s => ({ ...s, email: e.target.value }))}
                    />
                    {createErrors.email && <div style={{ color: C.danger, fontSize: 11, marginTop: 3 }}>{createErrors.email}</div>}
                  </>
                ), true)}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {formField("Password", (
                  <>
                    <input
                      type="password"
                      style={inputStyle(createErrors.password)}
                      placeholder="••••••••"
                      value={newStudent.password}
                      onChange={e => setNewStudent(s => ({ ...s, password: e.target.value }))}
                    />
                    {createErrors.password && <div style={{ color: C.danger, fontSize: 11, marginTop: 3 }}>{createErrors.password}</div>}
                  </>
                ), true)}

                {formField("Confirm Password", (
                  <>
                    <input
                      type="password"
                      style={inputStyle(createErrors.confirm_password)}
                      placeholder="••••••••"
                      value={newStudent.confirm_password}
                      onChange={e => setNewStudent(s => ({ ...s, confirm_password: e.target.value }))}
                    />
                    {createErrors.confirm_password && <div style={{ color: C.danger, fontSize: 11, marginTop: 3 }}>{createErrors.confirm_password}</div>}
                  </>
                ), true)}
              </div>

              {formField("Lab Access Mode", (
                <select
                  style={inputStyle(false)}
                  value={newStudent.lab_access_mode}
                  onChange={e => setNewStudent(s => ({ ...s, lab_access_mode: e.target.value }))}
                >
                  <option value="class_based">Class-Based Access (Can only access this class's labs)</option>
                  <option value="unrestricted">Unrestricted Access (Can access all available labs)</option>
                </select>
              ))}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <Btn icon={actionLoading ? Loader2 : Plus} disabled={actionLoading} type="submit">
                  {actionLoading ? "Creating Student..." : "Create & Enroll Student"}
                </Btn>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main AdminClasses Component ────────────────────────── */
export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [allLabs, setAllLabs] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [labsModalClass, setLabsModalClass] = useState(null);
  const [studentsModalClass, setStudentsModalClass] = useState(null);
  const [deleteConfirmClass, setDeleteConfirmClass] = useState(null);

  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState(null);
  const [classStats, setClassStats] = useState({ total_classes: 0, students_in_classes: 0, labs_assigned: 0, catalog_labs: 0 });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Classes list: server-side search + pagination (20 per page)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchClasses({ search: debouncedSearch, page });
      setClasses(res?.results || []);
      setPageMeta(res);
      if (res?.stats) setClassStats(res.stats);
    } catch (err) {
      setError(err.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // Full lab & student lists for the assign pickers (loaded once, refreshed after changes)
  const loadPickers = useCallback(async () => {
    const [labRes, studentRes] = await Promise.allSettled([fetchLabs(), fetchStudents()]);
    if (labRes.status === "fulfilled") setAllLabs(labRes.value?.results || []);
    if (studentRes.status === "fulfilled") setAllStudents(studentRes.value?.results || []);
  }, []);

  useEffect(() => {
    loadPickers();
  }, [loadPickers]);

  const handleClassSaved = (savedClass, msg) => {
    const targetClass = savedClass?.class || savedClass;
    if (targetClass?.id) {
      setClasses(prev => {
        const idx = prev.findIndex(c => c.id === targetClass.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = targetClass;
          return copy;
        }
        return [targetClass, ...prev];
      });
    }
    setToast({ message: msg, type: "success" });
    loadData();
    loadPickers();
  };

  const handleDeleteClass = async () => {
    if (!deleteConfirmClass) return;
    const target = deleteConfirmClass;
    setDeleteConfirmClass(null);
    try {
      await deleteClass(target.id);
      loadData();
      setToast({ message: `Class "${target.name}" deleted successfully.`, type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed to delete class.", type: "error" });
    }
  };

  // Search is applied on the server; `classes` is the current page
  const filteredClasses = classes;

  // Summary counts across all classes (from the server)
  const totalStudentsInClasses = classStats.students_in_classes;
  const totalLabsAssigned = classStats.labs_assigned;

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
              Class Management
            </h1>
            <Badge tone="cyan">CLASS-BASED LAB ACCESS</Badge>
          </div>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: "4px 0 0" }}>
            Create student cohorts, assign designated practical labs, and control class-based access permissions.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" icon={RefreshCw} onClick={loadData}>Refresh</Btn>
          <Btn icon={Plus} onClick={() => { setEditingClass(null); setShowCreateModal(true); }}>
            Create Class
          </Btn>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "TOTAL CLASSES", value: classStats.total_classes, icon: GraduationCap, color: C.amber },
          { label: "ENROLLED STUDENTS", value: totalStudentsInClasses, icon: Users, color: C.cyan },
          { label: "ASSIGNED LABS", value: totalLabsAssigned, icon: FlaskConical, color: "#a78bfa" },
          { label: "CATALOG LABS", value: classStats.catalog_labs, icon: Layers, color: C.hi },
        ].map((st, i) => {
          const Icon = st.icon;
          return (
            <Panel key={i} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.06em", marginBottom: 5 }}>
                    {st.label}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: st.color }}>
                    {st.value}
                  </div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: st.color }}>
                  <Icon size={18} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Search & Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ position: "relative", width: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.low }} />
          <input
            style={{ ...inputStyle(false), paddingLeft: 34, fontSize: 12.5 }}
            placeholder="Search classes by name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontFamily: mono, fontSize: 12, color: C.low }}>
          {pageMeta?.count ?? filteredClasses.length} of {classStats.total_classes} classes
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{ background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.3)", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontFamily: sans, fontSize: 13, display: "flex", gap: 8, alignItems: "center", marginBottom: 18 }}>
          <AlertCircle size={15} />
          {error}
          <span onClick={loadData} style={{ marginLeft: "auto", color: C.cyan, cursor: "pointer", fontSize: 12 }}>Retry</span>
        </div>
      )}

      {/* Classes Grid */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: C.mid, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Loader2 size={20} className="spin" /> Loading classes...
        </div>
      ) : filteredClasses.length === 0 ? (
        <Panel style={{ padding: "60px 24px", textAlign: "center" }}>
          <GraduationCap size={36} style={{ color: C.low, margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 600, color: C.hi, marginBottom: 6 }}>
            {search ? `No classes matching "${search}"` : "No classes created yet"}
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.low, maxWidth: 440, margin: "0 auto 20px" }}>
            Create cohorts, assign practical labs to each class, and restrict students to only their class's practical exercises.
          </div>
          <Btn icon={Plus} onClick={() => { setEditingClass(null); setShowCreateModal(true); }}>
            Create First Class
          </Btn>
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18 }}>
          {filteredClasses.map(c => {
            const studentCount = c.student_count ?? (c.students?.length || 0);
            const labCount = c.lab_count ?? (c.labs?.length || 0);
            const classLabs = (c.labs && c.labs.length > 0)
              ? c.labs
              : (allLabs || []).filter(l => (c.lab_ids || []).includes(l.id));

            return (
              <Panel key={c.id} style={{ padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  {/* Card top */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, marginBottom: 3 }}>
                        {c.name}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {c.code && (
                          <span style={{
                            fontFamily: mono, fontSize: 10, fontWeight: 700,
                            color: C.cyan, background: "rgba(63, 216, 200, 0.12)",
                            border: "1px solid rgba(63, 216, 200, 0.3)", padding: "1px 6px", borderRadius: 4,
                          }}>
                            {c.code}
                          </span>
                        )}
                        <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>
                          CLASS ID #{c.id}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => { setEditingClass(c); setShowCreateModal(true); }}
                        title="Edit Class details"
                        style={{
                          background: C.panel2, border: `1px solid ${C.border}`,
                          borderRadius: 6, padding: "5px 7px", color: C.mid, cursor: "pointer",
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmClass(c)}
                        title="Delete Class"
                        style={{
                          background: "rgba(229,83,75,0.08)", border: "1px solid rgba(229,83,75,0.2)",
                          borderRadius: 6, padding: "5px 7px", color: "#fca5a5", cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.45,
                    marginBottom: 16, minHeight: 36,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {c.description || "No description provided for this class."}
                  </div>

                  {/* Metrics Pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{
                      background: C.panel2, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: "10px 12px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.amber, marginBottom: 3 }}>
                        <FlaskConical size={14} />
                        <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>ASSIGNED LABS</span>
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 17, fontWeight: 700, color: C.hi }}>
                        {labCount} <span style={{ fontSize: 11, fontWeight: 400, color: C.mid }}>labs</span>
                      </div>
                    </div>

                    <div style={{
                      background: C.panel2, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: "10px 12px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.cyan, marginBottom: 3 }}>
                        <Users size={14} />
                        <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>STUDENTS</span>
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 17, fontWeight: 700, color: C.hi }}>
                        {studentCount} <span style={{ fontSize: 11, fontWeight: 400, color: C.mid }}>enrolled</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Labs quick chips */}
                  {classLabs.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontFamily: mono, fontSize: 10, color: C.low, marginBottom: 6 }}>
                        LAB ACCESS PREVIEW
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {classLabs.slice(0, 3).map(lab => (
                          <span
                            key={lab.id}
                            style={{
                              fontFamily: sans, fontSize: 11, color: C.mid,
                              background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                              padding: "2px 7px", borderRadius: 4,
                            }}
                          >
                            {lab.name}
                          </span>
                        ))}
                        {classLabs.length > 3 && (
                          <span style={{
                            fontFamily: mono, fontSize: 10.5, color: C.cyan,
                            background: "rgba(63, 216, 200, 0.08)", padding: "2px 6px", borderRadius: 4,
                          }}>
                            +{classLabs.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <Btn
                    variant="outline"
                    icon={FlaskConical}
                    size="sm"
                    onClick={() => setLabsModalClass(c)}
                    style={{ fontSize: 12 }}
                  >
                    Manage Labs
                  </Btn>
                  <Btn
                    variant="outline"
                    icon={Users}
                    size="sm"
                    onClick={() => setStudentsModalClass(c)}
                    style={{ fontSize: 12 }}
                  >
                    Manage Students
                  </Btn>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {!error && <Pagination meta={pageMeta} onPageChange={setPage} loading={loading} />}

      {/* Create / Edit Class Form Modal */}
      <ClassFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSaved={handleClassSaved}
        initialData={editingClass}
        allLabs={allLabs}
      />

      {/* Manage Labs Modal */}
      <ManageLabsModal
        isOpen={Boolean(labsModalClass)}
        classObj={labsModalClass}
        onClose={() => setLabsModalClass(null)}
        onUpdated={handleClassSaved}
        allLabs={allLabs}
      />

      {/* Manage Students Modal */}
      <ManageStudentsModal
        isOpen={Boolean(studentsModalClass)}
        classObj={studentsModalClass}
        onClose={() => setStudentsModalClass(null)}
        onUpdated={handleClassSaved}
        allStudents={allStudents}
        onReloadAllStudents={loadData}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmClass && (
        <>
          <div onClick={() => setDeleteConfirmClass(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1300 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 400, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 24, zIndex: 1301, boxShadow: "0 20px 80px rgba(0,0,0,0.6)",
          }}>
            <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, marginBottom: 8 }}>
              Delete Class "{deleteConfirmClass.name}"?
            </div>
            <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.5, marginBottom: 20 }}>
              Students assigned to this class will be returned to <strong>Unrestricted Access</strong>. Practical labs will not be deleted.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="outline" onClick={() => setDeleteConfirmClass(null)} style={{ flex: 1 }}>Cancel</Btn>
              <Btn icon={Trash2} onClick={handleDeleteClass} style={{ flex: 1, background: C.danger, border: `1px solid ${C.danger}`, color: "#fff" }}>
                Delete Class
              </Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

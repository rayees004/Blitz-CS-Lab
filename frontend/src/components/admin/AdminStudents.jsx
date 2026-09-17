import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, MoreHorizontal, Search, X,
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle,
  UserPlus, Trash2, RefreshCw, BookOpen, Layers,
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudents, createStudent, deleteStudent } from "../../api/students";
import { fetchSubjects } from "../../api/subjects";
import StudentDetailPanel from "./StudentDetailPanel";
import AssignSubjectsModal from "./AssignSubjectsModal";

/* ─── small field helpers ───────────────────────────────── */
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
});

function FieldInput({ label, required, error, ...props }) {
  return formField(label,
    <>
      <input style={inputStyle(error)} {...props} />
      {error && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{error}</div>}
    </>,
    required);
}

function FieldPassword({ label, required, error, ...props }) {
  const [show, setShow] = useState(false);
  return formField(label,
    <>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} style={{ ...inputStyle(error), paddingRight: 36 }} {...props} />
        <button type="button" onClick={() => setShow(s => !s)} style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: C.low, display: "flex", padding: 0,
        }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && <div style={{ color: C.danger, fontSize: 11, marginTop: 3, fontFamily: sans }}>{error}</div>}
    </>,
    required);
}

/* ─── Add Student Drawer ──────────────────────────────── */
const EMPTY = {
  first_name: "", last_name: "", username: "", email: "",
  phone_number: "", organization: "Blitz Cyber Lab",
  password: "", confirm_password: "",
  subject_ids: [],
};

function AddStudentDrawer({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    fetchSubjects()
      .then(res => setAvailableSubjects(res.results || []))
      .catch(() => {})
      .finally(() => setLoadingSubjects(false));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleSubject = (id) => {
    setForm(f => ({
      ...f,
      subject_ids: f.subject_ids.includes(id)
        ? f.subject_ids.filter(x => x !== id)
        : [...f.subject_ids, id]
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required.";
    if (!form.username.trim()) e.username = "Username is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Min. 8 characters.";
    if (form.password !== form.confirm_password) e.confirm_password = "Passwords do not match.";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setGlobalError(""); setErrors({});
    try {
      const res = await createStudent(form);
      onCreated(res.student);
    } catch (err) {
      setGlobalError(err.message || "Failed to create student.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 1000 }} />
      <div style={{
        position: "fixed", top: 0, right: 0, width: 480, height: "100vh",
        background: C.panel, borderLeft: `1px solid ${C.border}`,
        zIndex: 1001, display: "flex", flexDirection: "column",
        boxShadow: "-12px 0 48px rgba(0,0,0,0.5)",
        animation: "slideIn 200ms ease",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.amber, letterSpacing: "0.08em", marginBottom: 3 }}>ADMIN ACTION</div>
            <h2 style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: C.hi, margin: 0 }}>Add New Student</h2>
          </div>
          <button onClick={onClose} style={{ background: C.panel3, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", color: C.mid, padding: 5, display: "flex" }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ flex: 1, overflowY: "auto", padding: "24px 24px 0" }}>
          {globalError && (
            <div style={{ display: "flex", gap: 8, background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.35)", borderRadius: 7, padding: "10px 12px", marginBottom: 20, color: "#fca5a5", fontSize: 12.5, fontFamily: sans, alignItems: "flex-start" }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {globalError}
            </div>
          )}

          <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.05em", marginBottom: 14 }}>PERSONAL INFORMATION</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <FieldInput label="First Name" required placeholder="e.g. Rohith" value={form.first_name} onChange={set("first_name")} error={errors.first_name} />
            <FieldInput label="Last Name" placeholder="e.g. Kumar" value={form.last_name} onChange={set("last_name")} error={errors.last_name} />
          </div>
          <FieldInput label="Email Address" required type="email" placeholder="student@example.com" value={form.email} onChange={set("email")} error={errors.email} />
          <FieldInput label="Username" required placeholder="e.g. rohith_k" value={form.username} onChange={set("username")} error={errors.username} />
          <FieldInput label="Phone Number" placeholder="+91 98765 43210" value={form.phone_number} onChange={set("phone_number")} error={errors.phone_number} />
          <FieldInput label="Organization / Batch" placeholder="Blitz Cyber Lab" value={form.organization} onChange={set("organization")} error={errors.organization} />

          {/* Initial Subjects Selection */}
          <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.05em", marginBottom: 10, marginTop: 6, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            ASSIGN SUBJECTS (OPTIONAL)
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 8 }}>
              Select subjects to assign this student immediately (controls lab access):
            </div>
            {loadingSubjects ? (
              <div style={{ color: C.low, fontFamily: sans, fontSize: 12 }}>Loading subjects...</div>
            ) : availableSubjects.length === 0 ? (
              <div style={{ color: C.low, fontFamily: sans, fontSize: 12 }}>No subjects available.</div>
            ) : (
              <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, padding: "4px 2px" }}>
                {availableSubjects.map((s) => {
                  const isChecked = form.subject_ids.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                        background: isChecked ? "rgba(240, 180, 41, 0.08)" : C.panel2,
                        border: `1px solid ${isChecked ? C.amber : C.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ accentColor: C.amber, cursor: "pointer" }}
                        />
                        <span style={{ fontFamily: sans, fontSize: 12, color: isChecked ? C.hi : C.mid, fontWeight: isChecked ? 600 : 400 }}>
                          {s.name}
                        </span>
                        {s.code && (
                          <span style={{ fontFamily: mono, fontSize: 10, color: C.cyan, background: "rgba(63,216,200,0.1)", padding: "1px 5px", borderRadius: 3 }}>
                            {s.code}
                          </span>
                        )}
                      </div>
                      {s.credits_or_hours ? (
                        <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>
                          {s.credits_or_hours} hrs
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.05em", marginBottom: 14, marginTop: 6, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>SET PASSWORD</div>
          <FieldPassword label="Password" required placeholder="Min. 8 characters" value={form.password} onChange={set("password")} error={errors.password} />
          <FieldPassword label="Confirm Password" required placeholder="Re-enter password" value={form.confirm_password} onChange={set("confirm_password")} error={errors.confirm_password} />
        </form>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, flexShrink: 0 }}>
          <Btn variant="outline" onClick={onClose} style={{ flex: 1, padding: "10px 0" }}>Cancel</Btn>
          <Btn icon={loading ? Loader2 : UserPlus} disabled={loading} onClick={submit} style={{ flex: 2, padding: "10px 0" }}>
            {loading ? "Creating..." : "Create Student"}
          </Btn>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

/* ─── Confirm Deactivate ──────────────────────────────── */
function ConfirmDialog({ student, onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 380, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 28, zIndex: 1101, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, marginBottom: 8 }}>Deactivate Student?</div>
        <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.55, marginBottom: 22 }}>
          <strong style={{ color: C.hi }}>{student.full_name || student.username}</strong> will lose platform access. This can be reversed from the server.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={onCancel} style={{ flex: 1 }}>Cancel</Btn>
          <Btn icon={Trash2} onClick={onConfirm} style={{ flex: 1, background: C.danger, border: `1px solid ${C.danger}`, color: "#fff" }}>Deactivate</Btn>
        </div>
      </div>
    </>
  );
}

/* ─── Toast ──────────────────────────────────────────── */
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28,
      background: type === "success" ? "rgba(20,60,40,0.97)" : "rgba(60,20,20,0.97)",
      border: `1px solid ${type === "success" ? "rgba(63,216,200,0.4)" : "rgba(229,83,75,0.4)"}`,
      borderRadius: 8, padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 10,
      color: type === "success" ? C.cyan : "#fca5a5",
      fontFamily: sans, fontSize: 13, zIndex: 1200,
      animation: "fadeUp 200ms ease",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

/* ─── Avatar color ───────────────────────────────────── */
const AVATAR_COLORS = ["#B87A15", "#1A7A6E", "#6B4FBB", "#1A5E8A", "#8A3A3A"];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ─── Main Component ─────────────────────────────────── */
const FEE_TONE = { PAID: "cyan", DUE: "danger", PARTIAL: "warn" };

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [assignSubjectsStudent, setAssignSubjectsStudent] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await fetchStudents(search);
      setStudents(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Close action menus on outside click
  useEffect(() => {
    const h = () => setMenuOpen(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  const handleCreated = (student) => {
    setShowAddDrawer(false);
    setStudents(prev => [student, ...prev]);
    setToast({ message: `${student.full_name || student.username} added!`, type: "success" });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const s = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteStudent(s.id);
      setStudents(prev => prev.filter(x => x.id !== s.id));
      if (selectedStudent?.id === s.id) setSelectedStudent(null);
      setToast({ message: `${s.full_name || s.username} deactivated.`, type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Failed.", type: "error" });
    }
  };

  const activeCount = students.filter(s => s.is_active).length;

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: "0 0 4px" }}>Students</h1>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
            {loading ? "Loading..." : `${students.length} student${students.length !== 1 ? "s" : ""} · ${activeCount} active`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: C.low, display: "flex", padding: 4 }} title="Refresh">
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
          <Btn icon={Plus} onClick={() => setShowAddDrawer(true)}>Add Student</Btn>
        </div>
      </div>

      {/* Search */}
      <div style={{
        marginTop: 18, marginBottom: 16,
        display: "flex", alignItems: "center", gap: 8,
        background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: "8px 12px", maxWidth: 420,
      }}>
        <Search size={14} color={C.low} />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by name or email..."
          style={{ background: "none", border: "none", outline: "none", fontFamily: sans, fontSize: 13, color: C.hi, flex: 1 }}
        />
        {searchInput && <X size={13} color={C.low} style={{ cursor: "pointer" }} onClick={() => setSearchInput("")} />}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(229,83,75,0.1)", border: "1px solid rgba(229,83,75,0.3)", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontFamily: sans, fontSize: 13, display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <AlertCircle size={15} />
          {error}
          <span onClick={load} style={{ marginLeft: "auto", color: C.cyan, cursor: "pointer", fontSize: 12 }}>Retry</span>
        </div>
      )}

      {/* Table */}
      {!error && (
        <Panel style={{ overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.5fr 1.7fr 0.8fr 0.8fr 0.4fr", padding: "10px 18px", borderBottom: `1px solid ${C.border}`, fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em" }}>
            <div>NAME</div>
            <div>EMAIL</div>
            <div>SUBJECTS</div>
            <div>STATUS</div>
            <div>JOINED</div>
            <div />
          </div>

          {/* Empty state */}
          {!loading && students.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: sans, color: C.low, fontSize: 13 }}>
              {search ? `No students match "${search}".` : 'No students yet. Click "Add Student" to get started.'}
            </div>
          )}

          {/* Loading skeletons */}
          {loading && [1, 2, 3].map(i => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.7fr 1.5fr 1.7fr 0.8fr 0.8fr 0.4fr", padding: "13px 18px", alignItems: "center", borderTop: `1px solid ${C.border}`, gap: 12 }}>
              {[120, 160, 110, 60, 50, 20].map((w, j) => (
                <div key={j} style={{ height: 12, width: w, borderRadius: 4, background: C.panel3, animation: "pulse 1.4s ease infinite" }} />
              ))}
            </div>
          ))}

          {/* Student rows */}
          {!loading && students.map((s, i) => {
            const initials = (s.full_name || s.username || "?")[0].toUpperCase();
            const bg = avatarColor(s.full_name || s.username || "");
            const joined = s.date_joined
              ? new Date(s.date_joined).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
              : "—";
            const isMenuOpen = menuOpen === s.id;
            const isSelected = selectedStudent?.id === s.id;
            const enrolledSubjects = s.enrolled_subjects || [];

            return (
              <div
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.7fr 1.5fr 1.7fr 0.8fr 0.8fr 0.4fr",
                  padding: "13px 18px",
                  alignItems: "center",
                  borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                  cursor: "pointer",
                  background: isSelected ? C.panel2 : "transparent",
                  transition: "background 100ms",
                  position: "relative",
                  borderLeft: isSelected ? `3px solid ${C.amber}` : "3px solid transparent",
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Name + avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 7, background: bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: mono, fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>{s.full_name || s.username}</div>
                    <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>@{s.username}</div>
                  </div>
                </div>

                {/* Email */}
                <span style={{ fontFamily: mono, fontSize: 11.5, color: C.mid }}>{s.email || "—"}</span>

                {/* Subjects pills with click to assign */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignSubjectsStudent(s);
                  }}
                  title="Click to assign or manage multiple subjects (controls lab access)"
                  style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}
                >
                  {enrolledSubjects.length > 0 ? (
                    <>
                      {enrolledSubjects.slice(0, 2).map((subj) => (
                        <span
                          key={subj.id}
                          style={{
                            fontFamily: sans,
                            fontSize: 11,
                            fontWeight: 600,
                            color: C.amber,
                            background: "rgba(240,180,41,0.1)",
                            border: "1px solid rgba(240,180,41,0.25)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            whiteSpace: "nowrap",
                            maxWidth: 115,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {subj.code || subj.name}
                        </span>
                      ))}
                      {enrolledSubjects.length > 2 && (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10,
                            color: C.mid,
                            background: C.panel3,
                            padding: "2px 5px",
                            borderRadius: 4,
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          +{enrolledSubjects.length - 2}
                        </span>
                      )}
                    </>
                  ) : (
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 11,
                        color: C.low,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: C.panel3,
                        padding: "3px 8px",
                        borderRadius: 4,
                        border: `1px dashed ${C.border}`,
                        transition: "all 120ms ease",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.amber; e.currentTarget.style.borderColor = C.amber; }}
                      onMouseLeave={e => { e.currentTarget.style.color = C.low; e.currentTarget.style.borderColor = C.border; }}
                    >
                      <Plus size={11} /> Assign
                    </span>
                  )}
                </div>

                {/* Status */}
                <div><Badge tone={s.is_active ? "cyan" : "danger"}>{s.is_active ? "ACTIVE" : "INACTIVE"}</Badge></div>

                {/* Joined */}
                <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>{joined}</span>

                {/* Actions */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={e => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : s.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, color: C.low, display: "flex" }}
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {isMenuOpen && (
                    <div
                      style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, minWidth: 165, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => { setMenuOpen(null); setAssignSubjectsStudent(s); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", background: "none", border: "none", color: C.amber, fontFamily: sans, fontSize: 12.5, cursor: "pointer", borderRadius: 5, textAlign: "left", fontWeight: 600 }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(240,180,41,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <Layers size={13} color={C.amber} /> Assign Subjects
                      </button>
                      <button
                        onClick={() => { setMenuOpen(null); setSelectedStudent(s); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", background: "none", border: "none", color: C.mid, fontFamily: sans, fontSize: 12.5, cursor: "pointer", borderRadius: 5, textAlign: "left" }}
                        onMouseEnter={e => e.currentTarget.style.background = C.panel2}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <Eye size={13} /> View Details
                      </button>
                      <button
                        onClick={() => { setMenuOpen(null); setConfirmDelete(s); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", background: "none", border: "none", color: C.danger, fontFamily: sans, fontSize: 12.5, cursor: "pointer", borderRadius: 5, textAlign: "left" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(229,83,75,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <Trash2 size={13} /> Deactivate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Panel>
      )}

      {/* ── Modals & Panels ── */}
      {showAddDrawer && <AddStudentDrawer onClose={() => setShowAddDrawer(false)} onCreated={handleCreated} />}

      {assignSubjectsStudent && (
        <AssignSubjectsModal
          student={assignSubjectsStudent}
          onClose={() => setAssignSubjectsStudent(null)}
          onUpdated={(updatedStudent) => {
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            if (selectedStudent?.id === updatedStudent.id) {
              setSelectedStudent(updatedStudent);
            }
            setToast({
              message: `Subjects updated for ${updatedStudent.full_name || updatedStudent.username}!`,
              type: "success",
            });
          }}
        />
      )}

      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onStudentUpdate={(updated) => setStudents(prev => prev.map(s => s.id === updated.id ? updated : s))}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog student={confirmDelete} onConfirm={handleDeleteConfirm} onCancel={() => setConfirmDelete(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
      `}</style>
    </div>
  );
}

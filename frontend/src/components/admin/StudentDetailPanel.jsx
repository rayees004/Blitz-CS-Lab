import React, { useState, useEffect, useCallback } from "react";
import {
  X, BookOpen, Plus, AlertCircle, Loader2, CheckCircle,
  PauseCircle, PlayCircle, Trash2, ChevronDown, Mail,
  Phone, Building2, Calendar, User, Shield,
} from "lucide-react";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentEnrollments, fetchCourses, enrollStudent, updateEnrollment, removeEnrollment } from "../../api/courses";

/* ─── Helpers ─────────────────────────────────────────── */
const FEE_TONE = { PAID: "cyan", DUE: "danger", PARTIAL: "warn" };
const FEE_OPTIONS = ["PAID", "DUE", "PARTIAL"];

const AVATAR_COLORS = ["#B87A15", "#1A7A6E", "#6B4FBB", "#1A5E8A", "#8A3A3A"];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{ color: C.low, marginTop: 1, flexShrink: 0 }}>
        <Icon size={14} />
      </div>
      <div>
        <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginBottom: 1 }}>{label}</div>
        <div style={{ fontFamily: mono, fontSize: 12.5, color: C.mid }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Fee Status Dropdown ─────────────────────────────── */
function FeeDropdown({ enrollment, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = async (status) => {
    setOpen(false);
    if (status === enrollment.fee_status) return;
    setLoading(true);
    try {
      const res = await updateEnrollment(enrollment.id, { fee_status: status });
      onUpdate(res.enrollment);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          border: "none",
          cursor: loading ? "wait" : "pointer",
          padding: 0,
        }}
      >
        {loading
          ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite", color: C.low }} />
          : <Badge tone={FEE_TONE[enrollment.fee_status]}>{enrollment.fee_status}</Badge>
        }
        <ChevronDown size={11} color={C.low} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: 4,
            zIndex: 201,
            minWidth: 110,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            {FEE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => change(opt)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  width: "100%",
                  padding: "7px 10px",
                  background: enrollment.fee_status === opt ? C.panel2 : "none",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontFamily: mono,
                  fontSize: 11,
                  color: opt === "PAID" ? C.cyan : opt === "DUE" ? C.danger : C.warn,
                  textAlign: "left",
                }}
              >
                {enrollment.fee_status === opt && <CheckCircle size={10} />}
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Enrollment Card ─────────────────────────────────── */
function EnrollmentCard({ enrollment, onUpdate, onRemove }) {
  const [holdLoading, setHoldLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [showHoldInput, setShowHoldInput] = useState(false);
  const [holdReason, setHoldReason] = useState(enrollment.hold_reason || "");

  const toggleHold = async () => {
    const newHold = !enrollment.is_on_hold;
    if (newHold) { setShowHoldInput(true); return; }
    setHoldLoading(true);
    try {
      const res = await updateEnrollment(enrollment.id, { is_on_hold: false, hold_reason: "" });
      onUpdate(res.enrollment);
    } catch { /* silent */ }
    finally { setHoldLoading(false); }
  };

  const confirmHold = async () => {
    setHoldLoading(true);
    setShowHoldInput(false);
    try {
      const res = await updateEnrollment(enrollment.id, { is_on_hold: true, hold_reason: holdReason });
      onUpdate(res.enrollment);
    } catch { /* silent */ }
    finally { setHoldLoading(false); }
  };

  const handleRemove = async () => {
    setRemoveLoading(true);
    try {
      await removeEnrollment(enrollment.id);
      onRemove(enrollment.id);
    } catch { /* silent */ }
    finally { setRemoveLoading(false); }
  };

  const enrolledDate = enrollment.enrolled_at
    ? new Date(enrollment.enrolled_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
    : "—";

  return (
    <div style={{
      background: C.panel2,
      border: `1px solid ${enrollment.is_on_hold ? "rgba(229,83,75,0.4)" : C.border}`,
      borderRadius: 9,
      padding: "14px 16px",
      marginBottom: 10,
      transition: "border-color 200ms",
    }}>
      {/* Top row: course name + fee + hold badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi, marginBottom: 3 }}>
            {enrollment.course.name}
          </div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>
            {enrollment.course.duration_weeks}w · ₹{Number(enrollment.course.price).toLocaleString("en-IN")}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {enrollment.is_on_hold && (
            <Badge tone="danger">HOLD</Badge>
          )}
          <FeeDropdown enrollment={enrollment} onUpdate={onUpdate} />
        </div>
      </div>

      {/* Hold reason (if on hold) */}
      {enrollment.is_on_hold && enrollment.hold_reason && (
        <div style={{
          background: "rgba(229,83,75,0.08)",
          border: "1px solid rgba(229,83,75,0.2)",
          borderRadius: 5,
          padding: "6px 10px",
          fontFamily: sans,
          fontSize: 11.5,
          color: "#fca5a5",
          marginBottom: 10,
        }}>
          Hold reason: {enrollment.hold_reason}
        </div>
      )}

      {/* Hold reason input */}
      {showHoldInput && (
        <div style={{ marginBottom: 10 }}>
          <input
            autoFocus
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            placeholder="Reason for hold (optional)"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12,
              color: C.hi,
              outline: "none",
              marginBottom: 6,
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={confirmHold} style={{
              flex: 1, padding: "6px", background: C.danger, border: "none",
              borderRadius: 5, color: "#fff", fontFamily: sans, fontSize: 12, cursor: "pointer"
            }}>
              Confirm Hold
            </button>
            <button onClick={() => setShowHoldInput(false)} style={{
              flex: 1, padding: "6px", background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 5, color: C.mid, fontFamily: sans, fontSize: 12, cursor: "pointer"
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom row: enrolled date + action buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>
          Enrolled {enrolledDate}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={toggleHold}
            disabled={holdLoading || showHoldInput}
            title={enrollment.is_on_hold ? "Release hold" : "Place on hold"}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px",
              background: enrollment.is_on_hold ? "rgba(229,83,75,0.1)" : C.panel3,
              border: `1px solid ${enrollment.is_on_hold ? "rgba(229,83,75,0.35)" : C.border}`,
              borderRadius: 5,
              color: enrollment.is_on_hold ? C.danger : C.mid,
              fontFamily: sans, fontSize: 11.5,
              cursor: holdLoading ? "wait" : "pointer",
            }}
          >
            {holdLoading
              ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              : enrollment.is_on_hold
                ? <><PlayCircle size={11} /> Release</>
                : <><PauseCircle size={11} /> Hold</>
            }
          </button>

          <button
            onClick={handleRemove}
            disabled={removeLoading}
            title="Remove from course"
            style={{
              display: "flex", alignItems: "center",
              padding: "5px 8px",
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 5,
              color: C.low,
              cursor: removeLoading ? "wait" : "pointer",
            }}
          >
            {removeLoading
              ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              : <Trash2 size={11} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Enroll Course Picker ───────────────────────────── */
function EnrollForm({ studentId, enrolledCourseIds, onEnrolled, onCancel }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [feeStatus, setFeeStatus] = useState("DUE");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetchCourses()
      .then((d) => setCourses(d.results || []))
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  const available = courses.filter((c) => !enrolledCourseIds.includes(c.id));

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) { setError("Please select a course."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await enrollStudent(studentId, parseInt(selectedCourse), feeStatus, notes);
      onEnrolled(res.enrollment);
    } catch (err) {
      setError(err.message || "Enrollment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
    }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.amber, letterSpacing: "0.06em", marginBottom: 10 }}>
        ENROLL IN COURSE
      </div>

      {error && (
        <div style={{ display: "flex", gap: 7, color: "#fca5a5", fontSize: 12, fontFamily: sans, marginBottom: 10, alignItems: "center" }}>
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>Course *</div>
          {loadingCourses
            ? <div style={{ color: C.low, fontSize: 12, fontFamily: sans }}>Loading courses...</div>
            : available.length === 0
              ? <div style={{ color: C.low, fontSize: 12, fontFamily: sans }}>Student is already enrolled in all available courses.</div>
              : (
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  style={{
                    width: "100%",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontFamily: sans, fontSize: 12.5,
                    color: C.hi,
                    outline: "none",
                  }}
                >
                  <option value="">Select a course...</option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )
          }
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>Fee Status</div>
          <div style={{ display: "flex", gap: 6 }}>
            {FEE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFeeStatus(opt)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 5,
                  border: `1px solid ${feeStatus === opt
                    ? (opt === "PAID" ? C.cyan : opt === "DUE" ? C.danger : C.warn)
                    : C.border}`,
                  background: feeStatus === opt
                    ? (opt === "PAID" ? "rgba(63,216,200,0.1)" : opt === "DUE" ? "rgba(229,83,75,0.1)" : "rgba(240,180,41,0.1)")
                    : C.panel2,
                  color: feeStatus === opt
                    ? (opt === "PAID" ? C.cyan : opt === "DUE" ? C.danger : C.warn)
                    : C.low,
                  fontFamily: mono,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>Notes (optional)</div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this enrollment..."
            style={{
              width: "100%", boxSizing: "border-box",
              background: C.panel2, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "7px 10px",
              fontFamily: sans, fontSize: 12, color: C.hi, outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: "8px", background: "none",
              border: `1px solid ${C.border}`, borderRadius: 6,
              color: C.mid, fontFamily: sans, fontSize: 12.5, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || available.length === 0}
            style={{
              flex: 2, padding: "8px", background: C.amber,
              border: "none", borderRadius: 6,
              color: "#1A1200", fontFamily: sans, fontSize: 12.5,
              fontWeight: 600, cursor: loading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              opacity: available.length === 0 ? 0.5 : 1,
            }}
          >
            {loading
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Enrolling...</>
              : <><BookOpen size={13} /> Enroll Student</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Main Panel ─────────────────────────────────────── */
export default function StudentDetailPanel({ student, onClose, onStudentUpdate }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  const loadEnrollments = useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchStudentEnrollments(student.id);
      setEnrollments(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to load enrollments.");
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => { loadEnrollments(); }, [loadEnrollments]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleEnrollmentUpdate = (updated) => {
    setEnrollments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleEnrollmentRemove = (id) => {
    setEnrollments((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEnrolled = (newEnrollment) => {
    setEnrollments((prev) => [newEnrollment, ...prev]);
    setShowEnrollForm(false);
  };

  const joinedDate = student?.date_joined
    ? new Date(student.date_joined).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const avatarBg = avatarColor(student?.full_name || student?.username || "");
  const initials = (student?.full_name || student?.username || "?")[0].toUpperCase();
  const enrolledCourseIds = enrollments.map((e) => e.course.id);

  const feeWorst = enrollments.reduce((worst, e) => {
    if (e.fee_status === "DUE") return "DUE";
    if (worst !== "DUE" && e.fee_status === "PARTIAL") return "PARTIAL";
    return worst;
  }, "PAID");

  const hasHold = enrollments.some((e) => e.is_on_hold);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", zIndex: 900 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: 500, height: "100vh",
        background: C.void,
        borderLeft: `1px solid ${C.border}`,
        zIndex: 901,
        display: "flex", flexDirection: "column",
        boxShadow: "-16px 0 60px rgba(0,0,0,0.55)",
        animation: "slideIn 200ms ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 22px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.low, letterSpacing: "0.06em" }}>
            STUDENT PROFILE
          </div>
          <button
            onClick={onClose}
            style={{
              background: C.panel3, border: `1px solid ${C.border}`,
              borderRadius: 6, cursor: "pointer", color: C.mid,
              padding: 5, display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 22px 0" }}>
          {/* Profile card */}
          <div style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}>
            {/* Avatar + name row */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: avatarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: mono, fontSize: 22, fontWeight: 700, color: "#fff",
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: sans, fontSize: 17, fontWeight: 700, color: C.hi, marginBottom: 3 }}>
                  {student?.full_name || student?.username}
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginBottom: 8 }}>
                  @{student?.username}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Badge tone={student?.is_active ? "cyan" : "danger"}>
                    {student?.is_active ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  {enrollments.length > 0 && (
                    <Badge tone={FEE_TONE[feeWorst]}>{feeWorst} FEE</Badge>
                  )}
                  {hasHold && <Badge tone="danger">ON HOLD</Badge>}
                </div>
              </div>
            </div>

            {/* Info rows */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <InfoRow icon={Mail} label="Email Address" value={student?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={student?.phone_number || "—"} />
              <InfoRow icon={Building2} label="Organization" value={student?.organization} />
              <InfoRow icon={Calendar} label="Enrolled On" value={joinedDate} />
              <InfoRow icon={Shield} label="Account Type" value="Student" />
            </div>
          </div>

          {/* Enrollments section */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <div>
                <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>
                  Course Enrollments
                </div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, marginTop: 2 }}>
                  {loading ? "Loading..." : `${enrollments.length} course${enrollments.length !== 1 ? "s" : ""} enrolled`}
                </div>
              </div>
              {!showEnrollForm && (
                <button
                  onClick={() => setShowEnrollForm(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px",
                    background: C.panel,
                    border: `1px solid ${C.borderLight}`,
                    borderRadius: 7,
                    color: C.hi, fontFamily: sans, fontSize: 12, cursor: "pointer",
                  }}
                >
                  <Plus size={13} color={C.amber} />
                  Add Course
                </button>
              )}
            </div>

            {showEnrollForm && (
              <EnrollForm
                studentId={student?.id}
                enrolledCourseIds={enrolledCourseIds}
                onEnrolled={handleEnrolled}
                onCancel={() => setShowEnrollForm(false)}
              />
            )}

            {error && (
              <div style={{ color: "#fca5a5", fontSize: 12, fontFamily: sans, marginBottom: 12, display: "flex", gap: 7, alignItems: "center" }}>
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.low, fontFamily: sans, fontSize: 12, padding: "20px 0" }}>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                Loading enrollments...
              </div>
            )}

            {!loading && enrollments.length === 0 && !showEnrollForm && (
              <div style={{
                background: C.panel,
                border: `1px dashed ${C.border}`,
                borderRadius: 10,
                padding: "28px 20px",
                textAlign: "center",
              }}>
                <BookOpen size={28} color={C.low} style={{ marginBottom: 10 }} />
                <div style={{ fontFamily: sans, fontSize: 13, color: C.mid, marginBottom: 6 }}>
                  Not enrolled in any courses yet
                </div>
                <button
                  onClick={() => setShowEnrollForm(true)}
                  style={{
                    background: "none", border: "none", color: C.amber,
                    fontFamily: sans, fontSize: 12.5, cursor: "pointer", textDecoration: "underline",
                  }}
                >
                  Enroll in first course →
                </button>
              </div>
            )}

            {!loading && enrollments.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                onUpdate={handleEnrollmentUpdate}
                onRemove={handleEnrollmentRemove}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px",
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <Btn variant="outline" onClick={onClose} style={{ width: "100%", padding: "9px 0" }}>
            Close
          </Btn>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FileBadge, Search, RefreshCw, CheckCircle2, Calendar, FlaskConical, Hourglass } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentCertificates } from "../../api/labs";
import SubjectCertificateModal from "./SubjectCertificateModal";
import { formatDate, attendedLabs, LAB_STATUS_LABEL } from "./SubjectCertificateDocument";

// Certificates are computed live on the server from the student's lab scores:
// re-fetch while this page is open so score, report and progress count stay current
const AUTO_REFRESH_MS = 30000;

// Matches the rgba(0, 230, 118, …) accents (the theme has no green token)
const GREEN = "#00E676";
const STATUS_COLOR = { COMPLETED: GREEN, IN_PROGRESS: C.amber, EXPIRED: C.danger };

/**
 * Subject-based certificates only (no per-lab certificates): one per assigned subject (CEH, CHFI, SOC, CPENT, ...).
 * Each certificate exists from the start (empty) and updates automatically as the student attends the
 * subject's labs: certification score (out of all assigned labs), labs attended / completed, and a report
 * of the attended labs only.
 */
export default function StudentCertificates({ currentUser }) {
  const [certificates, setCertificates] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const requestSeq = useRef(0);
  const lastFetchAt = useRef(0);

  // silent: background refresh that keeps the current view (no spinner, no error banner)
  const loadData = useCallback(async ({ silent = false } = {}) => {
    const seq = ++requestSeq.current;
    lastFetchAt.current = Date.now();
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetchStudentCertificates();
      if (seq !== requestSeq.current) return; // a newer request will update the view
      setCertificates(res.certificates || []);
      setStudentName(res.student_name || "");
      setLastSynced(new Date());
      setError(null);
    } catch (err) {
      if (seq === requestSeq.current && !silent) setError(err.message || "Failed to load certificates.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchAt.current < 3000) return; // focus + visibilitychange fire together
      loadData({ silent: true });
    };
    const timer = setInterval(refresh, AUTO_REFRESH_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadData]);

  const recipient =
    studentName ||
    (currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim() : null) ||
    currentUser?.username ||
    "Student";

  const q = search.trim().toLowerCase();
  const filtered = certificates.filter(
    (c) =>
      !q ||
      (c.subject_name || "").toLowerCase().includes(q) ||
      (c.subject_code || "").toLowerCase().includes(q) ||
      (c.course_name || "").toLowerCase().includes(q) ||
      (c.certificate_id || "").toLowerCase().includes(q) ||
      attendedLabs(c).some((l) => (l.lab_name || "").toLowerCase().includes(q))
  );
  const completedCount = certificates.filter((c) => c.is_complete).length;
  // The open certificate follows the auto-refreshed data
  const selected = selectedId != null ? certificates.find((c) => c.subject_id === selectedId) || null : null;
  const showSpinner = loading && certificates.length === 0;

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
              Subject Certificates
            </h1>
            <span
              style={{
                fontFamily: mono, fontSize: 11, color: C.amber, background: "rgba(245, 166, 35, 0.12)",
                padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(245, 166, 35, 0.3)", fontWeight: 600,
              }}
            >
              {certificates.length} Subject{certificates.length !== 1 ? "s" : ""} · {completedCount} Completed
            </span>
          </div>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6, marginBottom: 0, maxWidth: 680 }}>
            One certificate for each of your subjects (CEH, CHFI, SOC, CPENT, ...). It shows your certification score,
            how many of the subject's labs you have attended, and a report of the labs you attended.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10.5, color: C.low, marginTop: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} />
            <span>
              Updates automatically as you attend labs
              {lastSynced &&
                ` · last synced ${lastSynced.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8, background: C.panel,
              border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: "7px 12px", width: 240,
            }}
          >
            <Search size={14} color={C.low} />
            <input
              type="text"
              placeholder="Search subject or lab..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", fontFamily: sans, fontSize: 12.5, color: C.hi, outline: "none", width: "100%" }}
            />
          </div>
          <Btn icon={RefreshCw} tone="ghost" sm onClick={() => loadData()}>
            {loading ? "Syncing..." : "Refresh"}
          </Btn>
        </div>
      </div>

      {/* Recipient banner */}
      <div
        style={{
          marginTop: 22, padding: "16px 20px", borderRadius: 10,
          background: "linear-gradient(90deg, rgba(245, 166, 35, 0.08) 0%, rgba(0, 229, 255, 0.05) 100%)",
          border: "1px solid rgba(245, 166, 35, 0.3)", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 10, background: "rgba(245, 166, 35, 0.15)",
              border: "1px solid rgba(245, 166, 35, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <FileBadge size={22} color={C.amber} />
          </div>
          <div>
            <div style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>Subject-Based Certification</div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 2 }}>
              Page 1: certification score and progress · Next pages: report of the labs you attended. Download as PDF.
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>STUDENT RECIPIENT</div>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.cyan }}>{recipient}</div>
        </div>
      </div>

      {showSpinner ? (
        <Panel style={{ padding: 60, textAlign: "center", color: C.mid, marginTop: 24 }}>
          <RefreshCw size={26} color={C.cyan} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div style={{ fontFamily: sans, fontSize: 14 }}>Retrieving your subject certificates...</div>
        </Panel>
      ) : error ? (
        <Panel style={{ padding: 24, marginTop: 24, border: "1px solid rgba(229,83,75,0.3)", background: "rgba(229,83,75,0.08)" }}>
          <div style={{ color: C.danger, fontFamily: sans, fontSize: 13, fontWeight: 600 }}>{error}</div>
          <Btn sm onClick={() => loadData()} style={{ marginTop: 8 }}>Retry</Btn>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel style={{ padding: 50, textAlign: "center", marginTop: 24, background: C.panel, border: `1px dashed ${C.border}` }}>
          <FileBadge size={30} color={C.amber} style={{ marginBottom: 12 }} />
          <h3 style={{ fontFamily: sans, fontSize: 17, fontWeight: 700, color: C.hi, margin: "0 0 8px" }}>
            {search ? "No certificates match your search" : "No Subjects Assigned Yet"}
          </h3>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, maxWidth: 460, margin: "0 auto", lineHeight: 1.55 }}>
            {search
              ? "Try clearing your search term to see all certificates."
              : "When you are assigned to a subject with labs, its certificate appears here and updates as you attend the labs."}
          </p>
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18, marginTop: 24 }}>
          {filtered.map((cert) => {
            const labs = attendedLabs(cert);
            const attended = cert.labs_attended ?? labs.length;
            const labsPct = cert.labs_in_subject > 0 ? Math.round((cert.labs_completed / cert.labs_in_subject) * 100) : 0;
            return (
              <Panel
                key={cert.certificate_id}
                style={{
                  padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14,
                  background: "linear-gradient(180deg, rgba(18, 20, 29, 0.9) 0%, rgba(11, 13, 20, 0.95) 100%)",
                  border: `1px solid ${cert.is_complete ? "rgba(0, 230, 118, 0.35)" : "rgba(245, 166, 35, 0.35)"}`,
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #f5a623, #00e5ff)" }} />

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    {cert.is_complete ? (
                      <span
                        style={{
                          fontFamily: mono, fontSize: 10, color: GREEN, background: "rgba(0, 230, 118, 0.12)",
                          padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(0, 230, 118, 0.3)",
                          display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={10} /> COMPLETED
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: mono, fontSize: 10, color: C.amber, background: "rgba(245, 166, 35, 0.12)",
                          padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(245, 166, 35, 0.3)",
                          display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 600,
                        }}
                      >
                        <Hourglass size={10} /> IN PROGRESS
                      </span>
                    )}
                    <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber }}>{cert.certificate_id}</span>
                  </div>

                  <h3 style={{ fontFamily: sans, fontSize: 17, fontWeight: 700, color: C.hi, margin: "0 0 4px" }}>
                    {cert.subject_name}
                    {cert.subject_code && cert.subject_code !== cert.subject_name && (
                      <span style={{ fontFamily: mono, fontSize: 11.5, color: C.mid, fontWeight: 500 }}> · {cert.subject_code}</span>
                    )}
                  </h3>
                  {cert.course_name && (
                    <div style={{ fontFamily: mono, fontSize: 11, color: C.cyan, marginBottom: 10 }}>Course: {cert.course_name}</div>
                  )}

                  <div
                    style={{
                      background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px",
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, textTransform: "uppercase" }}>Cert. Score</div>
                      <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: GREEN }}>
                        {cert.total_score}/{cert.max_score}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, textTransform: "uppercase" }}>Labs Attended</div>
                      <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.hi }}>
                        {attended} of {cert.labs_in_subject}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, textTransform: "uppercase" }}>Questions</div>
                      <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.hi }}>
                        {cert.questions_solved} of {cert.questions_total}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10.5, color: C.low, marginBottom: 4 }}>
                      <span>{cert.labs_completed} of {cert.labs_in_subject} labs completed</span>
                      <span>{labsPct}%</span>
                    </div>
                    <ProgressBar value={labsPct} tone={cert.is_complete ? "cyan" : "amber"} h={5} />
                  </div>

                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, textTransform: "uppercase", marginBottom: 2 }}>
                      Attended labs report
                    </div>
                    {labs.length === 0 ? (
                      <div style={{ fontFamily: sans, fontSize: 12, color: C.low, fontStyle: "italic" }}>
                        No labs attended yet. Attend a lab of this subject and its score is added here automatically.
                      </div>
                    ) : (
                      labs.slice(0, 4).map((l) => (
                        <div key={l.lab_id} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 12, color: C.mid }}>
                          <FlaskConical size={12} color={STATUS_COLOR[l.status] || C.cyan} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.lab_name}</span>
                          {l.status !== "COMPLETED" && (
                            <span style={{ fontFamily: mono, fontSize: 10, color: STATUS_COLOR[l.status] || C.amber }}>
                              {(LAB_STATUS_LABEL[l.status] || l.status).toLowerCase()}
                            </span>
                          )}
                          <span style={{ fontFamily: mono, fontSize: 11, color: C.hi }}>{l.score}/{l.max_score}</span>
                        </div>
                      ))
                    )}
                    {labs.length > 4 && (
                      <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                        + {labs.length - 4} more attended lab{labs.length - 4 !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: mono, fontSize: 10.5, color: C.low }}>
                    <Calendar size={11} />
                    <span>
                      {cert.is_complete
                        ? `Completed ${formatDate(cert.issued_at)}`
                        : cert.last_activity_at
                        ? `Last activity ${formatDate(cert.last_activity_at)}`
                        : "Not started yet"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(cert.subject_id)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245, 166, 35, 0.15)",
                      border: "1px solid rgba(245, 166, 35, 0.4)", color: C.amber, padding: "6px 14px", borderRadius: 6,
                      fontFamily: sans, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    <FileBadge size={13} /> View Certificate
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {selected && (
        <SubjectCertificateModal certificate={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

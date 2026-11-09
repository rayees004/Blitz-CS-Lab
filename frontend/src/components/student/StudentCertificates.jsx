import React, { useState, useEffect } from "react";
import { FileBadge, Search, RefreshCw, CheckCircle2, Calendar, FlaskConical, Hourglass } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentCertificates } from "../../api/labs";
import SubjectCertificateModal from "./SubjectCertificateModal";
import { formatDate } from "./SubjectCertificateDocument";

/**
 * Subject-based certificates only (no per-lab certificates): one per assigned subject (CEH, CPENT, ...).
 * Each certificate exists from the start (empty) and fills in as the student attends the subject's labs:
 * labs attended, each lab's score, and the total score out of all assigned labs of the subject.
 */
export default function StudentCertificates({ currentUser }) {
  const [certificates, setCertificates] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchStudentCertificates();
      setCertificates(res.certificates || []);
      setStudentName(res.student_name || "");
    } catch (err) {
      setError(err.message || "Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      (c.labs || []).some((l) => (l.lab_name || "").toLowerCase().includes(q))
  );
  const completedCount = certificates.filter((c) => c.is_complete).length;

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
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6, maxWidth: 680 }}>
            One certificate for each of your subjects (CEH, CPENT, ...). It starts empty and fills in as you attend
            the subject's labs: labs attended, each lab's score and your total score out of all assigned labs.
          </p>
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
          <Btn icon={RefreshCw} tone="ghost" sm onClick={loadData}>
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
              Page 1: subject report · Next pages: every assigned lab with its score and status. Download as PDF.
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>STUDENT RECIPIENT</div>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.cyan }}>{recipient}</div>
        </div>
      </div>

      {loading ? (
        <Panel style={{ padding: 60, textAlign: "center", color: C.mid, marginTop: 24 }}>
          <RefreshCw size={26} color={C.cyan} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div style={{ fontFamily: sans, fontSize: 14 }}>Retrieving your subject certificates...</div>
        </Panel>
      ) : error ? (
        <Panel style={{ padding: 24, marginTop: 24, border: "1px solid rgba(229,83,75,0.3)", background: "rgba(229,83,75,0.08)" }}>
          <div style={{ color: C.danger, fontFamily: sans, fontSize: 13, fontWeight: 600 }}>{error}</div>
          <Btn sm onClick={loadData} style={{ marginTop: 8 }}>Retry</Btn>
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
              : "When you are assigned to a subject with labs, its certificate appears here and fills in as you attend the labs."}
          </p>
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18, marginTop: 24 }}>
          {filtered.map((cert) => {
            const attended = cert.labs_attended ?? cert.labs_completed;
            const labsPct = cert.labs_in_subject > 0 ? Math.round((cert.labs_completed / cert.labs_in_subject) * 100) : 0;
            const attendedLabs = (cert.labs || []).filter((l) => l.status !== "NOT_ATTENDED");
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
                          fontFamily: mono, fontSize: 10, color: C.green, background: "rgba(0, 230, 118, 0.12)",
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
                      <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, textTransform: "uppercase" }}>Total Score</div>
                      <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.green }}>
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
                      <span>{cert.labs_completed} of {cert.labs_in_subject} assigned labs completed</span>
                      <span>{labsPct}%</span>
                    </div>
                    <ProgressBar value={labsPct} tone={cert.is_complete ? "green" : "amber"} h={5} />
                  </div>

                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                    {attendedLabs.length === 0 ? (
                      <div style={{ fontFamily: sans, fontSize: 12, color: C.low, fontStyle: "italic" }}>
                        No labs attended yet — attend a lab of this subject to add its score here.
                      </div>
                    ) : (
                      attendedLabs.slice(0, 3).map((l) => (
                        <div key={l.lab_id} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 12, color: C.mid }}>
                          <FlaskConical size={12} color={l.status === "COMPLETED" ? C.green : C.amber} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.lab_name}</span>
                          {l.status === "IN_PROGRESS" && (
                            <span style={{ fontFamily: mono, fontSize: 10, color: C.amber }}>in progress</span>
                          )}
                          <span style={{ fontFamily: mono, fontSize: 11, color: C.hi }}>{l.score}/{l.max_score}</span>
                        </div>
                      ))
                    )}
                    {attendedLabs.length > 3 && (
                      <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                        + {attendedLabs.length - 3} more attended lab{attendedLabs.length - 3 !== 1 ? "s" : ""}
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
                        : `${cert.labs_remaining ?? cert.labs_in_subject - cert.labs_completed} lab(s) remaining`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(cert)}
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
        <SubjectCertificateModal certificate={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

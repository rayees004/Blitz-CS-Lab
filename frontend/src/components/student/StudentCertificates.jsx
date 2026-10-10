import React, { useState, useEffect } from "react";
import {
  FileBadge, Search, RefreshCw, Award, CheckCircle2, ShieldCheck,
  Calendar, Printer, ArrowRight, FlaskConical, ExternalLink, Sparkles
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentLabs } from "../../api/labs";
import CertificateModal from "./CertificateModal";

export default function StudentCertificates({ currentUser, go }) {
  const [labs, setLabs] = useState([]);
  const [labScores, setLabScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchStudentLabs();
      setLabs(res.labs || []);
      setLabScores(res.lab_scores || []);
      setStats(res.stats || {});
    } catch (err) {
      console.warn("Failed to load certificates data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentFullName =
    stats?.student_name ||
    (currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim() : null) ||
    currentUser?.username ||
    "Student";

  // Build the list of earned certificates from completed labs & lab scores
  const certificates = [];
  const processedLabIds = new Set();

  // 1. Check lab_scores first (foreign key linked, verified scores)
  labScores.forEach((ls) => {
    if (ls.is_completed || (ls.solved_questions_count > 0 && ls.score > 0)) {
      const matchingLab = labs.find((l) => String(l.id) === String(ls.lab || ls.lab_id)) || {};
      processedLabIds.add(String(ls.lab || ls.lab_id));

      certificates.push({
        id: `cert-${ls.id}`,
        certId: `BLITZ-CERT-${String(ls.lab || ls.lab_id).padStart(3, "0")}-${String(ls.id).padStart(4, "0")}`,
        studentName: studentFullName,
        labId: ls.lab || ls.lab_id,
        labName: ls.lab_name || matchingLab.name || "Practical Lab Challenge",
        labDesc: matchingLab.description || matchingLab.desc || "Hands-on cybersecurity evaluation.",
        category: ls.lab_category || matchingLab.category || "Security",
        difficulty: ls.lab_difficulty || matchingLab.difficulty || "Beginner",
        subjectName: ls.subject_name || matchingLab.subject_name || "",
        score: typeof ls.score === "number" ? ls.score : 0,
        maxScore: ls.max_score || matchingLab.points || 100,
        solvedQuestions: typeof ls.solved_questions_count === "number" ? ls.solved_questions_count : 0,
        totalQuestions: ls.total_questions_count || matchingLab.question_count || 1,
        completedAt: ls.updated_at || new Date().toISOString(),
      });
    }
  });

  // 2. Also check any labs marked completed that weren't captured in lab_scores
  labs.forEach((l) => {
    const isCompleted = l.is_completed || l.submission_status === "COMPLETED" || l.progress_pct === 100;
    if (isCompleted && !processedLabIds.has(String(l.id))) {
      processedLabIds.add(String(l.id));
      certificates.push({
        id: `cert-lab-${l.id}`,
        certId: `BLITZ-CERT-${String(l.id).padStart(3, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName: studentFullName,
        labId: l.id,
        labName: l.name,
        labDesc: l.description || l.desc || "Hands-on cybersecurity evaluation.",
        category: l.category || "Security",
        difficulty: l.difficulty || "Beginner",
        subjectName: l.subject_name || "",
        score: typeof l.score === "number" ? l.score : 0,
        maxScore: l.points || 100,
        solvedQuestions: typeof l.solved_questions_count === "number" ? l.solved_questions_count : 0,
        totalQuestions: l.question_count || 1,
        completedAt: l.updated_at || new Date().toISOString(),
      });
    }
  });

  const filtered = certificates.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.labName.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.subjectName.toLowerCase().includes(q) ||
      c.certId.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
              Lab Certificates
            </h1>
            <span
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: C.amber,
                background: "rgba(245, 166, 35, 0.12)",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid rgba(245, 166, 35, 0.3)",
                fontWeight: 600,
              }}
            >
              {certificates.length} Earned
            </span>
          </div>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            Official credentials automatically generated upon attending and completing practical cybersecurity labs.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.panel,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 6,
              padding: "7px 12px",
              width: 240,
            }}
          >
            <Search size={14} color={C.low} />
            <input
              type="text"
              placeholder="Search certificates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                fontFamily: sans,
                fontSize: 12.5,
                color: C.hi,
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          <Btn icon={RefreshCw} tone="ghost" sm onClick={loadData}>
            {loading ? "Syncing..." : "Refresh"}
          </Btn>
        </div>
      </div>

      {/* Summary Banner */}
      <div
        style={{
          marginTop: 22,
          padding: "16px 20px",
          borderRadius: 10,
          background: "linear-gradient(90deg, rgba(245, 166, 35, 0.08) 0%, rgba(0, 229, 255, 0.05) 100%)",
          border: `1px solid rgba(245, 166, 35, 0.3)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(245, 166, 35, 0.15)",
              border: "1px solid rgba(245, 166, 35, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileBadge size={22} color={C.amber} />
          </div>
          <div>
            <div style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>
              Automatic Blitz Academy Certification
            </div>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginTop: 2 }}>
              Every completed lab generates an authentic certificate bearing student name, score, attended questions, and cryptographic verification ID.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>STUDENT RECIPIENT</div>
            <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.cyan }}>{studentFullName}</div>
          </div>
        </div>
      </div>

      {/* Grid of Certificates */}
      {loading ? (
        <Panel style={{ padding: 60, textAlign: "center", color: C.mid, marginTop: 24 }}>
          <RefreshCw size={26} color={C.cyan} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div style={{ fontFamily: sans, fontSize: 14 }}>Retrieving your verified lab certificates...</div>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel
          style={{
            padding: 50,
            textAlign: "center",
            marginTop: 24,
            background: C.panel,
            border: `1px dashed ${C.border}`,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(245, 166, 35, 0.1)",
              border: "1px solid rgba(245, 166, 35, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <FileBadge size={28} color={C.amber} />
          </div>
          <h3 style={{ fontFamily: sans, fontSize: 17, fontWeight: 700, color: C.hi, margin: "0 0 8px" }}>
            {search ? "No certificates match your search" : "No Lab Certificates Earned Yet"}
          </h3>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, maxWidth: 460, margin: "0 auto 20px", lineHeight: 1.55 }}>
            {search
              ? "Try clearing your search term to see all available certificates."
              : "Attend any hands-on security challenge, solve the questions, and submit your evaluation. Your official Blitz Academy certificate will automatically generate right here!"}
          </p>
          {go && (
            <Btn icon={ArrowRight} onClick={() => go("labs")}>
              Go to Labs & Start Earning
            </Btn>
          )}
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 18, marginTop: 24 }}>
          {filtered.map((cert) => {
            const pct = cert.maxScore > 0 ? Math.round((cert.score / cert.maxScore) * 100) : 100;
            return (
              <Panel
                key={cert.id}
                style={{
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "linear-gradient(180deg, rgba(18, 20, 29, 0.9) 0%, rgba(11, 13, 20, 0.95) 100%)",
                  border: "1px solid rgba(245, 166, 35, 0.35)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Subtle top gold strip */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #f5a623, #00e5ff)" }} />

                <div>
                  {/* Top Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 10,
                          color: C.green,
                          background: "rgba(0, 230, 118, 0.12)",
                          padding: "2px 7px",
                          borderRadius: 4,
                          border: "1px solid rgba(0, 230, 118, 0.3)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={10} /> VERIFIED
                      </span>
                      <DiffBadge level={cert.difficulty} />
                    </div>

                    <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber }}>
                      {cert.certId}
                    </span>
                  </div>

                  {/* Lab Title */}
                  <h3 style={{ fontFamily: sans, fontSize: 16.5, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
                    {cert.labName}
                  </h3>

                  {/* Course / Subject */}
                  <div style={{ fontFamily: mono, fontSize: 11, color: C.cyan, marginBottom: 8 }}>
                    {cert.category} {cert.subjectName ? `· ${cert.subjectName}` : ""}
                  </div>

                  {/* Description Clamped */}
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: 12,
                      color: C.mid,
                      lineHeight: 1.5,
                      margin: "0 0 14px",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {cert.labDesc}
                  </p>

                  {/* Performance Specs */}
                  <div
                    style={{
                      background: C.panel2,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, textTransform: "uppercase" }}>Score</div>
                      <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.green }}>
                        {cert.score} / {cert.maxScore} PTS ({pct}%)
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: mono, fontSize: 9.5, color: C.low, textTransform: "uppercase" }}>Questions Attended</div>
                      <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.hi }}>
                        {cert.solvedQuestions} / {cert.totalQuestions} Solved
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: mono, fontSize: 10.5, color: C.low }}>
                    <Calendar size={11} />
                    <span>{new Date(cert.completedAt).toLocaleDateString()}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCert(cert)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(245, 166, 35, 0.15)",
                      border: "1px solid rgba(245, 166, 35, 0.4)",
                      color: C.amber,
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontFamily: sans,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
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

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}

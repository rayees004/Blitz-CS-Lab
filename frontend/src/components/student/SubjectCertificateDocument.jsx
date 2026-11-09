import React from "react";
import { sans, mono } from "../../constants/theme";

/*
 * Subject certificate as fixed-size A4 landscape pages. Every assigned subject has one from the
 * start (empty); each attended lab adds its score. The certification score is out of all assigned labs.
 *   Page 1     — overall report: student, subject, certification score, labs attended/completed, questions solved
 *   Page 2..N  — report of ATTENDED labs only: lab name, score, questions solved, status / time of completion.
 *                Rows are split across as many pages as needed (LAB_ROWS_PER_PAGE each).
 * The same pages are used for the on-screen preview and for printing / saving as PDF.
 */

export const PAGE_W_PX = 1123; // 297mm at 96dpi
export const PAGE_H_PX = 794; // 210mm at 96dpi
const LAB_ROWS_PER_PAGE = 12;

const INK = "#0f1e3a";
const MUTED = "#5b6475";
const GOLD = "#b7862b";
const GOLD_SOFT = "rgba(183, 134, 43, 0.35)";
const TEAL = "#0e7c86";
const PAPER = "#fffdf7";
const ROW_ALT = "#f7f3e8";

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Labs shown in the certificate report: attended labs only */
export function attendedLabs(cert) {
  return (cert?.labs || []).filter((l) => l.status !== "NOT_ATTENDED");
}

/** Status label of an attended lab */
export const LAB_STATUS_LABEL = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In progress",
  EXPIRED: "Time expired",
};

/** Total number of pages a certificate needs (cover + lab pages) */
export function certificatePageCount(cert) {
  return 1 + Math.max(1, Math.ceil(attendedLabs(cert).length / LAB_ROWS_PER_PAGE));
}

function Page({ children }) {
  return (
    <div
      className="blitz-cert-page"
      style={{
        width: "297mm",
        height: "210mm",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        background: PAPER,
        color: INK,
        fontFamily: sans,
        padding: "15mm 17mm",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Double gold frame */}
      <div style={{ position: "absolute", inset: "6mm", border: `2px solid ${GOLD}`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "8mm", border: `1px solid ${GOLD_SOFT}`, pointerEvents: "none" }} />
      {/* Corner ornaments */}
      {[
        { top: "10mm", left: "10mm", borderTop: `3px solid ${GOLD}`, borderLeft: `3px solid ${GOLD}` },
        { top: "10mm", right: "10mm", borderTop: `3px solid ${GOLD}`, borderRight: `3px solid ${GOLD}` },
        { bottom: "10mm", left: "10mm", borderBottom: `3px solid ${GOLD}`, borderLeft: `3px solid ${GOLD}` },
        { bottom: "10mm", right: "10mm", borderBottom: `3px solid ${GOLD}`, borderRight: `3px solid ${GOLD}` },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 26, height: 26, pointerEvents: "none", ...s }} />
      ))}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function PageFooter({ cert, pageNo, pageCount }) {
  return (
    <div
      style={{
        marginTop: "auto",
        paddingTop: 8,
        borderTop: `1px solid ${GOLD_SOFT}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: mono,
        fontSize: 10.5,
        color: MUTED,
      }}
    >
      <span>Certificate ID: <strong style={{ color: INK }}>{cert.certificate_id}</strong></span>
      <span style={{ color: TEAL }}>✓ Verified on Blitz Cyber Lab System</span>
      <span>Page {pageNo} of {pageCount}</span>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 8px" }}>
      <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.12em", color: MUTED, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: INK, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function CoverPage({ cert, pageCount }) {
  const subjectLabel = cert.subject_code && cert.subject_code !== cert.subject_name
    ? `${cert.subject_name} (${cert.subject_code})`
    : cert.subject_name;
  const shortDate = (v) =>
    v ? new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const period =
    cert.first_completed_at && cert.issued_at && shortDate(cert.first_completed_at) !== shortDate(cert.issued_at)
      ? <>{shortDate(cert.first_completed_at)} –<br />{shortDate(cert.issued_at)}</>
      : shortDate(cert.issued_at);
  const complete = Boolean(cert.is_complete);
  const attended = cert.labs_attended ?? cert.labs_completed ?? 0;
  const statement = complete
    ? "has successfully completed all assigned hands-on practical cybersecurity labs in the subject"
    : attended > 0
    ? "is undertaking hands-on practical cybersecurity labs in the subject"
    : "is enrolled for hands-on practical cybersecurity labs in the subject";

  return (
    <Page>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 4 }}>
        <img
          src="/blitz-academy-logo.png"
          alt="Blitz Academy"
          style={{ height: 48, objectFit: "contain" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div style={{ fontFamily: mono, fontSize: 11.5, letterSpacing: "0.3em", color: GOLD, fontWeight: 700, marginTop: 8 }}>
          BLITZ ACADEMY · CYBERSECURITY DIVISION
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.08em", marginTop: 6, textTransform: "uppercase" }}>
          Subject Certification
        </div>
        <div style={{ fontFamily: mono, fontSize: 11.5, letterSpacing: "0.2em", color: TEAL, marginTop: 2, textTransform: "uppercase" }}>
          Practical Lab Score Report
        </div>
        <div
          style={{
            marginTop: 6, padding: "2px 12px", borderRadius: 12, fontFamily: mono, fontSize: 10.5, fontWeight: 700,
            letterSpacing: "0.15em", color: complete ? TEAL : GOLD,
            border: `1px solid ${complete ? TEAL : GOLD}`, background: complete ? "rgba(14,124,134,0.06)" : "rgba(183,134,43,0.08)",
          }}
        >
          {complete ? "COMPLETED" : "IN PROGRESS"}
        </div>
        <div style={{ width: 180, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "12px 0 14px" }} />

        <div style={{ fontSize: 14, fontStyle: "italic", color: MUTED }}>This is to certify that</div>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 38, fontWeight: 700, color: INK, margin: "6px 0 4px" }}>
          {cert.student_name}
        </div>
        <div style={{ width: 360, height: 1, background: GOLD_SOFT, marginBottom: 10 }} />
        <div style={{ fontSize: 14, color: MUTED, maxWidth: 720, lineHeight: 1.5 }}>
          {statement}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: TEAL, marginTop: 6 }}>{subjectLabel}</div>
        {cert.course_name && (
          <div style={{ fontFamily: mono, fontSize: 12, color: MUTED, marginTop: 2 }}>Course: {cert.course_name}</div>
        )}
      </div>

      {/* Overall report */}
      <div
        style={{
          margin: "18px auto 0",
          width: "100%",
          maxWidth: 860,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          border: `1px solid ${GOLD_SOFT}`,
          borderRadius: 8,
          background: "#ffffff",
        }}
      >
        <Stat label="Certification Score" value={`${cert.total_score} / ${cert.max_score}`} sub={`${cert.score_pct}% of all assigned labs`} />
        <Stat
          label="Labs Attended"
          value={`${attended} of ${cert.labs_in_subject}`}
          sub={`${cert.labs_completed} completed`}
        />
        <Stat label="Questions Solved" value={`${cert.questions_solved} of ${cert.questions_total}`} sub="across assigned labs" />
        {complete ? (
          <Stat label="Completion Period" value={<span style={{ fontSize: 14 }}>{period}</span>} />
        ) : (
          <Stat
            label="Status"
            value={<span style={{ fontSize: 16, color: GOLD }}>In Progress</span>}
            sub={`${cert.labs_remaining ?? cert.labs_in_subject - cert.labs_completed} lab(s) remaining`}
          />
        )}
      </div>

      {/* Signature row */}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 30px 10px" }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: MUTED, lineHeight: 1.7 }}>
          {complete ? (
            <div>Date of Issue: <strong style={{ color: INK }}>{formatDate(cert.issued_at)}</strong></div>
          ) : (
            <div>Report generated: <strong style={{ color: INK }}>{formatDate(new Date())}</strong></div>
          )}
          <div>Attended labs report on the following page{pageCount > 2 ? "s" : ""}</div>
        </div>
        <div
          style={{
            width: 84, height: 84, borderRadius: "50%", border: `2px solid ${GOLD}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: GOLD, fontFamily: mono, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em",
            background: "rgba(183, 134, 43, 0.06)",
          }}
        >
          <span>OFFICIAL</span>
          <span style={{ fontSize: 16 }}>★</span>
          <span>VERIFIED</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 20, color: GOLD }}>Academic Directorate</div>
          <div style={{ width: 200, height: 1, background: GOLD_SOFT, margin: "4px 0 4px auto" }} />
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Blitz Academy</div>
          <div style={{ fontSize: 11, color: MUTED }}>Head of Cybersecurity Lab Evaluation</div>
        </div>
      </div>

      <PageFooter cert={cert} pageNo={1} pageCount={pageCount} />
    </Page>
  );
}

const th = {
  padding: "0 12px",
  height: 36,
  textAlign: "left",
  fontFamily: mono,
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#ffffff",
  background: INK,
  fontWeight: 700,
};
const td = {
  padding: "0 12px",
  height: 36,
  fontSize: 12.5,
  borderBottom: "1px solid #e6dfcc",
  whiteSpace: "nowrap",
};

function LabsPage({ cert, rows, startIndex, pageNo, pageCount, isLast }) {
  return (
    <Page>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.25em", color: GOLD, fontWeight: 700 }}>
            BLITZ ACADEMY · CYBERSECURITY DIVISION
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 3 }}>Attended Labs Report</div>
          <div style={{ fontSize: 12.5, color: TEAL, fontWeight: 700, marginTop: 1 }}>
            {cert.subject_name}{cert.course_name ? ` · ${cert.course_name}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
          <div>Student: <strong style={{ color: INK }}>{cert.student_name}</strong></div>
          <div>
            Labs attended: <strong style={{ color: INK }}>{cert.labs_attended ?? cert.labs_completed} of {cert.labs_in_subject}</strong>
            {" · "}Certification score: <strong style={{ color: INK }}>{cert.total_score} / {cert.max_score}</strong>
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", background: "#ffffff" }}>
        <colgroup>
          <col style={{ width: 46 }} />
          <col />
          <col style={{ width: 130 }} />
          <col style={{ width: 170 }} />
          <col style={{ width: 210 }} />
        </colgroup>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Lab Name</th>
            <th style={th}>Score</th>
            <th style={th}>Questions Solved</th>
            <th style={th}>Status / Completed On</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...td, height: 60, textAlign: "center", color: MUTED, fontStyle: "italic" }}>
                No labs attended yet in this subject. Each lab you attend is added to this report automatically.
              </td>
            </tr>
          )}
          {rows.map((lab, i) => {
            const status = lab.status || "COMPLETED";
            return (
              <tr key={lab.lab_id} style={{ background: i % 2 ? ROW_ALT : "#ffffff" }}>
                <td style={{ ...td, fontFamily: mono, color: MUTED }}>{startIndex + i + 1}</td>
                <td style={{ ...td, overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }} title={lab.lab_name}>
                  {lab.lab_name}
                  {lab.category && (
                    <span style={{ fontWeight: 400, color: MUTED, fontSize: 11 }}> · {lab.category}</span>
                  )}
                </td>
                <td style={{ ...td, fontFamily: mono, fontWeight: 700 }}>{lab.score} / {lab.max_score}</td>
                <td style={{ ...td, fontFamily: mono }}>{lab.solved_questions} of {lab.total_questions} solved</td>
                <td style={{ ...td, fontFamily: mono, fontSize: 11.5 }}>
                  {status === "COMPLETED" ? (
                    formatDateTime(lab.completed_at)
                  ) : (
                    <span style={{ color: status === "EXPIRED" ? "#b3412e" : GOLD, fontWeight: 700 }}>
                      {LAB_STATUS_LABEL[status] || status}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {isLast && (
            <tr style={{ background: "rgba(183, 134, 43, 0.12)" }}>
              <td style={{ ...td, borderBottom: "none" }} />
              <td style={{ ...td, borderBottom: "none", fontWeight: 800 }}>
                Certification score ({cert.labs_attended ?? rows.length} of {cert.labs_in_subject} assigned labs attended)
              </td>
              <td style={{ ...td, borderBottom: "none", fontFamily: mono, fontWeight: 800 }}>{cert.total_score} / {cert.max_score}</td>
              <td style={{ ...td, borderBottom: "none", fontFamily: mono, fontWeight: 800 }}>{cert.questions_solved} of {cert.questions_total} solved</td>
              <td style={{ ...td, borderBottom: "none", fontFamily: mono, fontSize: 11.5 }}>{cert.score_pct}% of all assigned labs</td>
            </tr>
          )}
        </tbody>
      </table>

      {!isLast && (
        <div style={{ fontFamily: mono, fontSize: 10.5, color: MUTED, textAlign: "right", marginTop: 6 }}>
          Continued on next page →
        </div>
      )}

      <PageFooter cert={cert} pageNo={pageNo} pageCount={pageCount} />
    </Page>
  );
}

/** All pages of one subject certificate, in order */
export default function SubjectCertificatePages({ cert, pageGap = 0, wrapPage }) {
  const labChunks = chunk(attendedLabs(cert), LAB_ROWS_PER_PAGE);
  if (labChunks.length === 0) labChunks.push([]);
  const pageCount = 1 + labChunks.length;
  const wrap = wrapPage || ((node) => node);

  const pages = [
    <CoverPage key="cover" cert={cert} pageCount={pageCount} />,
    ...labChunks.map((rows, idx) => (
      <LabsPage
        key={`labs-${idx}`}
        cert={cert}
        rows={rows}
        startIndex={idx * LAB_ROWS_PER_PAGE}
        pageNo={idx + 2}
        pageCount={pageCount}
        isLast={idx === labChunks.length - 1}
      />
    )),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: pageGap }}>
      {pages.map((page, i) => (
        <React.Fragment key={i}>{wrap(page, i)}</React.Fragment>
      ))}
    </div>
  );
}

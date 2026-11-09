import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Download, FileBadge, FlaskConical, Loader2, Lock, X } from "lucide-react";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentCertificates } from "../../api/labs";
import SubjectCertificatePages, { PAGE_W_PX, PAGE_H_PX, certificatePageCount } from "./SubjectCertificateDocument";

/**
 * Shows a subject certificate (multi-page) with a "Download PDF" action.
 * Pass `certificate` (from GET /student/certificates/) or just `subjectId` to load it.
 */
export default function SubjectCertificateModal({ subjectId, certificate, onClose }) {
  const [cert, setCert] = useState(certificate || null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(!certificate);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const previewRef = useRef(null);

  useEffect(() => {
    if (certificate) {
      setCert(certificate);
      return;
    }
    if (!subjectId) {
      setLoading(false);
      setError("This lab is not linked to a subject, so it has no subject certificate.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProgress(null);
    fetchStudentCertificates(subjectId)
      .then((res) => {
        if (cancelled) return;
        const found = (res.certificates || [])[0];
        const pending = (res.in_progress || [])[0];
        if (found) setCert(found);
        else if (pending) setProgress(pending);
        else setError("You are not assigned to this subject, so it has no subject certificate.");
      })
      .catch((err) => !cancelled && setError(err.message || "Failed to load the certificate."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [subjectId, certificate]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fit the A4 pages to the available width
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, (el.clientWidth - 32) / PAGE_W_PX));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cert]);

  const handleDownload = () => {
    // Browser print dialog → "Save as PDF"; the file name comes from the document title
    const prevTitle = document.title;
    const safe = (s) => String(s || "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    document.title = `Blitz_Certificate_${safe(cert.subject_name)}_${safe(cert.student_name)}`;
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  const pageCount = cert ? certificatePageCount(cert) : 0;

  return (
    <>
      <style>{`
        #blitz-cert-print-root { display: none; }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body {
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }
          body > *:not(#blitz-cert-print-root) { display: none !important; }
          #blitz-cert-print-root { display: block !important; }
          #blitz-cert-print-root .blitz-cert-page {
            break-after: page;
            page-break-after: always;
          }
          #blitz-cert-print-root .blitz-cert-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      {/* Print-only copy of the pages, outside the app so only the certificate is printed */}
      {cert && createPortal(
        <div id="blitz-cert-print-root">
          <SubjectCertificatePages cert={cert} />
        </div>,
        document.body
      )}

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          background: "rgba(0, 0, 0, 0.88)",
          backdropFilter: "blur(8px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: "12px 20px",
            background: "rgba(18, 20, 29, 0.97)",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, background: C.panel2,
              border: `1px solid ${C.borderLight}`, color: C.hi, padding: "8px 16px", borderRadius: 6,
              fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} color={C.amber} /> Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <FileBadge size={16} color={C.amber} />
            <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cert ? `${cert.subject_name} — Subject Certificate` : "Subject Certificate"}
            </span>
            {cert && (
              <span style={{ fontFamily: mono, fontSize: 11, color: C.mid }}>
                {pageCount} page{pageCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!cert}
              title="Opens the print dialog — choose “Save as PDF”"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, background: C.amber, color: "#1a1200",
                border: "none", padding: "8px 16px", borderRadius: 6, fontFamily: sans, fontSize: 13,
                fontWeight: 700, cursor: cert ? "pointer" : "not-allowed", opacity: cert ? 1 : 0.6,
              }}
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              style={{
                background: "transparent", border: `1px solid ${C.border}`, color: C.mid, width: 34, height: 34,
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div ref={previewRef} style={{ flex: 1, overflow: "auto", padding: "20px 16px 40px" }}>
          {loading ? (
            <div style={{ color: C.mid, fontFamily: sans, textAlign: "center", marginTop: 80 }}>
              <Loader2 size={26} className="spin" color={C.cyan} style={{ marginBottom: 10 }} />
              <div>Preparing your subject certificate...</div>
            </div>
          ) : error ? (
            <div
              style={{
                maxWidth: 460, margin: "80px auto 0", padding: 24, textAlign: "center", borderRadius: 10,
                background: C.panel, border: `1px solid ${C.border}`, color: C.mid, fontFamily: sans, fontSize: 13.5,
              }}
            >
              <FileBadge size={28} color={C.amber} style={{ marginBottom: 10 }} />
              <div>{error}</div>
            </div>
          ) : progress ? (
            <SubjectProgressNotice progress={progress} />
          ) : cert ? (
            <SubjectCertificatePages
              cert={cert}
              pageGap={18}
              wrapPage={(page) => (
                <div
                  style={{
                    width: PAGE_W_PX * scale,
                    height: PAGE_H_PX * scale,
                    flexShrink: 0,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAGE_W_PX, height: PAGE_H_PX }}>
                    {page}
                  </div>
                </div>
              )}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

/** Subject not finished yet: the certificate unlocks after every assigned lab is completed */
function SubjectProgressNotice({ progress }) {
  const pct = progress.labs_in_subject > 0
    ? Math.round((progress.labs_completed / progress.labs_in_subject) * 100)
    : 0;
  return (
    <div
      style={{
        maxWidth: 480, margin: "60px auto 0", padding: 24, borderRadius: 10,
        background: C.panel, border: "1px solid rgba(245, 166, 35, 0.35)", fontFamily: sans,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Lock size={20} color={C.amber} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.hi }}>
            {progress.subject_name} certificate is locked
          </div>
          <div style={{ fontSize: 12.5, color: C.mid, marginTop: 2 }}>
            Complete all {progress.labs_in_subject} assigned lab{progress.labs_in_subject !== 1 ? "s" : ""} of this
            subject to earn it.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11, color: C.low, marginBottom: 4 }}>
        <span>{progress.labs_completed} of {progress.labs_in_subject} labs completed</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: C.panel2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: C.amber }} />
      </div>

      {(progress.pending_labs || []).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, textTransform: "uppercase", marginBottom: 6 }}>
            Remaining labs
          </div>
          {progress.pending_labs.map((l) => (
            <div key={l.lab_id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.mid, padding: "3px 0" }}>
              <FlaskConical size={12} color={C.cyan} style={{ flexShrink: 0 }} /> {l.lab_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Download, Printer, X, FileBadge, ShieldCheck,
  Award, Calendar, Hash, CheckCircle2, Loader2
} from "lucide-react";
import { C, sans, mono } from "../../constants/theme";

export default function CertificateModal({ certificate, onClose }) {
  if (!certificate) return null;

  const [downloading, setDownloading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const storedUser = (() => {
    try {
      const u = localStorage.getItem("blitz_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();
  const fallbackName = storedUser?.full_name || storedUser?.name || storedUser?.username || "Student";
  const studentName = (certificate.studentName && certificate.studentName !== "Student")
    ? certificate.studentName
    : fallbackName;

  const {
    labName = "Cybersecurity Practical Lab",
    labDesc = "",
    category = "Cyber Security",
    subjectName = "",
    score = 100,
    maxScore = 100,
    solvedQuestions = 1,
    totalQuestions = 1,
    completedAt = new Date().toISOString(),
    certId = `BLITZ-CERT-${Date.now().toString(36).toUpperCase()}`,
  } = certificate;

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
  const formattedDate = new Date(completedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  // Direct high-res image download
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1060;
      const ctx = canvas.getContext("2d");

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1060);
      bgGrad.addColorStop(0, "#0b0f19");
      bgGrad.addColorStop(0.5, "#06080d");
      bgGrad.addColorStop(1, "#0d1322");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1600, 1060);

      // Gold Double Border
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1540, 1000);

      ctx.strokeStyle = "rgba(245, 166, 35, 0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(42, 42, 1516, 976);

      // Corner ornamental brackets
      const drawBracket = (x, y, dx, dy) => {
        ctx.strokeStyle = "#f5a623";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 40);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 40, y);
        ctx.stroke();
      };
      drawBracket(54, 54, 1, 1);
      drawBracket(1546, 54, -1, 1);
      drawBracket(54, 1006, 1, -1);
      drawBracket(1546, 1006, -1, -1);

      // Try drawing the Blitz Academy logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
          logoImg.src = "/blitz-academy-logo.png";
        });

        if (logoImg.complete && logoImg.naturalWidth > 0) {
          const lWidth = 140;
          const lHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * lWidth;
          const lX = (1600 - lWidth) / 2;
          const lY = 80;

          // White background card for logo
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(lX - 16, lY - 10, lWidth + 32, lHeight + 20, 12);
          ctx.fill();

          ctx.drawImage(logoImg, lX, lY, lWidth, lHeight);
        }
      } catch (err) {
        // Fallback
      }

      ctx.textAlign = "center";

      // Division Tagline
      ctx.font = "bold 18px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.letterSpacing = "4px";
      ctx.fillText("BLITZ ACADEMY · CYBERSECURITY DIVISION", 800, 220);

      // Certificate Title
      ctx.font = "bold 38px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("CERTIFICATE OF LAB COMPLETION", 800, 275);

      // Gold divider line
      const lineGrad = ctx.createLinearGradient(600, 290, 1000, 290);
      lineGrad.addColorStop(0, "rgba(245, 166, 35, 0)");
      lineGrad.addColorStop(0.5, "#f5a623");
      lineGrad.addColorStop(1, "rgba(245, 166, 35, 0)");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(600, 295);
      ctx.lineTo(1000, 295);
      ctx.stroke();

      // Subtitle
      ctx.font = "italic 20px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("This credential officially verifies that", 800, 335);

      // Student Name
      ctx.font = "bold 46px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(studentName, 800, 395);

      // Underline student name
      const nameWidth = ctx.measureText(studentName).width;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(800 - nameWidth / 2, 408);
      ctx.lineTo(800 + nameWidth / 2, 408);
      ctx.stroke();

      // Description intro
      ctx.font = "20px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#c9d1d9";
      const introText = solvedQuestions >= totalQuestions
        ? "has successfully attended, executed hands-on practical exploitation, and submitted all evaluation flags for:"
        : `has attended, executed hands-on practical exploitation, and submitted ${solvedQuestions} of ${totalQuestions} evaluation flags for:`;
      ctx.fillText(introText, 800, 450);

      // Lab Box
      ctx.fillStyle = "rgba(245, 166, 35, 0.1)";
      ctx.strokeStyle = "rgba(245, 166, 35, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(400, 475, 800, 80, 10);
      ctx.fill();
      ctx.stroke();

      // Lab Name
      ctx.font = "bold 28px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText(labName, 800, 515);

      // Category & Subject
      ctx.font = "16px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#94a3b8";
      const subText = `Category: ${category}${subjectName ? ` · Course: ${subjectName}` : ""}`;
      ctx.fillText(subText, 800, 542);

      // Lab Description text (word-wrap up to 2 lines)
      ctx.font = "18px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#94a3b8";
      const words = (labDesc || "Hands-on cybersecurity evaluation challenge.").split(" ");
      let line1 = "";
      let line2 = "";
      for (const w of words) {
        if (ctx.measureText(line1 + w).width < 1000 && !line2) {
          line1 += w + " ";
        } else if (ctx.measureText(line2 + w).width < 1000) {
          line2 += w + " ";
        }
      }
      ctx.fillText(line1.trim(), 800, 595);
      if (line2) ctx.fillText(line2.trim(), 800, 625);

      // Evaluation specs grid box
      ctx.fillStyle = "rgba(13, 17, 23, 0.9)";
      ctx.strokeStyle = "rgba(48, 54, 61, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(350, 665, 900, 100, 10);
      ctx.fill();
      ctx.stroke();

      // Spec 1: Score
      ctx.font = "14px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("SCORE ACHIEVED", 500, 700);
      ctx.font = "bold 22px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#34d399";
      ctx.fillText(`${score} / ${maxScore} PTS (${pct}%)`, 500, 735);

      // Spec 2: Questions
      ctx.font = "14px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("QUESTIONS ATTENDED", 800, 700);
      ctx.font = "bold 22px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`${solvedQuestions} of ${totalQuestions} Solved`, 800, 735);

      // Spec 3: Evaluation
      ctx.font = "14px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("EVALUATION TYPE", 1100, 700);
      ctx.font = "bold 20px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText("Hands-On Practical Lab", 1100, 735);

      // Divider line before footer
      ctx.strokeStyle = "rgba(245, 166, 35, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 805);
      ctx.lineTo(1450, 805);
      ctx.stroke();

      // Footer - Left: ID and Date
      ctx.textAlign = "left";
      ctx.font = "15px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText(`Certificate ID: ${certId}`, 150, 845);
      ctx.fillText(`Date of Completion: ${formattedDate}`, 150, 875);
      ctx.fillStyle = "#34d399";
      ctx.fillText("✓ Verified on Blitz Cyber Lab System", 150, 905);

      // Footer - Center Seal Badge
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(245, 166, 35, 0.15)";
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(800, 875, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 13px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText("OFFICIAL", 800, 868);
      ctx.fillText("VERIFIED", 800, 888);

      // Footer - Right: Signature
      ctx.textAlign = "right";
      ctx.font = "italic 26px 'Georgia', serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText("Academic Directorate", 1450, 855);

      ctx.strokeStyle = "rgba(245, 166, 35, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1250, 868);
      ctx.lineTo(1450, 868);
      ctx.stroke();

      ctx.font = "bold 16px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Blitz Academy", 1450, 892);
      ctx.font = "14px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("Head of Cybersecurity Lab Evaluation", 1450, 915);

      // Trigger instant PNG file download
      const imageUri = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = imageUri;
      downloadLink.download = `Blitz_Certificate_${certId.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Certificate download error:", err);
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #blitz-printable-certificate, #blitz-printable-certificate * {
            visibility: visible !important;
          }
          #blitz-printable-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 30px !important;
            box-sizing: border-box !important;
            background: #090b10 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        className="no-print"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.88)",
          backdropFilter: "blur(8px)",
          zIndex: 1300,
        }}
      />

      {/* Modal Container */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          zIndex: 1301,
          padding: "24px 16px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            position: "relative",
            maxWidth: 900,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            margin: "auto",
          }}
        >
          {/* Top Sticky Action & Back Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(18, 20, 29, 0.95)",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "10px 18px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* Prominent Back Button on Left */}
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: C.panel2,
                border: `1px solid ${C.borderLight}`,
                color: C.hi,
                padding: "8px 18px",
                borderRadius: 6,
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.amber)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.borderLight)}
            >
              <ArrowLeft size={16} color={C.amber} />
              <span>Back</span>
            </button>

            {/* Certificate Status Tag */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileBadge size={16} color={C.amber} />
              <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.hi }}>
                Verified Certificate
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10.5,
                  color: C.green,
                  background: "rgba(0, 230, 118, 0.12)",
                  padding: "2px 7px",
                  borderRadius: 4,
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <ShieldCheck size={11} /> Authentic
              </span>
            </div>

            {/* Right: Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Direct Download Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: C.amber,
                  color: "#1a1200",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: downloading ? "wait" : "pointer",
                  boxShadow: "0 2px 10px rgba(245, 166, 35, 0.3)",
                }}
              >
                {downloading ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                <span>{downloading ? "Generating..." : "Download Certificate"}</span>
              </button>

              {/* Print / Save PDF Button */}
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: C.panel2,
                  border: `1px solid ${C.borderLight}`,
                  color: C.hi,
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Printer size={15} />
                <span>Print / PDF</span>
              </button>

              {/* Close Cross */}
              <button
                type="button"
                onClick={onClose}
                title="Close Certificate"
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  color: C.mid,
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Printable Certificate Frame */}
          <div
            id="blitz-printable-certificate"
            style={{
              background: "linear-gradient(135deg, #0b0f19 0%, #06080d 50%, #0d1220 100%)",
              border: "3px double #f5a623",
              borderRadius: 14,
              padding: "36px 44px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 166, 35, 0.1)",
              color: "#e6edf3",
              fontFamily: sans,
            }}
          >
            {/* Guilloche / Cyber Background Grid Accents */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.04,
                backgroundImage: `radial-gradient(#f5a623 1px, transparent 1px), radial-gradient(#00e5ff 1px, transparent 1px)`,
                backgroundSize: "28px 28px",
                backgroundPosition: "0 0, 14px 14px",
                pointerEvents: "none",
              }}
            />

            {/* Corner Decorative Borders */}
            <div style={{ position: "absolute", top: 12, left: 12, width: 28, height: 28, borderTop: "2px solid #f5a623", borderLeft: "2px solid #f5a623" }} />
            <div style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderTop: "2px solid #f5a623", borderRight: "2px solid #f5a623" }} />
            <div style={{ position: "absolute", bottom: 12, left: 12, width: 28, height: 28, borderBottom: "2px solid #f5a623", borderLeft: "2px solid #f5a623" }} />
            <div style={{ position: "absolute", bottom: 12, right: 12, width: 28, height: 28, borderBottom: "2px solid #f5a623", borderRight: "2px solid #f5a623" }} />

            {/* Top Brand Header with Official Blitz Academy Logo */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  background: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: 10,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                <img
                  src="/blitz-academy-logo.png"
                  alt="Blitz Academy"
                  style={{
                    height: 52,
                    objectFit: "contain",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>

              <div
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  letterSpacing: "0.28em",
                  color: "#f5a623",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginTop: 4,
                }}
              >
                BLITZ ACADEMY · CYBERSECURITY DIVISION
              </div>

              <h1
                style={{
                  fontFamily: sans,
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  color: "#ffffff",
                  margin: "8px 0 4px",
                  textTransform: "uppercase",
                  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                CERTIFICATE OF LAB COMPLETION
              </h1>

              <div
                style={{
                  width: 140,
                  height: 2,
                  background: "linear-gradient(90deg, transparent, #f5a623, transparent)",
                  margin: "6px auto 14px",
                }}
              />

              <p style={{ fontSize: 13, color: "#8b949e", fontStyle: "italic", margin: 0 }}>
                This credential officially verifies that
              </p>

              {/* Student Name */}
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#38bdf8",
                  letterSpacing: "0.02em",
                  margin: "12px 0 8px",
                  textDecoration: "underline",
                  textUnderlineOffset: 6,
                  textDecorationColor: "rgba(56, 189, 248, 0.4)",
                  fontFamily: sans,
                }}
              >
                {studentName}
              </div>

              <p style={{ fontSize: 13, color: "#c9d1d9", maxWidth: 640, lineHeight: 1.6, margin: "6px 0 14px" }}>
                {solvedQuestions >= totalQuestions
                  ? "has successfully attended, executed hands-on practical exploitation, and submitted all evaluation flags for the official cybersecurity lab challenge:"
                  : `has attended, executed hands-on practical exploitation, and submitted ${solvedQuestions} of ${totalQuestions} evaluation challenge questions (${pct}% marks earned) for the official cybersecurity lab challenge:`}
              </p>

              {/* Lab Title */}
              <div
                style={{
                  background: "rgba(245, 166, 35, 0.08)",
                  border: "1px solid rgba(245, 166, 35, 0.35)",
                  borderRadius: 8,
                  padding: "10px 22px",
                  marginBottom: 12,
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f5a623", letterSpacing: "-0.01em" }}>
                  {labName}
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: "#8b949e", marginTop: 3 }}>
                  Category: {category} {subjectName ? `· Course / Subject: ${subjectName}` : ""}
                </div>
              </div>

              {/* Lab Description */}
              {labDesc && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: "#8b949e",
                    lineHeight: 1.55,
                    maxWidth: 680,
                    marginBottom: 18,
                    textAlign: "center",
                    padding: "0 10px",
                  }}
                >
                  {labDesc}
                </div>
              )}

              {/* Performance & Questions Evaluation Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 14,
                  width: "100%",
                  maxWidth: 680,
                  background: "rgba(13, 17, 23, 0.8)",
                  border: "1px solid rgba(48, 54, 61, 0.8)",
                  borderRadius: 8,
                  padding: "12px 18px",
                  marginBottom: 24,
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: "#8b949e", textTransform: "uppercase" }}>
                    Score Achieved
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#34d399", marginTop: 2 }}>
                    {score} / {maxScore} PTS ({pct}%)
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: "#8b949e", textTransform: "uppercase" }}>
                    Questions Attended
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#38bdf8", marginTop: 2 }}>
                    {solvedQuestions} of {totalQuestions} Solved
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: "#8b949e", textTransform: "uppercase" }}>
                    Status
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: solvedQuestions >= totalQuestions ? "#34d399" : "#f5a623", marginTop: 2 }}>
                    {solvedQuestions >= totalQuestions ? "Fully Completed" : "Attended & Finalized"}
                  </div>
                </div>
              </div>

              {/* Bottom Signatures & Verification Seal */}
              <div
                style={{
                  width: "100%",
                  maxWidth: 720,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: "1px dashed rgba(245, 166, 35, 0.3)",
                }}
              >
                {/* Left: Certificate ID & Date */}
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: mono, fontSize: 10, color: "#8b949e", display: "flex", alignItems: "center", gap: 5 }}>
                    <Hash size={11} color="#f5a623" />
                    <span>ID: <strong style={{ color: "#e6edf3" }}>{certId}</strong></span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: "#8b949e", display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <Calendar size={11} color="#f5a623" />
                    <span>Date of Completion: <strong style={{ color: "#e6edf3" }}>{formattedDate}</strong></span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 9.5, color: "#34d399", marginTop: 4 }}>
                    ✓ Authenticity Verified on Blitz Cyber Lab System
                  </div>
                </div>

                {/* Center: Official Seal Badge */}
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    border: "2px solid #f5a623",
                    background: "radial-gradient(circle, rgba(245, 166, 35, 0.2) 0%, rgba(13, 17, 23, 0.9) 70%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 15px rgba(245, 166, 35, 0.35)",
                  }}
                >
                  <Award size={24} color="#f5a623" />
                  <span style={{ fontFamily: mono, fontSize: 8, color: "#f5a623", fontWeight: 700, marginTop: 2, letterSpacing: "0.08em" }}>
                    VERIFIED
                  </span>
                </div>

                {/* Right: Signature */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "cursive",
                      fontSize: 18,
                      color: "#f5a623",
                      lineHeight: 1,
                      marginBottom: 4,
                      opacity: 0.9,
                    }}
                  >
                    Academic Directorate
                  </div>
                  <div style={{ width: 150, height: 1, background: "rgba(245, 166, 35, 0.5)", marginLeft: "auto", marginBottom: 4 }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#e6edf3" }}>
                    Blitz Academy
                  </div>
                  <div style={{ fontSize: 9.5, color: "#8b949e" }}>
                    Head of Cybersecurity Lab Evaluation
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Secondary Action Bar with explicit Back Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(18, 20, 29, 0.8)",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "10px 18px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "none",
                color: C.mid,
                fontFamily: sans,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard / Labs
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: C.amber,
                  color: "#1a1200",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: downloading ? "wait" : "pointer",
                }}
              >
                {downloading ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.borderLight}`,
                  color: C.hi,
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

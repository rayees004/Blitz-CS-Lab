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

  const {
    studentName = "Student",
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

  // Dedicated reliable print handler with landscape iframe
  const handlePrint = () => {
    const certEl = document.getElementById("blitz-printable-certificate");
    if (certEl) {
      let iframe = document.getElementById("blitz-cert-print-frame");
      if (iframe) {
        try {
          document.body.removeChild(iframe);
        } catch (e) {}
      }
      iframe = document.createElement("iframe");
      iframe.id = "blitz-cert-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Certificate - ${studentName} - ${labName}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
              @page {
                size: landscape;
                margin: 0;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                background: #06080d;
                font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .print-container {
                width: 100vw;
                height: 100vh;
                padding: 24px 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #06080d;
              }
              #blitz-printable-certificate {
                width: 100% !important;
                max-width: 1040px !important;
                margin: 0 auto !important;
                border-radius: 12px !important;
                box-shadow: none !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${certEl.outerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          window.print();
        }
      }, 400);
      return;
    }
    window.print();
  };

  // Direct high-res, perfectly aligned image download
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1080);
      bgGrad.addColorStop(0, "#0b0f19");
      bgGrad.addColorStop(0.5, "#06080d");
      bgGrad.addColorStop(1, "#0d1322");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1600, 1080);

      // Subtle background dot pattern
      ctx.fillStyle = "rgba(245, 166, 35, 0.04)";
      for (let x = 60; x < 1540; x += 36) {
        for (let y = 60; y < 1020; y += 36) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Outer Gold Border
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 28, 1544, 1024);

      // Inner subtle Gold Border
      ctx.strokeStyle = "rgba(245, 166, 35, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, 40, 1520, 1000);

      // Corner ornamental brackets
      const drawBracket = (x, y, dx, dy) => {
        ctx.strokeStyle = "#f5a623";
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 36);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 36, y);
        ctx.stroke();
      };
      drawBracket(52, 52, 1, 1);
      drawBracket(1548, 52, -1, 1);
      drawBracket(52, 1028, 1, -1);
      drawBracket(1548, 1028, -1, -1);

      // Helper function for text wrapping
      const wrapText = (text, maxWidth) => {
        const words = (text || "").split(" ");
        const lines = [];
        let currentLine = "";
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Try drawing Blitz Academy logo in a balanced white badge card
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          logoImg.onload = resolve;
          logoImg.onerror = resolve;
          logoImg.src = "/blitz-academy-logo.png";
        });

        if (logoImg.complete && logoImg.naturalWidth > 0) {
          const lSize = 68;
          const lX = (1600 - lSize) / 2;
          const lY = 60;

          // White rounded card background for logo
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(lX - 18, lY - 8, lSize + 36, lSize + 16, 10);
          ctx.fill();

          ctx.drawImage(logoImg, lX, lY, lSize, lSize);
        }
      } catch (err) {
        // Continue if logo fails
      }

      ctx.textAlign = "center";

      // 1. Division Tagline
      ctx.font = "bold 15px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText("BLITZ ACADEMY · CYBERSECURITY DIVISION", 800, 175);

      // 2. Certificate Title
      ctx.font = "bold 34px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("CERTIFICATE OF LAB COMPLETION", 800, 222);

      // 3. Gold Decorative Divider
      const lineGrad = ctx.createLinearGradient(560, 238, 1040, 238);
      lineGrad.addColorStop(0, "rgba(245, 166, 35, 0)");
      lineGrad.addColorStop(0.5, "#f5a623");
      lineGrad.addColorStop(1, "rgba(245, 166, 35, 0)");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(560, 238);
      ctx.lineTo(1040, 238);
      ctx.stroke();

      // 4. Subtitle
      ctx.font = "italic 18px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("This credential officially verifies that", 800, 275);

      // 5. Student Name
      ctx.font = "bold 44px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(studentName, 800, 332);

      // Underline student name cleanly
      const nameWidth = Math.min(ctx.measureText(studentName).width + 30, 800);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(800 - nameWidth / 2, 346);
      ctx.lineTo(800 + nameWidth / 2, 346);
      ctx.stroke();

      // 6. Description Intro
      const introText = solvedQuestions >= totalQuestions
        ? "has successfully attended, executed hands-on practical exploitation, and submitted all evaluation flags for:"
        : `has attended, executed hands-on practical exploitation, and submitted ${solvedQuestions} of ${totalQuestions} evaluation challenge questions (${pct}% marks earned) for:`;
      ctx.font = "17px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#c9d1d9";
      const introLines = wrapText(introText, 1050);
      introLines.forEach((line, idx) => {
        ctx.fillText(line, 800, 385 + idx * 24);
      });

      // 7. Lab Box (Properly proportioned & auto-scaled)
      const labBoxY = 430;
      const labBoxHeight = 88;
      ctx.fillStyle = "rgba(245, 166, 35, 0.08)";
      ctx.strokeStyle = "rgba(245, 166, 35, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(310, labBoxY, 980, labBoxHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Lab Name (dynamically sized if title is long)
      let labFontSize = 26;
      ctx.font = `bold ${labFontSize}px 'IBM Plex Sans', sans-serif`;
      while (ctx.measureText(labName).width > 920 && labFontSize > 18) {
        labFontSize -= 2;
        ctx.font = `bold ${labFontSize}px 'IBM Plex Sans', sans-serif`;
      }
      ctx.fillStyle = "#f5a623";
      ctx.fillText(labName, 800, labBoxY + 38);

      // Category & Subject
      ctx.font = "14px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#94a3b8";
      const subText = `Category: ${category}${subjectName ? ` · Course: ${subjectName}` : ""}`;
      ctx.fillText(subText, 800, labBoxY + 68);

      // 8. Lab Description (word-wrapped cleanly below lab box)
      if (labDesc) {
        ctx.font = "15px 'IBM Plex Sans', sans-serif";
        ctx.fillStyle = "#8b949e";
        const descLines = wrapText(labDesc, 960).slice(0, 2);
        descLines.forEach((dl, i) => {
          ctx.fillText(dl, 800, 545 + i * 22);
        });
      }

      // 9. Evaluation Specs Grid Card
      const specsY = 595;
      const specsHeight = 96;
      ctx.fillStyle = "rgba(13, 17, 23, 0.9)";
      ctx.strokeStyle = "rgba(48, 54, 61, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(310, specsY, 980, specsHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Column Dividers inside specs box
      ctx.strokeStyle = "rgba(48, 54, 61, 0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(636, specsY + 12);
      ctx.lineTo(636, specsY + specsHeight - 12);
      ctx.moveTo(964, specsY + 12);
      ctx.lineTo(964, specsY + specsHeight - 12);
      ctx.stroke();

      // Col 1: Score
      ctx.font = "13px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("SCORE ACHIEVED", 473, specsY + 32);
      ctx.font = "bold 22px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#34d399";
      ctx.fillText(`${score} / ${maxScore} PTS (${pct}%)`, 473, specsY + 66);

      // Col 2: Questions
      ctx.font = "13px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("QUESTIONS ATTENDED", 800, specsY + 32);
      ctx.font = "bold 22px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`${solvedQuestions} of ${totalQuestions} Solved`, 800, specsY + 66);

      // Col 3: Status
      ctx.font = "13px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("EVALUATION STATUS", 1127, specsY + 32);
      ctx.font = "bold 20px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText(solvedQuestions >= totalQuestions ? "Fully Completed" : "Attended & Finalized", 1127, specsY + 66);

      // 10. Divider before footer
      ctx.strokeStyle = "rgba(245, 166, 35, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(120, 735);
      ctx.lineTo(1480, 735);
      ctx.stroke();

      // 11. Footer - Left: ID and Date
      ctx.textAlign = "left";
      ctx.font = "14px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText(`Certificate ID: ${certId}`, 140, 785);
      ctx.fillText(`Date of Completion: ${formattedDate}`, 140, 816);
      ctx.fillStyle = "#34d399";
      ctx.fillText("✓ Authenticity Verified on Blitz Cyber Lab System", 140, 847);

      // 12. Footer - Center Seal Badge
      ctx.textAlign = "center";
      const sealX = 800;
      const sealY = 825;
      const sealR = 48;

      ctx.fillStyle = "rgba(245, 166, 35, 0.15)";
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(245, 166, 35, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 6, 0, Math.PI * 2);
      ctx.stroke();

      // Mini 5-pointed gold star
      const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;
          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = "#f5a623";
        ctx.fill();
      };
      drawStar(sealX, sealY - 18, 5, 8, 4);

      ctx.font = "bold 11.5px 'IBM Plex Mono', monospace, sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText("OFFICIAL", sealX, sealY + 8);
      ctx.fillText("VERIFIED", sealX, sealY + 24);

      // 13. Footer - Right: Signature
      ctx.textAlign = "right";
      ctx.font = "italic 26px 'Georgia', serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText("Academic Directorate", 1460, 792);

      ctx.strokeStyle = "rgba(245, 166, 35, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1240, 808);
      ctx.lineTo(1460, 808);
      ctx.stroke();

      ctx.font = "bold 16px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("Blitz Academy", 1460, 832);
      ctx.font = "14px 'IBM Plex Sans', sans-serif";
      ctx.fillStyle = "#8b949e";
      ctx.fillText("Head of Cybersecurity Lab Evaluation", 1460, 856);

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
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #06080d !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body > * {
            visibility: hidden !important;
          }
          .cert-modal-overlay {
            visibility: visible !important;
            position: static !important;
            inset: auto !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #06080d !important;
            overflow: visible !important;
          }
          .cert-modal-inner {
            visibility: visible !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
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
            padding: 24px 36px !important;
            box-sizing: border-box !important;
            background: #090b10 !important;
            color: #ffffff !important;
            border: 3px double #f5a623 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            z-index: 999999 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
        className="cert-modal-overlay"
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
          className="cert-modal-inner"
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
            className="no-print"
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
            className="no-print"
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

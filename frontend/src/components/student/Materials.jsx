import React, { useState, useEffect } from "react";
import {
  FileText, Download, Eye, Layers, FlaskConical,
  Search, X, BookOpen, Clock, RefreshCw, Presentation, File
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentMaterials } from "../../api/materials";

function getFileTypeMeta(type, fileName = "") {
  const upper = (type || "").toUpperCase();
  const name = fileName.toLowerCase();

  if (upper === "PDF" || name.endsWith(".pdf")) {
    return {
      label: "PDF",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.3)",
      icon: FileText,
    };
  }
  if (upper === "WORD" || name.endsWith(".doc") || name.endsWith(".docx")) {
    return {
      label: "DOCX",
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.12)",
      border: "rgba(59, 130, 246, 0.3)",
      icon: FileText,
    };
  }
  if (upper === "PPTX" || name.endsWith(".ppt") || name.endsWith(".pptx")) {
    return {
      label: "PPTX",
      color: "#f97316",
      bg: "rgba(249, 115, 22, 0.12)",
      border: "rgba(249, 115, 22, 0.3)",
      icon: Presentation,
    };
  }
  return {
    label: "FILE",
    color: C.cyan,
    bg: "rgba(0, 229, 255, 0.1)",
    border: "rgba(0, 229, 255, 0.25)",
    icon: File,
  };
}

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState("All");

  const loadMaterials = () => {
    setLoading(true);
    fetchStudentMaterials()
      .then((data) => {
        setMaterials(data.results || []);
      })
      .catch((err) => {
        console.warn("Could not load student materials from backend:", err);
        setMaterials([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Distinct subjects present in student materials
  const subjectsList = ["All", ...new Set(materials.map((m) => m.subject_name).filter(Boolean))];

  const filtered = materials.filter((m) => {
    const matchesSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.subject_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.lab_name || "").toLowerCase().includes(search.toLowerCase());

    const matchesSubject = activeSubject === "All" || m.subject_name === activeSubject;

    return matchesSearch && matchesSubject;
  });

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
              Study Materials
            </h1>
            <Badge tone="cyan">{materials.length} Documents</Badge>
          </div>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            Subject curriculum documentation, cheat sheets, and lab guides for your enrolled courses.
          </p>
        </div>
        <Btn onClick={loadMaterials} variant="subtle" icon={RefreshCw} disabled={loading}>
          Refresh
        </Btn>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: C.panel2,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: "8px 12px",
            width: 280,
          }}
        >
          <Search size={14} color={C.mid} />
          <input
            type="text"
            placeholder="Search documents or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: C.hi,
              fontFamily: sans,
              fontSize: 13,
              width: "100%",
            }}
          />
          {search && (
            <X size={14} color={C.mid} style={{ cursor: "pointer" }} onClick={() => setSearch("")} />
          )}
        </div>

        {/* Subject Pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {subjectsList.map((subj) => (
            <button
              key={subj}
              onClick={() => setActiveSubject(subj)}
              style={{
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 20,
                border: activeSubject === subj ? `1px solid ${C.cyan}` : `1px solid ${C.border}`,
                background: activeSubject === subj ? "rgba(0, 229, 255, 0.12)" : C.panel2,
                color: activeSubject === subj ? C.cyan : C.mid,
                cursor: "pointer",
                transition: "all 120ms ease",
              }}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: C.mid, fontFamily: sans }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div>Loading study materials...</div>
        </div>
      ) : filtered.length === 0 ? (
        <Panel style={{ padding: "48px 24px", textAlign: "center", background: C.panel2, border: `1px dashed ${C.border}` }}>
          <BookOpen size={40} color={C.low} style={{ margin: "0 auto 14px", display: "block" }} />
          <h3 style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
            No Study Materials Available
          </h3>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, maxWidth: 420, margin: "0 auto" }}>
            {search || activeSubject !== "All"
              ? "No study documents match your current filter criteria."
              : "No study materials have been published for your enrolled subjects yet. Check back soon!"}
          </p>
        </Panel>
      ) : (
        <Panel style={{ overflow: "hidden" }}>
          {filtered.map((item, i) => {
            const meta = getFileTypeMeta(item.file_type, item.file);
            const Icon = meta.icon;

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                  transition: "background 150ms",
                }}
              >
                {/* File Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: meta.color,
                  }}
                >
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        fontWeight: 700,
                        color: meta.color,
                        background: meta.bg,
                        padding: "1px 6px",
                        borderRadius: 4,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      {meta.label}
                    </span>
                    {item.file_size_formatted && (
                      <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                        {item.file_size_formatted}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 11,
                        color: C.cyan,
                        background: "rgba(0, 229, 255, 0.08)",
                        padding: "2px 7px",
                        borderRadius: 4,
                        border: "1px solid rgba(0, 229, 255, 0.2)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Layers size={10} />
                      {item.subject_name || "General Curriculum"}
                    </span>

                    {item.lab_name && (
                      <span
                        style={{
                          fontFamily: sans,
                          fontSize: 11,
                          color: C.amber,
                          background: "rgba(245, 166, 35, 0.1)",
                          padding: "2px 7px",
                          borderRadius: 4,
                          border: "1px solid rgba(245, 166, 35, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FlaskConical size={10} />
                        Lab: {item.lab_name}
                      </span>
                    )}

                    {item.description && (
                      <span style={{ fontFamily: sans, fontSize: 12, color: C.mid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date */}
                <span style={{ fontFamily: mono, fontSize: 11, color: C.low, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} />
                  {new Date(item.created_at).toLocaleDateString()}
                </span>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <Btn variant="ghost" small icon={Eye}>
                        Read
                      </Btn>
                    </a>
                  )}

                  {item.file_url && (
                    <a
                      href={item.file_url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <Btn variant="outline" small icon={Download}>
                        Download
                      </Btn>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </Panel>
      )}
    </div>
  );
}

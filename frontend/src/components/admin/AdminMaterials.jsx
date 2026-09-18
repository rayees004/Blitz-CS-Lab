import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, X, BookOpen, FileText, Download,
  ExternalLink, Trash2, RefreshCw, AlertCircle, CheckCircle,
  File, Presentation, Layers, FlaskConical, Filter, Upload,
  Clock, HardDrive, Eye
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchMaterials, createMaterial, deleteMaterial } from "../../api/materials";
import { fetchSubjects } from "../../api/subjects";
import { fetchLabs } from "../../api/labs";

/* ── File type badge & icon helpers ── */
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

export default function AdminMaterials() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Upload Form State
  const [uploadSubjectId, setUploadSubjectId] = useState("");
  const [uploadLabId, setUploadLabId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, subjRes, labRes] = await Promise.all([
        fetchMaterials(),
        fetchSubjects(),
        fetchLabs(),
      ]);
      setMaterials(matRes.results || []);
      setSubjects(subjRes.results || []);
      setLabs(labRes.results || []);
    } catch (err) {
      console.error("Error loading materials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter labs based on subject selected in upload modal
  const availableLabsForUpload = uploadSubjectId
    ? labs.filter((l) => String(l.subject_id || l.subject?.id || l.subject) === String(uploadSubjectId))
    : labs;

  const handleOpenUpload = () => {
    setUploadSubjectId(subjects.length > 0 ? String(subjects[0].id) : "");
    setUploadLabId("");
    setUploadTitle("");
    setUploadDesc("");
    setUploadFile(null);
    setFormError("");
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const name = file.name.toLowerCase();
      const valid = name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx") || name.endsWith(".ppt") || name.endsWith(".pptx");
      if (!valid) {
        setFormError("Only PDF, Word (.doc, .docx), and PowerPoint (.ppt, .pptx) files are supported.");
        setUploadFile(null);
        return;
      }
      setUploadFile(file);
      setFormError("");
      if (!uploadTitle.trim()) {
        // Pre-fill title from filename without extension
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setUploadTitle(cleanName);
      }
    }
  };

  const handleSubmitUpload = async (e) => {
    e.preventDefault();
    if (!uploadSubjectId) {
      setFormError("Please select a subject (mandatory).");
      return;
    }
    if (!uploadTitle.trim()) {
      setFormError("Please enter a material title.");
      return;
    }
    if (!uploadFile) {
      setFormError("Please select a file to upload (PDF, Word, or PPTX).");
      return;
    }

    setUploading(true);
    setFormError("");

    try {
      const fd = new FormData();
      fd.append("subject", uploadSubjectId);
      if (uploadLabId) {
        fd.append("lab", uploadLabId);
      }
      fd.append("title", uploadTitle.trim());
      if (uploadDesc.trim()) {
        fd.append("description", uploadDesc.trim());
      }
      fd.append("file", uploadFile);

      const res = await createMaterial(fd);
      setSuccessToast(`Material "${res.material.title}" uploaded successfully!`);
      setShowUploadModal(false);
      loadData();
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to upload study material.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      setSuccessToast(`Deleted "${title}".`);
      setTimeout(() => setSuccessToast(""), 3000);
    } catch (err) {
      alert(err.message || "Failed to delete material.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.subject_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.lab_name || "").toLowerCase().includes(search.toLowerCase());

    const matchesSubject =
      filterSubject === "All" || String(m.subject) === String(filterSubject);

    const matchesType =
      filterType === "All" || (m.file_type || "").toUpperCase() === filterType.toUpperCase();

    return matchesSearch && matchesSubject && matchesType;
  });

  // Metrics
  const pdfCount = materials.filter((m) => (m.file_type || "").toUpperCase() === "PDF").length;
  const wordCount = materials.filter((m) => (m.file_type || "").toUpperCase() === "WORD").length;
  const pptxCount = materials.filter((m) => (m.file_type || "").toUpperCase() === "PPTX").length;

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Toast */}
      {successToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle size={16} /> {successToast}
        </div>
      )}

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
            Upload and organize subject-based guides, syllabi, cheat sheets, and lab reference documents (PDF, Word, PPTX).
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={loadData} variant="subtle" icon={RefreshCw} disabled={loading}>
            Refresh
          </Btn>
          <Btn onClick={handleOpenUpload} icon={Plus} variant="primary">
            Upload Material
          </Btn>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <Panel style={{ padding: "16px 18px" }}>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.low }}>Total Documents</div>
          <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: C.hi, marginTop: 6 }}>
            {materials.length}
          </div>
          <div style={{ fontFamily: sans, fontSize: 11, color: C.mid, marginTop: 4 }}>
            Across {new Set(materials.map((m) => m.subject)).size} subjects
          </div>
        </Panel>

        <Panel style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low }}>PDF Documents</div>
            <span style={{ fontSize: 10, fontFamily: mono, color: "#ef4444", background: "rgba(239,68,68,0.12)", padding: "2px 6px", borderRadius: 4 }}>
              PDF
            </span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: "#ef4444", marginTop: 6 }}>
            {pdfCount}
          </div>
          <div style={{ fontFamily: sans, fontSize: 11, color: C.mid, marginTop: 4 }}>
            Manuals & guides
          </div>
        </Panel>

        <Panel style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low }}>Word Documents</div>
            <span style={{ fontSize: 10, fontFamily: mono, color: "#3b82f6", background: "rgba(59,130,246,0.12)", padding: "2px 6px", borderRadius: 4 }}>
              DOCX
            </span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: "#3b82f6", marginTop: 6 }}>
            {wordCount}
          </div>
          <div style={{ fontFamily: sans, fontSize: 11, color: C.mid, marginTop: 4 }}>
            Editable worksheets & notes
          </div>
        </Panel>

        <Panel style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.low }}>PowerPoint Slides</div>
            <span style={{ fontSize: 10, fontFamily: mono, color: "#f97316", background: "rgba(249,115,22,0.12)", padding: "2px 6px", borderRadius: 4 }}>
              PPTX
            </span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, color: "#f97316", marginTop: 6 }}>
            {pptxCount}
          </div>
          <div style={{ fontFamily: sans, fontSize: 11, color: C.mid, marginTop: 4 }}>
            Class lecture presentations
          </div>
        </Panel>
      </div>

      {/* Filter & Search Bar */}
      <Panel style={{ padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 12px", flex: 1, minWidth: 240 }}>
          <Search size={14} color={C.mid} />
          <input
            type="text"
            placeholder="Search documents, subjects, labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", color: C.hi, fontFamily: sans, fontSize: 13, width: "100%" }}
          />
          {search && (
            <X size={14} color={C.mid} style={{ cursor: "pointer" }} onClick={() => setSearch("")} />
          )}
        </div>

        {/* Filter by Subject */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>Subject:</span>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              color: C.hi,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12.5,
              outline: "none",
            }}
          >
            <option value="All">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.code ? `(${s.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by File Type */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>Format:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              color: C.hi,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12.5,
              outline: "none",
            }}
          >
            <option value="All">All Formats</option>
            <option value="PDF">PDF (.pdf)</option>
            <option value="WORD">Word (.doc, .docx)</option>
            <option value="PPTX">PowerPoint (.ppt, .pptx)</option>
          </select>
        </div>
      </Panel>

      {/* Documents List */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: C.mid, fontFamily: sans }}>
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div>Loading study materials...</div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Panel style={{ padding: "48px 24px", textAlign: "center", background: C.panel2, border: `1px dashed ${C.border}` }}>
          <BookOpen size={40} color={C.low} style={{ margin: "0 auto 14px", display: "block" }} />
          <h3 style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
            No Study Materials Found
          </h3>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, maxWidth: 420, margin: "0 auto 18px" }}>
            {search || filterSubject !== "All" || filterType !== "All"
              ? "No documents match the active filter criteria. Try clearing the filters."
              : "No study materials have been uploaded yet. Click below to add the first PDF, Word, or PPTX file."}
          </p>
          <Btn onClick={handleOpenUpload} icon={Plus} variant="primary">
            Upload Study Material
          </Btn>
        </Panel>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredMaterials.map((item) => {
            const meta = getFileTypeMeta(item.file_type, item.file);
            const Icon = meta.icon;

            return (
              <Panel
                key={item.id}
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  transition: "background 150ms",
                }}
              >
                {/* File Format Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
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
                  <Icon size={20} />
                </div>

                {/* Main Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 10.5,
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

                  {/* Metadata Row: Subject, Course, Optional Lab */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 11.5,
                        color: C.cyan,
                        background: "rgba(0, 229, 255, 0.08)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid rgba(0, 229, 255, 0.2)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Layers size={11} />
                      Subject: {item.subject_name || "Assigned Subject"}
                    </span>

                    {item.lab_name && (
                      <span
                        style={{
                          fontFamily: sans,
                          fontSize: 11.5,
                          color: C.amber,
                          background: "rgba(245, 166, 35, 0.1)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(245, 166, 35, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FlaskConical size={11} />
                        Lab: {item.lab_name}
                      </span>
                    )}

                    {item.description && (
                      <span style={{ fontFamily: sans, fontSize: 12, color: C.mid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Upload info & Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontFamily: mono, fontSize: 10.5, color: C.low, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ fontFamily: sans, fontSize: 11, color: C.mid }}>
                      by {item.uploaded_by_name || "Admin"}
                    </span>
                  </div>

                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <Btn small variant="subtle" icon={Eye}>
                        View
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
                      <Btn small variant="outline" icon={Download}>
                        Download
                      </Btn>
                    </a>
                  )}

                  <Btn
                    small
                    variant="danger"
                    icon={Trash2}
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id, item.title)}
                  >
                    Delete
                  </Btn>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            padding: 16,
          }}
        >
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              width: "100%",
              maxWidth: 540,
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.panel2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "rgba(0, 229, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.cyan,
                  }}
                >
                  <Upload size={18} />
                </div>
                <div>
                  <h3 style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, margin: 0 }}>
                    Upload Study Material
                  </h3>
                  <div style={{ fontFamily: sans, fontSize: 11.5, color: C.mid, marginTop: 2 }}>
                    Add subject-based document (PDF, Word, or PPTX)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "transparent", border: "none", color: C.low, cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitUpload} style={{ padding: 22 }}>
              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(229, 83, 75, 0.1)",
                    border: "1px solid rgba(229, 83, 75, 0.3)",
                    borderRadius: 6,
                    color: "#fca5a5",
                    fontSize: 12.5,
                    fontFamily: sans,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Subject (MANDATORY) */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Target Subject <span style={{ color: C.amber }}>* (Mandatory)</span>
                </label>
                <select
                  value={uploadSubjectId}
                  onChange={(e) => {
                    setUploadSubjectId(e.target.value);
                    setUploadLabId(""); // Reset lab when subject changes
                  }}
                  required
                  style={{
                    width: "100%",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px",
                    fontFamily: sans,
                    fontSize: 13,
                    color: C.hi,
                    outline: "none",
                  }}
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ""} {s.course_name ? `· Course: ${s.course_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Lab (OPTIONAL) */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>
                    Linked Lab (Optional)
                  </label>
                  <span style={{ fontFamily: sans, fontSize: 11, color: C.low }}>
                    Leave blank for general subject material
                  </span>
                </div>
                <select
                  value={uploadLabId}
                  onChange={(e) => setUploadLabId(e.target.value)}
                  style={{
                    width: "100%",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px",
                    fontFamily: sans,
                    fontSize: 13,
                    color: C.hi,
                    outline: "none",
                  }}
                >
                  <option value="">-- None (General Subject Material) --</option>
                  {availableLabsForUpload.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lab #{String(l.id).padStart(2, "0")}: {l.name} ({l.category || l.cat || "Lab"})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Title */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Document Title <span style={{ color: C.amber }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Web Security Cheat Sheet & Methodologies"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px",
                    fontFamily: sans,
                    fontSize: 13,
                    color: C.hi,
                    outline: "none",
                  }}
                />
              </div>

              {/* 4. Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Description / Notes (Optional)
                </label>
                <textarea
                  placeholder="Brief note or instructions for students reading this document..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px",
                    fontFamily: sans,
                    fontSize: 12.5,
                    color: C.hi,
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* 5. File Picker */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  File Document <span style={{ color: C.amber }}>* (.pdf, .doc, .docx, .ppt, .pptx)</span>
                </label>
                <div
                  style={{
                    border: `1px dashed ${uploadFile ? C.cyan : C.border}`,
                    background: uploadFile ? "rgba(0, 229, 255, 0.04)" : C.panel2,
                    borderRadius: 8,
                    padding: "18px 14px",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleFileChange}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                  {uploadFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <FileText size={22} color={C.cyan} />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: C.hi }}>
                          {uploadFile.name}
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} color={C.mid} style={{ margin: "0 auto 6px", display: "block" }} />
                      <div style={{ fontFamily: sans, fontSize: 13, color: C.hi, fontWeight: 600 }}>
                        Click to select document
                      </div>
                      <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginTop: 4 }}>
                        Supports PDF, Microsoft Word, and PowerPoint (up to 50MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Btn type="button" variant="subtle" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                  Cancel
                </Btn>
                <Btn type="submit" variant="primary" icon={Upload} disabled={uploading}>
                  {uploading ? "Uploading Document..." : "Upload Material"}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  X, Plus, Trash2, HelpCircle, Lightbulb, AlertCircle,
  Flag, Award, Globe, Server, CheckCircle2, ChevronDown, Sparkles,
  BookMarked, Video, UploadCloud, Film, PlayCircle,
  Terminal, Code, FolderArchive, Download, Link2, FileCode
} from "lucide-react";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchSubjects } from "../../api/subjects";

const CATEGORIES = [
  "Web Security",
  "API Security",
  "Authentication",
  "Bug Bounty",
  "Network Security",
  "OSINT",
  "Cryptography",
  "Cloud Security",
  "Advanced Web Security",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function AddLabModal({ isOpen, onClose, onLabCreated, initialLab = null, initialCourse = null }) {
  if (!isOpen) return null;

  const isEdit = Boolean(initialLab?.id && typeof initialLab.id === "number");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchSubjects().then((data) => {
      setCourses(data.results || []);
    }).catch((err) => console.warn("Could not load courses for lab modal:", err));
  }, []);


  const [form, setForm] = useState(() => {
    if (initialLab) {
      return {
        name: initialLab.name || "",
        description: initialLab.desc || initialLab.description || "",
        org: initialLab.org || "BlitzLab",
        category: initialLab.cat || initialLab.category || "Web Security",
        difficulty: initialLab.diff || initialLab.difficulty || "Beginner",
        points: initialLab.pts || initialLab.points || 100,
        target_url: initialLab.target_url || "",
        video_url: initialLab.video_url || "",
        source_link: initialLab.source_link || "",
        setup_guide: initialLab.setup_guide || "",
        setup_commands: initialLab.setup_commands || "",
        subject_id: initialCourse?.id || initialLab.subject_id || initialLab.subject || "",
        questions: (initialLab.questions && initialLab.questions.length > 0)

          ? initialLab.questions.map((q) => ({
              title: q.title || "",
              description: q.description || "",
              flag: q.flag || "",
              points: q.points || 50,
              hints: (q.hints && q.hints.length > 0)
                ? q.hints.map((h) => ({
                    hint_text: typeof h === "string" ? h : (h.hint_text || ""),
                    cost: h.cost ?? 10,
                  }))
                : [],
            }))
          : [
              {
                title: "Vulnerability Discovery & Exploitation",
                description: "Identify the vulnerability and extract the validation flag.",
                flag: "BLITZ{sample_flag_123}",
                points: 50,
                hints: [
                  { hint_text: "Examine request parameters in browser developer tools.", cost: 10 },
                ],
              },
            ],
      };
    }

    return {
      name: "",
      description: "",
      org: "BlitzLab",
      category: "Web Security",
      difficulty: "Beginner",
      points: 100,
      target_url: "",
      video_url: "",
      source_link: "",
      setup_guide: "",
      setup_commands: "",
      subject_id: initialCourse?.id ? String(initialCourse.id) : "",
      questions: [

        {
          title: "Vulnerability Discovery & Exploitation",
          description: "Identify the vulnerability and extract the validation flag.",
          flag: "BLITZ{example_secret_flag}",
          points: 50,
          hints: [
            { hint_text: "Check common endpoint parameters and response headers.", cost: 10 },
          ],
        },
      ],
    };
  });

  const [videoFile, setVideoFile] = useState(null);
  const [videoFilePreview, setVideoFilePreview] = useState(initialLab?.video_file || null);
  const [videoMode, setVideoMode] = useState(() => (initialLab?.video_url ? "url" : (initialLab?.video_file ? "upload" : "upload")));

  const [sourceFile, setSourceFile] = useState(null);
  const [sourceFilePreview, setSourceFilePreview] = useState(initialLab?.source_file || null);
  const [sourceMode, setSourceMode] = useState(() => (initialLab?.source_link ? "link" : (initialLab?.source_file ? "upload" : "upload")));

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  /* ── Question handlers ── */
  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          title: `Question ${prev.questions.length + 1}`,
          description: "",
          flag: "",
          points: 50,
          hints: [{ hint_text: "", cost: 10 }],
        },
      ],
    }));
  };

  const removeQuestion = (qIndex) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== qIndex),
    }));
  };

  const updateQuestion = (qIndex, field, value) => {
    setForm((prev) => {
      const updated = [...prev.questions];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  /* ── Hint handlers ── */
  const addHint = (qIndex) => {
    setForm((prev) => {
      const updated = [...prev.questions];
      const q = updated[qIndex];
      updated[qIndex] = {
        ...q,
        hints: [...(q.hints || []), { hint_text: "", cost: 10 }],
      };
      return { ...prev, questions: updated };
    });
  };

  const removeHint = (qIndex, hIndex) => {
    setForm((prev) => {
      const updated = [...prev.questions];
      const q = updated[qIndex];
      updated[qIndex] = {
        ...q,
        hints: q.hints.filter((_, idx) => idx !== hIndex),
      };
      return { ...prev, questions: updated };
    });
  };

  const updateHint = (qIndex, hIndex, field, value) => {
    setForm((prev) => {
      const updated = [...prev.questions];
      const q = updated[qIndex];
      const updatedHints = [...q.hints];
      updatedHints[hIndex] = { ...updatedHints[hIndex], [field]: value };
      updated[qIndex] = { ...q, hints: updatedHints };
      return { ...prev, questions: updated };
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Lab name is required";
    if (!form.description.trim()) errs.description = "Lab description is required";
    if (!form.points || Number(form.points) <= 0) errs.points = "Points must be greater than 0";

    form.questions.forEach((q, qIdx) => {
      if (!q.title.trim()) {
        errs[`q_${qIdx}_title`] = `Question #${qIdx + 1} title is required`;
      }
    });

    return errs;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setGlobalError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const cleanQuestions = form.questions.map((q, qIdx) => ({
        title: q.title.trim(),
        description: q.description.trim(),
        flag: q.flag.trim(),
        points: Number(q.points) || 50,
        order: qIdx,
        hints: (q.hints || [])
          .filter((h) => h.hint_text.trim().length > 0)
          .map((h, hIdx) => ({
            hint_text: h.hint_text.trim(),
            cost: Number(h.cost) || 0,
            order: hIdx,
          })),
      }));

      let payload;
      if (videoFile || sourceFile) {
        payload = new FormData();
        payload.append("name", form.name.trim());
        payload.append("description", form.description.trim());
        payload.append("org", form.org.trim() || "BlitzLab");
        payload.append("category", form.category);
        payload.append("difficulty", form.difficulty);
        payload.append("points", String(Number(form.points) || 100));
        payload.append("target_url", form.target_url.trim());
        payload.append("video_url", form.video_url.trim());
        payload.append("source_link", form.source_link.trim());
        payload.append("setup_guide", form.setup_guide.trim());
        payload.append("setup_commands", form.setup_commands.trim());
        if (form.subject_id) {
          payload.append("subject_id", String(form.subject_id));
        }
        if (videoFile) {
          payload.append("video_file", videoFile);
        }
        if (sourceFile) {
          payload.append("source_file", sourceFile);
        }
        payload.append("questions", JSON.stringify(cleanQuestions));
      } else {
        payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          org: form.org.trim() || "BlitzLab",
          category: form.category,
          difficulty: form.difficulty,
          points: Number(form.points) || 100,
          target_url: form.target_url.trim(),
          video_url: form.video_url.trim(),
          source_link: form.source_link.trim(),
          setup_guide: form.setup_guide.trim(),
          setup_commands: form.setup_commands.trim(),
          subject_id: form.subject_id ? Number(form.subject_id) : null,
          questions: cleanQuestions,
        };
      }

      if (onLabCreated) {
        await onLabCreated(payload, initialLab?.id);
      }
      onClose();
    } catch (err) {
      setGlobalError(err.message || "Failed to save lab. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 13, 18, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "90vh",
          background: C.panel,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.panel2,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} color={C.amber} />
              <h2 style={{ fontFamily: sans, fontSize: 17, fontWeight: 700, color: C.hi, margin: 0 }}>
                {isEdit ? "Edit Lab" : "Add New Lab"}
              </h2>
            </div>
            <p style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, margin: "4px 0 0" }}>
              Define lab scenario, assign point values, multiple questions, and question-level hints.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: C.low,
              cursor: "pointer",
              padding: 6,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 26px" }}>
          {globalError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "rgba(229, 83, 75, 0.15)",
                border: `1px solid ${C.danger}`,
                borderRadius: 8,
                marginBottom: 20,
                color: C.danger,
                fontSize: 13,
                fontFamily: sans,
              }}
            >
              <AlertCircle size={16} />
              <span>{globalError}</span>
            </div>
          )}

          {/* ── Section 1: Lab Details ── */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em", marginBottom: 14, fontWeight: 600 }}>
              01 // LAB SPECIFICATIONS
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                Lab Name <span style={{ color: C.amber }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Advanced SQL Injection in ShopX"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.panel2,
                  border: `1px solid ${errors.name ? C.danger : C.border}`,
                  borderRadius: 7,
                  padding: "9px 12px",
                  fontFamily: sans,
                  fontSize: 13,
                  color: C.hi,
                  outline: "none",
                }}
              />
              {errors.name && <div style={{ color: C.danger, fontSize: 11.5, marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontFamily: sans, fontSize: 12, color: C.mid, display: "flex", alignItems: "center", gap: 5 }}>
                  <BookMarked size={13} color={C.amber} />
                  Assigned Course (Curriculum Track)
                </label>
                {initialCourse && (
                  <Badge tone="cyan">Locked to {initialCourse.code || initialCourse.name}</Badge>
                )}
              </div>
              <select
                value={form.subject_id}
                onChange={(e) => updateField("subject_id", e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.panel2,
                  border: `1px solid ${form.subject_id ? C.amberDim : C.border}`,
                  borderRadius: 7,
                  padding: "9px 12px",
                  fontFamily: sans,
                  fontSize: 12.5,
                  color: C.hi,
                  outline: "none",
                }}
              >
                <option value="">— Standalone Lab (Not assigned to any course) —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code ? `[${c.code}] ` : ""}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                Description / Mission Objective <span style={{ color: C.amber }}>*</span>
              </label>

              <textarea
                placeholder="Describe the environment scenario, exploitation objective, and expected vulnerabilities..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: C.panel2,
                  border: `1px solid ${errors.description ? C.danger : C.border}`,
                  borderRadius: 7,
                  padding: "9px 12px",
                  fontFamily: sans,
                  fontSize: 12.5,
                  color: C.hi,
                  outline: "none",
                  resize: "vertical",
                }}
              />
              {errors.description && <div style={{ color: C.danger, fontSize: 11.5, marginTop: 4 }}>{errors.description}</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 10px",
                    fontFamily: sans,
                    fontSize: 12.5,
                    color: C.hi,
                    outline: "none",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 10px",
                    fontFamily: sans,
                    fontSize: 12.5,
                    color: C.hi,
                    outline: "none",
                  }}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Total Points
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={form.points}
                  onChange={(e) => updateField("points", e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panel2,
                    border: `1px solid ${errors.points ? C.danger : C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px",
                    fontFamily: mono,
                    fontSize: 13,
                    color: C.amber,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Teaching Video Upload / Link Sub-section */}
            <div
              style={{
                marginTop: 18,
                padding: "16px 18px",
                background: "rgba(245, 166, 35, 0.04)",
                border: `1px solid rgba(245, 166, 35, 0.25)`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Video size={16} color={C.amber} />
                  <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: C.hi }}>
                    Lab Teaching & Walkthrough Video
                  </span>
                  <Badge tone="amber">Optional</Badge>
                </div>

                <div style={{ display: "flex", gap: 4, background: C.panel2, padding: 3, borderRadius: 6, border: `1px solid ${C.border}` }}>
                  <button
                    type="button"
                    onClick={() => setVideoMode("upload")}
                    style={{
                      background: videoMode === "upload" ? C.amber : "transparent",
                      color: videoMode === "upload" ? "#1A1200" : C.mid,
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 9px",
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <UploadCloud size={12} /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode("url")}
                    style={{
                      background: videoMode === "url" ? C.amber : "transparent",
                      color: videoMode === "url" ? "#1A1200" : C.mid,
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 9px",
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Film size={12} /> Video URL
                  </button>
                </div>
              </div>

              {videoMode === "upload" ? (
                <div>
                  <div
                    style={{
                      border: `1.5px dashed ${videoFile ? C.amber : C.border}`,
                      borderRadius: 8,
                      padding: "16px 20px",
                      textAlign: "center",
                      background: C.panel2,
                      cursor: "pointer",
                      position: "relative",
                      transition: "border-color 150ms",
                    }}
                  >
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime,video/mkv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVideoFile(file);
                          setVideoFilePreview(URL.createObjectURL(file));
                        }
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                    <UploadCloud size={28} color={videoFile ? C.amber : C.cyan} style={{ marginBottom: 6 }} />
                    <div style={{ fontFamily: sans, fontSize: 13, color: C.hi, fontWeight: 600 }}>
                      {videoFile ? videoFile.name : (videoFilePreview ? "Replace current uploaded video" : "Click or drag teaching video file here")}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 4 }}>
                      {videoFile
                        ? `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB · Selected`
                        : "Supports MP4, WebM, MKV, QuickTime (up to 500MB)"}
                    </div>
                  </div>

                  {videoFilePreview && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel3, padding: "8px 12px", borderRadius: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <PlayCircle size={15} color={C.amber} />
                        <span style={{ fontFamily: mono, fontSize: 11.5, color: C.hi, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {videoFile ? videoFile.name : (typeof videoFilePreview === "string" ? videoFilePreview.split("/").pop() : "Teaching Video")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoFilePreview(null);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: C.danger,
                          cursor: "pointer",
                          fontFamily: sans,
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                    Direct Video Stream / YouTube / Vimeo URL
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://www.youtube.com/watch?v=... or https://cdn.blitzlab.io/videos/lab1.mp4"
                    value={form.video_url}
                    onChange={(e) => updateField("video_url", e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: C.panel2,
                      border: `1px solid ${C.border}`,
                      borderRadius: 7,
                      padding: "9px 12px",
                      fontFamily: mono,
                      fontSize: 12.5,
                      color: C.hi,
                      outline: "none",
                    }}
                  />
                  <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginTop: 4 }}>
                    Embed YouTube, Vimeo, or direct .mp4/.webm video link for teaching students how to solve this lab.
                  </div>
                </div>
              )}
            </div>

            {/* ── Source Code Attachment & Local Setup Sub-section ── */}
            <div
              style={{
                marginTop: 18,
                padding: "16px 18px",
                background: "rgba(0, 229, 255, 0.03)",
                border: `1px solid rgba(0, 229, 255, 0.25)`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FolderArchive size={16} color={C.cyan} />
                  <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: C.hi }}>
                    Lab Source Code & Local Setup
                  </span>
                  <Badge tone="cyan">Optional</Badge>
                </div>

                <div style={{ display: "flex", gap: 4, background: C.panel2, padding: 3, borderRadius: 6, border: `1px solid ${C.border}` }}>
                  <button
                    type="button"
                    onClick={() => setSourceMode("upload")}
                    style={{
                      background: sourceMode === "upload" ? C.cyan : "transparent",
                      color: sourceMode === "upload" ? "#0A0D12" : C.mid,
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 9px",
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <UploadCloud size={12} /> Source File (.ZIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode("link")}
                    style={{
                      background: sourceMode === "link" ? C.cyan : "transparent",
                      color: sourceMode === "link" ? "#0A0D12" : C.mid,
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 9px",
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Link2 size={12} /> Repo Link (GitHub)
                  </button>
                </div>
              </div>

              {sourceMode === "upload" ? (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      border: `1.5px dashed ${sourceFile ? C.cyan : C.border}`,
                      borderRadius: 8,
                      padding: "16px 20px",
                      textAlign: "center",
                      background: C.panel2,
                      cursor: "pointer",
                      position: "relative",
                      transition: "border-color 150ms",
                    }}
                  >
                    <input
                      type="file"
                      accept=".zip,.tar,.tar.gz,.tgz,.rar,.7z,.py,.js,.html,.sh,.dockerfile"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSourceFile(file);
                          setSourceFilePreview(file.name);
                        }
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0,
                        cursor: "pointer",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                    <FolderArchive size={28} color={sourceFile ? C.cyan : C.mid} style={{ marginBottom: 6 }} />
                    <div style={{ fontFamily: sans, fontSize: 13, color: C.hi, fontWeight: 600 }}>
                      {sourceFile ? sourceFile.name : (sourceFilePreview ? "Replace current uploaded source archive" : "Click or drag lab source archive (.ZIP, .TAR.GZ) here")}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 4 }}>
                      {sourceFile
                        ? `${(sourceFile.size / (1024 * 1024)).toFixed(2)} MB · Selected`
                        : "Supports ZIP, TAR, GZ, code files up to 250MB for students to run locally"}
                    </div>
                  </div>

                  {sourceFilePreview && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel3, padding: "8px 12px", borderRadius: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileCode size={15} color={C.cyan} />
                        <span style={{ fontFamily: mono, fontSize: 11.5, color: C.hi, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sourceFile ? sourceFile.name : (typeof sourceFilePreview === "string" ? sourceFilePreview.split("/").pop() : "Source Archive")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSourceFile(null);
                          setSourceFilePreview(null);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: C.danger,
                          cursor: "pointer",
                          fontFamily: sans,
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                    Source Code Repository / Container URL
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://github.com/blitzlab/vulnerable-app or https://hub.docker.com/r/..."
                    value={form.source_link}
                    onChange={(e) => updateField("source_link", e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: C.panel2,
                      border: `1px solid ${C.border}`,
                      borderRadius: 7,
                      padding: "9px 12px",
                      fontFamily: mono,
                      fontSize: 12.5,
                      color: C.hi,
                      outline: "none",
                    }}
                  />
                  <div style={{ fontFamily: sans, fontSize: 11, color: C.low, marginTop: 4 }}>
                    GitHub, GitLab, Docker Hub, or repository URL for students to clone or pull.
                  </div>
                </div>
              )}

              {/* Local Setup Commands */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  <Terminal size={13} color={C.cyan} />
                  <span>Local Run / Docker Commands</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>(Quick copyable CLI commands)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={`# Example commands:\ngit clone https://github.com/...\ncd vulnerable-app\ndocker compose up -d`}
                  value={form.setup_commands}
                  onChange={(e) => updateField("setup_commands", e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#080c10",
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px",
                    fontFamily: mono,
                    fontSize: 12,
                    color: "#00E5FF",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Step-by-Step Local Setup Guide */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  <Code size={13} color={C.cyan} />
                  <span>Step-by-Step Local Setup Guide</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>(Prerequisites, instructions, ports, credentials)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={`Step 1: Install Docker Desktop and Python 3.11\nStep 2: Unzip the lab source code or clone the repository\nStep 3: Run the setup command to start the vulnerable container\nStep 4: Navigate to http://localhost:8080 and begin testing`}
                  value={form.setup_guide}
                  onChange={(e) => updateField("setup_guide", e.target.value)}
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
                    lineHeight: 1.6,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Questions & Question-based Hints ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan, letterSpacing: "0.06em", fontWeight: 600 }}>
                  02 // LAB QUESTIONS & HINTS
                </span>
                <Badge tone="cyan">{form.questions.length} Questions</Badge>
              </div>
              <Btn small variant="subtle" icon={Plus} onClick={addQuestion}>
                Add Question
              </Btn>
            </div>

            {form.questions.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  border: `1px dashed ${C.border}`,
                  borderRadius: 8,
                  textAlign: "center",
                  background: C.panel2,
                }}
              >
                <HelpCircle size={28} color={C.mid} style={{ marginBottom: 8 }} />
                <div style={{ fontFamily: sans, fontSize: 13, color: C.hi }}>No questions added to this lab yet.</div>
                <p style={{ fontFamily: sans, fontSize: 12, color: C.low, margin: "4px 0 12px" }}>
                  Add multiple questions with target flags and per-question hints for students.
                </p>
                <Btn small icon={Plus} onClick={addQuestion}>
                  Add First Question
                </Btn>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {form.questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      background: C.panel2,
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: 10,
                      padding: 18,
                      position: "relative",
                    }}
                  >
                    {/* Question Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            background: C.panel3,
                            border: `1px solid ${C.border}`,
                            color: C.amber,
                            fontFamily: mono,
                            fontSize: 11,
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          Q{qIdx + 1}
                        </span>
                        <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi }}>
                          Question #{qIdx + 1}
                        </span>
                      </div>

                      {form.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          title="Remove question"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: C.danger,
                            cursor: "pointer",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11.5,
                            fontFamily: sans,
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>

                    {/* Question Inputs */}
                    <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ display: "block", fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>
                          Question Prompt / Title <span style={{ color: C.amber }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Find the SQL injection parameter in the search API"
                          value={q.title}
                          onChange={(e) => updateQuestion(qIdx, "title", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            background: C.panel,
                            border: `1px solid ${errors[`q_${qIdx}_title`] ? C.danger : C.border}`,
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontFamily: sans,
                            fontSize: 12.5,
                            color: C.hi,
                            outline: "none",
                          }}
                        />
                        {errors[`q_${qIdx}_title`] && (
                          <div style={{ color: C.danger, fontSize: 11, marginTop: 3 }}>
                            {errors[`q_${qIdx}_title`]}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: "block", fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>
                          Points
                        </label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={q.points}
                          onChange={(e) => updateQuestion(qIdx, "points", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            background: C.panel,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontFamily: mono,
                            fontSize: 12.5,
                            color: C.amber,
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: "block", fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>
                          Description / Guidance (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Specific scenario or condition to fulfill"
                          value={q.description}
                          onChange={(e) => updateQuestion(qIdx, "description", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            background: C.panel,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontFamily: sans,
                            fontSize: 12,
                            color: C.hi,
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontFamily: sans, fontSize: 11.5, color: C.mid, marginBottom: 5 }}>
                          Target Flag / Expected Answer
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            placeholder="BLITZ{flag_here}"
                            value={q.flag}
                            onChange={(e) => updateQuestion(qIdx, "flag", e.target.value)}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              background: C.panel,
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              padding: "8px 10px 8px 28px",
                              fontFamily: mono,
                              fontSize: 12,
                              color: C.cyan,
                              outline: "none",
                            }}
                          />
                          <Flag size={13} color={C.mid} style={{ position: "absolute", left: 9, top: 10 }} />
                        </div>
                      </div>
                    </div>

                    {/* ── Question Hints Sub-section ── */}
                    <div
                      style={{
                        background: C.panel3,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Lightbulb size={14} color={C.amber} />
                          <span style={{ fontFamily: mono, fontSize: 11.5, color: C.hi, fontWeight: 600 }}>
                            Hints for Question #{qIdx + 1}
                          </span>
                          <span style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>
                            ({q.hints?.length || 0})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addHint(qIdx)}
                          style={{
                            background: "transparent",
                            border: `1px solid ${C.borderLight}`,
                            color: C.amber,
                            borderRadius: 5,
                            padding: "3px 8px",
                            fontFamily: sans,
                            fontSize: 11,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Plus size={11} /> Add Hint
                        </button>
                      </div>

                      {(!q.hints || q.hints.length === 0) ? (
                        <div style={{ fontFamily: sans, fontSize: 11.5, color: C.low, fontStyle: "italic", padding: "4px 0" }}>
                          No hints added yet for this question. Click "+ Add Hint" to provide clues.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {q.hints.map((h, hIdx) => (
                            <div
                              key={hIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: C.panel,
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                padding: "6px 8px",
                              }}
                            >
                              <span style={{ fontFamily: mono, fontSize: 10.5, color: C.low, width: 22, flexShrink: 0 }}>
                                #{hIdx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder={`Hint #${hIdx + 1} clue... (e.g. Inspect the hidden query parameter)`}
                                value={h.hint_text}
                                onChange={(e) => updateHint(qIdx, hIdx, "hint_text", e.target.value)}
                                style={{
                                  flex: 1,
                                  background: "transparent",
                                  border: "none",
                                  fontFamily: sans,
                                  fontSize: 12,
                                  color: C.hi,
                                  outline: "none",
                                }}
                              />
                              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>Cost:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  value={h.cost}
                                  onChange={(e) => updateHint(qIdx, hIdx, "cost", e.target.value)}
                                  title="Point deduction penalty"
                                  style={{
                                    width: 44,
                                    background: C.panel2,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 4,
                                    padding: "2px 4px",
                                    fontFamily: mono,
                                    fontSize: 11,
                                    color: C.warn,
                                    textAlign: "center",
                                    outline: "none",
                                  }}
                                />
                                <span style={{ fontFamily: mono, fontSize: 10, color: C.low }}>pts</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeHint(qIdx, hIdx)}
                                title="Delete hint"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: C.low,
                                  cursor: "pointer",
                                  padding: 2,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.panel2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontFamily: mono, fontSize: 11.5, color: C.mid }}>
            Total: <span style={{ color: C.hi, fontWeight: 600 }}>{form.questions.length} questions</span>
            {" · "}
            <span style={{ color: C.amber, fontWeight: 600 }}>
              {form.questions.reduce((acc, q) => acc + (q.hints?.length || 0), 0)} hints
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Btn>
            <Btn onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving Lab..." : isEdit ? "Save Changes" : "Create Lab"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import {
  X, Plus, Trash2, HelpCircle, Lightbulb, AlertCircle,
  Flag, Award, Globe, Server, CheckCircle2, ChevronDown, Sparkles
} from "lucide-react";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";

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

export default function AddLabModal({ isOpen, onClose, onLabCreated, initialLab = null }) {
  if (!isOpen) return null;

  const isEdit = Boolean(initialLab?.id && typeof initialLab.id === "number");

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
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        org: form.org.trim() || "BlitzLab",
        category: form.category,
        difficulty: form.difficulty,
        points: Number(form.points) || 100,
        target_url: form.target_url.trim(),
        questions: form.questions.map((q, qIdx) => ({
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
        })),
      };

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

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
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

              <div>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Target System / Org
                </label>
                <input
                  type="text"
                  placeholder="e.g. ShopX Staging"
                  value={form.org}
                  onChange={(e) => updateField("org", e.target.value)}
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

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.5fr", gap: 12 }}>
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

              <div>
                <label style={{ display: "block", fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                  Target URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.target_url}
                  onChange={(e) => updateField("target_url", e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: C.panel2,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7,
                    padding: "9px 12px",
                    fontFamily: mono,
                    fontSize: 12,
                    color: C.hi,
                    outline: "none",
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

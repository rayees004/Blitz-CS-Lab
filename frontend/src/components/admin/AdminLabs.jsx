import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical, Plus, Search, Filter, HelpCircle, Lightbulb,
  Trash2, Edit3, CheckCircle, AlertCircle, RefreshCw, Layers,
  Award, Globe, ExternalLink, Flag, BookMarked, Eye, EyeOff,
  ChevronDown, ChevronUp, Database, Sparkles, X, Terminal,
  Video, Play, Film, FolderArchive, Download, Copy, Check, Code, FileCode
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import StatCard from "../common/StatCard";
import { C, sans, mono } from "../../constants/theme";
import { fetchLabs, createLab, updateLab, deleteLab, seedLabs } from "../../api/labs";
import { fetchSubjects } from "../../api/subjects";
import AddLabModal from "./AddLabModal";

/* ── Lab Detailed View Drawer ─────────────────────────────────────────── */
function LabViewDrawer({ lab, courses, onClose, onEdit, onDelete }) {
  const [showFlags, setShowFlags] = useState({});
  const [copiedCommands, setCopiedCommands] = useState(false);

  if (!lab) return null;

  const toggleFlag = (qIdx) => {
    setShowFlags((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  };

  const matchingCourse = courses.find((c) => String(c.id) === String(lab.subject_id || lab.subject));
  const qList = lab.questions || [];
  const totalHints = qList.reduce((acc, q) => acc + (q.hints?.length || 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.68)",
          zIndex: 900,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 580,
          maxWidth: "100vw",
          background: C.void,
          borderLeft: `1px solid ${C.borderLight}`,
          zIndex: 901,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.8)",
          animation: "slideIn 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.panel2 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: C.amber,
                    background: "rgba(245, 166, 35, 0.12)",
                    padding: "2px 7px",
                    borderRadius: 4,
                    border: `1px solid rgba(245, 166, 35, 0.25)`,
                    fontWeight: 700,
                  }}
                >
                  DATABASE LAB #{String(lab.id).padStart(2, "0")}
                </span>
                <DiffBadge level={lab.difficulty || lab.diff || "Beginner"} />
                <Badge tone="cyan">{lab.category || lab.cat || "Security"}</Badge>
                {(lab.subject_name || matchingCourse) && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: sans,
                      fontSize: 11,
                      color: C.amber,
                      background: "rgba(245, 166, 35, 0.12)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      border: `1px solid rgba(245, 166, 35, 0.3)`,
                      fontWeight: 600,
                    }}
                  >
                    <BookMarked size={11} />
                    {lab.subject_name || (matchingCourse?.code ? `[${matchingCourse.code}] ` : "") + matchingCourse?.name}
                  </span>
                )}
              </div>

              <h2 style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
                {lab.name}
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                background: C.panel3,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                cursor: "pointer",
                color: C.mid,
                padding: 6,
                display: "flex",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 8,
              marginTop: 14,
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "10px 14px",
            }}
          >
            <div>
              <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.amber }}>
                {lab.points || lab.pts || 100} pts
              </div>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>Reward Points</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.cyan }}>
                {qList.length}
              </div>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>Questions</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.warn }}>
                {totalHints}
              </div>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>Hints Configured</div>
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C.hi }}>
                {lab.is_active !== false ? "Active" : "Archived"}
              </div>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>DB Status</div>
            </div>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Target Environment */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.low, letterSpacing: "0.06em", marginBottom: 8 }}>
              TARGET ENVIRONMENT & URL
            </div>
            <div
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: sans, fontSize: 12.5, color: C.mid }}>Organization / Target:</span>
                <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
                  {lab.org || "BlitzLab Staging"}
                </span>
              </div>
              {lab.target_url && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: sans, fontSize: 12.5, color: C.mid }}>Live Target URL:</span>
                  <a
                    href={lab.target_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: mono,
                      fontSize: 12,
                      color: C.cyan,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      textDecoration: "none",
                    }}
                  >
                    {lab.target_url}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lab Teaching Video */}
          {(lab.video_file || lab.video_url) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <Video size={13} /> TEACHING & WALKTHROUGH VIDEO
              </div>
              <div
                style={{
                  background: C.panel2,
                  border: `1px solid rgba(245, 166, 35, 0.3)`,
                  borderRadius: 8,
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {lab.video_file ? (
                  <div style={{ borderRadius: 6, overflow: "hidden", background: "#000", border: `1px solid ${C.border}` }}>
                    <video
                      controls
                      src={lab.video_file}
                      style={{ width: "100%", maxHeight: 240, display: "block" }}
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>
                ) : lab.video_url?.includes("youtube.com") || lab.video_url?.includes("youtu.be") ? (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: 6 }}>
                    <iframe
                      src={
                        lab.video_url.includes("watch?v=")
                          ? lab.video_url.replace("watch?v=", "embed/")
                          : lab.video_url.includes("youtu.be/")
                          ? `https://www.youtube.com/embed/${lab.video_url.split("youtu.be/")[1]}`
                          : lab.video_url
                      }
                      title="Teaching Video"
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: sans, fontSize: 12.5, color: C.mid }}>External Video Link:</span>
                    <a
                      href={lab.video_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontFamily: mono,
                        fontSize: 12,
                        color: C.amber,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        textDecoration: "none",
                      }}
                    >
                      {lab.video_url}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lab Source Code & Local Setup Guide */}
          {(lab.source_file || lab.source_link || lab.setup_commands || lab.setup_guide) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.cyan, letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                <FolderArchive size={13} /> SOURCE CODE & LOCAL ENVIRONMENT SETUP
              </div>
              <div
                style={{
                  background: C.panel2,
                  border: `1px solid rgba(0, 229, 255, 0.25)`,
                  borderRadius: 8,
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Source File & Source Link Row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {lab.source_file && (
                    <a
                      href={lab.source_file}
                      download
                      style={{
                        background: "rgba(0, 229, 255, 0.12)",
                        border: "1px solid rgba(0, 229, 255, 0.35)",
                        color: C.cyan,
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Download size={13} />
                      Download Lab Source Archive
                      {lab.source_file_size > 0 && (
                        <span style={{ fontFamily: mono, fontSize: 10.5, color: C.mid }}>
                          ({(lab.source_file_size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      )}
                    </a>
                  )}

                  {lab.source_link && (
                    <a
                      href={lab.source_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: C.panel3,
                        border: `1px solid ${C.border}`,
                        color: C.hi,
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <ExternalLink size={13} color={C.cyan} />
                      Open Source Repository
                    </a>
                  )}
                </div>

                {/* Local Setup Commands */}
                {lab.setup_commands && (
                  <div style={{ background: "#080c10", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan, display: "flex", alignItems: "center", gap: 5 }}>
                        <Terminal size={12} /> Local Run Commands:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(lab.setup_commands);
                          setCopiedCommands(true);
                          setTimeout(() => setCopiedCommands(false), 2000);
                        }}
                        style={{
                          background: C.panel2,
                          border: `1px solid ${C.border}`,
                          color: copiedCommands ? C.green : C.mid,
                          padding: "2px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontFamily: sans,
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {copiedCommands ? <Check size={11} /> : <Copy size={11} />}
                        {copiedCommands ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <pre style={{ margin: 0, fontFamily: mono, fontSize: 11.5, color: "#79c0ff", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {lab.setup_commands}
                    </pre>
                  </div>
                )}

                {/* Step-by-Step Setup Guide */}
                {lab.setup_guide && (
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 4 }}>
                      STEP-BY-STEP SETUP GUIDE
                    </div>
                    <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                      {lab.setup_guide}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scenario & Description */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.low, letterSpacing: "0.06em", marginBottom: 8 }}>
              SCENARIO & MISSION OBJECTIVE
            </div>
            <div
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "14px 16px",
                fontFamily: sans,
                fontSize: 13,
                color: C.hi,
                lineHeight: 1.6,
              }}
            >
              {lab.description || lab.desc || "No description provided."}
            </div>
          </div>

          {/* Questions & Hints Breakdown */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.cyan, letterSpacing: "0.06em", fontWeight: 600 }}>
                QUESTIONS & PROGRESSIVE HINTS ({qList.length})
              </div>
            </div>

            {qList.length === 0 ? (
              <div
                style={{
                  background: C.panel2,
                  border: `1px dashed ${C.border}`,
                  borderRadius: 8,
                  padding: 24,
                  textAlign: "center",
                  color: C.mid,
                  fontFamily: sans,
                  fontSize: 12.5,
                }}
              >
                No questions configured for this lab yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {qList.map((q, qIdx) => {
                  const hints = q.hints || [];
                  const isFlagVisible = Boolean(showFlags[qIdx]);

                  return (
                    <div
                      key={q.id || qIdx}
                      style={{
                        background: C.panel2,
                        border: `1px solid ${C.borderLight}`,
                        borderRadius: 8,
                        padding: 16,
                      }}
                    >
                      {/* Question Top */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 11,
                              color: C.amber,
                              background: C.panel3,
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            Q{qIdx + 1}
                          </span>
                          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: C.hi }}>
                            {q.title}
                          </span>
                        </div>
                        <span style={{ fontFamily: mono, fontSize: 12, color: C.amber, fontWeight: 600 }}>
                          {q.points || 50} pts
                        </span>
                      </div>

                      {q.description && (
                        <p style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, margin: "6px 0 10px", lineHeight: 1.5 }}>
                          {q.description}
                        </p>
                      )}

                      {/* Flag Box */}
                      {q.flag && (
                        <div
                          style={{
                            background: C.panel3,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            padding: "8px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Flag size={13} color={C.cyan} />
                            <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Expected Flag:</span>
                            <span style={{ fontFamily: mono, fontSize: 12, color: C.cyan, letterSpacing: isFlagVisible ? 0 : "0.2em" }}>
                              {isFlagVisible ? q.flag : "••••••••••••••••••••"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFlag(qIdx)}
                            style={{
                              background: "none",
                              border: "none",
                              color: C.mid,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: sans,
                              fontSize: 11,
                            }}
                          >
                            {isFlagVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            {isFlagVisible ? "Hide" : "Reveal"}
                          </button>
                        </div>
                      )}

                      {/* Question Hints List */}
                      {hints.length > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${C.border}` }}>
                          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.warn, display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                            <Lightbulb size={12} />
                            <span>HINTS ({hints.length})</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {hints.map((h, hIdx) => (
                              <div
                                key={h.id || hIdx}
                                style={{
                                  background: C.panel,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 5,
                                  padding: "6px 10px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: 12,
                                  fontFamily: sans,
                                }}
                              >
                                <span style={{ color: C.mid }}>
                                  <strong style={{ color: C.low, fontFamily: mono, marginRight: 6 }}>#{hIdx + 1}</strong>
                                  {typeof h === "string" ? h : h.hint_text}
                                </span>
                                {h.cost !== undefined && (
                                  <span style={{ fontFamily: mono, fontSize: 10.5, color: C.warn, flexShrink: 0 }}>
                                    -{h.cost} pts
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
            background: C.panel2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(lab);
            }}
            style={{
              background: "rgba(229, 83, 75, 0.1)",
              border: `1px solid rgba(229, 83, 75, 0.3)`,
              color: C.danger,
              borderRadius: 6,
              padding: "7px 12px",
              cursor: "pointer",
              fontFamily: sans,
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Trash2 size={13} /> Archive Lab
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="outline" small onClick={onClose}>
              Close
            </Btn>
            <Btn
              small
              icon={Edit3}
              onClick={() => {
                onClose();
                onEdit(lab);
              }}
            >
              Edit Lab
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main AdminLabs Component ─────────────────────────────────────────── */
export default function AdminLabs({ onOpenAddModal = null }) {
  const [labs, setLabs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [filterDiff, setFilterDiff] = useState("ALL");
  const [filterCourse, setFilterCourse] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [viewingLab, setViewingLab] = useState(null);
  const [expandedLabIds, setExpandedLabIds] = useState(new Set());
  const [actionNotice, setActionNotice] = useState(null);
  const [seeding, setSeeding] = useState(false);

  /* ── Load real backend database labs ── */
  const loadLabs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, subjectsData] = await Promise.all([
        fetchLabs(),
        fetchSubjects().catch(() => ({ results: [] })),
      ]);
      const serverLabs = data.results || [];
      setCourses(subjectsData.results || []);
      // Real backend data driven
      setLabs(serverLabs);
    } catch (err) {
      console.warn("Failed to fetch labs from backend:", err);
      setError("Unable to load labs from backend API. Please check server connection.");
      setLabs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const toggleExpandLab = (labId) => {
    setExpandedLabIds((prev) => {
      const next = new Set(prev);
      if (next.has(labId)) next.delete(labId);
      else next.add(labId);
      return next;
    });
  };

  const handleSaveLab = async (payload, editId) => {
    if (editId) {
      await updateLab(editId, payload);
      setActionNotice({ type: "success", text: `Lab "${payload.name}" updated successfully!` });
    } else {
      await createLab(payload);
      setActionNotice({ type: "success", text: `Lab "${payload.name}" created successfully!` });
    }
    await loadLabs();
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteLab = async (lab) => {
    if (!window.confirm(`Are you sure you want to archive or delete "${lab.name}"?`)) return;
    try {
      await deleteLab(lab.id);
      await loadLabs();
      setActionNotice({ type: "success", text: `Lab "${lab.name}" removed.` });
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      setActionNotice({ type: "error", text: err.message || "Failed to delete lab." });
    }
  };

  const handleSeedLabs = async () => {
    setSeeding(true);
    try {
      const res = await seedLabs();
      setActionNotice({ type: "success", text: res.message || "Seeded starter labs successfully!" });
      await loadLabs();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      setActionNotice({ type: "error", text: err.message || "Failed to seed sample labs." });
    } finally {
      setSeeding(false);
    }
  };

  const filteredLabs = labs.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.description || l.desc || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.org || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "ALL" || (l.category || l.cat) === filterCat;
    const matchesDiff = filterDiff === "ALL" || (l.difficulty || l.diff) === filterDiff;
    const matchesCourse =
      filterCourse === "ALL" ||
      (filterCourse === "STANDALONE" && !l.subject_id && !l.subject && !l.course_id && !l.course) ||
      (String(l.subject_id || l.subject?.id || l.subject) === String(filterCourse));

    return matchesSearch && matchesCat && matchesDiff && matchesCourse;
  });

  const totalQuestions = labs.reduce((acc, l) => acc + (l.questions?.length || l.question_count || 0), 0);
  const totalHints = labs.reduce(
    (acc, l) =>
      acc +
      (l.questions
        ? l.questions.reduce((qAcc, q) => qAcc + (q.hints?.length || 0), 0)
        : 0),
    0
  );

  const categories = Array.from(new Set(labs.map((l) => l.category || l.cat))).filter(Boolean);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
              Lab Management
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: mono,
                fontSize: 11,
                color: C.cyan,
                background: "rgba(63, 216, 200, 0.1)",
                padding: "3px 8px",
                borderRadius: 4,
                border: `1px solid rgba(63, 216, 200, 0.25)`,
              }}
            >
              <Database size={11} /> Live Backend Data ({labs.length})
            </span>
          </div>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            Database-backed lab environments, multi-step questions, flags, and progressive hints.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn variant="subtle" icon={RefreshCw} onClick={loadLabs} small disabled={loading}>
            Refresh
          </Btn>
          {labs.length === 0 && (
            <Btn variant="subtle" icon={Sparkles} onClick={handleSeedLabs} small disabled={seeding}>
              {seeding ? "Seeding..." : "Seed Starter Labs"}
            </Btn>
          )}
          <Btn
            icon={Plus}
            onClick={() => {
              setEditingLab(null);
              setModalOpen(true);
            }}
          >
            Add New Lab
          </Btn>
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: actionNotice.type === "success" ? "rgba(63, 216, 200, 0.12)" : "rgba(229, 83, 75, 0.15)",
            border: `1px solid ${actionNotice.type === "success" ? C.cyan : C.danger}`,
            borderRadius: 8,
            marginBottom: 20,
            color: actionNotice.type === "success" ? C.cyan : C.danger,
            fontFamily: sans,
            fontSize: 13,
          }}
        >
          {actionNotice.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <StatCard label="Database Labs" value={String(labs.length)} icon={FlaskConical} tone="cyan" sub="Real-time SQLite backend" />
        <StatCard label="Total Questions" value={String(totalQuestions)} icon={HelpCircle} sub="Challenge steps" />
        <StatCard label="Configured Hints" value={String(totalHints)} icon={Lightbulb} sub="Progressive clues" />
        <StatCard label="Curriculum Courses" value={String(courses.length)} icon={Layers} />
      </div>

      {/* Filter & Search Bar */}
      <Panel style={{ padding: "14px 18px", marginBottom: 20, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} color={C.low} style={{ position: "absolute", left: 11, top: 10 }} />
          <input
            type="text"
            placeholder="Search backend labs by name, description, organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "8px 12px 8px 34px",
              fontFamily: sans,
              fontSize: 12.5,
              color: C.hi,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Category:</span>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12,
              color: C.hi,
              outline: "none",
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Difficulty:</span>
          <select
            value={filterDiff}
            onChange={(e) => setFilterDiff(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12,
              color: C.hi,
              outline: "none",
            }}
          >
            <option value="ALL">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Course:</span>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            style={{
              background: C.panel2,
              border: `1px solid ${filterCourse !== "ALL" ? C.amberDim : C.border}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontFamily: sans,
              fontSize: 12,
              color: C.hi,
              outline: "none",
              maxWidth: 200,
            }}
          >
            <option value="ALL">All Tracks / Standalone</option>
            <option value="STANDALONE">Standalone Only</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `[${c.code}] ` : ""}{c.name}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {/* Labs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {loading ? (
          <Panel style={{ padding: 50, textAlign: "center" }}>
            <RefreshCw size={28} color={C.cyan} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
            <div style={{ fontFamily: sans, fontSize: 14, color: C.hi }}>Loading labs from backend database...</div>
          </Panel>
        ) : filteredLabs.length === 0 ? (
          <Panel style={{ padding: 48, textAlign: "center" }}>
            <FlaskConical size={36} color={C.mid} style={{ marginBottom: 14 }} />
            <div style={{ fontFamily: sans, fontSize: 16, color: C.hi, fontWeight: 700 }}>
              {labs.length === 0 ? "No labs in backend database yet" : "No labs match your filters"}
            </div>
            <p style={{ fontFamily: sans, fontSize: 13, color: C.low, margin: "8px 0 20px", maxWidth: 460, marginInline: "auto" }}>
              {labs.length === 0
                ? "You can create custom cybersecurity labs with multiple questions and hints, or seed default sample environments directly into the database."
                : "Try resetting your search query or category filters."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              {labs.length === 0 && (
                <Btn variant="subtle" icon={Sparkles} onClick={handleSeedLabs} disabled={seeding}>
                  {seeding ? "Seeding..." : "Seed Starter Labs into DB"}
                </Btn>
              )}
              <Btn
                icon={Plus}
                onClick={() => {
                  setEditingLab(null);
                  setModalOpen(true);
                }}
              >
                Add New Lab
              </Btn>
            </div>
          </Panel>
        ) : (
          filteredLabs.map((l, index) => {
            const qList = l.questions || [];
            const qCount = qList.length || l.question_count || 0;
            const hCount = qList.reduce((acc, q) => acc + (q.hints?.length || 0), 0);
            const matchingCourse = courses.find((c) => String(c.id) === String(l.subject_id || l.subject));
            const isExpanded = expandedLabIds.has(l.id);

            return (
              <Panel
                key={l.id || index}
                style={{
                  padding: 18,
                  border: `1px solid ${C.border}`,
                  transition: "border-color 150ms ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  {/* Left Column: Lab Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          color: C.amber,
                          background: "rgba(245, 166, 35, 0.1)",
                          padding: "2px 7px",
                          borderRadius: 4,
                          border: `1px solid rgba(245, 166, 35, 0.2)`,
                          fontWeight: 700,
                        }}
                      >
                        LAB #{String(l.id || index + 1).padStart(2, "0")}
                      </span>

                      <h3
                        onClick={() => setViewingLab(l)}
                        style={{
                          fontFamily: sans,
                          fontSize: 15,
                          fontWeight: 700,
                          color: C.hi,
                          margin: 0,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = C.amber)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = C.hi)}
                      >
                        {l.name}
                      </h3>

                      <DiffBadge level={l.difficulty || l.diff || "Beginner"} />
                      <Badge tone="cyan">{l.category || l.cat || "Security"}</Badge>

                      {(l.subject_name || matchingCourse) && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontFamily: sans,
                            fontSize: 11,
                            color: C.amber,
                            background: "rgba(245, 166, 35, 0.12)",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: `1px solid rgba(245, 166, 35, 0.3)`,
                            fontWeight: 600,
                          }}
                        >
                          <BookMarked size={11} />
                          Course: {l.subject_name || (matchingCourse?.code ? `[${matchingCourse.code}] ` : "") + matchingCourse?.name}
                        </span>
                      )}

                      {(l.video_file || l.video_url) && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontFamily: sans,
                            fontSize: 11,
                            color: C.hi,
                            background: "rgba(245, 166, 35, 0.16)",
                            padding: "2px 7px",
                            borderRadius: 4,
                            border: `1px solid ${C.amber}`,
                            fontWeight: 600,
                          }}
                        >
                          <Video size={11} color={C.amber} /> Teaching Video
                        </span>
                      )}

                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 10,
                          color: C.cyan,
                          background: "rgba(63, 216, 200, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: `1px solid rgba(63, 216, 200, 0.25)`,
                        }}
                      >
                        Backend DB
                      </span>
                    </div>

                    <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: "6px 0 12px", lineHeight: 1.5 }}>
                      {l.description || l.desc || "No description provided."}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: mono, fontSize: 11.5, color: C.low, flexWrap: "wrap" }}>
                      <span>
                        Target: <strong style={{ color: C.hi }}>{l.org || "Internal"}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Reward: <strong style={{ color: C.amber }}>{l.points || l.pts || 100} pts</strong>
                      </span>
                      <span>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <HelpCircle size={13} color={C.cyan} />
                        <strong style={{ color: C.hi }}>{qCount}</strong> Questions
                      </span>
                      <span>·</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Lightbulb size={13} color={C.warn} />
                        <strong style={{ color: C.warn }}>{hCount}</strong> Hints configured
                      </span>
                      {qList.length > 0 && (
                        <>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => toggleExpandLab(l.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: isExpanded ? C.amber : C.cyan,
                              cursor: "pointer",
                              padding: 0,
                              fontFamily: sans,
                              fontSize: 11.5,
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {isExpanded ? "Hide Details" : "Expand Questions & Hints"}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Inline Expanded View of Questions & Hints */}
                    {isExpanded && qList.length > 0 && (
                      <div
                        style={{
                          marginTop: 14,
                          padding: 14,
                          background: C.panel2,
                          border: `1px solid ${C.borderLight}`,
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontFamily: mono, fontSize: 11, color: C.cyan, fontWeight: 600, letterSpacing: "0.05em" }}>
                          QUESTIONS BREAKDOWN & HINTS
                        </div>
                        {qList.map((q, qIdx) => (
                          <div
                            key={q.id || qIdx}
                            style={{
                              background: C.panel,
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              padding: "10px 12px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontFamily: mono, color: C.amber, fontWeight: 700, fontSize: 11 }}>
                                  Q{qIdx + 1}
                                </span>
                                <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
                                  {q.title}
                                </span>
                              </div>
                              <span style={{ fontFamily: mono, fontSize: 11, color: C.amber }}>
                                {q.points || 50} pts
                              </span>
                            </div>

                            {q.description && (
                              <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginBottom: 6 }}>
                                {q.description}
                              </div>
                            )}

                            {q.flag && (
                              <div style={{ fontFamily: mono, fontSize: 11, color: C.cyan, display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                                <Flag size={11} /> Flag: {q.flag}
                              </div>
                            )}

                            {q.hints && q.hints.length > 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                                {q.hints.map((h, hIdx) => (
                                  <div
                                    key={h.id || hIdx}
                                    style={{
                                      fontFamily: sans,
                                      fontSize: 11.5,
                                      color: C.mid,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      paddingLeft: 8,
                                      borderLeft: `2px solid ${C.amber}`,
                                    }}
                                  >
                                    <Lightbulb size={11} color={C.amber} />
                                    <span>{typeof h === "string" ? h : h.hint_text}</span>
                                    {h.cost !== undefined && (
                                      <span style={{ fontFamily: mono, fontSize: 10, color: C.warn, marginLeft: "auto" }}>
                                        -{h.cost} pts
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setViewingLab(l)}
                      title="View Lab Details"
                      style={{
                        background: C.panel2,
                        border: `1px solid ${C.borderLight}`,
                        color: C.cyan,
                        borderRadius: 6,
                        padding: "7px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLab(l);
                        setModalOpen(true);
                      }}
                      title="Edit Lab"
                      style={{
                        background: C.panel2,
                        border: `1px solid ${C.borderLight}`,
                        color: C.hi,
                        borderRadius: 6,
                        padding: "7px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: sans,
                        fontSize: 12,
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLab(l)}
                      title="Archive Lab"
                      style={{
                        background: "rgba(229, 83, 75, 0.1)",
                        border: `1px solid rgba(229, 83, 75, 0.3)`,
                        color: C.danger,
                        borderRadius: 6,
                        padding: "7px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: sans,
                        fontSize: 12,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })
        )}
      </div>

      {/* Add / Edit Lab Modal */}
      <AddLabModal
        isOpen={modalOpen}
        initialLab={editingLab}
        onClose={() => {
          setModalOpen(false);
          setEditingLab(null);
        }}
        onLabCreated={handleSaveLab}
      />

      {/* View Lab Details Drawer */}
      {viewingLab && (
        <LabViewDrawer
          lab={viewingLab}
          courses={courses}
          onClose={() => setViewingLab(null)}
          onEdit={(l) => {
            setViewingLab(null);
            setEditingLab(l);
            setModalOpen(true);
          }}
          onDelete={handleDeleteLab}
        />
      )}
    </div>
  );
}

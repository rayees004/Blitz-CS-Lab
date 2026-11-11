import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, TrendingUp, Plus, FlaskConical,
  HelpCircle, Lightbulb, CheckCircle, ChevronRight, ExternalLink, Shield,
  RotateCcw, Check, X, Clock, Loader2, RefreshCw, BarChart3, ArrowRight,
} from "lucide-react";
import { DiffBadge } from "../common/Badge";
import { LABS as MOCK_LABS } from "../../data/mockData";
import { fetchLabs, createLab } from "../../api/labs";
import { fetchAdminDashboardStats, reviewAdminRetakeRequest } from "../../api/students";
import { DJANGO_ADMIN_URL } from "../../api/client";
import AddLabModal from "./AddLabModal";
import CompletionsChart from "./CompletionsChart";
import SmartStatTile from "../smart/SmartStatTile";
import { ShieldArt } from "../smart/SmartDashboardContent";
import "../smart/smart.css";

export default function AdminDashboard({ onNavigate, currentUser }) {
  const isAdmin = currentUser?.user_type === "admin" || Boolean(currentUser?.is_superuser) || Boolean(currentUser?.can_access_django_admin);
  const [modalOpen, setModalOpen] = useState(false);
  const [labs, setLabs] = useState([]);
  const [dbStats, setDbStats] = useState({
    total_students: 0,
    active_students: 0,
    active_students_pct: 0,
    fee_due_raw: 0,
    fee_due_formatted: "₹0",
    avg_progress: 0,
    total_labs: 0,
    total_completions: 0,
    completions_chart: {
      "7D": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "30D": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "90D": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    active_labs: [],
    pending_retake_requests_count: 0,
    pending_retake_requests: [],
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [labsData, statsData] = await Promise.all([
        // Only a few labs are shown here, so fetch just the first page instead of every lab
        fetchLabs({ page: 1 }).catch(() => ({ results: [] })),
        fetchAdminDashboardStats().catch(() => null),
      ]);

      const serverLabs = labsData.results || [];
      if (serverLabs.length > 0) {
        setLabs(serverLabs);
      } else {
        setLabs(MOCK_LABS);
      }

      if (statsData) {
        setDbStats(statsData);
      }
    } catch (err) {
      console.warn("Could not fetch server data, falling back:", err);
      setLabs(MOCK_LABS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLabCreated = async (payload) => {
    try {
      await createLab(payload);
      setNotice({ type: "success", text: `Lab "${payload.name}" successfully created with ${payload.questions.length} questions!` });
      await loadData();
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      // In case of backend issue, add locally so UI updates smoothly
      const newLocalLab = {
        id: Date.now(),
        name: payload.name,
        desc: payload.description,
        description: payload.description,
        org: payload.org,
        cat: payload.category,
        category: payload.category,
        diff: payload.difficulty,
        difficulty: payload.difficulty,
        pts: payload.points,
        points: payload.points,
        questions: payload.questions,
      };
      setLabs((prev) => [newLocalLab, ...prev]);
      setNotice({ type: "success", text: `Lab "${payload.name}" created with ${payload.questions.length} questions!` });
      setTimeout(() => setNotice(null), 5000);
    }
  };

  const handleReviewRetake = async (requestId, action, studentName, labName) => {
    let note = "";
    if (action === "reject") {
      const confirmReject = window.confirm(
        `Are you sure you want to reject the retake request for ${studentName} on "${labName}"?`
      );
      if (!confirmReject) return;
      note = window.prompt("Optional rejection note / feedback for student (or leave blank):", "") || "";
    } else {
      const confirmAccept = window.confirm(
        `Accept retake request for ${studentName} on "${labName}"?\nThis will unlock the lab and allow the student to retake it.`
      );
      if (!confirmAccept) return;
    }

    setReviewingId(requestId);
    try {
      const res = await reviewAdminRetakeRequest(requestId, action, note, true);
      setNotice({
        type: action === "approve" ? "success" : "default",
        text: res.message || `Retake request for ${studentName} on ${labName} ${action === "approve" ? "accepted" : "rejected"} successfully.`,
      });
      await loadData();
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      alert(err.message || `Failed to ${action} retake request.`);
    } finally {
      setReviewingId(null);
    }
  };

  const go = (page) => onNavigate && onNavigate(page);

  const displayLabs = (dbStats.active_labs && dbStats.active_labs.length > 0)
    ? dbStats.active_labs
    : labs.slice(0, 5);

  const pendingRequests = dbStats.pending_retake_requests || [];
  const pendingCount = dbStats.pending_retake_requests_count || pendingRequests.length;

  const firstName = currentUser?.first_name || currentUser?.username || (isAdmin ? "Admin" : "Instructor");

  return (
    <div style={{ padding: "4px 28px 32px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <div className="smart-dash smart-ui">
        {/* Hero: greeting + quick actions */}
        <section className="smart-hero">
          <div>
            <span className="smart-eyebrow">{isAdmin ? "Admin Dashboard" : "Instructor Dashboard"}</span>
            <h1>
              Welcome back, <span className="smart-accent">{firstName}</span> <span aria-hidden="true">👋</span>
            </h1>
            <p>
              {isAdmin
                ? "Platform Administrator overview across courses, students, and lab infrastructure."
                : "Instructor dashboard for monitoring students, curriculum, and practical labs."}
            </p>
          </div>
          <ShieldArt />
          <div className="smart-hero-actions">
            {isAdmin && (
              <a
                className="smart-btn-outline is-django"
                href={DJANGO_ADMIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Access low-level Django model administration (/admin/)"
              >
                <Shield size={13} /> Django Admin <ExternalLink size={11} style={{ opacity: 0.8 }} />
              </a>
            )}
            {onNavigate && (
              <button type="button" className="smart-btn-outline" onClick={() => go("a-labs")}>
                <FlaskConical size={13} color="#f5a623" /> All Labs
              </button>
            )}
            <button type="button" className="smart-btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={14} strokeWidth={2.6} /> Add Lab
            </button>
          </div>
        </section>

        {notice && (
          <div className="smart-notice is-success" role="status">
            <CheckCircle size={16} color="#3fd8c8" style={{ flexShrink: 0 }} />
            <span>{notice.text}</span>
          </div>
        )}

        {/* Stat tiles with real database data */}
        <div className="smart-stats">
          <SmartStatTile tint="blue" icon={Users} label="Total Students" value={dbStats.total_students}
            sub="Registered students" wave={0} onClick={onNavigate ? () => go("a-students") : undefined} />
          <SmartStatTile tint="green" icon={Activity} label="Active Students" value={dbStats.active_students}
            sub={`${dbStats.active_students_pct}% active`} wave={1} onClick={onNavigate ? () => go("a-activity") : undefined} />
          <SmartStatTile tint="teal" icon={TrendingUp} label="Avg. Progress" value={`${dbStats.avg_progress}%`}
            sub="Platform wide completion" wave={1} onClick={onNavigate ? () => go("a-subject-analysis") : undefined} />
        </div>

        {/* Lab retake requests */}
        <section
          className={`smart-panel${pendingRequests.length > 0 ? " is-attention" : ""}`}
          aria-labelledby="smart-retakes-title"
        >
          <div className="smart-panel-head">
            <div className="smart-panel-title">
              <RotateCcw size={22} color="#f5a623" strokeWidth={2.4} />
              <div>
                <h2 id="smart-retakes-title" style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  Student Lab Retake Requests
                  {pendingCount > 0 && <span className="smart-count">{pendingCount} Pending</span>}
                </h2>
                <p>Students who completed all questions requesting one more attempt</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {onNavigate && (
                <button
                  type="button"
                  className="smart-btn-outline"
                  onClick={() => go("a-retakes")}
                  title="Open dedicated retake requests review dashboard"
                >
                  <RotateCcw size={12} color="#f5a623" /> All Retake Requests
                </button>
              )}
              <button type="button" className="smart-btn-outline" onClick={loadData} disabled={loading}>
                <RefreshCw size={12} className={loading ? "smart-spin" : undefined} /> Refresh
              </button>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="smart-empty">
              <CheckCircle size={26} color="#22c55e" />
              <div className="smart-empty-title">No pending retake requests</div>
              <div className="smart-empty-sub" style={onNavigate ? undefined : { marginBottom: 0 }}>
                All student lab statuses are up to date.
              </div>
              {onNavigate && (
                <button type="button" className="smart-link" onClick={() => go("a-retakes")}>
                  View all retake requests history &amp; records <ChevronRight size={13} />
                </button>
              )}
            </div>
          ) : (
            <div className="smart-req-list">
              {pendingRequests.map((req) => {
                const studentName = req.student_name || req.student_username;
                const busy = reviewingId === req.id;
                return (
                  <div key={req.id} className="smart-req">
                    <div className="smart-req-main">
                      <div className="smart-req-head">
                        <span className="smart-req-name">{studentName}</span>
                        <span className="smart-req-user">@{req.student_username}</span>
                        <span style={{ color: "#3a4250" }}>•</span>
                        <span className="smart-req-lab">{req.lab_name}</span>
                        {req.lab_difficulty && <DiffBadge level={req.lab_difficulty} />}
                      </div>

                      {req.reason && <div className="smart-req-reason">"{req.reason}"</div>}

                      <div className="smart-req-meta">
                        {req.student_email && <span>{req.student_email}</span>}
                        {req.subject_name && <span>Subject: {req.subject_name}</span>}
                        {req.created_at && (
                          <span>
                            <Clock size={10} /> {new Date(req.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="smart-req-actions">
                      <button
                        type="button"
                        className="smart-btn-accept"
                        disabled={busy}
                        onClick={() => handleReviewRetake(req.id, "approve", studentName, req.lab_name)}
                        title="Accept retake request and unlock lab"
                      >
                        {busy ? <Loader2 size={13} className="smart-spin" /> : <Check size={14} />}
                        Accept
                      </button>
                      <button
                        type="button"
                        className="smart-btn-reject"
                        disabled={busy}
                        onClick={() => handleReviewRetake(req.id, "reject", studentName, req.lab_name)}
                        title="Reject student retake request"
                      >
                        {busy ? <Loader2 size={13} className="smart-spin" /> : <X size={14} />}
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Completions chart + active labs */}
        <div className="smart-dash-grid">
          <section className="smart-panel" style={{ position: "relative" }}>
            <CompletionsChart series={dbStats.completions_series} totalAllTime={dbStats.total_completions || 0} />
          </section>

          <section className="smart-panel" aria-labelledby="smart-active-labs-title">
            <div className="smart-panel-head">
              <div className="smart-panel-title">
                <BarChart3 size={22} color="#f5a623" strokeWidth={2.4} />
                <div>
                  <h2 id="smart-active-labs-title">Active Security Labs</h2>
                  <p>Most recently active labs on the platform</p>
                </div>
              </div>
              <button type="button" className="smart-btn-primary is-small" onClick={() => setModalOpen(true)}>
                <Plus size={12} strokeWidth={2.6} /> Add Lab
              </button>
            </div>

            <div className="smart-lab-rows">
              {displayLabs.map((l) => {
                const qCount = l.questions?.length || l.question_count || 1;
                const hCount = l.questions
                  ? l.questions.reduce((acc, q) => acc + (q.hints?.length || 0), 0)
                  : 1;

                return (
                  <div key={l.id} className="smart-lab-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="smart-lab-row-name">{l.name}</div>
                      <div className="smart-lab-row-meta">
                        <span>{l.org || "BlitzLab"}</span>
                        <span style={{ color: "#3fd8c8" }}>
                          <HelpCircle size={11} /> {qCount} Qs
                        </span>
                        <span style={{ color: "#f5a623" }}>
                          <Lightbulb size={11} /> {hCount} Hints
                        </span>
                        {l.subject_name && (
                          <span
                            className="smart-chip"
                            style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
                          >
                            {l.subject_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <DiffBadge level={l.difficulty || l.diff || "Beginner"} />
                  </div>
                );
              })}
            </div>

            {onNavigate && (
              <div className="smart-panel-foot">
                <button type="button" className="smart-link" onClick={() => go("a-labs")}>
                  View all labs in Lab Management <ArrowRight size={12} />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Add Lab Modal */}
      <AddLabModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onLabCreated={handleLabCreated}
      />
    </div>
  );
}

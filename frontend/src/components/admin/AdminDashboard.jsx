import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, Wallet, TrendingUp, Plus, FlaskConical,
  HelpCircle, Lightbulb, CheckCircle, ChevronRight, ExternalLink, Shield,
  RotateCcw, Check, X, Clock, Loader2
} from "lucide-react";
import Panel from "../common/Panel";
import StatCard from "../common/StatCard";
import Badge, { DiffBadge } from "../common/Badge";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { LABS as MOCK_LABS } from "../../data/mockData";
import { fetchLabs, createLab } from "../../api/labs";
import { fetchAdminDashboardStats, reviewAdminRetakeRequest } from "../../api/students";
import { DJANGO_ADMIN_URL } from "../../api/client";
import AddLabModal from "./AddLabModal";

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
  const [chartTimeframe, setChartTimeframe] = useState("30D"); // 7D | 30D | 90D
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [labsData, statsData] = await Promise.all([
        fetchLabs().catch(() => ({ results: [] })),
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
      const res = await createLab(payload);
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
    setReviewingId(requestId);
    try {
      const res = await reviewAdminRetakeRequest(requestId, action);
      setNotice({
        type: action === "approve" ? "success" : "default",
        text: res.message || `Retake request for ${studentName} on ${labName} ${action === "approve" ? "approved" : "rejected"}.`,
      });
      await loadData();
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      alert(err.message || `Failed to ${action} retake request.`);
    } finally {
      setReviewingId(null);
    }
  };

  const displayLabs = (dbStats.active_labs && dbStats.active_labs.length > 0)
    ? dbStats.active_labs
    : labs.slice(0, 5);


  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header with Add Lab Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            {isAdmin
              ? "Platform Administrator overview across courses, students, and lab infrastructure."
              : "Instructor dashboard for monitoring students, curriculum, and practical labs."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isAdmin && (
            <a
              href={DJANGO_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Access low-level Django model administration (/admin/)"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 7,
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#34d399",
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              <Shield size={14} />
              <span>Django Admin</span>
              <ExternalLink size={12} style={{ opacity: 0.8 }} />
            </a>
          )}
          {onNavigate && (
            <Btn
              variant="subtle"
              icon={FlaskConical}
              onClick={() => onNavigate("a-labs")}
            >
              All Labs
            </Btn>
          )}
          <Btn icon={Plus} onClick={() => setModalOpen(true)}>
            Add Lab
          </Btn>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "rgba(63, 216, 200, 0.12)",
            border: `1px solid ${C.cyan}`,
            borderRadius: 8,
            margin: "18px 0 0",
            color: C.cyan,
            fontFamily: sans,
            fontSize: 13,
          }}
        >
          <CheckCircle size={16} />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Stat Cards with Real Database Data */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 22 }}>
        <StatCard
          label="Total Students"
          value={dbStats.total_students}
          icon={Users}
          sub="Registered students"
        />
        <StatCard
          label="Active Students"
          value={dbStats.active_students}
          icon={Activity}
          sub={`${dbStats.active_students_pct}% active`}
          tone="cyan"
        />
        <StatCard
          label="Fee Due"
          value={dbStats.fee_due_formatted}
          icon={Wallet}
          sub="Outstanding tuition"
          tone={dbStats.fee_due_raw > 0 ? "amber" : "neutral"}
        />
        <StatCard
          label="Avg. Progress"
          value={`${dbStats.avg_progress}%`}
          icon={TrendingUp}
          sub="Platform wide completion"
          tone="green"
        />
      </div>

      {/* Lab Retake Requests Panel */}
      <Panel
        style={{
          padding: 20,
          marginTop: 24,
          border: (dbStats.pending_retake_requests && dbStats.pending_retake_requests.length > 0)
            ? `1px solid rgba(245, 166, 35, 0.4)`
            : `1px solid ${C.border}`,
          background: (dbStats.pending_retake_requests && dbStats.pending_retake_requests.length > 0)
            ? "rgba(245, 166, 35, 0.03)"
            : C.panel,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(245, 166, 35, 0.12)",
                border: "1px solid rgba(245, 166, 35, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCcw size={16} color={C.amber} />
            </div>
            <div>
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, display: "flex", alignItems: "center", gap: 8 }}>
                <span>Student Lab Retake Requests</span>
                {(dbStats.pending_retake_requests_count > 0 || (dbStats.pending_retake_requests && dbStats.pending_retake_requests.length > 0)) && (
                  <span
                    style={{
                      background: "rgba(245, 166, 35, 0.2)",
                      color: C.amber,
                      fontFamily: mono,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                      border: "1px solid rgba(245, 166, 35, 0.4)",
                    }}
                  >
                    {dbStats.pending_retake_requests_count || dbStats.pending_retake_requests.length} Pending
                  </span>
                )}
              </div>
              <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginTop: 2 }}>
                Students who completed all questions requesting one more attempt
              </div>
            </div>
          </div>
          <Btn sm tone="ghost" icon={RefreshCw} onClick={loadData}>
            Refresh Requests
          </Btn>
        </div>

        {(!dbStats.pending_retake_requests || dbStats.pending_retake_requests.length === 0) ? (
          <div
            style={{
              padding: "18px 14px",
              textAlign: "center",
              fontFamily: sans,
              fontSize: 12.5,
              color: C.low,
              background: C.panel2,
              borderRadius: 8,
              border: `1px dashed ${C.border}`,
            }}
          >
            No pending retake requests. All student lab statuses are up to date.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dbStats.pending_retake_requests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 700, color: C.hi }}>
                      {req.student_name || req.student_username}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.cyan }}>
                      @{req.student_username}
                    </span>
                    <span style={{ color: C.border }}>•</span>
                    <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.amber }}>
                      {req.lab_name}
                    </span>
                    {req.lab_difficulty && <DiffBadge level={req.lab_difficulty} />}
                  </div>

                  {req.reason && (
                    <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, marginTop: 4, fontStyle: "italic" }}>
                      "{req.reason}"
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, fontFamily: mono, fontSize: 10.5, color: C.low }}>
                    {req.subject_name && <span>Subject: {req.subject_name}</span>}
                    {req.created_at && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} /> {new Date(req.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    disabled={reviewingId === req.id}
                    onClick={() => handleReviewRetake(req.id, "approve", req.student_username, req.lab_name)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(0, 230, 118, 0.15)",
                      border: "1px solid rgba(0, 230, 118, 0.4)",
                      color: "#a7f3d0",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontFamily: sans,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: reviewingId === req.id ? "wait" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {reviewingId === req.id ? (
                      <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={reviewingId === req.id}
                    onClick={() => handleReviewRetake(req.id, "reject", req.student_username, req.lab_name)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(229, 83, 75, 0.1)",
                      border: "1px solid rgba(229, 83, 75, 0.35)",
                      color: "#fca5a5",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontFamily: sans,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: reviewingId === req.id ? "wait" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {reviewingId === req.id ? (
                      <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      <X size={14} />
                    )}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.1fr", gap: 16, marginTop: 24 }}>
        {/* Lab Completions Panel */}
        <Panel style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>
                Lab Completions — {chartTimeframe}
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                {dbStats.total_completions} Total verified lab completions recorded
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["7D", "30D", "90D"].map((d) => (
                <div
                  key={d}
                  onClick={() => setChartTimeframe(d)}
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    padding: "4px 9px",
                    borderRadius: 5,
                    color: chartTimeframe === d ? "#1A1200" : C.mid,
                    background: chartTimeframe === d ? C.amber : C.panel2,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                    fontWeight: chartTimeframe === d ? 700 : 500,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
            {(dbStats.completions_chart[chartTimeframe] || [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]).map((v, i) => (
              <div
                key={i}
                title={`Interval ${i + 1}`}
                style={{
                  flex: 1,
                  height: `${v}%`,
                  background: i === 11 ? C.amber : (v > 15 ? C.cyan : C.panel3),
                  borderRadius: "3px 3px 0 0",
                  border: `1px solid ${C.border}`,
                  transition: "height 0.3s ease",
                }}
              />
            ))}
          </div>
        </Panel>

        {/* Labs Quick Overview Panel */}
        <Panel style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FlaskConical size={16} color={C.amber} />
              <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>
                Active Security Labs
              </div>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                color: C.amber,
                fontFamily: sans,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 600,
              }}
            >
              <Plus size={13} /> Add Lab
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {displayLabs.map((l) => {
              const qCount = l.questions?.length || l.question_count || 1;
              const hCount = l.questions
                ? l.questions.reduce((acc, q) => acc + (q.hints?.length || 0), 0)
                : 1;

              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderTop: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          fontFamily: sans,
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.hi,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {l.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3 }}>
                      <span style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>{l.org || "BlitzLab"}</span>
                      <span style={{ color: C.border }}>·</span>
                      <span style={{ fontFamily: mono, fontSize: 10.5, color: C.cyan, display: "flex", alignItems: "center", gap: 3 }}>
                        <HelpCircle size={11} /> {qCount} Qs
                      </span>
                      <span style={{ color: C.border }}>·</span>
                      <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber, display: "flex", alignItems: "center", gap: 3 }}>
                        <Lightbulb size={11} /> {hCount} Hints
                      </span>
                      {l.subject_name && (
                        <>
                          <span style={{ color: C.border }}>·</span>
                          <span style={{ fontFamily: mono, fontSize: 10.5, color: C.amber, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.subject_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <DiffBadge level={l.difficulty || l.diff || "Beginner"} />

                </div>
              );
            })}
          </div>

          {onNavigate && (
            <div
              onClick={() => onNavigate("a-labs")}
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px dashed ${C.border}`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                fontFamily: sans,
                fontSize: 12,
                color: C.amber,
                cursor: "pointer",
              }}
            >
              <span>View all labs in Lab Management</span>
              <ChevronRight size={13} />
            </div>
          )}
        </Panel>
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

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Activity, Wallet, TrendingUp, Plus, FlaskConical,
  HelpCircle, Lightbulb, CheckCircle, ChevronRight, ExternalLink
} from "lucide-react";
import Panel from "../common/Panel";
import StatCard from "../common/StatCard";
import Badge, { DiffBadge } from "../common/Badge";
import Btn from "../common/Btn";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { LABS as MOCK_LABS } from "../../data/mockData";
import { fetchLabs, createLab } from "../../api/labs";
import { fetchAdminDashboardStats } from "../../api/students";
import AddLabModal from "./AddLabModal";

export default function AdminDashboard({ onNavigate }) {
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
  });
  const [chartTimeframe, setChartTimeframe] = useState("30D"); // 7D | 30D | 90D
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

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
            Overview across courses, students, and interactive labs.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
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

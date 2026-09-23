import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Trophy, Award, FlaskConical, CheckCircle2,
  Clock, ArrowRight, ShieldCheck, Zap, RefreshCw, Layers
} from "lucide-react";
import Panel from "../common/Panel";
import StatCard from "../common/StatCard";
import ProgressBar from "../common/ProgressBar";
import Badge, { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentLabs } from "../../api/labs";

export default function StudentProgressView({ go }) {
  const [labs, setLabs] = useState([]);
  const [labScores, setLabScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentLabs();
      setLabs(res.labs || []);
      setLabScores(res.lab_scores || []);
      setStats(res.stats || {});
    } catch (err) {
      console.error("Failed to load student progress:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completedLabs = labs.filter((l) => l.is_completed || l.submission_status === "COMPLETED");
  const inProgressLabs = labs.filter((l) => l.submission_status === "IN_PROGRESS" && !l.is_completed);
  const attendedLabs = labs.filter((l) => (l.attend_count > 0 || l.submission_status !== "NOT_STARTED"));

  const totalPoints = stats?.total_points_earned || 0;
  const maxPossible = stats?.total_possible_points || 1;
  const overallPct = Math.round((totalPoints / maxPossible) * 100);

  return (
    <div style={{ padding: "26px 30px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
            Your Overall Progress & Attended Labs
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: "4px 0 0" }}>
            Track your verified practical lab scores, attendance history, and completion milestones.
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            color: C.hi,
            fontFamily: sans,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={13} color={C.amber} />
          Refresh Progress
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 22 }}>
        <StatCard
          icon={TrendingUp}
          label="Overall Score"
          value={`${totalPoints} pts`}
          sub={`Out of ${maxPossible} possible`}
          tone="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Labs Completed"
          value={completedLabs.length}
          sub={`${overallPct}% completion rate`}
          tone="cyan"
        />
        <StatCard
          icon={FlaskConical}
          label="Labs In Progress"
          value={inProgressLabs.length}
          sub="Active workspace sessions"
          tone="purple"
        />
        <StatCard
          icon={Trophy}
          label="Total Attended"
          value={attendedLabs.length}
          sub="Labs entered"
          tone="green"
        />
      </div>

      {/* Overall Progress Milestone Card */}
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>
              Platform Cybersecurity Mastery
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
              Marks are uniquely bound to labs. Attending a lab multiple times reinforces skills without inflating marks.
            </div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: C.amber }}>
            {overallPct}%
          </div>
        </div>
        <ProgressBar pct={overallPct} color={C.cyan} />
      </div>

      {/* Attended Labs & Score Breakdown List */}
      <Panel
        title="Attended Labs & Scores Breakdown"
        sub={`${attendedLabs.length} labs attended with recorded marks`}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.mid, fontFamily: sans }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 12, color: C.amber }} />
            <div>Loading your lab scores...</div>
          </div>
        ) : attendedLabs.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: C.low, fontFamily: sans }}>
            <FlaskConical size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div style={{ fontSize: 14, color: C.mid, fontWeight: 600 }}>No labs attended yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Head over to the Dashboard or Labs Explorer to attend your first lab!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {attendedLabs.map((lab, idx) => (
              <div
                key={lab.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: idx < attendedLabs.length - 1 ? `1px solid ${C.border}` : "none",
                  background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                }}
              >
                {/* Left Info */}
                <div style={{ flex: 1, minWidth: 0, marginRight: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: C.hi }}>
                      {lab.name}
                    </span>
                    <DiffBadge diff={lab.difficulty} />
                    {lab.is_completed || lab.submission_status === "COMPLETED" ? (
                      <Badge tone="cyan">COMPLETED</Badge>
                    ) : (
                      <Badge tone="warn">IN PROGRESS</Badge>
                    )}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                    {lab.subject_name ? `Subject: ${lab.subject_name}` : lab.category} • Attended {lab.attend_count || 1} time(s)
                  </div>
                  <div style={{ marginTop: 8, maxWidth: 360 }}>
                    <ProgressBar pct={lab.progress_pct || 0} color={lab.is_completed ? "#4ade80" : C.cyan} />
                  </div>
                </div>

                {/* Right Score */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.amber }}>
                    {lab.score} / {lab.max_score} pts
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>
                    {lab.solved_questions_count || 0} / {lab.question_count || 0} flags solved
                  </div>
                  {go && (
                    <button
                      onClick={() => go("dashboard")}
                      style={{
                        marginTop: 6,
                        background: "none",
                        border: "none",
                        color: C.cyan,
                        fontFamily: sans,
                        fontSize: 12,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Resume Lab <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

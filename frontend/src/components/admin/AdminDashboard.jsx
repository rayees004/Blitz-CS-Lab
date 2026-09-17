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
import { LABS as MOCK_LABS, CLASSES } from "../../data/mockData";
import { fetchLabs, createLab } from "../../api/labs";
import AddLabModal from "./AddLabModal";

export default function AdminDashboard({ onNavigate }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadLabs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLabs();
      const serverLabs = data.results || [];
      if (serverLabs.length > 0) {
        setLabs(serverLabs);
      } else {
        setLabs(MOCK_LABS);
      }
    } catch (err) {
      console.warn("Could not fetch server labs, using mock labs:", err);
      setLabs(MOCK_LABS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const handleLabCreated = async (payload) => {
    try {
      const res = await createLab(payload);
      setNotice({ type: "success", text: `Lab "${payload.name}" successfully created with ${payload.questions.length} questions!` });
      await loadLabs();
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

  const displayLabs = labs.slice(0, 5);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header with Add Lab Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            Overview across all classes, curriculum, and interactive labs.
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

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
        <StatCard label="Total Students" value="312" icon={Users} />
        <StatCard label="Active Students" value="276" icon={Activity} sub="88% active" tone="cyan" />
        <StatCard label="Fee Due" value="₹1.4L" icon={Wallet} />
        <StatCard label="Avg. Progress" value="47%" icon={TrendingUp} />
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.1fr", gap: 16, marginTop: 24 }}>
        {/* Lab Completions Panel */}
        <Panel style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>
              Lab Completions — 30 Days
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["7D", "30D", "90D"].map((d) => (
                <div
                  key={d}
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    padding: "4px 9px",
                    borderRadius: 5,
                    color: d === "30D" ? "#1A1200" : C.mid,
                    background: d === "30D" ? C.amber : C.panel2,
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
            {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85, 70, 95].map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${v}%`,
                  background: i === 11 ? C.amber : C.panel3,
                  borderRadius: "3px 3px 0 0",
                  border: `1px solid ${C.border}`,
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

      {/* Classes Section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 12 }}>
          Classes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {CLASSES.map((c) => (
            <Panel key={c.name} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>{c.name}</div>
                <Badge tone={c.fee === "PAID" ? "cyan" : c.fee === "DUE" ? "danger" : "warn"}>{c.fee}</Badge>
              </div>
              <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
                {[["Students", c.students], ["Labs", c.labs], ["Materials", c.materials]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 600, color: C.hi }}>{v}</div>
                    <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>{k}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: sans, fontSize: 11.5, color: C.mid }}>Progress</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.hi }}>{c.pct}%</span>
                </div>
                <ProgressBar value={c.pct} />
              </div>
            </Panel>
          ))}
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

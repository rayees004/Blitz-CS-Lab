import React, { useState, useEffect, useCallback } from "react";
import { Trophy, Medal, RefreshCw, Globe, Users, Zap } from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import StatCard from "../common/StatCard";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentLeaderboard } from "../../api/labs";
import Pagination from "../common/Pagination";

const MEDAL_COLORS = { 1: "#F5C542", 2: "#C0C7D1", 3: "#D08A4E" };

function RankCell({ rank }) {
  if (MEDAL_COLORS[rank]) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: mono, fontWeight: 700, color: MEDAL_COLORS[rank] }}>
        <Medal size={16} color={MEDAL_COLORS[rank]} /> #{rank}
      </span>
    );
  }
  return <span style={{ fontFamily: mono, color: C.mid }}>#{rank}</span>;
}

export default function StudentLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Rankings, 20 per page (ranks are computed across everyone on the server)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchStudentLeaderboard(page));
    } catch (err) {
      setError(err.message || "Failed to load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isClassScope = data?.scope === "class";
  const results = data?.results || [];
  const me = data?.me || results.find((r) => r.is_me);

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>Leaderboard</h1>
            {data && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: mono,
                  fontSize: 11,
                  color: isClassScope ? C.amber : C.cyan,
                  background: isClassScope ? "rgba(245, 166, 35, 0.1)" : "rgba(63, 216, 200, 0.1)",
                  border: `1px solid ${isClassScope ? "rgba(245, 166, 35, 0.3)" : "rgba(63, 216, 200, 0.3)"}`,
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                {isClassScope ? <Users size={12} /> : <Globe size={12} />}
                {isClassScope
                  ? `Class: ${data.class_name || "Not assigned"}${data.class_code ? ` (${data.class_code})` : ""}`
                  : "Global"}
              </span>
            )}
          </div>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 5 }}>
            {isClassScope
              ? "Rankings among students in your class, by points earned, labs completed and questions solved."
              : "Rankings across all Blitz Cyber Lab students, by points earned, labs completed and questions solved."}
          </p>
        </div>
        <Btn icon={RefreshCw} variant="outline" sm onClick={loadData}>
          {loading ? "Loading..." : "Refresh"}
        </Btn>
      </div>

      {/* Your position */}
      {me && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 22 }}>
          <StatCard label="Your Rank" value={`#${me.rank}`} icon={Trophy} sub={`of ${data.total_students} students`} />
          <StatCard label="Your Points" value={`${me.points} pts`} icon={Zap} sub="across all labs" tone="cyan" />
          <StatCard label="Labs Completed" value={`${me.labs_completed}`} icon={Medal} sub={`${me.questions_solved} questions solved`} />
        </div>
      )}

      {/* Rankings table */}
      <Panel style={{ marginTop: 22, padding: 0, overflow: "hidden" }}>
        {loading && !data ? (
          <div style={{ padding: 40, textAlign: "center", color: C.mid, fontFamily: sans }}>Loading leaderboard...</div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#fca5a5", fontFamily: sans }}>{error}</div>
        ) : results.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.mid, fontFamily: sans }}>No students to rank yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: sans, fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.panel2, color: C.low, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ textAlign: "left", padding: "12px 18px", width: 90 }}>Rank</th>
                <th style={{ textAlign: "left", padding: "12px 18px" }}>Student</th>
                <th style={{ textAlign: "right", padding: "12px 18px" }}>Points</th>
                <th style={{ textAlign: "right", padding: "12px 18px" }}>Labs Completed</th>
                <th style={{ textAlign: "right", padding: "12px 18px" }}>Questions Solved</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.student_id}
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    background: r.is_me ? "rgba(245, 166, 35, 0.08)" : "transparent",
                    boxShadow: r.is_me ? `inset 3px 0 0 ${C.amber}` : "none",
                  }}
                >
                  <td style={{ padding: "12px 18px" }}><RankCell rank={r.rank} /></td>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{ color: C.hi, fontWeight: 600 }}>{r.name}</span>
                    {r.is_me && (
                      <span style={{ marginLeft: 8, fontFamily: mono, fontSize: 10, color: C.amber, border: "1px solid rgba(245, 166, 35, 0.35)", padding: "1px 6px", borderRadius: 4 }}>
                        YOU
                      </span>
                    )}
                    <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 2 }}>@{r.username}</div>
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "right", fontFamily: mono, fontWeight: 700, color: C.amber }}>{r.points} pts</td>
                  <td style={{ padding: "12px 18px", textAlign: "right", fontFamily: mono, color: C.hi }}>{r.labs_completed}</td>
                  <td style={{ padding: "12px 18px", textAlign: "right", fontFamily: mono, color: C.hi }}>{r.questions_solved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Pagination meta={data} onPageChange={setPage} loading={loading} />
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  FlaskConical, Search, Play, BookOpen, Video, Award,
  CheckCircle2, Clock, ShieldCheck, Terminal, RefreshCw,
  FolderArchive, Download, ArrowLeft, Lightbulb, User
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import { C, sans, mono } from "../../constants/theme";
import { fetchLabs, fetchStudentLabs } from "../../api/labs";
import StudentLabAttendModal from "../student/StudentLabAttendModal";
import LabDetail from "../student/LabDetail";

export default function AdminAttendLabView({ currentUser, onNavigate }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [selectedDiff, setSelectedDiff] = useState("ALL");

  // Attending modal state
  const [attendingLab, setAttendingLab] = useState(null);
  const [inspectingLab, setInspectingLab] = useState(null);

  const loadLabs = async () => {
    setLoading(true);
    setError(null);
    try {
      // First try fetchStudentLabs to get enriched attendee data
      const studentData = await fetchStudentLabs().catch(() => null);
      if (studentData && studentData.labs && studentData.labs.length > 0) {
        setLabs(studentData.labs);
      } else {
        const adminLabsData = await fetchLabs();
        setLabs(adminLabsData.results || []);
      }
    } catch (err) {
      console.warn("Error loading labs for attend view:", err);
      setError(err.message || "Failed to load labs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const categories = ["ALL", ...new Set(labs.map((l) => l.category || l.cat).filter(Boolean))];

  const filteredLabs = labs.filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.description || l.desc || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.org || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === "ALL" || (l.category || l.cat) === selectedCat;
    const matchesDiff = selectedDiff === "ALL" || (l.difficulty || l.diff) === selectedDiff;
    return matchesSearch && matchesCat && matchesDiff;
  });

  if (inspectingLab) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <LabDetail lab={inspectingLab} back={() => setInspectingLab(null)} />
      </div>
    );
  }

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10.5,
                color: C.green,
                background: "rgba(0, 230, 118, 0.12)",
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid rgba(0, 230, 118, 0.3)",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              INSTRUCTOR LAB ATTENDANCE
            </span>
          </div>
          <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
            Attend & Test Practical Labs
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: 0, maxWidth: 680 }}>
            Launch practical laboratory workspaces directly as faculty or instructor. Verify container environments, test questions and flags, review hints, and experience hands-on exploitation live.
          </p>
        </div>

        <button
          onClick={loadLabs}
          style={{
            background: C.panel2,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            cursor: "pointer",
            color: C.mid,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            fontFamily: sans,
            fontSize: 12,
            transition: "all 0.15s ease",
          }}
          title="Refresh Labs"
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <Panel style={{ padding: "14px 18px", marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: "7px 12px",
              minWidth: 260,
              flex: 1,
            }}
          >
            <Search size={14} color={C.low} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by lab name, concept, or vulnerability..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: sans,
                fontSize: 12.5,
                color: C.hi,
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Category:</span>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontFamily: sans,
                  fontSize: 12,
                  color: C.hi,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>Difficulty:</span>
              <select
                value={selectedDiff}
                onChange={(e) => setSelectedDiff(e.target.value)}
                style={{
                  background: C.panel2,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontFamily: sans,
                  fontSize: 12,
                  color: C.hi,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      </Panel>

      {/* Error state */}
      {error && !loading && (
        <Panel style={{ padding: 20, border: "1px solid rgba(229,83,75,0.3)", background: "rgba(229,83,75,0.08)", marginBottom: 20 }}>
          <div style={{ color: C.danger, fontFamily: sans, fontSize: 13, fontWeight: 600 }}>{error}</div>
          <Btn small onClick={loadLabs} style={{ marginTop: 8 }}>Retry</Btn>
        </Panel>
      )}

      {/* Labs Grid */}
      {loading ? (
        <Panel style={{ padding: 50, textAlign: "center" }}>
          <RefreshCw size={26} color={C.green} style={{ animation: "spin 1s linear infinite", marginBottom: 12 }} />
          <div style={{ fontFamily: sans, fontSize: 14, color: C.hi }}>Loading active laboratory environments...</div>
        </Panel>
      ) : filteredLabs.length === 0 ? (
        <Panel style={{ padding: 48, textAlign: "center" }}>
          <FlaskConical size={36} color={C.mid} style={{ marginBottom: 14 }} />
          <div style={{ fontFamily: sans, fontSize: 16, color: C.hi, fontWeight: 700 }}>No practical labs found</div>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.low, margin: "8px 0 16px" }}>
            No labs matched your search filter or no labs are active in the database.
          </p>
        </Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredLabs.map((lab) => {
            const hasVideo = Boolean(lab.video_file || lab.video_url);
            const qCount = lab.question_count || lab.questions?.length || 0;
            const creatorName = lab.created_by_name || lab.org || "Platform Admin";

            return (
              <Panel
                key={lab.id}
                style={{
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                  border: `1px solid ${C.border}`,
                  transition: "all 0.15s ease",
                  background: C.panel,
                }}
              >
                <div>
                  {/* Top line with lab id & badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.amber, fontWeight: 700 }}>
                      LAB #{String(lab.id).padStart(2, "0")}
                    </span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <DiffBadge level={lab.difficulty || lab.diff || "Beginner"} />
                      <Badge tone="cyan">{lab.points || lab.pts || 100} PTS</Badge>
                    </div>
                  </div>

                  {/* Lab Title */}
                  <h3 style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi, margin: "0 0 6px" }}>
                    {lab.name}
                  </h3>

                  {/* Category & Course Tag */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                      {lab.category || lab.cat || "Security"}
                    </span>
                    {lab.subject_name && (
                      <span style={{ fontFamily: sans, fontSize: 11, color: C.amber }}>
                        · Subject: {lab.subject_name}
                      </span>
                    )}
                  </div>

                  {/* Creator person attribution */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                    <User size={11} color={C.low} />
                    <span style={{ fontFamily: sans, fontSize: 11, color: C.mid }}>
                      Created by: <strong style={{ color: C.hi }}>{creatorName}</strong>
                    </span>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: 12.5,
                      color: C.mid,
                      margin: 0,
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {lab.description || lab.desc || "Interactive cybersecurity challenge environment."}
                  </p>
                </div>

                {/* Bottom specs & action buttons */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.borderLight}`, marginBottom: 10 }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                      {qCount} Evaluation Question{qCount !== 1 ? "s" : ""}
                    </span>
                    {hasVideo && (
                      <span style={{ fontFamily: sans, fontSize: 10.5, color: C.amber, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Video size={11} /> Video Guide
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setInspectingLab(lab)}
                      style={{
                        flex: 1,
                        background: C.panel2,
                        border: `1px solid ${C.border}`,
                        color: C.hi,
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontFamily: sans,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendingLab(lab)}
                      style={{
                        flex: 1.3,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        border: "none",
                        color: "#ffffff",
                        padding: "8px 14px",
                        borderRadius: 6,
                        fontFamily: sans,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <Play size={13} fill="#ffffff" /> Attend Lab
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Attend Lab Modal for Instructor */}
      {attendingLab && (
        <StudentLabAttendModal
          lab={attendingLab}
          onClose={() => setAttendingLab(null)}
          onUpdated={loadLabs}
        />
      )}
    </div>
  );
}

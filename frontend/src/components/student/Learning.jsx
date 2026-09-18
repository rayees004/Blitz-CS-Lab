import React, { useState, useEffect } from "react";
import {
  ChevronLeft, Play, Lock, Video, CheckCircle2,
  BookOpen, Sparkles, AlertCircle, ShieldAlert, ArrowRight
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import { C, sans, mono } from "../../constants/theme";
import { CATEGORIES } from "../../data/mockData";
import { fetchStudentLabs, fetchLabs } from "../../api/labs";

export default function Learning({ go, onSelect }) {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchStudentLabs()
      .then((data) => {
        if (!isMounted) return;
        const results = data.labs || [];
        setLabs(results);
      })
      .catch((err) => {
        console.warn("Could not fetch student labs for learning tracks:", err);
        fetchLabs()
          .then((data) => {
            if (!isMounted) return;
            setLabs(data.results || []);
          })
          .catch(() => {
            if (isMounted) setLabs([]);
          });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter only labs that have teaching videos assigned
  const videoLabs = labs.filter((l) => Boolean(l.video_file || l.video_url));

  // Compute category statistics based on video-enabled labs and platform categories
  const categoryStats = CATEGORIES.map((cat) => {
    const matchingVideoLabs = videoLabs.filter(
      (l) => (l.category || l.cat || "").toLowerCase() === cat.name.toLowerCase()
    );
    const videoCount = matchingVideoLabs.length;
    const completedCount = matchingVideoLabs.filter((l) => l.is_completed || l.pct === 100).length;
    const computedPct = videoCount > 0 ? Math.round((completedCount / videoCount) * 100) : cat.pct;

    return {
      ...cat,
      videoCount,
      videoLabs: matchingVideoLabs,
      computedPct,
    };
  });

  // Labs for the currently opened category (only those with videos)
  const activeCategoryLabs = selectedCategory
    ? videoLabs.filter(
        (l) => (l.category || l.cat || "").toLowerCase() === selectedCategory.name.toLowerCase()
      )
    : [];

  const handleAttendLab = (lab) => {
    if (lab.is_locked) {
      alert(lab.lock_reason || "Access restricted. You must purchase/enroll in this subject to attend this lab.");
      return;
    }
    if (go) {
      go("lab-detail", lab);
    }
  };

  return (
    <div style={{ padding: 28, overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {/* Top Header / Breadcrumbs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          {selectedCategory ? (
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  color: C.cyan,
                  cursor: "pointer",
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: 0,
                  marginBottom: 10,
                }}
              >
                <ChevronLeft size={16} /> Back to All Tracks
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
                  {selectedCategory.name}
                </h1>
                <DiffBadge level={selectedCategory.diff === "Mixed" ? "Beginner" : selectedCategory.diff} />
              </div>
              <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
                Guided video tutorials and hands-on laboratory environments for {selectedCategory.name}.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Learning</h1>
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: C.amber,
                    background: "rgba(245, 166, 35, 0.1)",
                    padding: "2px 7px",
                    borderRadius: 4,
                    border: `1px solid rgba(245, 166, 35, 0.25)`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontWeight: 600,
                  }}
                >
                  <Video size={11} /> Video Learning Platform
                </span>
              </div>
              <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
                Structured curriculum tracks with instructional video walkthroughs and direct lab sessions.
              </p>
            </div>
          )}
        </div>

        {selectedCategory && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 12,
                color: C.low,
                background: C.panel2,
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px solid ${C.border}`,
              }}
            >
              {activeCategoryLabs.length} Video Tutorial{activeCategoryLabs.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* VIEW 1: CATEGORIES GRID */}
      {!selectedCategory && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {categoryStats.map((c) => (
            <Panel
              key={c.name}
              onClick={() => setSelectedCategory(c)}
              style={{
                padding: 18,
                cursor: "pointer",
                transition: "all 150ms ease",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.amber;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>{c.name}</div>
                  <DiffBadge level={c.diff === "Mixed" ? "Beginner" : c.diff} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <span style={{ fontFamily: mono, fontSize: 11.5, color: C.low }}>
                    {c.labs} curriculum labs
                  </span>
                  {c.videoCount > 0 ? (
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 10.5,
                        color: C.amber,
                        background: "rgba(245, 166, 35, 0.1)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: `1px solid rgba(245, 166, 35, 0.25)`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Video size={10} /> {c.videoCount} with video
                    </span>
                  ) : (
                    <span style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>
                      No videos yet
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: sans, fontSize: 11.5, color: C.mid }}>Track Progress</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.hi }}>{c.computedPct}%</span>
                </div>
                <ProgressBar value={c.computedPct} />
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* VIEW 2: CATEGORY VIDEO LABS LIST */}
      {selectedCategory && (
        <div>
          {activeCategoryLabs.length === 0 ? (
            <Panel
              style={{
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: C.panel2,
                border: `1px dashed ${C.border}`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(245, 166, 35, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  color: C.amber,
                }}
              >
                <Video size={26} />
              </div>
              <h3 style={{ fontFamily: sans, fontSize: 17, fontWeight: 700, color: C.hi, margin: "0 0 8px" }}>
                No Video Lessons Available for {selectedCategory.name}
              </h3>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 13,
                  color: C.mid,
                  maxWidth: 460,
                  lineHeight: 1.6,
                  margin: "0 0 20px",
                }}
              >
                This category does not have any active instructional videos assigned yet. Labs without video tutorials can be accessed directly in the Lab Explorer.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={() => setSelectedCategory(null)} variant="subtle">
                  Choose Another Category
                </Btn>
                {onSelect && (
                  <Btn onClick={() => onSelect("labs")} icon={ArrowRight}>
                    Open Lab Explorer
                  </Btn>
                )}
              </div>
            </Panel>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))", gap: 20 }}>
              {activeCategoryLabs.map((lab) => {
                const isLocked = Boolean(lab.is_locked);
                const isCompleted = lab.is_completed || lab.pct === 100;
                const isStarted = (lab.pct > 0 && lab.pct < 100) || lab.attend_count > 0;

                return (
                  <Panel
                    key={lab.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: C.panel,
                      border: isLocked
                        ? `1px dashed rgba(229, 83, 75, 0.4)`
                        : `1px solid ${C.border}`,
                      borderRadius: 10,
                      overflow: "hidden",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* VIDEO CONTAINER */}
                    <div
                      style={{
                        position: "relative",
                        background: "#080c14",
                        minHeight: 220,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      {isLocked ? (
                        /* Locked video overlay when student has not enrolled/purchased the subject */
                        <div
                          style={{
                            height: 230,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 24,
                            textAlign: "center",
                            background: "radial-gradient(ellipse at center, rgba(30, 16, 20, 0.95), #0a0c10)",
                          }}
                        >
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: "50%",
                              background: "rgba(229, 83, 75, 0.15)",
                              border: "1px solid rgba(229, 83, 75, 0.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: 12,
                              color: C.danger,
                            }}
                          >
                            <Lock size={22} />
                          </div>
                          <div
                            style={{
                              fontFamily: sans,
                              fontSize: 14.5,
                              fontWeight: 700,
                              color: "#fca5a5",
                              marginBottom: 6,
                            }}
                          >
                            Learning Video Locked
                          </div>
                          <p
                            style={{
                              fontFamily: sans,
                              fontSize: 12,
                              color: C.mid,
                              maxWidth: 380,
                              lineHeight: 1.5,
                              margin: "0 0 10px",
                            }}
                          >
                            {lab.lock_reason ||
                              `This video tutorial is exclusive to students enrolled in ${
                                lab.subject_name || "this subject"
                              }.`}
                          </p>
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 10.5,
                              color: "#f87171",
                              background: "rgba(229, 83, 75, 0.1)",
                              padding: "3px 8px",
                              borderRadius: 4,
                              border: "1px solid rgba(229, 83, 75, 0.2)",
                            }}
                          >
                            Subject enrollment / purchase required
                          </span>
                        </div>
                      ) : (
                        /* Unlocked video player */
                        <div>
                          {lab.video_file ? (
                            <video
                              controls
                              src={lab.video_file}
                              style={{
                                width: "100%",
                                maxHeight: 270,
                                display: "block",
                                background: "#000",
                              }}
                            >
                              Your browser does not support HTML5 video.
                            </video>
                          ) : lab.video_url?.includes("youtube.com") || lab.video_url?.includes("youtu.be") ? (
                            <div
                              style={{
                                position: "relative",
                                paddingBottom: "56.25%",
                                height: 0,
                                overflow: "hidden",
                              }}
                            >
                              <iframe
                                src={
                                  lab.video_url.includes("watch?v=")
                                    ? lab.video_url.replace("watch?v=", "embed/")
                                    : lab.video_url.includes("youtu.be/")
                                    ? `https://www.youtube.com/embed/${lab.video_url.split("youtu.be/")[1]}`
                                    : lab.video_url
                                }
                                title={lab.name}
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  border: "none",
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                height: 200,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                              }}
                            >
                              <Video size={28} color={C.amber} />
                              <a
                                href={lab.video_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontFamily: sans,
                                  fontSize: 13,
                                  color: C.cyan,
                                  textDecoration: "underline",
                                }}
                              >
                                Watch External Teaching Video
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* LAB DETAILS & ACTION */}
                    <div
                      style={{
                        padding: 18,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        flex: 1,
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        {/* Meta tags */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                              LAB #{String(lab.id).padStart(2, "0")}
                            </span>
                            <DiffBadge level={lab.difficulty || lab.diff || "Beginner"} />
                            <Badge>{lab.points || lab.pts || 100} PTS</Badge>
                          </div>

                          {isLocked ? (
                            <Badge tone="danger">
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <Lock size={10} /> LOCKED
                              </span>
                            </Badge>
                          ) : isCompleted ? (
                            <Badge tone="cyan">COMPLETED</Badge>
                          ) : isStarted ? (
                            <Badge tone="amber">IN PROGRESS</Badge>
                          ) : (
                            <Badge>READY TO ATTEND</Badge>
                          )}
                        </div>

                        {/* Title & Subject */}
                        <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                          {lab.name}
                        </div>
                        <div
                          style={{
                            fontFamily: mono,
                            fontSize: 11.5,
                            color: C.low,
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{lab.org || "BlitzLab"}</span>
                          <span>·</span>
                          <span>{lab.category || lab.cat}</span>
                          {(lab.subject_name || lab.course_name) && (
                            <>
                              <span>·</span>
                              <span style={{ color: C.cyan }}>
                                Subject: {lab.subject_name || lab.course_name}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Description */}
                        <p
                          style={{
                            fontFamily: sans,
                            fontSize: 12.5,
                            color: C.mid,
                            lineHeight: 1.55,
                            margin: "8px 0 0",
                          }}
                        >
                          {lab.description || lab.desc}
                        </p>
                      </div>

                      {/* Attend Lab CTA */}
                      <div
                        style={{
                          borderTop: `1px solid ${C.border}`,
                          paddingTop: 12,
                          marginTop: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          {isLocked ? (
                            <span style={{ fontFamily: sans, fontSize: 11.5, color: "#f87171" }}>
                              Purchase subject to unlock video & laboratory access
                            </span>
                          ) : isStarted ? (
                            <div style={{ width: "100%", maxWidth: 160 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                  fontFamily: mono,
                                  fontSize: 10,
                                  color: C.mid,
                                }}
                              >
                                <span>Progress</span>
                                <span>{lab.progress_pct || lab.pct || 0}%</span>
                              </div>
                              <ProgressBar value={lab.progress_pct || lab.pct || 0} h={4} />
                            </div>
                          ) : (
                            <span style={{ fontFamily: mono, fontSize: 11, color: C.green }}>
                              ● Live Target Ready
                            </span>
                          )}
                        </div>

                        <Btn
                          onClick={() => handleAttendLab(lab)}
                          icon={isLocked ? Lock : Play}
                          variant={isLocked ? "subtle" : isCompleted ? "subtle" : "primary"}
                          style={{
                            padding: "9px 18px",
                            opacity: isLocked ? 0.6 : 1,
                            cursor: isLocked ? "not-allowed" : "pointer",
                          }}
                        >
                          {isLocked
                            ? "Locked (Subject Required)"
                            : isCompleted
                            ? "Review Lab"
                            : isStarted
                            ? "Continue Lab"
                            : "Attend Lab"}
                        </Btn>
                        </div>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        )}
    </div>
  );
}

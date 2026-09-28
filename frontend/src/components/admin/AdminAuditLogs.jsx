import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollText, Search, RefreshCw, Filter, Shield, AlertTriangle,
  Info, Bell, User, Clock, Terminal, Globe, ChevronDown, ChevronRight,
  Database, FileText, CheckCircle2, XCircle, ArrowUpRight
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge from "../common/Badge";
import StatCard from "../common/StatCard";
import { C, sans, mono } from "../../constants/theme";
import { fetchAuditLogs } from "../../api/audit";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, info: 0, notice: 0, warning: 0, danger: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAuditLogs({
        q: searchQuery,
        action: selectedAction,
        severity: selectedSeverity,
        entity: selectedEntity,
      });
      setLogs(res.results || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedAction, selectedSeverity, selectedEntity]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const toggleExpand = (id) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "DANGER":
        return <Badge tone="danger">DANGER</Badge>;
      case "WARNING":
        return <Badge tone="warn">WARNING</Badge>;
      case "NOTICE":
        return <Badge tone="cyan">NOTICE</Badge>;
      case "INFO":
      default:
        return <Badge tone="default">INFO</Badge>;
    }
  };

  const getActionTone = (action) => {
    if (action.includes("DELETE")) return "danger";
    if (action.includes("CREATE")) return "cyan";
    if (action.includes("ASSIGN")) return "amber";
    return "default";
  };

  const getEntityIcon = (entity) => {
    switch (entity) {
      case "User":
        return <User size={14} color={C.mid} />;
      case "Lab":
        return <Terminal size={14} color={C.amber} />;
      case "Course":
      case "Subject":
        return <Database size={14} color={C.cyan} />;
      case "StudyMaterial":
        return <FileText size={14} color={C.mid} />;
      default:
        return <ScrollText size={14} color={C.low} />;
    }
  };

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>
              Audit Logs
            </h1>
            <Badge tone="cyan">IMMUTABLE TRAIL</Badge>
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, color: C.mid, marginTop: 4 }}>
            System activity ledger tracking administrative modifications, account access, and governance events.
          </div>
        </div>
        <Btn variant="subtle" icon={RefreshCw} onClick={loadLogs} disabled={loading} small>
          {loading ? "Refreshing..." : "Refresh"}
        </Btn>
      </div>

      {/* KPI Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard
          label="Total Logged Events"
          value={stats.total || logs.length}
          sub="Platform-wide records"
          icon={ScrollText}
        />
        <StatCard
          label="Info Events"
          value={stats.info || 0}
          sub="Standard operations & logins"
          icon={Info}
          tone="cyan"
        />
        <StatCard
          label="Notices & Changes"
          value={stats.notice || 0}
          sub="Creations & assignments"
          icon={Bell}
        />
        <StatCard
          label="Warnings & Deletions"
          value={(stats.warning || 0) + (stats.danger || 0)}
          sub="Deactivations & removals"
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      {/* Filters and Search Bar */}
      <Panel style={{ padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search box */}
          <div
            style={{
              flex: 1,
              minWidth: 240,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.panel2,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              padding: "7px 12px",
            }}
          >
            <Search size={14} color={C.low} />
            <input
              type="text"
              placeholder="Search by actor, description, target entity, or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: C.hi,
                fontFamily: sans,
                fontSize: 13,
                width: "100%",
              }}
            />
            {searchQuery && (
              <span
                onClick={() => setSearchQuery("")}
                style={{ cursor: "pointer", color: C.low, fontSize: 12 }}
              >
                ✕
              </span>
            )}
          </div>

          {/* Severity Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              style={{
                background: C.panel2,
                color: C.hi,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "7px 10px",
                fontFamily: sans,
                fontSize: 12.5,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="NOTICE">Notice</option>
              <option value="WARNING">Warning</option>
              <option value="DANGER">Danger</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              style={{
                background: C.panel2,
                color: C.hi,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "7px 10px",
                fontFamily: sans,
                fontSize: 12.5,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Entities</option>
              <option value="User">User</option>
              <option value="Lab">Lab</option>
              <option value="Course">Course / Class</option>
              <option value="Subject">Subject</option>
              <option value="StudyMaterial">Study Material</option>
              <option value="Enrollment">Enrollment</option>
            </select>
          </div>

          {/* Action Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              style={{
                background: C.panel2,
                color: C.hi,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                padding: "7px 10px",
                fontFamily: sans,
                fontSize: 12.5,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="AUTH_LOGIN">Logins</option>
              <option value="AUTH_LOGOUT">Logouts</option>
              <option value="USER_CREATE">Student Created</option>
              <option value="USER_UPDATE">Student Updated</option>
              <option value="USER_DELETE">Student Deactivated</option>
              <option value="COURSE_CREATE">Course Created</option>
              <option value="COURSE_UPDATE">Course Updated</option>
              <option value="COURSE_DELETE">Course Deactivated</option>
              <option value="SUBJECT_CREATE">Subject Created</option>
              <option value="SUBJECT_UPDATE">Subject Updated</option>
              <option value="SUBJECT_DELETE">Subject Deactivated</option>
              <option value="LAB_CREATE">Lab Created</option>
              <option value="LAB_UPDATE">Lab Updated</option>
              <option value="LAB_DELETE">Lab Archived</option>
              <option value="MATERIAL_UPLOAD">Material Uploaded</option>
              <option value="MATERIAL_UPDATE">Material Updated</option>
              <option value="MATERIAL_DELETE">Material Deleted</option>
              <option value="ENROLLMENT_ASSIGN">Course Assigned</option>
              <option value="SUBJECT_ASSIGN">Subject Assigned</option>
            </select>
          </div>
        </div>
      </Panel>

      {/* Audit Log Table / Feed */}
      <Panel style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "12px 18px",
            borderBottom: `1px solid ${C.border}`,
            display: "grid",
            gridTemplateColumns: "180px 140px 110px 1fr 130px 40px",
            gap: 12,
            alignItems: "center",
            fontFamily: mono,
            fontSize: 11,
            fontWeight: 600,
            color: C.low,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <div>Timestamp</div>
          <div>Actor</div>
          <div>Severity</div>
          <div>Action & Description</div>
          <div>Target Entity</div>
          <div style={{ textAlign: "right" }}></div>
        </div>

        {loading && logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.mid, fontFamily: sans, fontSize: 13.5 }}>
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: C.mid, fontFamily: sans }}>
            <ScrollText size={32} color={C.low} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: C.hi }}>No audit events found</div>
            <div style={{ fontSize: 12.5, color: C.low, marginTop: 4 }}>
              Try adjusting your search terms or filters above.
            </div>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <React.Fragment key={log.id}>
                <div
                  onClick={() => toggleExpand(log.id)}
                  style={{
                    padding: "13px 18px",
                    borderBottom: `1px solid ${C.border}`,
                    display: "grid",
                    gridTemplateColumns: "180px 140px 110px 1fr 130px 40px",
                    gap: 12,
                    alignItems: "center",
                    cursor: "pointer",
                    background: isExpanded ? C.panel2 : "transparent",
                    transition: "background 100ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.background = C.panel3;
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Timestamp */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={12} color={C.low} />
                    <span style={{ fontFamily: mono, fontSize: 11.5, color: C.mid }}>
                      {log.timestamp_formatted || log.timestamp}
                    </span>
                  </div>

                  {/* Actor */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: C.panel3,
                        border: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <User size={12} color={C.amber} />
                    </div>
                    <span
                      style={{
                        fontFamily: sans,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: C.hi,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={log.actor_display || log.actor_username}
                    >
                      {log.actor_username || "System"}
                    </span>
                  </div>

                  {/* Severity */}
                  <div>{getSeverityBadge(log.severity)}</div>

                  {/* Description & Action Type */}
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          color: C.cyan,
                          fontWeight: 600,
                        }}
                      >
                        [{log.action_type_display || log.action_type}]
                      </span>
                      <span
                        style={{
                          fontFamily: sans,
                          fontSize: 13,
                          color: C.hi,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.description}
                      </span>
                    </div>
                  </div>

                  {/* Target Entity */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                    {getEntityIcon(log.target_entity)}
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 11.5,
                        color: C.mid,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.target_name || log.target_entity || "—"}
                    </span>
                  </div>

                  {/* Expand Chevron */}
                  <div style={{ textAlign: "right", color: C.low }}>
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "16px 22px",
                      background: C.panel3,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
                      <div>
                        <div style={{ fontFamily: mono, fontSize: 11, color: C.amber, fontWeight: 600, marginBottom: 8 }}>
                          EVENT DETAILS & AUDIT CONTEXT
                        </div>
                        <div style={{ fontFamily: sans, fontSize: 13, color: C.hi, lineHeight: 1.5, marginBottom: 12 }}>
                          {log.description}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginBottom: 4 }}>
                              PAYLOAD DATA
                            </div>
                            <pre
                              style={{
                                background: C.void,
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                padding: "10px 12px",
                                fontFamily: mono,
                                fontSize: 11.5,
                                color: C.cyan,
                                margin: 0,
                                overflowX: "auto",
                              }}
                            >
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          background: C.panel2,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: 14,
                        }}
                      >
                        <div style={{ fontFamily: mono, fontSize: 11, color: C.mid, fontWeight: 600, marginBottom: 10 }}>
                          FORENSIC METADATA
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: sans, fontSize: 12.5 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: C.low }}>Record ID:</span>
                            <span style={{ fontFamily: mono, color: C.hi }}>#{log.id}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: C.low }}>Actor Role:</span>
                            <span style={{ fontFamily: mono, color: C.amber }}>{log.actor_role || "admin"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: C.low }}>Target Entity:</span>
                            <span style={{ fontFamily: mono, color: C.cyan }}>
                              {log.target_entity} (ID: {log.target_id || "N/A"})
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: C.low }}>Origin IP:</span>
                            <span style={{ fontFamily: mono, color: C.hi }}>
                              {log.ip_address || "127.0.0.1"}
                            </span>
                          </div>
                          {log.user_agent && (
                            <div>
                              <span style={{ color: C.low, display: "block", marginBottom: 3 }}>User Agent:</span>
                              <span style={{ fontFamily: mono, fontSize: 11, color: C.mid, wordBreak: "break-all" }}>
                                {log.user_agent}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </Panel>
    </div>
  );
}

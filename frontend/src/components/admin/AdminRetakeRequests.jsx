import React, { useState, useEffect, useCallback } from "react";
import {
  RotateCcw, Search, RefreshCw, CheckCircle2, XCircle, Clock,
  User, FlaskConical, BookOpen, AlertCircle, MessageSquare, Check, X,
  ShieldCheck, FileText, ChevronRight
} from "lucide-react";
import Panel from "../common/Panel";
import Btn from "../common/Btn";
import Badge, { DiffBadge } from "../common/Badge";
import StatCard from "../common/StatCard";
import { C, sans, mono } from "../../constants/theme";
import { fetchAdminRetakeRequests, reviewAdminRetakeRequest } from "../../api/students";

export default function AdminRetakeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionNotes, setActionNotes] = useState({});
  const [resetScores, setResetScores] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const param = statusFilter === "ALL" ? "" : statusFilter;
      const res = await fetchAdminRetakeRequests(param);
      setRequests(res.results || []);
    } catch (err) {
      console.error("Failed to fetch retake requests:", err);
      setErrorMessage("Failed to load retake requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Show a temporary toast message
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleAction = async (requestId, action) => {
    setActionLoadingId(requestId);
    setErrorMessage(null);
    try {
      const note = actionNotes[requestId] || "";
      // Default resetScore to true unless unchecked
      const resetScore = resetScores[requestId] !== false;
      const res = await reviewAdminRetakeRequest(requestId, action, note, resetScore);
      
      triggerToast(
        action === "approve"
          ? (res.message || "Retake request approved! The lab is now unlocked for the student.")
          : "Retake request was rejected."
      );

      // Refresh list
      await loadRequests();
    } catch (err) {
      console.error(`Failed to ${action} retake request:`, err);
      setErrorMessage(err.message || `Failed to ${action} retake request.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Compute stats across all loaded or filtered items
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  // Filter based on search query
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const studentName = (r.student_name || "").toLowerCase();
    const username = (r.student_username || "").toLowerCase();
    const email = (r.student_email || "").toLowerCase();
    const labName = (r.lab_name || "").toLowerCase();
    const subject = (r.subject_name || "").toLowerCase();
    const reason = (r.reason || "").toLowerCase();
    return (
      studentName.includes(q) ||
      username.includes(q) ||
      email.includes(q) ||
      labName.includes(q) ||
      subject.includes(q) ||
      reason.includes(q)
    );
  });

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      style={{
        padding: "24px 28px",
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
        background: C.void,
        fontFamily: sans,
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 28,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            background: "rgba(16, 185, 129, 0.95)",
            color: "#ffffff",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            fontFamily: sans,
            fontSize: 13.5,
            fontWeight: 600,
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "rgba(245, 166, 35, 0.12)",
                border: "1px solid rgba(245, 166, 35, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCcw size={18} color={C.amber} />
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.hi, letterSpacing: "-0.01em" }}>
              Lab Retake Requests
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: C.mid }}>
            Review, approve, or reject student requests to retake completed or locked practical labs.
          </p>
        </div>

        <Btn
          variant="outline"
          icon={RefreshCw}
          onClick={loadRequests}
          disabled={loading}
          small
        >
          Refresh
        </Btn>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <StatCard
          label="Total Requests"
          value={totalCount}
          delta={statusFilter !== "ALL" ? `Filter: ${statusFilter}` : "All Recorded"}
          sub="Platform lab retakes"
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          delta={pendingCount > 0 ? "Requires Attention" : "All cleared"}
          sub="Awaiting admin action"
        />
        <StatCard
          label="Approved"
          value={approvedCount}
          delta="Granted"
          sub="Labs unlocked for retake"
        />
        <StatCard
          label="Rejected"
          value={rejectedCount}
          delta="Denied"
          sub="Requests declined"
        />
      </div>

      {/* Filter and Search Bar */}
      <Panel style={{ padding: "14px 16px", marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "All Requests", count: totalCount },
              { id: "PENDING", label: "Pending", count: pendingCount },
              { id: "APPROVED", label: "Approved", count: approvedCount },
              { id: "REJECTED", label: "Rejected", count: rejectedCount },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 13px",
                    borderRadius: 6,
                    border: active ? `1px solid ${C.amber}` : `1px solid ${C.border}`,
                    background: active ? "rgba(245, 166, 35, 0.12)" : C.panel2,
                    color: active ? C.amber : C.mid,
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 11,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background: active ? "rgba(245, 166, 35, 0.25)" : C.panel3,
                      color: active ? C.amber : C.low,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.panel2,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 6,
              padding: "6px 12px",
              minWidth: 260,
            }}
          >
            <Search size={14} color={C.mid} />
            <input
              type="text"
              placeholder="Search student, lab, or reason..."
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
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.low,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* Error alert */}
      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "rgba(229, 83, 75, 0.1)",
            border: "1px solid rgba(229, 83, 75, 0.3)",
            borderRadius: 8,
            color: C.danger,
            fontSize: 13.5,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div
          style={{
            padding: "60px 0",
            textAlign: "center",
            color: C.mid,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <RefreshCw size={26} className="spin" color={C.amber} />
          <div style={{ fontSize: 14 }}>Loading retake requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Panel style={{ padding: "50px 20px", textAlign: "center" }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "rgba(155, 163, 176, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <RotateCcw size={24} color={C.mid} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.hi, marginBottom: 6 }}>
            No retake requests found
          </div>
          <div style={{ fontSize: 13.5, color: C.mid, maxWidth: 440, margin: "0 auto" }}>
            {searchQuery
              ? `No requests match "${searchQuery}". Try adjusting your search term.`
              : statusFilter !== "ALL"
              ? `There are currently no requests with status '${statusFilter}'.`
              : "No students have requested lab retakes yet."}
          </div>
        </Panel>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredRequests.map((req) => {
            const isPending = req.status === "PENDING";
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";
            const isProcessing = actionLoadingId === req.id;

            return (
              <Panel
                key={req.id}
                style={{
                  padding: "18px 20px",
                  borderLeft: isPending
                    ? `3px solid ${C.amber}`
                    : isApproved
                    ? "3px solid #10b981"
                    : "3px solid #ef4444",
                  background: C.panel,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 14,
                  }}
                >
                  {/* Left Section: Student & Lab Info */}
                  <div style={{ flex: "1 1 450px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      {/* Status Badge */}
                      {isPending && (
                        <Badge tone="amber">
                          <Clock size={11} /> PENDING REVIEW
                        </Badge>
                      )}
                      {isApproved && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 9px",
                            borderRadius: 5,
                            fontSize: 11,
                            fontFamily: mono,
                            fontWeight: 600,
                            background: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                          }}
                        >
                          <CheckCircle2 size={12} /> APPROVED
                        </span>
                      )}
                      {isRejected && (
                        <Badge tone="danger">
                          <XCircle size={11} /> REJECTED
                        </Badge>
                      )}

                      <span style={{ fontSize: 12, color: C.low, fontFamily: mono }}>
                        Req ID #{req.id}
                      </span>
                      <span style={{ fontSize: 12, color: C.low }}>•</span>
                      <span style={{ fontSize: 12, color: C.mid, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} color={C.low} />
                        {formatDate(req.created_at)}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: C.panel3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: C.amber,
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {(req.student_name || req.student_username || "S").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontSize: 14.5, fontWeight: 600, color: C.hi }}>
                          {req.student_name}
                        </span>
                        <span style={{ fontSize: 13, color: C.low, marginLeft: 6, fontFamily: mono }}>
                          (@{req.student_username})
                        </span>
                        {req.student_email && (
                          <span style={{ fontSize: 12, color: C.mid, marginLeft: 8 }}>
                            {req.student_email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lab Info */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: C.panel2,
                        padding: "8px 12px",
                        borderRadius: 6,
                        marginBottom: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FlaskConical size={14} color={C.cyan} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.hi }}>
                          {req.lab_name}
                        </span>
                      </div>
                      {req.subject_name && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.mid }}>
                          <BookOpen size={13} color={C.low} />
                          <span>{req.subject_name}</span>
                        </div>
                      )}
                      {req.lab_difficulty && <DiffBadge level={req.lab_difficulty} />}
                    </div>

                    {/* Student Reason */}
                    {req.reason ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          background: "rgba(255, 255, 255, 0.02)",
                          borderLeft: `2px solid ${C.borderLight}`,
                          padding: "8px 12px",
                          borderRadius: 4,
                          fontSize: 13,
                          color: C.hi,
                        }}
                      >
                        <MessageSquare size={14} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <span style={{ fontSize: 11, color: C.low, display: "block", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
                            Student's Reason:
                          </span>
                          <span>"{req.reason}"</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12.5, color: C.low, fontStyle: "italic" }}>
                        No specific reason provided by student.
                      </div>
                    )}

                    {/* Review Info (if already reviewed) */}
                    {(isApproved || isRejected) && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: isApproved ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                          border: isApproved
                            ? "1px solid rgba(16, 185, 129, 0.15)"
                            : "1px solid rgba(239, 68, 68, 0.15)",
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ color: isApproved ? "#34d399" : "#f87171", fontWeight: 600, marginBottom: 2 }}>
                          {isApproved ? "Approved" : "Rejected"} by @{req.reviewed_by_username || "Admin"} on {formatDate(req.reviewed_at)}
                        </div>
                        {req.admin_response_note && (
                          <div style={{ color: C.mid, marginTop: 3 }}>
                            <span style={{ color: C.low }}>Admin note: </span>
                            {req.admin_response_note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Section: Admin Actions (Only for PENDING) */}
                  {isPending && (
                    <div
                      style={{
                        flex: "0 0 320px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        background: C.panel2,
                        padding: "14px",
                        borderRadius: 8,
                        border: `1px solid ${C.borderLight}`,
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.hi, display: "flex", alignItems: "center", gap: 6 }}>
                        <ShieldCheck size={14} color={C.amber} />
                        <span>Take Action</span>
                      </div>

                      {/* Optional Note Input */}
                      <div>
                        <input
                          type="text"
                          placeholder="Optional note / feedback to student..."
                          value={actionNotes[req.id] || ""}
                          onChange={(e) =>
                            setActionNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          style={{
                            width: "100%",
                            padding: "7px 10px",
                            borderRadius: 6,
                            background: C.panel3,
                            border: `1px solid ${C.border}`,
                            color: C.hi,
                            fontFamily: sans,
                            fontSize: 12.5,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {/* Reset Score Option */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          color: C.mid,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={resetScores[req.id] !== false}
                          onChange={(e) =>
                            setResetScores((prev) => ({ ...prev, [req.id]: e.target.checked }))
                          }
                          style={{ accentColor: C.amber }}
                        />
                        <span>Reset previous lab score & answers to 0</span>
                      </label>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <Btn
                          variant="primary"
                          icon={Check}
                          small
                          disabled={isProcessing}
                          onClick={() => handleAction(req.id, "approve")}
                          style={{
                            flex: 1,
                            background: "#10b981",
                            borderColor: "#10b981",
                            color: "#ffffff",
                          }}
                        >
                          {isProcessing ? "Processing..." : "Approve"}
                        </Btn>

                        <Btn
                          variant="outline"
                          icon={X}
                          small
                          disabled={isProcessing}
                          onClick={() => handleAction(req.id, "reject")}
                          style={{
                            flex: 1,
                            borderColor: "rgba(239, 68, 68, 0.4)",
                            color: "#ef4444",
                          }}
                        >
                          Reject
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

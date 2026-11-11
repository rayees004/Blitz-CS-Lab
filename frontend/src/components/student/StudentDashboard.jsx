import React, { useState, useEffect, useCallback } from "react";
import { Lock } from "lucide-react";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";
import { fetchStudentLabs } from "../../api/labs";
import StudentLabAttendModal from "./StudentLabAttendModal";
import LabSubmittedModal from "./LabSubmittedModal";
import SmartDashboardContent from "../smart/SmartDashboardContent";

export default function StudentDashboard({ onNavigate }) {
  const [labs, setLabs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedLabNotice, setLockedLabNotice] = useState(null);

  // Lab modal state for attending and submitting marks
  const [attendingLab, setAttendingLab] = useState(null);
  // Result of a lab auto-submitted by its last correct answer ("submitted successfully" popup)
  const [submittedLab, setSubmittedLab] = useState(null);

  const [inProgressTotal, setInProgressTotal] = useState(0);

  // Only in-progress labs (most recent first, first page); stats always cover all labs
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentLabs({ status: "IN_PROGRESS", page: 1 });
      setLabs(res.labs || []);
      setStats(res.stats || {});
      setInProgressTotal(res.pagination?.count ?? (res.labs || []).length);
    } catch (err) {
      console.error("Failed to load student dashboard labs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dashboard shows only in-progress labs (most recently active first, sorted by the server), capped at 10
  const MAX_DASHBOARD_LABS = 10;
  const dashboardLabs = labs.slice(0, MAX_DASHBOARD_LABS);

  return (
    <div style={{ padding: "4px 28px 32px", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      <SmartDashboardContent
        stats={stats}
        labs={dashboardLabs}
        loading={loading}
        inProgressTotal={inProgressTotal}
        maxLabs={MAX_DASHBOARD_LABS}
        onSync={loadData}
        onNavigate={onNavigate}
        onAttend={setAttendingLab}
        onLocked={setLockedLabNotice}
      />

      {/* Locked Lab Notice Modal */}
      {lockedLabNotice && (
        <>
          <div
            onClick={() => setLockedLabNotice(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(4px)",
              zIndex: 1200,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 440,
              maxWidth: "92vw",
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 24,
              zIndex: 1201,
              boxShadow: "0 24px 70px rgba(0,0,0,0.7)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "rgba(229, 83, 75, 0.12)",
                  border: "1px solid rgba(229, 83, 75, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Lock size={20} color={C.danger} />
              </div>
              <div>
                <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: C.hi }}>
                  Lab Access Locked
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: C.low }}>
                  {lockedLabNotice.name}
                </div>
              </div>
            </div>

            <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.55, margin: "0 0 16px" }}>
              {lockedLabNotice.lock_reason || `You must be assigned to subject '${lockedLabNotice.subject_name}' to access and attend this practical lab session.`}
            </p>

            <div
              style={{
                background: C.panel2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: sans, fontSize: 12, color: C.low }}>Required Subject:</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: C.amber, fontWeight: 600 }}>
                {lockedLabNotice.subject_name || "Assigned Subject"} {lockedLabNotice.subject_code ? `(${lockedLabNotice.subject_code})` : ""}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setLockedLabNotice(null)} style={{ padding: "8px 20px" }}>
                Understood
              </Btn>
            </div>
          </div>
        </>
      )}

      {/* Interactive Lab Attendee & Mark Submitting Modal */}
      {attendingLab && (
        <StudentLabAttendModal
          lab={attendingLab}
          onClose={() => setAttendingLab(null)}
          onUpdated={loadData}
          onSubmitted={(result) => {
            setAttendingLab(null);
            setSubmittedLab(result);
          }}
        />
      )}

      {submittedLab && (
        <LabSubmittedModal result={submittedLab} onClose={() => setSubmittedLab(null)} />
      )}
    </div>
  );
}

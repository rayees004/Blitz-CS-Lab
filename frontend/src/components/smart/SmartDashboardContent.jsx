import React from "react";
import {
  RefreshCw, FlaskConical, CheckCircle2, Activity, Star, HelpCircle, CalendarDays,
  ArrowRight, BarChart3, ShieldAlert, Clock, Play, Lock, RotateCcw,
} from "lucide-react";
import ProgressBar from "../common/ProgressBar";
import { DiffBadge } from "../common/Badge";
import { useTimeLeft, formatTimeLeft } from "../../utils/labTime";
import "./smart.css";

// Colour per stat card: main tint, deep tint for the icon circle
const TINTS = {
  blue: ["#3b82f6", "#1e40af", "59, 130, 246"],
  green: ["#22c55e", "#15803d", "34, 197, 94"],
  purple: ["#a855f7", "#6b21a8", "168, 85, 247"],
  amber: ["#f5a623", "#a16207", "245, 166, 35"],
  violet: ["#7c3aed", "#4c1d95", "124, 58, 237"],
  teal: ["#14b8a6", "#0f766e", "20, 184, 166"],
};

const WAVES = [
  "M0 52 C40 52 60 30 100 36 C140 42 160 14 200 8",
  "M0 50 C30 50 50 40 80 42 C120 46 140 20 170 22 C185 23 192 30 200 32",
  "M0 54 C40 54 70 46 100 30 C130 14 160 40 200 26",
];

function tintStyle(name) {
  const [tint, deep, rgb] = TINTS[name];
  return {
    "--tint": tint,
    "--tint-deep": deep,
    "--tint-bg": `rgba(${rgb}, 0.13)`,
    "--tint-border": `rgba(${rgb}, 0.3)`,
  };
}

function StatTile({ tint, icon: Icon, label, value, unit, sub, wave, onClick }) {
  const gradId = `smart-wave-${tint}`;
  const color = TINTS[tint][0];
  return (
    <button type="button" className="smart-stat" style={tintStyle(tint)} onClick={onClick} title={`${label}: open details`}>
      <span className="smart-stat-icon">
        <Icon size={28} color="#fff" strokeWidth={2.2} fill={tint === "amber" ? "#fff" : "none"} />
      </span>
      <span className="smart-stat-text" style={{ minWidth: 0 }}>
        <span className="smart-stat-label" style={{ display: "block" }}>{label}</span>
        <span className="smart-stat-value" style={{ display: "block" }}>
          {value}
          {unit && <small> {unit}</small>}
        </span>
        <span className="smart-stat-sub" style={{ display: "block" }}>{sub}</span>
      </span>
      <span className="smart-stat-arrow" aria-hidden="true">
        <ArrowRight size={17} strokeWidth={2.4} />
      </span>
      <svg className="smart-stat-wave" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${WAVES[wave]} L200 64 L0 64 Z`} fill={`url(#${gradId})`} />
        <path d={WAVES[wave]} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </button>
  );
}

function ShieldArt() {
  return (
    <svg className="smart-hero-art" width="150" height="150" viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <radialGradient id="smart-shield-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5a623" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="smart-shield-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd27a" />
          <stop offset="100%" stopColor="#c27400" />
        </linearGradient>
        <linearGradient id="smart-shield-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b303b" />
          <stop offset="100%" stopColor="#0f1218" />
        </linearGradient>
        <linearGradient id="smart-shield-lock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd27a" />
          <stop offset="100%" stopColor="#f5a623" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="78" r="78" fill="url(#smart-shield-glow)" />
      <ellipse cx="80" cy="146" rx="50" ry="7" fill="#f5a623" opacity="0.28" />
      <path d="M80 16 L126 33 V74 C126 106 105 128 80 139 C55 128 34 106 34 74 V33 Z" fill="url(#smart-shield-edge)" />
      <path d="M80 26 L117 40 V74 C117 100 99 119 80 129 C61 119 43 100 43 74 V40 Z" fill="url(#smart-shield-face)" />
      <path d="M68 73 V64 a12 12 0 0 1 24 0 V73" fill="none" stroke="url(#smart-shield-lock)" strokeWidth="5.5" strokeLinecap="round" />
      <rect x="60" y="71" width="40" height="32" rx="7" fill="url(#smart-shield-lock)" />
      <circle cx="80" cy="84" r="4.4" fill="#3a2600" />
      <rect x="78" y="85" width="4" height="10" rx="2" fill="#3a2600" />
    </svg>
  );
}

function EmptyLabsArt() {
  return (
    <svg width="170" height="84" viewBox="0 0 170 84" aria-hidden="true">
      <ellipse cx="85" cy="44" rx="78" ry="24" fill="none" stroke="#3a4250" strokeWidth="1.2" />
      <circle cx="22" cy="28" r="3" fill="#f5a623" />
      <circle cx="152" cy="34" r="2.5" fill="#f5a623" />
      <circle cx="132" cy="64" r="2.5" fill="#3b82f6" />
      <g transform="translate(64 6)" fill="none" stroke="#9ba3b0" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M14 2 H28 M17 2 V24 L4 52 C2 57 5 62 11 62 H31 C37 62 40 57 38 52 L25 24 V2" fill="#232a35" />
        <path d="M9 44 H33" stroke="#5c6572" />
      </g>
    </svg>
  );
}

function TimeLeft({ deadline }) {
  const ms = useTimeLeft(deadline);
  if (ms === null) return <span />;
  const urgent = ms < 2 * 3600 * 1000;
  return (
    <span className={`smart-time${urgent ? " is-urgent" : ""}`}>
      <Clock size={13} />
      {formatTimeLeft(ms)}
    </span>
  );
}

function SmartLabCard({ lab, onAttend, onLocked }) {
  const pct = lab.progress_pct || 0;
  return (
    <article className="smart-lab">
      <div className="smart-lab-meta">
        <DiffBadge level={lab.difficulty} />
        {lab.subject_name && <span className="smart-chip">{lab.subject_code || lab.subject_name}</span>}
      </div>
      <h3>{lab.name}</h3>
      <div className="smart-lab-progress">
        <span>{lab.solved_questions_count || 0} of {lab.question_count || 0} questions solved</span>
        <b>{pct}%</b>
      </div>
      <ProgressBar value={pct} tone="amber" h={6} />
      <div className="smart-lab-foot">
        <TimeLeft deadline={lab.attempt_deadline} />
        {lab.is_locked ? (
          <button type="button" className="smart-btn-outline is-danger" onClick={() => onLocked(lab)}>
            <Lock size={14} /> Locked
          </button>
        ) : (
          <button type="button" className="smart-btn-primary is-small" onClick={() => onAttend(lab)}>
            <Play size={14} fill="#1a1200" /> Continue
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * Smart UI version of the student dashboard. Data, loading and pop-ups stay in StudentDashboard;
 * this only renders the new layout.
 */
export default function SmartDashboardContent({
  stats,
  labs,
  loading,
  inProgressTotal,
  maxLabs,
  onSync,
  onNavigate,
  onAttend,
  onLocked,
}) {
  const go = (page) => onNavigate && onNavigate(page);
  const name = stats?.student_name || "Student";

  return (
    <div className="smart-dash smart-ui">
      <section className="smart-hero">
        <div>
          <h1>
            Welcome back, <span className="smart-accent">{name}</span> <span aria-hidden="true">👋</span>
          </h1>
          <p>Cybersecurity hands-on labs evaluation &amp; lab-based marks record.</p>
        </div>
        <ShieldArt />
        <button type="button" className="smart-btn-primary" onClick={onSync} disabled={loading}>
          <RefreshCw size={16} strokeWidth={2.4} className={loading ? "smart-spin" : undefined} />
          {loading ? "Syncing..." : "Sync Live Labs & Scores"}
        </button>
      </section>

      {stats?.is_lab_access_blocked && (
        <div className="smart-notice" role="alert">
          <ShieldAlert size={20} color="#f87171" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong>Lab access blocked by administrator.</strong>{" "}
            {stats.lab_access_block_reason
              ? `Reason: "${stats.lab_access_block_reason}".`
              : "Please contact your instructor or platform administrator."}
          </div>
        </div>
      )}

      {stats?.labs_expired > 0 && (
        <div className="smart-notice">
          <Clock size={20} color="#f87171" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong>
              {stats.labs_expired} lab{stats.labs_expired !== 1 ? "s" : ""} timed out.
            </strong>{" "}
            {stats.labs_expired !== 1 ? "They were" : "It was"} not finished within {stats.attempt_window_hours || 24} hours of starting. Send a retake request from the Labs page.
          </div>
          <button type="button" className="smart-btn-outline" onClick={() => go("labs")}>
            <RotateCcw size={14} /> Go to Labs
          </button>
        </div>
      )}

      <div className="smart-stats">
        <StatTile tint="blue" icon={FlaskConical} label="Assigned Labs" value={stats?.labs_assigned ?? 0}
          sub="labs you can attend" wave={0} onClick={() => go("labs")} />
        <StatTile tint="green" icon={CheckCircle2} label="Completed Labs" value={stats?.labs_completed ?? 0}
          sub="finished & recorded" wave={1} onClick={() => go("progress")} />
        <StatTile tint="purple" icon={Activity} label="In Progress Labs" value={stats?.labs_in_progress ?? 0}
          sub="started, not finished" wave={2} onClick={() => go("labs")} />
        <StatTile tint="amber" icon={Star} label="Total Points Earned" value={stats?.total_points_earned ?? 0} unit="pts"
          sub="across all labs" wave={1} onClick={() => go("progress")} />
        <StatTile tint="violet" icon={HelpCircle} label="Questions Completed" value={stats?.total_questions_completed ?? 0}
          sub="correct flags submitted" wave={0} onClick={() => go("progress")} />
        <StatTile tint="teal" icon={CalendarDays} label="Attendance Logged" value={stats?.total_attendances ?? 0}
          sub="total lab visits" wave={2} onClick={() => go("attendance")} />
      </div>

      <section className="smart-panel" aria-labelledby="smart-in-progress-title">
        <div className="smart-panel-head">
          <div className="smart-panel-title">
            <BarChart3 size={30} color="#f5a623" strokeWidth={2.4} />
            <div>
              <h2 id="smart-in-progress-title">In Progress Labs</h2>
              <p>
                {inProgressTotal > maxLabs
                  ? `Showing your ${maxLabs} most recent of ${inProgressTotal} labs in progress.`
                  : "Labs you have started but not finished yet."}
              </p>
            </div>
          </div>
          <button type="button" className="smart-btn-outline" onClick={() => go("labs")}>
            <FlaskConical size={16} color="#f5a623" /> View all labs <ArrowRight size={15} />
          </button>
        </div>

        {loading && labs.length === 0 ? (
          <div className="smart-empty">
            <RefreshCw size={26} color="#3fd8c8" className="smart-spin" />
            <div className="smart-empty-sub" style={{ margin: "12px 0 0" }}>Loading your labs...</div>
          </div>
        ) : labs.length === 0 ? (
          <div className="smart-empty">
            <EmptyLabsArt />
            <div className="smart-empty-title">No labs in progress.</div>
            <div className="smart-empty-sub">Start a lab to begin your learning journey!</div>
            <button type="button" className="smart-btn-primary is-pill" onClick={() => go("labs")}>
              Browse Labs <ArrowRight size={15} strokeWidth={2.4} />
            </button>
          </div>
        ) : (
          <div className="smart-labs">
            {labs.map((lab) => (
              <SmartLabCard key={lab.id} lab={lab} onAttend={onAttend} onLocked={onLocked} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

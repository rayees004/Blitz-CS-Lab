import React, { useState } from "react";
import {
  Search, Bell, ChevronRight, ChevronDown, Zap, Shield, Terminal as TerminalIcon,
  LayoutGrid, GraduationCap, FlaskConical, BookOpen, Trophy, TrendingUp, Award,
  FileBadge, User, HelpCircle, Settings, LogOut, Users, Layers, ClipboardList,
  Wallet, Activity, BarChart3, ScrollText, Flag, Clock, Target, CheckCircle2,
  Lock, ArrowRight, Play, Download, FileText, Plus, Filter, MoreHorizontal,
  AlertTriangle, Wifi, Globe, X
} from "lucide-react";

/* ============================================================
   BLITZ CYBER LAB — design tokens
   bg-void:      #0A0D12   deep charcoal-navy, not pure black
   bg-panel:     #12161D   card / panel surface
   bg-panel-2:   #171C25   raised surface (hover, inputs)
   border:       #232A35   hairline borders
   text-hi:      #EDEFF2   primary text
   text-mid:     #9BA3B0   secondary text
   text-low:     #5C6572   tertiary / placeholder
   accent (blitz amber): #F5A623   -- energy / primary actions / "blitz"
   accent-2 (signal cyan): #3FD8C8 -- status / success / active states
   danger:       #E5534B
   warn:         #F0B429
   Type: "IBM Plex Sans" (UI text) + "IBM Plex Mono" (data, code, terminal, labels)
   ============================================================ */

const FONT_LINK_ID = "blitz-fonts";
if (typeof document !== "undefined" && !document.getElementById(FONT_LINK_ID)) {
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}

const C = {
  void: "#0A0D12",
  panel: "#12161D",
  panel2: "#171C25",
  panel3: "#1B212B",
  border: "#232A35",
  borderLight: "#2C3444",
  hi: "#EDEFF2",
  mid: "#9BA3B0",
  low: "#5C6572",
  amber: "#F5A623",
  amberDim: "#B87A15",
  cyan: "#3FD8C8",
  danger: "#E5534B",
  warn: "#F0B429",
};

const sans = "'IBM Plex Sans', system-ui, sans-serif";
const mono = "'IBM Plex Mono', 'SF Mono', monospace";

/* ---------------- shared bits ---------------- */

function Badge({ children, tone = "default" }) {
  const tones = {
    default: { bg: "rgba(155,163,176,0.10)", fg: C.mid, bd: C.border },
    amber: { bg: "rgba(245,166,35,0.12)", fg: C.amber, bd: "rgba(245,166,35,0.35)" },
    cyan: { bg: "rgba(63,216,200,0.12)", fg: C.cyan, bd: "rgba(63,216,200,0.35)" },
    danger: { bg: "rgba(229,83,75,0.12)", fg: C.danger, bd: "rgba(229,83,75,0.35)" },
    warn: { bg: "rgba(240,180,41,0.12)", fg: C.warn, bd: "rgba(240,180,41,0.35)" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 5,
        fontSize: 11,
        fontFamily: mono,
        fontWeight: 500,
        letterSpacing: "0.02em",
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function DiffBadge({ level }) {
  const map = {
    Beginner: "cyan",
    Intermediate: "amber",
    Advanced: "danger",
  };
  return <Badge tone={map[level] || "default"}>{level}</Badge>;
}

function Btn({ children, variant = "primary", onClick, style, icon: Icon, small }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontFamily: sans,
    fontWeight: 600,
    fontSize: small ? 12.5 : 13.5,
    padding: small ? "6px 12px" : "9px 16px",
    borderRadius: 7,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "background 120ms ease, border-color 120ms ease, transform 80ms ease",
  };
  const variants = {
    primary: { background: C.amber, color: "#1A1200", border: `1px solid ${C.amber}` },
    outline: { background: "transparent", color: C.hi, border: `1px solid ${C.borderLight}` },
    ghost: { background: "transparent", color: C.mid, border: "1px solid transparent" },
    subtle: { background: C.panel3, color: C.hi, border: `1px solid ${C.border}` },
  };
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {Icon && <Icon size={small ? 13 : 15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

function ProgressBar({ value, tone = "amber", h = 6 }) {
  const color = tone === "amber" ? C.amber : tone === "cyan" ? C.cyan : C.mid;
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: C.panel3, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", borderRadius: h, background: color }} />
    </div>
  );
}

function Panel({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------- mock data ---------------- */

const LABS = [
  { id: "03", name: "SQL Injection", org: "ShopX", cat: "Web Security", diff: "Intermediate", pts: 200, pct: 65, desc: "Identify and exploit a SQL injection vulnerability inside the fictional ShopX storefront application." },
  { id: "07", name: "Broken Access Control", org: "Acme Employee Portal", cat: "Authentication", diff: "Beginner", pts: 100, pct: 100, desc: "Escalate a standard employee account to an administrative role inside Acme's internal HR portal." },
  { id: "11", name: "Insecure Deserialization", org: "CloudBox", cat: "Cloud Security", diff: "Advanced", pts: 350, pct: 0, desc: "Exploit unsafe object deserialization in CloudBox's file-sync API to achieve remote code execution." },
  { id: "14", name: "Stored XSS", org: "SocialSpace", cat: "Web Security", diff: "Beginner", pts: 120, pct: 0, desc: "Plant a persistent cross-site scripting payload inside a SocialSpace user profile." },
  { id: "18", name: "JWT Forgery", org: "FinSecure", cat: "Authentication", diff: "Advanced", pts: 300, pct: 20, desc: "Forge a signed session token to bypass FinSecure's two-factor login gate." },
  { id: "21", name: "IDOR in Patient Records", org: "Medix", cat: "API Security", diff: "Intermediate", pts: 220, pct: 0, desc: "Enumerate patient record IDs to access data belonging to other Medix users." },
  { id: "24", name: "Subdomain Takeover", org: "TravelGo", cat: "OSINT", diff: "Intermediate", pts: 180, pct: 0, desc: "Trace an abandoned DNS record to claim a dangling TravelGo subdomain." },
  { id: "27", name: "Race Condition Checkout", org: "PayFlow", cat: "API Security", diff: "Advanced", pts: 320, pct: 0, desc: "Abuse a payment race condition in PayFlow's checkout API to duplicate a balance credit." },
  { id: "29", name: "Weak Password Reset", org: "EduCore", cat: "Authentication", diff: "Beginner", pts: 90, pct: 0, desc: "Exploit a predictable reset-token scheme in EduCore's student login flow." },
  { id: "32", name: "SSRF via Webhook", org: "DevHub", cat: "Cloud Security", diff: "Advanced", pts: 340, pct: 0, desc: "Pivot an internal metadata request through DevHub's outbound webhook integration." },
  { id: "35", name: "Weak Crypto Storage", org: "PayFlow", cat: "Cryptography", diff: "Intermediate", pts: 210, pct: 0, desc: "Recover plaintext card metadata from a poorly-salted hashing scheme in PayFlow's vault service." },
  { id: "40", name: "GraphQL Introspection Leak", org: "DevHub", cat: "API Security", diff: "Beginner", pts: 110, pct: 0, desc: "Use exposed GraphQL introspection to map hidden mutations in DevHub's internal API." },
];

const CATEGORIES = [
  { name: "Web Security", labs: 9, pct: 44, diff: "Mixed" },
  { name: "Bug Bounty", labs: 6, pct: 10, diff: "Mixed" },
  { name: "API Security", labs: 7, pct: 20, diff: "Intermediate" },
  { name: "Authentication", labs: 6, pct: 55, diff: "Mixed" },
  { name: "Network Security", labs: 5, pct: 0, diff: "Advanced" },
  { name: "OSINT", labs: 4, pct: 25, diff: "Beginner" },
  { name: "Cryptography", labs: 5, pct: 0, diff: "Intermediate" },
  { name: "Cloud Security", labs: 5, pct: 0, diff: "Advanced" },
  { name: "Advanced Web Security", labs: 3, pct: 0, diff: "Advanced" },
];

const CLASSES = [
  { name: "Bug Bounty Batch 01", students: 32, labs: 25, materials: 18, pct: 42, fee: "PAID" },
  { name: "Web Security — Evening", students: 24, labs: 18, materials: 12, pct: 61, fee: "DUE" },
  { name: "API Security Intensive", students: 15, labs: 14, materials: 9, pct: 30, fee: "PARTIAL" },
  { name: "OSINT Fundamentals", students: 28, labs: 10, materials: 7, pct: 78, fee: "PAID" },
];

const NAV_STUDENT = [
  { label: "Dashboard", icon: LayoutGrid, key: "dashboard" },
  { label: "Learning", icon: GraduationCap, key: "learning" },
  { label: "Labs", icon: FlaskConical, key: "labs" },
  { label: "Study Materials", icon: BookOpen, key: "materials" },
  { label: "Challenges", icon: Target, key: "challenges" },
  { label: "Progress", icon: TrendingUp, key: "progress" },
  { label: "Leaderboard", icon: Trophy, key: "leaderboard" },
  { label: "Achievements", icon: Award, key: "achievements" },
  { label: "Certificates", icon: FileBadge, key: "certificates" },
  { label: "Profile", icon: User, key: "profile" },
];

const NAV_ADMIN = [
  { label: "Dashboard", icon: LayoutGrid, key: "a-dashboard" },
  { label: "Students", icon: Users, key: "a-students" },
  { label: "Classes", icon: Layers, key: "a-classes" },
  { label: "Labs", icon: FlaskConical, key: "a-labs" },
  { label: "Study Materials", icon: BookOpen, key: "a-materials" },
  { label: "Assignments", icon: ClipboardList, key: "a-assignments" },
  { label: "Fees", icon: Wallet, key: "a-fees" },
  { label: "Activity", icon: Activity, key: "a-activity" },
  { label: "Analytics", icon: BarChart3, key: "a-analytics" },
  { label: "Audit Logs", icon: ScrollText, key: "a-audit" },
  { label: "Settings", icon: Settings, key: "a-settings" },
];

/* ---------------- logo ---------------- */

function Logo({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path d="M4 16C4 9.373 9.373 4 16 4s12 5.373 12 12-5.373 12-12 12S4 22.627 4 16Z" stroke={C.borderLight} strokeWidth="1.4" />
        <path d="M17.6 7.5 9.8 17.4h5.1l-1.1 7.1 8-10.3h-5.2l1-6.7Z" fill={C.amber} />
      </svg>
      <span style={{ fontFamily: mono, fontWeight: 600, fontSize: size * 0.62, color: C.hi, letterSpacing: "-0.01em" }}>
        BLITZ<span style={{ color: C.amber }}>/</span>CYBER LAB
      </span>
    </div>
  );
}

/* ---------------- shell (sidebar + topbar) ---------------- */

function Sidebar({ items, active, onSelect, footerExtra, onSwitch, switchLabel }) {
  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: C.panel,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ padding: "20px 18px 16px" }}>
        <Logo />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px" }}>
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <div
              key={it.key}
              onClick={() => onSelect(it.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 7,
                marginBottom: 2,
                cursor: "pointer",
                fontFamily: sans,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? C.hi : C.mid,
                background: isActive ? C.panel3 : "transparent",
                borderLeft: isActive ? `2px solid ${C.amber}` : "2px solid transparent",
              }}
            >
              <it.icon size={16} strokeWidth={2} color={isActive ? C.amber : C.low} />
              {it.label}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "10px", borderTop: `1px solid ${C.border}` }}>
        {onSwitch && (
          <div
            onClick={onSwitch}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              borderRadius: 7, cursor: "pointer", fontFamily: sans, fontSize: 13, color: C.cyan, marginBottom: 2,
            }}
          >
            <Shield size={16} strokeWidth={2} color={C.cyan} />
            {switchLabel}
          </div>
        )}
        {[
          { label: "Help", icon: HelpCircle },
          { label: "Settings", icon: Settings },
          { label: "Logout", icon: LogOut },
        ].map((it) => (
          <div
            key={it.label}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              borderRadius: 7, cursor: "pointer", fontFamily: sans, fontSize: 13, color: C.mid,
            }}
          >
            <it.icon size={16} strokeWidth={2} color={C.low} />
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Topbar({ placeholder, name, role }) {
  return (
    <div
      style={{
        height: 58,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, background: C.panel2,
          border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 12px", width: 340,
        }}
      >
        <Search size={14} color={C.low} />
        <span style={{ fontFamily: mono, fontSize: 12.5, color: C.low }}>{placeholder}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Bell size={17} color={C.mid} strokeWidth={2} style={{ cursor: "pointer" }} />
        <div style={{ width: 1, height: 22, background: C.border }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 7, background: C.panel3,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: mono, fontSize: 12, fontWeight: 600, color: C.amber, border: `1px solid ${C.border}`,
            }}
          >
            {name[0]}
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>{name}</div>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- LOGIN ---------------- */

function Login({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: C.void, display: "flex" }}>
      <div
        style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 64px", position: "relative", overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
                <path d="M 34 0 L 0 0 0 34" fill="none" stroke={C.border} strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div style={{ position: "relative", maxWidth: 440 }}>
          <Logo size={26} />
          <h1
            style={{
              fontFamily: sans, fontWeight: 700, fontSize: 38, lineHeight: 1.15,
              color: C.hi, margin: "28px 0 14px", letterSpacing: "-0.02em",
            }}
          >
            Learn. Hack. Build.<br />Secure.
          </h1>
          <p style={{ fontFamily: sans, fontSize: 15, color: C.mid, lineHeight: 1.6, maxWidth: 380 }}>
            Hands-on cybersecurity training in isolated lab environments — built for
            students, trainers, and teams who learn by breaking things safely.
          </p>
          <div style={{ display: "flex", gap: 26, marginTop: 34 }}>
            {[["50", "Practical labs"], ["9", "Security domains"], ["1:1", "Isolated targets"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 600, color: C.amber }}>{n}</div>
                <div style={{ fontFamily: sans, fontSize: 12, color: C.low, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          width: 440, flexShrink: 0, background: C.panel, borderLeft: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px",
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 11, color: C.low, letterSpacing: "0.05em", marginBottom: 8 }}>
          STUDENT LOGIN
        </div>
        <h2 style={{ fontFamily: sans, fontSize: 20, fontWeight: 700, color: C.hi, margin: "0 0 26px" }}>
          Sign in to your account
        </h2>

        {["Email address", "Password"].map((label, i) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginBottom: 6 }}>{label}</div>
            <div
              style={{
                border: `1px solid ${C.border}`, borderRadius: 7, background: C.panel2,
                padding: "10px 12px", fontFamily: mono, fontSize: 13, color: C.low,
              }}
            >
              {i === 0 ? "rohith@blitzcyberlab.io" : "••••••••••••"}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
          <span style={{ fontFamily: sans, fontSize: 12, color: C.cyan, cursor: "pointer" }}>Forgot password?</span>
        </div>

        <Btn onClick={() => onLogin("student")} style={{ width: "100%", padding: "11px 0" }} icon={ArrowRight}>
          Sign in
        </Btn>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>OR</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <Btn onClick={() => onLogin("admin")} variant="outline" style={{ width: "100%", padding: "10px 0" }} icon={Shield}>
          Sign in to Admin console
        </Btn>

        <p style={{ fontFamily: sans, fontSize: 11.5, color: C.low, marginTop: 28, lineHeight: 1.6 }}>
          By signing in you agree to use Blitz Cyber Lab's isolated lab environments only for
          authorized training activity.
        </p>
      </div>
    </div>
  );
}

/* ---------------- STUDENT: dashboard ---------------- */

function StatCard({ label, value, sub, icon: Icon, tone }) {
  return (
    <Panel style={{ padding: 18, flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.mid }}>{label}</div>
          <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 600, color: C.hi, marginTop: 6 }}>{value}</div>
          {sub && <div style={{ fontFamily: sans, fontSize: 11.5, color: tone === "cyan" ? C.cyan : C.low, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: C.panel3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={C.amber} strokeWidth={2} />
        </div>
      </div>
    </Panel>
  );
}

function StudentDashboard({ go }) {
  return (
    <div style={{ padding: 28, overflowY: "auto" }}>
      <h1 style={{ fontFamily: sans, fontSize: 24, fontWeight: 700, color: C.hi, margin: 0 }}>
        Welcome back, Rohith
      </h1>
      <p style={{ fontFamily: sans, fontSize: 14, color: C.mid, marginTop: 6 }}>
        Continue your cybersecurity learning journey.
      </p>

      <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
        <StatCard label="Labs Completed" value="18" icon={CheckCircle2} sub="of 50 total" />
        <StatCard label="Labs Available" value="32" icon={FlaskConical} />
        <StatCard label="Current Progress" value="36%" icon={TrendingUp} sub="+4% this week" tone="cyan" />
        <StatCard label="Total Points" value="2,840" icon={Zap} />
        <StatCard label="Current Rank" value="#12" icon={Trophy} sub="Bug Bounty Batch 01" />
      </div>

      <div style={{ marginTop: 30 }}>
        <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi, marginBottom: 12 }}>
          Continue Learning
        </div>
        <Panel style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 9, background: "rgba(245,166,35,0.1)", border: `1px solid rgba(245,166,35,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FlaskConical size={20} color={C.amber} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>SQL Injection</span>
                <DiffBadge level="Intermediate" />
              </div>
              <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 4 }}>ShopX · LAB 03 · Web Security</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 160 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.mid }}>65% Complete</span>
              </div>
              <ProgressBar value={65} />
            </div>
            <Btn icon={Play} onClick={() => go("lab-detail")}>Continue Lab</Btn>
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 14 }}>Recent Achievements</div>
          {[["First Blood", "Completed your first lab"], ["Injection Specialist", "5 injection-class labs solved"], ["Streak · 7 Days", "Logged in 7 days in a row"]].map((a) => (
            <div key={a[0]} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${C.border}` }}>
              <Award size={15} color={C.cyan} />
              <div>
                <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: C.hi }}>{a[0]}</div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>{a[1]}</div>
              </div>
            </div>
          ))}
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 14 }}>Category Progress</div>
          {CATEGORIES.slice(0, 4).map((c) => (
            <div key={c.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontFamily: sans, fontSize: 12.5, color: C.hi }}>{c.name}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>{c.pct}%</span>
              </div>
              <ProgressBar value={c.pct} tone="cyan" h={5} />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- STUDENT: learning ---------------- */

function Learning() {
  return (
    <div style={{ padding: 28, overflowY: "auto" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Learning</h1>
      <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
        Structured tracks across nine security domains.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
        {CATEGORIES.map((c) => (
          <Panel key={c.name} style={{ padding: 18, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontFamily: sans, fontSize: 14.5, fontWeight: 700, color: C.hi }}>{c.name}</div>
              <DiffBadge level={c.diff === "Mixed" ? "Beginner" : c.diff} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 8 }}>{c.labs} labs</div>
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
  );
}

/* ---------------- STUDENT: lab explorer ---------------- */

function LabCard({ lab, onOpen }) {
  const started = lab.pct > 0 && lab.pct < 100;
  const done = lab.pct === 100;
  return (
    <Panel style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>LAB {lab.id}</span>
        {done ? <Badge tone="cyan">COMPLETED</Badge> : started ? <Badge tone="amber">IN PROGRESS</Badge> : <Badge>NOT STARTED</Badge>}
      </div>
      <div>
        <div style={{ fontFamily: sans, fontSize: 15.5, fontWeight: 700, color: C.hi }}>{lab.name}</div>
        <div style={{ fontFamily: mono, fontSize: 11.5, color: C.low, marginTop: 3 }}>{lab.org} · {lab.cat}</div>
      </div>
      <p style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.55, margin: 0, minHeight: 52 }}>
        {lab.desc}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <DiffBadge level={lab.diff} />
        <Badge>{lab.pts} PTS</Badge>
      </div>
      {started && <ProgressBar value={lab.pct} h={5} />}
      <Btn onClick={onOpen} icon={started ? Play : Lock === null ? Play : Play} style={{ marginTop: 4 }} variant={done ? "subtle" : "primary"}>
        {done ? "Review Lab" : started ? "Continue Lab" : "Start Lab"}
      </Btn>
    </Panel>
  );
}

function LabExplorer({ go }) {
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(LABS.map((l) => l.cat))];
  const filtered = cat === "All" ? LABS : LABS.filter((l) => l.cat === cat);

  return (
    <div style={{ padding: 28, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Lab Explorer</h1>
          <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>
            50 isolated environments across 9 security domains. Showing 12 of 50.
          </p>
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8, background: C.panel2,
            border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px", width: 280,
          }}
        >
          <Search size={14} color={C.low} />
          <span style={{ fontFamily: mono, fontSize: 12.5, color: C.low }}>Search labs...</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <div
            key={c}
            onClick={() => setCat(c)}
            style={{
              fontFamily: sans, fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 20,
              cursor: "pointer", color: cat === c ? "#1A1200" : C.mid,
              background: cat === c ? C.amber : C.panel2, border: `1px solid ${cat === c ? C.amber : C.border}`,
            }}
          >
            {c}
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Btn variant="outline" small icon={Filter}>Difficulty</Btn>
          <Btn variant="outline" small icon={Filter}>Status</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 22 }}>
        {filtered.map((lab) => (
          <LabCard key={lab.id} lab={lab} onOpen={() => go("lab-detail", lab)} />
        ))}
      </div>
    </div>
  );
}

/* ---------------- STUDENT: lab detail / experience ---------------- */

function LabDetail({ lab, back }) {
  const l = lab || LABS[0];
  const [flag, setFlag] = useState("");
  const [submitted, setSubmitted] = useState(null); // null | "correct" | "wrong"

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          height: 54, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center",
          padding: "0 22px", gap: 12, flexShrink: 0,
        }}
      >
        <span onClick={back} style={{ cursor: "pointer", color: C.low }}>
          <ChevronRight size={15} style={{ transform: "rotate(180deg)" }} />
        </span>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: C.low }}>LAB {l.id}</span>
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>{l.name}</span>
        <DiffBadge level={l.diff} />
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 12, color: C.cyan }}>
            <Wifi size={13} /> TARGET ONLINE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 12, color: C.mid }}>
            <Clock size={13} /> 42:18 remaining
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* left: lab info */}
        <div style={{ width: 300, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: 20, flexShrink: 0 }}>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 8 }}>SCENARIO</div>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>
            {l.org} has deployed a new build to staging. Your objective is to identify and
            exploit the vulnerability planted in this environment, then submit proof of exploitation.
          </p>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>OBJECTIVE</div>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, lineHeight: 1.6, margin: 0 }}>{l.desc}</p>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>INSTRUCTIONS</div>
          <ol style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
            <li>Launch the target environment.</li>
            <li>Explore the application surface.</li>
            <li>Locate and exploit the vulnerability.</li>
            <li>Submit the flag below to earn points.</li>
          </ol>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>HINTS</div>
          <Panel style={{ padding: 12, background: C.panel2 }}>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.mid, display: "flex", gap: 8 }}>
              <AlertTriangle size={14} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
              1 hint available · costs 10 points
            </div>
          </Panel>

          <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", margin: "20px 0 8px" }}>RESOURCES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Web Security fundamentals", `${l.cat} cheat sheet`].map((r) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 12.5, color: C.cyan, cursor: "pointer" }}>
                <FileText size={13} /> {r}
              </div>
            ))}
          </div>
        </div>

        {/* center: target */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.void }}>
          <div style={{ height: 38, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
            <Globe size={13} color={C.low} />
            <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 10px", fontFamily: mono, fontSize: 11.5, color: C.mid, flex: 1 }}>
              https://{l.org.toLowerCase().replace(/\s+/g, "-")}.blitzlab.internal
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: C.panel, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TerminalIcon size={24} color={C.amber} />
            </div>
            <div style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, textAlign: "center", maxWidth: 320 }}>
              Isolated target environment for <strong style={{ color: C.hi }}>{l.org}</strong> is provisioned per-session.
            </div>
            <Btn icon={Play}>Launch Target</Btn>
          </div>
        </div>

        {/* right: meta */}
        <div style={{ width: 240, borderLeft: `1px solid ${C.border}`, overflowY: "auto", padding: 20, flexShrink: 0 }}>
          {[["Difficulty", l.diff], ["Points", `${l.pts} pts`], ["Category", l.cat], ["Status", l.pct > 0 ? "In Progress" : "Not Started"]].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em" }}>{k.toUpperCase()}</div>
              <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi, marginTop: 4 }}>{v}</div>
            </div>
          ))}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em", marginBottom: 6 }}>PROGRESS</div>
            <ProgressBar value={l.pct} />
            <div style={{ fontFamily: mono, fontSize: 11, color: C.mid, marginTop: 5 }}>{l.pct}% complete</div>
          </div>
        </div>
      </div>

      {/* flag submission */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 22px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <Flag size={15} color={C.amber} />
        <input
          value={flag}
          onChange={(e) => { setFlag(e.target.value); setSubmitted(null); }}
          placeholder="BLITZ{ submit your flag here }"
          style={{
            flex: 1, background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 7,
            padding: "10px 12px", fontFamily: mono, fontSize: 13, color: C.hi, outline: "none",
          }}
        />
        <Btn
          onClick={() => setSubmitted(flag.trim().length > 4 ? "correct" : "wrong")}
        >
          Submit Flag
        </Btn>
        {submitted === "correct" && <Badge tone="cyan">FLAG ACCEPTED</Badge>}
        {submitted === "wrong" && <Badge tone="danger">INCORRECT FLAG</Badge>}
      </div>
    </div>
  );
}

/* ---------------- STUDENT: study materials ---------------- */

function Materials() {
  const rows = [
    ["Web App Testing Methodology", "Web Security", "Bug Bounty Batch 01", "SQL Injection", "2 days ago"],
    ["Authentication Bypass Patterns", "Authentication", "Web Security — Evening", "JWT Forgery", "1 week ago"],
    ["API Fuzzing Playbook", "API Security", "API Security Intensive", "GraphQL Leak", "2 weeks ago"],
    ["OSINT Reconnaissance Guide", "OSINT", "OSINT Fundamentals", "Subdomain Takeover", "3 weeks ago"],
  ];
  return (
    <div style={{ padding: 28, overflowY: "auto" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Study Materials</h1>
      <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>Reference documents linked to your enrolled classes.</p>
      <Panel style={{ marginTop: 20, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div
            key={r[0]}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 7, background: "rgba(229,83,75,0.1)", border: `1px solid rgba(229,83,75,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={15} color={C.danger} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: sans, fontSize: 13.5, fontWeight: 600, color: C.hi }}>{r[0]}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.low, marginTop: 3 }}>{r[1]} · {r[2]} · Related: {r[3]}</div>
            </div>
            <span style={{ fontFamily: mono, fontSize: 11, color: C.low }}>{r[4]}</span>
            <Btn variant="ghost" small icon={FileText}>Read</Btn>
            <Btn variant="outline" small icon={Download}>Download</Btn>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* generic placeholder page for lightly-specced sidebar items */
function Placeholder({ title, blurb, icon: Icon }) {
  return (
    <div style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>{title}</h1>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: C.panel, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} color={C.low} />
        </div>
        <div style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, maxWidth: 340, textAlign: "center" }}>{blurb}</div>
      </div>
    </div>
  );
}

/* ---------------- ADMIN ---------------- */

function AdminDashboard() {
  return (
    <div style={{ padding: 28, overflowY: "auto" }}>
      <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Admin Dashboard</h1>
      <p style={{ fontFamily: sans, fontSize: 13.5, color: C.mid, marginTop: 6 }}>Overview across all classes and labs.</p>

      <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
        <StatCard label="Total Students" value="312" icon={Users} />
        <StatCard label="Active Students" value="276" icon={Activity} sub="88% active" tone="cyan" />
        <StatCard label="Fee Due" value="₹1.4L" icon={Wallet} />
        <StatCard label="Avg. Progress" value="47%" icon={TrendingUp} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 24 }}>
        <Panel style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi }}>Lab Completions — 30 Days</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["7D", "30D", "90D"].map((d) => (
                <div key={d} style={{ fontFamily: mono, fontSize: 11, padding: "4px 9px", borderRadius: 5, color: d === "30D" ? "#1A1200" : C.mid, background: d === "30D" ? C.amber : C.panel2, border: `1px solid ${C.border}`, cursor: "pointer" }}>{d}</div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
            {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85, 70, 95].map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${v}%`, background: i === 11 ? C.amber : C.panel3, borderRadius: "3px 3px 0 0", border: `1px solid ${C.border}` }} />
            ))}
          </div>
        </Panel>
        <Panel style={{ padding: 20 }}>
          <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 14 }}>Most Popular Labs</div>
          {LABS.slice(0, 4).map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: C.hi }}>{l.name}</div>
                <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low }}>{l.org}</div>
              </div>
              <DiffBadge level={l.diff} />
            </div>
          ))}
        </Panel>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.hi, marginBottom: 12 }}>Classes</div>
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
    </div>
  );
}

function AdminStudents() {
  const students = [
    ["Rohith K.", "Bug Bounty Batch 01", "PAID", "ACTIVE", "62%"],
    ["Anjali S.", "Web Security — Evening", "DUE", "ACTIVE", "48%"],
    ["Marcus T.", "API Security Intensive", "PARTIAL", "RESTRICTED", "30%"],
    ["Priya N.", "OSINT Fundamentals", "PAID", "ACTIVE", "81%"],
    ["Jordan L.", "Bug Bounty Batch 01", "DUE", "SUSPENDED", "12%"],
  ];
  const feeTone = { PAID: "cyan", DUE: "danger", PARTIAL: "warn" };
  const accessTone = { ACTIVE: "cyan", RESTRICTED: "warn", EXPIRED: "default", SUSPENDED: "danger" };
  return (
    <div style={{ padding: 28, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Students</h1>
        <Btn icon={Plus}>Add Student</Btn>
      </div>
      <Panel style={{ marginTop: 20, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 0.9fr 1fr 0.8fr 0.4fr", padding: "10px 18px", borderBottom: `1px solid ${C.border}`, fontFamily: mono, fontSize: 10.5, color: C.low, letterSpacing: "0.04em" }}>
          <div>NAME</div><div>CLASS</div><div>FEE</div><div>ACCESS</div><div>PROGRESS</div><div />
        </div>
        {students.map((s, i) => (
          <div key={s[0]} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 0.9fr 1fr 0.8fr 0.4fr", padding: "13px 18px", alignItems: "center", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: C.panel3, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 11, color: C.amber }}>{s[0][0]}</div>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>{s[0]}</span>
            </div>
            <span style={{ fontFamily: sans, fontSize: 12.5, color: C.mid }}>{s[1]}</span>
            <div><Badge tone={feeTone[s[2]]}>{s[2]}</Badge></div>
            <div><Badge tone={accessTone[s[3]]}>{s[3]}</Badge></div>
            <span style={{ fontFamily: mono, fontSize: 12, color: C.hi }}>{s[4]}</span>
            <MoreHorizontal size={15} color={C.low} style={{ cursor: "pointer" }} />
          </div>
        ))}
      </Panel>
    </div>
  );
}

function AdminClasses() {
  return (
    <div style={{ padding: 28, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: 0 }}>Classes</h1>
        <Btn icon={Plus}>Create Class</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 20 }}>
        {CLASSES.map((c) => (
          <Panel key={c.name} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: C.hi }}>{c.name}</div>
              <Badge tone={c.fee === "PAID" ? "cyan" : c.fee === "DUE" ? "danger" : "warn"}>{c.fee}</Badge>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 14, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              {["Overview", "Students", "Labs", "Materials", "Activity"].map((t, i) => (
                <span key={t} style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: i === 0 ? C.amber : C.low, cursor: "pointer" }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
              {[["Students", c.students], ["Labs Assigned", c.labs], ["Materials", c.materials]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: mono, fontSize: 17, fontWeight: 600, color: C.hi }}>{v}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: C.low }}>{k}</div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---------------- app shell ---------------- */

export default function BlitzCyberLab() {
  const [stage, setStage] = useState("login"); // login | student | admin
  const [studentPage, setStudentPage] = useState("dashboard");
  const [adminPage, setAdminPage] = useState("a-dashboard");
  const [activeLab, setActiveLab] = useState(null);

  const goLab = (page, lab) => {
    if (lab) setActiveLab(lab);
    setStudentPage(page);
  };

  if (stage === "login") {
    return (
      <div style={{ fontFamily: sans }}>
        <Login onLogin={(role) => setStage(role)} />
      </div>
    );
  }

  if (stage === "admin") {
    const pages = {
      "a-dashboard": <AdminDashboard />,
      "a-students": <AdminStudents />,
      "a-classes": <AdminClasses />,
      "a-labs": <Placeholder title="Labs" blurb="Manage all 50 lab environments, difficulty, points, and availability." icon={FlaskConical} />,
      "a-materials": <Placeholder title="Study Materials" blurb="Upload and organize documents linked to classes and labs." icon={BookOpen} />,
      "a-assignments": <Placeholder title="Assignments" blurb="Assign labs and materials to classes or individual students." icon={ClipboardList} />,
      "a-fees": <Placeholder title="Fees" blurb="Track payment status across every enrolled student." icon={Wallet} />,
      "a-activity": <Placeholder title="Activity" blurb="Live feed of lab attempts, completions, and logins." icon={Activity} />,
      "a-analytics": <Placeholder title="Analytics" blurb="Registrations, completions, and difficulty trends over time." icon={BarChart3} />,
      "a-audit": <Placeholder title="Audit Logs" blurb="Immutable record of administrative actions." icon={ScrollText} />,
      "a-settings": <Placeholder title="Settings" blurb="Platform configuration, instructors, and organization details." icon={Settings} />,
    };
    return (
      <div style={{ fontFamily: sans, display: "flex", height: "100vh", background: C.void, color: C.hi }}>
        <Sidebar items={NAV_ADMIN} active={adminPage} onSelect={setAdminPage} onSwitch={() => setStage("login")} switchLabel="Sign out" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Topbar placeholder="Search students, classes, labs..." name="Admin" role="Platform Administrator" />
          <div style={{ flex: 1, overflow: "hidden" }}>{pages[adminPage]}</div>
        </div>
      </div>
    );
  }

  // student
  const pages = {
    dashboard: <StudentDashboard go={goLab} />,
    learning: <Learning />,
    labs: <LabExplorer go={goLab} />,
    "lab-detail": <LabDetail lab={activeLab} back={() => setStudentPage("labs")} />,
    materials: <Materials />,
    challenges: <Placeholder title="Challenges" blurb="Timed and community challenge events." icon={Target} />,
    progress: <Placeholder title="Progress" blurb="Your completion history across all security domains." icon={TrendingUp} />,
    leaderboard: <Placeholder title="Leaderboard" blurb="Rankings within your class and across Blitz Cyber Lab." icon={Trophy} />,
    achievements: <Placeholder title="Achievements" blurb="Badges earned from labs, streaks, and challenges." icon={Award} />,
    certificates: <Placeholder title="Certificates" blurb="Download certificates for completed tracks." icon={FileBadge} />,
    profile: <Placeholder title="Profile" blurb="Manage your account and notification preferences." icon={User} />,
  };

  return (
    <div style={{ fontFamily: sans, display: "flex", height: "100vh", background: C.void, color: C.hi }}>
      <Sidebar items={NAV_STUDENT} active={studentPage === "lab-detail" ? "labs" : studentPage} onSelect={setStudentPage} onSwitch={() => setStage("login")} switchLabel="Sign out" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {studentPage !== "lab-detail" && <Topbar placeholder="Search labs, topics, vulnerabilities..." name="Rohith" role="Student" />}
        <div style={{ flex: 1, overflow: "hidden" }}>{pages[studentPage]}</div>
      </div>
    </div>
  );
}

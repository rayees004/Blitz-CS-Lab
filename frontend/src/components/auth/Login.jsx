import React, { useState } from "react";
import { ArrowRight, Shield } from "lucide-react";
import Logo from "../layout/Logo";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("rohith@blitzcyberlab.io");
  const [password, setPassword] = useState("••••••••••••");

  return (
    <div style={{ minHeight: "100vh", background: C.void, display: "flex" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
          position: "relative",
          overflow: "hidden",
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
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 38,
              lineHeight: 1.15,
              color: C.hi,
              margin: "28px 0 14px",
              letterSpacing: "-0.02em",
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
          width: 440,
          flexShrink: 0,
          background: C.panel,
          borderLeft: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 48px",
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 11, color: C.low, letterSpacing: "0.05em", marginBottom: 8 }}>
          STUDENT LOGIN
        </div>
        <h2 style={{ fontFamily: sans, fontSize: 20, fontWeight: 700, color: C.hi, margin: "0 0 26px" }}>
          Sign in to your account
        </h2>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginBottom: 6 }}>Email address</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              background: C.panel2,
              padding: "10px 12px",
              fontFamily: mono,
              fontSize: 13,
              color: C.hi,
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              background: C.panel2,
              padding: "10px 12px",
              fontFamily: mono,
              fontSize: 13,
              color: C.hi,
              outline: "none",
            }}
          />
        </div>

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

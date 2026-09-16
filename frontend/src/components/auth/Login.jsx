import React, { useState } from "react";
import { ArrowRight, AlertCircle, Loader2, KeyRound } from "lucide-react";
import Logo from "../layout/Logo";
import Btn from "../common/Btn";
import { C, sans, mono } from "../../constants/theme";
import { loginUser } from "../../api/auth";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      const userType = response.user_type || response.user?.user_type || "student";

      if (userType === "admin") {
        onLogin("admin", response.user);
      } else {
        onLogin("student", response.user);
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.void, display: "flex" }}>
      {/* Left Hero section */}
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

      {/* Right Login Form section */}
      <div
        style={{
          width: 460,
          flexShrink: 0,
          background: C.panel,
          borderLeft: `1px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 44px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 11, color: C.amber, letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <KeyRound size={13} />
          AUTHENTICATION GATEWAY
        </div>
        <h2 style={{ fontFamily: sans, fontSize: 22, fontWeight: 700, color: C.hi, margin: "0 0 10px" }}>
          Sign in to your account
        </h2>
        <p style={{ fontFamily: sans, fontSize: 13, color: C.mid, margin: "0 0 20px" }}>
          Enter your Blitz Cyber Lab credentials to access your dashboard.
        </p>

        {/* Error message banner */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              padding: "10px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              fontFamily: sans,
              lineHeight: 1.45,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: sans, fontSize: 12.5, color: C.mid, marginBottom: 6 }}>
              Email address or Username
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@blitzcyberlab.io"
              disabled={loading}
              autoComplete="username"
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
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
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
            <span style={{ fontFamily: sans, fontSize: 12, color: C.cyan, cursor: "pointer" }}>
              Forgot password?
            </span>
          </div>

          <Btn
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "11px 0" }}
            icon={loading ? Loader2 : ArrowRight}
          >
            {loading ? "Verifying..." : "Sign in"}
          </Btn>
        </form>

        <p style={{ fontFamily: sans, fontSize: 11.5, color: C.low, marginTop: 28, lineHeight: 1.6 }}>
          By signing in you agree to use Blitz Cyber Lab's isolated lab environments only for
          authorized training activity.
        </p>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import {
  AlertCircle, Eye, EyeOff, Info, Loader2, Lock, LogIn, Mail, ShieldCheck, Zap,
} from "lucide-react";
import BlitzMark from "./BlitzMark";
import LoginArt from "./LoginArt";
import { loginUser } from "../../api/auth";
import "./login.css";

// Gold and blue diagonal stripes anchored to the screen corners
function Backdrop() {
  return (
    <div className="lg-bg" aria-hidden="true">
      <div className="lg-bg-dots" />
      <div className="lg-bg-swoosh" />

      <svg className="lg-bg-tr" viewBox="0 0 820 320" preserveAspectRatio="xMaxYMin meet">
        <defs>
          <linearGradient id="lg-bg-gold-down" x1="0.7" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg-bg-blue-down" x1="0.7" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#3b5bff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3b5bff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg-bg-violet" x1="1" y1="0" x2="0.3" y2="0.9">
            <stop offset="0" stopColor="#6d5cff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#6d5cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="470,0 820,0 820,320" fill="url(#lg-bg-violet)" />
        <polygon points="380,0 470,0 240,300 150,300" fill="url(#lg-bg-blue-down)" opacity="0.6" />
        <polygon points="160,0 250,0 64,240 30,240" fill="url(#lg-bg-gold-down)" />
        <polygon points="270,0 292,0 128,220 116,220" fill="url(#lg-bg-blue-down)" />
        <polygon points="640,0 668,0 560,130 546,130" fill="url(#lg-bg-gold-down)" />
        <polygon points="700,0 712,0 640,90 632,90" fill="url(#lg-bg-gold-down)" opacity="0.6" />
      </svg>

      <svg className="lg-bg-br" viewBox="0 0 900 220" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <linearGradient id="lg-bg-gold-up" x1="0.2" y1="1" x2="0.7" y2="0">
            <stop offset="0" stopColor="#f59e0b" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lg-bg-navy-up" x1="0.2" y1="1" x2="0.7" y2="0">
            <stop offset="0" stopColor="#1e2fa8" stopOpacity="0.75" />
            <stop offset="1" stopColor="#1e2fa8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="30,220 120,220 310,50 276,50" fill="url(#lg-bg-gold-up)" />
        <polygon points="140,220 250,220 420,80 370,80" fill="url(#lg-bg-navy-up)" />
        <polygon points="650,220 680,220 860,40 846,40" fill="url(#lg-bg-navy-up)" />
        <polygon points="736,220 792,220 900,112 900,56" fill="#f7a81b" opacity="0.92" />
        <polygon points="826,220 852,220 900,172 900,146" fill="#fbbf24" opacity="0.75" />
      </svg>
    </div>
  );
}

export default function Login({ onLogin, initialNotice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(initialNotice || null);

  useEffect(() => {
    if (initialNotice) {
      setNotice(initialNotice);
    }
  }, [initialNotice]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await loginUser(email, password);
      const userType = response.user_type || response.user?.user_type || "student";

      // Strictly route by user type:
      // - student -> Student panel only
      // - instructor -> Admin dashboard
      // - admin -> Admin dashboard (with django admin access available)
      if (userType === "student") {
        onLogin("student", response.user);
      } else {
        onLogin("admin", response.user);
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate. Ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-root">
      <Backdrop />

      <main className="lg-main">
        <section className="lg-hero" aria-label="Blitz Cyber Lab">
          <div className="lg-brand">
            <BlitzMark className="lg-brand-mark" size={88} />
            <span className="lg-brand-sep" aria-hidden="true" />
            <span className="lg-brand-name">Blitz Academy</span>
          </div>

          <div className="lg-hero-body">
            <div className="lg-badge">
              <Zap size={20} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
              BLITZ/CYBER LAB
            </div>

            <h1 className="lg-title">
              <span className="lg-title-line">Learn. Hack. Build.</span>
              <span className="lg-title-secure">
                Secure.
                <svg className="lg-swoosh" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 21C60 12 160 5 317 4C250 10 150 16 6 23Z" fill="#fbb424" />
                </svg>
              </span>
            </h1>

            <p className="lg-desc">
              Hands-on <strong>cybersecurity</strong> training in isolated lab environments — built for
              students, trainers, and teams who learn by breaking things safely.
            </p>
          </div>

          <LoginArt className="lg-art" />
        </section>

        <section className="lg-card-wrap">
          <div className="lg-card">
            <div className="lg-gw">
              <ShieldCheck size={30} strokeWidth={1.8} aria-hidden="true" />
              Authentication Gateway
            </div>
            <h2 className="lg-card-title">Sign in to your account</h2>
            <p className="lg-card-sub">
              Enter your Blitz Cyber Lab credentials to access your platform portal.
            </p>

            {notice && (
              <div className="lg-alert lg-alert--notice" role="status">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="lg-alert lg-alert--error" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form className="lg-form" onSubmit={handleSubmit}>
              <div className="lg-field">
                <label className="lg-field-main" htmlFor="lg-email">
                  <Mail size={22} strokeWidth={1.8} aria-hidden="true" />
                  <span className="lg-sr-only">Email address or username</span>
                  <input
                    id="lg-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or username"
                    disabled={loading}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </label>
              </div>

              <div className="lg-field">
                <label className="lg-field-main" htmlFor="lg-password">
                  <Lock size={22} strokeWidth={1.8} aria-hidden="true" />
                  <span className="lg-sr-only">Password</span>
                  <input
                    id="lg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </label>
                <button
                  type="button"
                  className="lg-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <Eye size={22} strokeWidth={1.8} /> : <EyeOff size={22} strokeWidth={1.8} />}
                </button>
              </div>

              <button type="submit" className="lg-submit" disabled={loading}>
                {loading ? (
                  <Loader2 size={22} className="lg-spin" aria-hidden="true" />
                ) : (
                  <LogIn size={22} strokeWidth={2.2} aria-hidden="true" />
                )}
                <span>{loading ? "Authenticating..." : "Sign in"}</span>
              </button>
            </form>

            <div className="lg-divider" role="presentation" />

            <p className="lg-note">
              <Info size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>
                By signing in you agree to use Blitz Cyber Lab's isolated lab environments only for
                authorized training activity.
              </span>
            </p>
          </div>
        </section>
      </main>

      <footer className="lg-footer">
        <div className="lg-footer-brand">
          <BlitzMark size={30} />
          <span>Blitz Academy</span>
        </div>
        <span className="lg-footer-sep" aria-hidden="true" />
        <span className="lg-footer-tag">Train Today. Secure Tomorrow.</span>
      </footer>
    </div>
  );
}

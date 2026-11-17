import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Globe, Loader2, Maximize2, Minimize2, RotateCw } from "lucide-react";
import { fetchStudentLabAttendState } from "../../api/labs";
import { getStoredToken } from "../../api/auth";
import { C, sans, mono } from "../../constants/theme";

// Only real web addresses may be framed; a javascript:/data: URL would run inside this site.
export function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Address of the full-screen viewer. It carries no lab id; see handOffLabTarget. */
export const LAB_TARGET_PATH = `${import.meta.env.BASE_URL}target_environment/`;

export function isLabTargetPath(pathname) {
  return pathname.replace(/\/+$/, "") === LAB_TARGET_PATH.replace(/\/+$/, "");
}

const HANDOFF_KEY = "blitz.labTarget.handoff"; // localStorage: lab page -> the tab it is opening
const TAB_KEY = "blitz.labTarget.id"; // sessionStorage: the lab this viewer tab shows (survives reload)
const HANDOFF_MAX_AGE_MS = 2 * 60 * 1000;

/** Call just before opening LAB_TARGET_PATH in a new tab: tells that tab which lab to load. */
export function handOffLabTarget(labId) {
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify({ id: String(labId), at: Date.now() }));
  } catch {
    // Storage blocked: the viewer shows "open it from the lab page".
  }
}

// A reload keeps this tab's own lab; a fresh tab takes the lab page's recent hand-off.
function resolveLabTargetId() {
  try {
    const own = sessionStorage.getItem(TAB_KEY);
    if (own) return own;
    const handoff = JSON.parse(localStorage.getItem(HANDOFF_KEY) || "null");
    localStorage.removeItem(HANDOFF_KEY);
    if (handoff?.id && Date.now() - handoff.at < HANDOFF_MAX_AGE_MS) {
      sessionStorage.setItem(TAB_KEY, handoff.id);
      return handoff.id;
    }
  } catch {
    // Storage blocked or a malformed value: fall through.
  }
  return null;
}

/**
 * Full-window lab environment, opened in its own tab from LabDetail.
 * Looks up the target by lab id (with the signed-in session) instead of trusting a URL
 * in the address bar, so this page can't be used to frame arbitrary sites.
 */
export default function LabTargetViewer() {
  const [labId] = useState(resolveLabTargetId);
  const [state, setState] = useState({ status: "loading", lab: null, error: null });
  const [frameKey, setFrameKey] = useState(0);
  const [frameLoading, setFrameLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!labId) {
      setState({ status: "error", lab: null, error: "Open the lab environment from the lab page using Launch Lab Environment." });
      return;
    }
    if (!getStoredToken()) {
      setState({ status: "error", lab: null, error: "Sign in to Blitz Cyber Lab first, then open the lab environment again." });
      return;
    }
    let cancelled = false;
    fetchStudentLabAttendState(labId)
      .then((data) => {
        if (cancelled) return;
        const lab = data?.lab || {};
        if (!safeHttpUrl(lab.target_url)) {
          setState({ status: "error", lab, error: "This lab has no valid target environment URL." });
        } else {
          setState({ status: "ready", lab, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", lab: null, error: err.message || "Could not load this lab." });
      });
    return () => {
      cancelled = true;
    };
  }, [labId]);

  useEffect(() => {
    const name = state.lab?.name;
    document.title = name ? `${name} · Lab Environment` : "Lab Environment · Blitz Cyber Lab";
  }, [state.lab?.name]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      rootRef.current?.requestFullscreen?.().catch(() => {});
    }
  };

  const reload = () => {
    setFrameLoading(true);
    setFrameKey((k) => k + 1);
  };

  const targetUrl = state.status === "ready" ? safeHttpUrl(state.lab.target_url) : null;

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: C.void,
        color: C.hi,
        fontFamily: sans,
      }}
    >
      <style>{"@keyframes ltv-spin { to { transform: rotate(360deg); } }"}</style>

      {/* Toolbar */}
      <header
        style={{
          flexShrink: 0,
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 12px 0 14px",
          background: C.panel,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 11, color: C.cyan, letterSpacing: "0.04em", flexShrink: 0 }}>
          <Globe size={14} />
          LAB ENVIRONMENT
        </div>
        {state.lab?.name && (
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
            {state.lab.name}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {targetUrl && (
          <>
            <ToolbarButton onClick={reload} title="Reload the lab site">
              <RotateCw size={13} /> Reload
            </ToolbarButton>
            <ToolbarButton onClick={toggleFullscreen} title={isFullscreen ? "Exit full screen (Esc)" : "Full screen"}>
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </ToolbarButton>
          </>
        )}
      </header>

      {/* Body */}
      <main style={{ position: "relative", flex: 1, minHeight: 0, background: "#fff" }}>
        {state.status === "loading" && (
          <Centered>
            <Loader2 size={24} color={C.cyan} style={{ animation: "ltv-spin 0.9s linear infinite" }} />
            <span>Loading lab environment…</span>
          </Centered>
        )}

        {state.status === "error" && (
          <Centered>
            <AlertTriangle size={26} color={C.amber} />
            <span style={{ maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>{state.error}</span>
            <a href={import.meta.env.BASE_URL} style={{ color: C.cyan, fontSize: 13 }}>Go to Blitz Cyber Lab</a>
          </Centered>
        )}

        {targetUrl && (
          <>
            {frameLoading && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, overflow: "hidden", background: "rgba(63, 216, 200, 0.15)" }}>
                <div style={{ width: "40%", height: "100%", background: C.cyan, animation: "ltv-bar 1.1s ease-in-out infinite" }} />
                <style>{"@keyframes ltv-bar { from { transform: translateX(-100%); } to { transform: translateX(250%); } }"}</style>
              </div>
            )}
            <iframe
              key={frameKey}
              src={targetUrl}
              title={`${state.lab.name || "Lab"} environment`}
              onLoad={() => setFrameLoading(false)}
              // Cross-origin sandbox: the lab site keeps scripts, forms, cookies and popups,
              // but can't navigate this tab away to somewhere else.
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
              allow="clipboard-read; clipboard-write; fullscreen"
              referrerPolicy="no-referrer"
              style={{ display: "block", width: "100%", height: "100%", border: 0, background: "#fff" }}
            />
          </>
        )}
      </main>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: C.void,
        color: C.mid,
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}

function ToolbarButton({ children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 30,
        padding: "0 11px",
        borderRadius: 8,
        border: `1px solid ${C.borderLight}`,
        background: "rgba(255, 255, 255, 0.03)",
        color: C.hi,
        fontFamily: sans,
        fontSize: 12.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

import React from "react";
import { Bell, Shield, ExternalLink, Eye, LayoutDashboard } from "lucide-react";
import { C, sans, mono } from "../../constants/theme";
import { DJANGO_ADMIN_URL } from "../../api/client";

export default function Topbar({
  name,
  role,
  userType = "student",
  canAccessDjangoAdmin = false,
  onToggleView = null,
  viewMode = "admin",
}) {
  const isAdmin = userType === "admin" || canAccessDjangoAdmin;
  const isInstructor = userType === "instructor";

  // Role tag styling
  const roleBadgeStyle = isAdmin
    ? {
        color: "#38bdf8",
        background: "rgba(56, 189, 248, 0.12)",
        border: "1px solid rgba(56, 189, 248, 0.3)",
      }
    : isInstructor
    ? {
        color: "#c084fc",
        background: "rgba(192, 132, 252, 0.14)",
        border: "1px solid rgba(192, 132, 252, 0.35)",
      }
    : {
        color: "#34d399",
        background: "rgba(52, 211, 153, 0.12)",
        border: "1px solid rgba(52, 211, 153, 0.3)",
      };

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
        background: C.panel,
      }}
    >
      {/* Left side actions (Django Admin quick launcher & Student View toggle for Admin) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isAdmin && (
          <a
            href={DJANGO_ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Django Administration Panel (/admin/)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#34d399",
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.22)";
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.12)";
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.35)";
            }}
          >
            <Shield size={13} />
            <span>Django Admin</span>
            <ExternalLink size={11} style={{ opacity: 0.8 }} />
          </a>
        )}

        {isAdmin && onToggleView && (
          <button
            type="button"
            onClick={onToggleView}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              background: viewMode === "student" ? "rgba(245, 158, 11, 0.15)" : C.panel2,
              border: `1px solid ${viewMode === "student" ? C.amber : C.border}`,
              color: viewMode === "student" ? C.amber : C.mid,
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
            title={viewMode === "student" ? "Return to Platform Administrator Dashboard" : "Preview Platform as Student"}
          >
            {viewMode === "student" ? (
              <>
                <LayoutDashboard size={13} />
                <span>Return to Admin Dashboard</span>
              </>
            ) : (
              <>
                <Eye size={13} />
                <span>Preview Student View</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Right side user info & notification */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Bell size={17} color={C.mid} strokeWidth={2} style={{ cursor: "pointer" }} />
        <div style={{ width: 1, height: 22, background: C.border }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: C.panel3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: mono,
              fontSize: 12.5,
              fontWeight: 700,
              color: isAdmin ? "#38bdf8" : isInstructor ? "#c084fc" : C.amber,
              border: `1px solid ${C.border}`,
            }}
          >
            {name ? name[0].toUpperCase() : "U"}
          </div>

          <div style={{ lineHeight: 1.25 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.hi }}>
                {name}
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  padding: "1px 5px",
                  borderRadius: 4,
                  ...roleBadgeStyle,
                }}
              >
                {isAdmin ? "ADMIN" : isInstructor ? "INSTRUCTOR" : "STUDENT"}
              </span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 10.5, color: C.low, marginTop: 1 }}>
              {role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

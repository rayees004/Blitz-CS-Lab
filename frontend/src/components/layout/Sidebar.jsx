import React from "react";
import { Shield, HelpCircle, Settings, LogOut, ExternalLink, Eye, LayoutDashboard } from "lucide-react";
import Logo from "./Logo";
import { C, sans } from "../../constants/theme";
import { DJANGO_ADMIN_URL } from "../../api/client";

export default function Sidebar({
  items,
  active,
  onSelect,
  footerExtra,
  onSwitch,
  switchLabel = "Sign out",
  userType = "student",
  canAccessDjangoAdmin = false,
  onToggleView = null,
  viewMode = "admin",
}) {
  const isAdmin = userType === "admin" || canAccessDjangoAdmin;

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
        {/* Django Admin link available exclusively for Platform Administrators */}
        {isAdmin && (
          <a
            href={DJANGO_ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: sans,
              fontSize: 13,
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              marginBottom: 6,
              textDecoration: "none",
            }}
            title="Open Django Administration Portal (/admin/)"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Shield size={15} strokeWidth={2} color="#34d399" />
              <span style={{ fontWeight: 600 }}>Django Admin</span>
            </div>
            <ExternalLink size={12} color="#34d399" />
          </a>
        )}

        {/* View switcher for admin (previewing student panel / returning to admin dashboard) */}
        {isAdmin && onToggleView && (
          <div
            onClick={onToggleView}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 10px",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: sans,
              fontSize: 13,
              color: viewMode === "student" ? C.amber : C.cyan,
              background: viewMode === "student" ? "rgba(245, 158, 11, 0.08)" : "transparent",
              marginBottom: 4,
            }}
          >
            {viewMode === "student" ? (
              <>
                <LayoutDashboard size={15} strokeWidth={2} color={C.amber} />
                <span>Admin Dashboard</span>
              </>
            ) : (
              <>
                <Eye size={15} strokeWidth={2} color={C.cyan} />
                <span>Student View</span>
              </>
            )}
          </div>
        )}

        {[
          { label: "Help", icon: HelpCircle },
          { label: "Settings", icon: Settings },
          { label: switchLabel, icon: LogOut, onClick: onSwitch },
        ].map((it) => (
          <div
            key={it.label}
            onClick={it.onClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 7,
              cursor: "pointer",
              fontFamily: sans,
              fontSize: 13,
              color: C.mid,
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

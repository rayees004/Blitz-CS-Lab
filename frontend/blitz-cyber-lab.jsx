import React, { useState } from "react";
import {
  FlaskConical, BookOpen, ClipboardList, Wallet, Activity,
  BarChart3, ScrollText, Settings, Target, TrendingUp,
  Trophy, Award, FileBadge, User, ShieldAlert, ArrowLeft
} from "lucide-react";

import { C, sans } from "./src/constants/theme";
import { NAV_STUDENT, NAV_ADMIN } from "./src/data/mockData";
import Sidebar from "./src/components/layout/Sidebar";
import Topbar from "./src/components/layout/Topbar";
import Login from "./src/components/auth/Login";
import Placeholder from "./src/components/common/Placeholder";

import { logoutUser, getStoredUser, checkTokenValidity } from "./src/api/auth";

// Student Views
import StudentDashboard from "./src/components/student/StudentDashboard";
import Learning from "./src/components/student/Learning";
import LabExplorer from "./src/components/student/LabExplorer";
import LabDetail from "./src/components/student/LabDetail";
import Materials from "./src/components/student/Materials";

// Admin Views
import AdminDashboard from "./src/components/admin/AdminDashboard";
import AdminStudents from "./src/components/admin/AdminStudents";
import AdminClasses from "./src/components/admin/AdminClasses";
import AdminSubjects from "./src/components/admin/AdminSubjects";
import AdminLabs from "./src/components/admin/AdminLabs";
import AdminMaterials from "./src/components/admin/AdminMaterials";
import AdminActivity from "./src/components/admin/AdminActivity";
import AdminAuditLogs from "./src/components/admin/AdminAuditLogs";
import StudentProgressView from "./src/components/student/StudentProgressView";

// Export modular subcomponents for external consumption
export { default as Sidebar } from "./src/components/layout/Sidebar";
export { default as Topbar } from "./src/components/layout/Topbar";
export { default as Logo } from "./src/components/layout/Logo";
export { default as Login } from "./src/components/auth/Login";
export { default as Btn } from "./src/components/common/Btn";
export { default as Panel } from "./src/components/common/Panel";
export { default as Badge, DiffBadge } from "./src/components/common/Badge";
export { default as ProgressBar } from "./src/components/common/ProgressBar";
export { default as StatCard } from "./src/components/common/StatCard";
export { default as Placeholder } from "./src/components/common/Placeholder";
export { default as StudentDashboard } from "./src/components/student/StudentDashboard";
export { default as Learning } from "./src/components/student/Learning";
export { default as LabExplorer } from "./src/components/student/LabExplorer";
export { default as LabCard } from "./src/components/student/LabCard";
export { default as LabDetail } from "./src/components/student/LabDetail";
export { default as Materials } from "./src/components/student/Materials";
export { default as AdminDashboard } from "./src/components/admin/AdminDashboard";
export { default as AdminStudents } from "./src/components/admin/AdminStudents";
export { default as AdminClasses } from "./src/components/admin/AdminClasses";
export { default as AdminSubjects } from "./src/components/admin/AdminSubjects";
export { default as AdminLabs } from "./src/components/admin/AdminLabs";
export { default as AdminMaterials } from "./src/components/admin/AdminMaterials";
export * from "./src/constants/theme";
export * from "./src/data/mockData";

export default function BlitzCyberLab() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [stage, setStage] = useState(() => {
    const user = getStoredUser();
    if (user?.user_type === "admin" || user?.user_type === "instructor") return "admin";
    if (user?.user_type === "student") return "student";
    return "login";
  });
  const [studentPage, setStudentPage] = useState("dashboard");
  const [adminPage, setAdminPage] = useState("a-dashboard");
  const [activeLab, setActiveLab] = useState(null);

  const [sessionNotice, setSessionNotice] = useState(null);

  React.useEffect(() => {
    // 1. Listen for global token expiry / 401 unauthorized events
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setSessionNotice("Your session has expired. Please log in again to continue.");
      setStage("login");
    };

    window.addEventListener("blitz:auth_expired", handleAuthExpired);

    // 2. On app load/refresh, verify stored token validity with backend
    if (getStoredUser()) {
      checkTokenValidity().then((isValid) => {
        if (!isValid) {
          handleAuthExpired();
        }
      });
    }

    return () => {
      window.removeEventListener("blitz:auth_expired", handleAuthExpired);
    };
  }, []);

  const handleLogin = (role, user) => {
    setSessionNotice(null);
    if (user) {
      setCurrentUser(user);
      // Strictly enforce role-based entry:
      // - Student -> only access to student panel only
      // - Instructor -> admin dashboard access
      // - Admin -> admin dashboard access (& django admin panel access)
      if (user.user_type === "student") {
        setStage("student");
      } else {
        setStage("admin");
      }
    } else {
      setStage(role);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setSessionNotice(null);
    setStage("login");
  };

  const goLab = (page, lab) => {
    if (lab) setActiveLab(lab);
    setStudentPage(page);
  };

  // ─── STRICT ACCESS CONTROL GUARDS ───
  // 1. Student: ONLY has access to the student panel. Cannot access admin stage.
  // 2. Instructor: Access to admin dashboard.
  // 3. Admin: Access to admin dashboard AND django admin panel available (can also preview student panel).
  const isStudent = currentUser?.user_type === "student";
  const isInstructor = currentUser?.user_type === "instructor";
  const isAdmin = currentUser?.user_type === "admin" || Boolean(currentUser?.is_superuser);

  // If a student somehow lands on "admin" stage, strictly redirect to "student"
  const effectiveStage = stage === "admin" && isStudent ? "student" : stage;

  // View toggle for admin users wanting to preview student experience
  const handleToggleAdminView = () => {
    if (isAdmin) {
      setStage(stage === "admin" ? "student" : "admin");
    }
  };

  if (effectiveStage === "login") {
    return (
      <div style={{ fontFamily: sans }}>
        <Login onLogin={handleLogin} initialNotice={sessionNotice} />
      </div>
    );
  }

  if (effectiveStage === "admin") {
    const pages = {
      "a-dashboard": <AdminDashboard onNavigate={setAdminPage} currentUser={currentUser} />,
      "a-students": <AdminStudents currentUser={currentUser} />,
      "a-classes": <AdminClasses />,
      "a-subjects": <AdminSubjects />,
      "a-labs": <AdminLabs onOpenAddModal={() => setAdminPage("a-dashboard")} />,
      "a-materials": <AdminMaterials />,
      "a-activity": <AdminActivity onSelectStudent={() => setAdminPage("a-students")} />,
      "a-audit": <AdminAuditLogs />,
    };

    const userFullName = currentUser?.first_name
      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
      : (currentUser?.username || (isAdmin ? "Admin" : "Instructor"));

    const roleTitle = isAdmin ? "Platform Administrator" : "Instructor / Faculty";

    return (
      <div style={{ fontFamily: sans, display: "flex", height: "100vh", background: C.void, color: C.hi, overflow: "hidden" }}>
        <Sidebar
          items={NAV_ADMIN}
          active={adminPage}
          onSelect={setAdminPage}
          onSwitch={handleLogout}
          switchLabel="Sign out"
          userType={currentUser?.user_type || (isAdmin ? "admin" : "instructor")}
          canAccessDjangoAdmin={isAdmin}
          onToggleView={isAdmin ? handleToggleAdminView : null}
          viewMode="admin"
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
          <Topbar
            name={userFullName}
            role={roleTitle}
            userType={currentUser?.user_type || (isAdmin ? "admin" : "instructor")}
            canAccessDjangoAdmin={isAdmin}
            onToggleView={isAdmin ? handleToggleAdminView : null}
            viewMode="admin"
          />
          <div style={{ flex: 1, overflow: "hidden" }}>{pages[adminPage]}</div>
        </div>
      </div>
    );
  }

  // ─── Student Stage ───
  // (Available to Students, and Admins who toggle to preview student experience)
  const pages = {
    dashboard: <StudentDashboard go={goLab} />,
    learning: <Learning go={goLab} onSelect={setStudentPage} />,
    labs: <LabExplorer go={goLab} />,
    "lab-detail": <LabDetail lab={activeLab} back={() => setStudentPage("labs")} />,
    materials: <Materials />,
    progress: <StudentProgressView go={goLab} />,
    leaderboard: <Placeholder title="Leaderboard" blurb="Rankings within your class and across Blitz Cyber Lab." icon={Trophy} />,
    achievements: <Placeholder title="Achievements" blurb="Badges earned from labs, streaks, and challenges." icon={Award} />,
  };

  const studentFullName = currentUser?.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
    : (currentUser?.username || "Student");

  return (
    <div style={{ fontFamily: sans, display: "flex", height: "100vh", background: C.void, color: C.hi, overflow: "hidden" }}>
      <Sidebar
        items={NAV_STUDENT}
        active={studentPage === "lab-detail" ? "labs" : studentPage}
        onSelect={setStudentPage}
        onSwitch={handleLogout}
        switchLabel="Sign out"
        userType={isStudent ? "student" : "admin"}
        canAccessDjangoAdmin={isAdmin}
        onToggleView={isAdmin ? handleToggleAdminView : null}
        viewMode="student"
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        {/* Banner if Platform Admin is previewing Student Panel */}
        {isAdmin && (
          <div
            style={{
              background: "rgba(240, 180, 41, 0.12)",
              borderBottom: "1px solid rgba(240, 180, 41, 0.35)",
              padding: "7px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12.5,
              color: "#fbbf24",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={14} color="#f59e0b" />
              <span>
                <strong>Administrator Preview Mode:</strong> You are viewing the Student Panel as a Platform Administrator.
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleAdminView}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: C.panel3,
                border: `1px solid rgba(240, 180, 41, 0.5)`,
                color: "#fde68a",
                borderRadius: 5,
                padding: "3px 9px",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={12} />
              Return to Admin Dashboard
            </button>
          </div>
        )}

        {studentPage !== "lab-detail" && (
          <Topbar
            name={studentFullName}
            role={isAdmin ? "Administrator (Previewing Student)" : "Student"}
            userType={isStudent ? "student" : "admin"}
            canAccessDjangoAdmin={isAdmin}
            onToggleView={isAdmin ? handleToggleAdminView : null}
            viewMode="student"
          />
        )}
        <div style={{ flex: 1, overflow: "hidden" }}>{pages[studentPage]}</div>
      </div>
    </div>
  );
}

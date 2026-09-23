import React, { useState } from "react";
import {
  FlaskConical, BookOpen, ClipboardList, Wallet, Activity,
  BarChart3, ScrollText, Settings, Target, TrendingUp,
  Trophy, Award, FileBadge, User
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

import AdminDashboard from "./src/components/admin/AdminDashboard";
import AdminStudents from "./src/components/admin/AdminStudents";
import AdminClasses from "./src/components/admin/AdminClasses";
import AdminSubjects from "./src/components/admin/AdminSubjects";
import AdminLabs from "./src/components/admin/AdminLabs";
import AdminMaterials from "./src/components/admin/AdminMaterials";


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
    if (user?.user_type === "admin") return "admin";
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
    if (user) setCurrentUser(user);
    setStage(role);
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

  if (stage === "login") {
    return (
      <div style={{ fontFamily: sans }}>
        <Login onLogin={handleLogin} initialNotice={sessionNotice} />
      </div>
    );
  }

  if (stage === "admin") {
    const pages = {
      "a-dashboard": <AdminDashboard onNavigate={setAdminPage} />,
      "a-students": <AdminStudents />,
      "a-classes": <AdminClasses />,
      "a-subjects": <AdminSubjects />,
      "a-labs": <AdminLabs onOpenAddModal={() => setAdminPage("a-dashboard")} />,
      "a-materials": <AdminMaterials />,
      "a-assignments": <Placeholder title="Assignments" blurb="Assign labs and materials to classes or individual students." icon={ClipboardList} />,
      "a-fees": <Placeholder title="Fees" blurb="Track payment status across every enrolled student." icon={Wallet} />,
      "a-activity": <Placeholder title="Activity" blurb="Live feed of lab attempts, completions, and logins." icon={Activity} />,
      "a-analytics": <Placeholder title="Analytics" blurb="Registrations, completions, and difficulty trends over time." icon={BarChart3} />,
      "a-audit": <Placeholder title="Audit Logs" blurb="Immutable record of administrative actions." icon={ScrollText} />,
      "a-settings": <Placeholder title="Settings" blurb="Platform configuration, instructors, and organization details." icon={Settings} />,
    };
    return (
      <div style={{ fontFamily: sans, display: "flex", height: "100vh", background: C.void, color: C.hi, overflow: "hidden" }}>
        <Sidebar items={NAV_ADMIN} active={adminPage} onSelect={setAdminPage} onSwitch={handleLogout} switchLabel="Sign out" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
          <Topbar
            placeholder="Search students, courses, labs..."
            name={currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : (currentUser?.username || "Admin")}
            role="Platform Administrator"
          />
          <div style={{ flex: 1, overflow: "hidden" }}>{pages[adminPage]}</div>
        </div>
      </div>
    );
  }

  // student stage
  const pages = {
    dashboard: <StudentDashboard go={goLab} />,
    learning: <Learning go={goLab} onSelect={setStudentPage} />,
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
    <div style={{ fontFamily: sans, display: "flex", height: "100vh", background: C.void, color: C.hi, overflow: "hidden" }}>
      <Sidebar
        items={NAV_STUDENT}
        active={studentPage === "lab-detail" ? "labs" : studentPage}
        onSelect={setStudentPage}
        onSwitch={handleLogout}
        switchLabel="Sign out"
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        {studentPage !== "lab-detail" && (
          <Topbar
            placeholder="Search labs, topics, vulnerabilities..."
            name={currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : (currentUser?.username || "Student")}
            role="Student"
          />
        )}
        <div style={{ flex: 1, overflow: "hidden" }}>{pages[studentPage]}</div>
      </div>
    </div>
  );
}

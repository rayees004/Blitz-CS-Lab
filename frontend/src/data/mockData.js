import {
  LayoutGrid, GraduationCap, FlaskConical, BookOpen, Trophy, TrendingUp, Award,
  FileBadge, User, Users, Layers, ClipboardList, Wallet, Activity, BarChart3,
  ScrollText, Settings, Target
} from "lucide-react";

export const LABS = [
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

export const CATEGORIES = [
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

export const CLASSES = [
  { name: "Bug Bounty Batch 01", students: 32, labs: 25, materials: 18, pct: 42, fee: "PAID" },
  { name: "Web Security — Evening", students: 24, labs: 18, materials: 12, pct: 61, fee: "DUE" },
  { name: "API Security Intensive", students: 15, labs: 14, materials: 9, pct: 30, fee: "PARTIAL" },
  { name: "OSINT Fundamentals", students: 28, labs: 10, materials: 7, pct: 78, fee: "PAID" },
];

export const NAV_STUDENT = [
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

export const NAV_ADMIN = [
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

import React, { useState } from "react";
import { api, setToken, User } from "../api";
import {
  Building2,
  Shield,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Clock,
  ChevronRight,
  ShieldAlert,
  ChevronDown
} from "lucide-react";

interface LoginProps {
  onSuccess: (user: User) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  // Tab: "signin" | "register"
  const [mode, setMode] = useState<"signin" | "register">("signin");
  
  // Selected Role (1 of 4 institutional roles)
  const [selectedRole, setSelectedRole] = useState("ADMIN");

  // Form Fields
  const [email, setEmail] = useState("admin@cit.ac.in");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [clubName, setClubName] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const roles = [
    {
      id: "ADMIN",
      title: "Admin",
      subtitle: "Dean's Office (Administration)",
      desc: "Full institutional privileges: master timetable solver, validator audits & disruption approvals",
      icon: Shield,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      accent: "text-amber-600",
      demoUser: "admin",
      demoPass: "admin123",
      defaultEmail: "dean.office@cit.ac.in"
    },
    {
      id: "DEPARTMENT_COORDINATOR",
      title: "Department Coordinator",
      subtitle: "Department Operations",
      desc: "Course & lab scheduling, departmental bookings review, workload balancing",
      icon: BookOpen,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      accent: "text-blue-600",
      demoUser: "coord_cse",
      demoPass: "coord123",
      defaultEmail: "coord.cse@cit.ac.in"
    },
    {
      id: "FACULTY",
      title: "Faculty Member",
      subtitle: "Teaching Faculty",
      desc: "Personal weekly grid, unavailability marking, AI-assisted rescheduling requests",
      icon: GraduationCap,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      accent: "text-purple-600",
      demoUser: "fac_f01",
      demoPass: "faculty123",
      defaultEmail: "ananya.mishra@cit.ac.in"
    },
    {
      id: "CLUB_REPRESENTATIVE",
      title: "Club Representative",
      subtitle: "Student Societies & Wings",
      desc: "Spectra fest venue requests, tracking approvals/rejections & cancellation",
      icon: Sparkles,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      accent: "text-emerald-600",
      demoUser: "club_dramatics",
      demoPass: "club123",
      defaultEmail: "dramatics.society@cit.ac.in"
    }
  ];

  const currentRoleInfo = roles.find((r) => r.id === selectedRole) || roles[0];

  const handleRoleDropdownChange = (roleId: string) => {
    const r = roles.find((item) => item.id === roleId);
    if (!r) return;
    setSelectedRole(r.id);
    setUsername(r.demoUser);
    setPassword(r.demoPass);
    setEmail(r.defaultEmail);
    setErr("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      if (mode === "register") {
        await api("/admin/users", "POST", {
          username: username.trim(),
          password: password,
          role: selectedRole,
          department: selectedRole === "DEPARTMENT_COORDINATOR" || selectedRole === "FACULTY" ? department : null,
          org: selectedRole === "CLUB_REPRESENTATIVE" ? clubName || "Student Club" : "CIT",
          active: true
        }).catch(() => {});
      }

      const cleanUser = username.trim() || email.trim();
      const res = await api("/auth/login", "POST", {
        username: cleanUser,
        password: password
      });

      setToken(res.token);
      const me = await api<User>("/me");
      if (onSuccess) onSuccess(me);
    } catch (error: any) {
      setErr(error.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (r: typeof roles[0]) => {
    setSelectedRole(r.id);
    setUsername(r.demoUser);
    setPassword(r.demoPass);
    setEmail(r.defaultEmail);
    setTimeout(() => {
      handleDirectLogin(r.demoUser, r.demoPass);
    }, 50);
  };

  const handleDirectLogin = async (u: string, p: string) => {
    setLoading(true);
    setErr("");
    try {
      const res = await api("/auth/login", "POST", {
        username: u,
        password: p
      });
      setToken(res.token);
      const me = await api<User>("/me");
      if (onSuccess) onSuccess(me);
    } catch (error: any) {
      setErr(error.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = currentRoleInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center text-slate-800">
      <div className="w-full min-h-screen grid lg:grid-cols-12 bg-white">
        
        {/* =========================================================================
            LEFT COLUMN: INTERACTIVE AUTHENTICATION & ROLE DROPDOWN FORM
            ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
          
          {/* Top Brand Header with Official Logo */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              
              {/* Official Logo Display */}
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="CampusNx9 Official Logo"
                  className="h-12 sm:h-14 w-auto object-contain hover:scale-105 transition-transform"
                />
                <div className="border-l border-slate-200 pl-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Chilika Institute of Technology
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    Campus Scheduling & Governance OS
                  </div>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signin"}
                  onClick={() => setMode("signin")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === "signin"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "register"}
                  onClick={() => setMode("register")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === "register"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {mode === "signin" ? "Sign in to CampusNx9" : "Create a CampusNx9 Account"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Select your institutional role from the dropdown below to access your role-based dashboard.
              </p>
            </div>

            {/* Error Message */}
            {err && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{err}</span>
              </div>
            )}

            {/* Institutional Rule Notice Banner */}
            <div className="mb-6 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Institutional Rule:</strong> Nobody can approve their own request. System-enforced.
                </span>
              </div>
              <span className="hidden sm:inline font-mono font-bold text-[10px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-800">
                ZERO HARD VIOLATIONS
              </span>
            </div>

            {/* 1. ROLE SELECTION DROPDOWN METHOD */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="role-dropdown-select"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <RoleIcon className={`w-4 h-4 ${currentRoleInfo.accent}`} />
                  Select Institutional Role
                </label>
                <span className="text-[11px] text-blue-600 font-medium">
                  Auto-fills demo credentials
                </span>
              </div>

              {/* Accessible Dropdown Selector */}
              <div className="relative">
                <select
                  id="role-dropdown-select"
                  value={selectedRole}
                  onChange={(e) => handleRoleDropdownChange(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all cursor-pointer shadow-sm pr-10"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} — {r.subtitle}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>

              {/* Active Role Permissions Card */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                <div className={`w-8 h-8 rounded-lg ${currentRoleInfo.badgeColor} flex items-center justify-center shrink-0`}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900">{currentRoleInfo.title} ({currentRoleInfo.subtitle})</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{currentRoleInfo.desc}</p>
                </div>
              </div>
            </div>

            {/* 2. AUTHENTICATION FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Ananya Mishra"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              {/* Institutional Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Email Address (@cit.ac.in)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (mode === "register" || !username) {
                        setUsername(e.target.value.split("@")[0]);
                      }
                    }}
                    placeholder="user@cit.ac.in"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Username (Internal system handle) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username / CIT Identity Handle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin, coord_cse, fac_f01"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Department / Org Fields (Contextual for Coordinator / Faculty / Club) */}
              {mode === "register" && (selectedRole === "DEPARTMENT_COORDINATOR" || selectedRole === "FACULTY") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="CSE">Computer Science & Engineering (CSE)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="ME">Mechanical Engineering (ME)</option>
                    <option value="CE">Civil Engineering (CE)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="MA">Mathematics (MA)</option>
                    <option value="PH">Physics (PH)</option>
                    <option value="HS">Humanities & Social Sciences (HS)</option>
                  </select>
                </div>
              )}

              {mode === "register" && selectedRole === "CLUB_REPRESENTATIVE" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Society / Club Name
                  </label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="e.g. Dramatics Society, Robotics Club"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  "Authenticating CIT User..."
                ) : (
                  <>
                    <span>{mode === "signin" ? `Sign In as ${currentRoleInfo.title}` : "Complete Registration"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Role Logins for Competition Judges */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Competition Judge Instant Login
                </span>
                <span className="text-[10px] text-slate-400">1-click demo</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleQuickDemoLogin(r)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all text-center truncate shadow-sm ${
                      selectedRole === r.id
                        ? "bg-blue-50 border-blue-400 text-blue-700 font-bold"
                        : "border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700"
                    }`}
                  >
                    ⚡ {r.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="mt-8 text-center text-xs text-slate-400">
            Chilika Institute of Technology · CampusNx9 Protected Infrastructure
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: INSTITUTIONAL SHOWCASE WITH OFFICIAL LOGO & SYSTEM MATRIX
            ========================================================================= */}
        <div className="hidden lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-10 xl:p-14 flex flex-col justify-between relative overflow-hidden">
          
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Showcase Header with Logo */}
          <div className="relative z-10">
            
            {/* Logo in showcase with rounded backdrop */}
            <div className="inline-block p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl mb-6">
              <img
                src="/logo.png"
                alt="CampusNx9"
                className="h-14 xl:h-16 w-auto object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-blue-200 mb-4 block w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Chilika Institute of Technology Scheduling OS</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Zero-Conflict Campus Operations & Timetable Intelligence
            </h2>

            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Powered by Google OR-Tools CP-SAT with mathematical verification of hard constraints H1–H14 and 6-tier institutional priority handling.
            </p>
          </div>

          {/* Center Showcase Stats Cards */}
          <div className="relative z-10 my-8 space-y-3.5">
            
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">189 Sessions Scheduled</div>
                  <div className="text-xs text-blue-200/80">14 Student Groups · 40 Faculty · 27 Rooms</div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2.5 py-1 rounded-full">
                0 Violations
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">41 Midsem Exams (Week 8)</div>
                  <div className="text-xs text-purple-200/80">Room capacities halved · AM / PM Allocations</div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold bg-purple-500/20 border border-purple-400/40 text-purple-300 px-2.5 py-1 rounded-full">
                Optimal
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Spectra Fest Priority Engine</div>
                  <div className="text-xs text-amber-200/80">6-Tier Hierarchy · 25 Booking Requests</div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full">
                Score: 67.0
              </div>
            </div>

          </div>

          {/* Bottom Banner */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Official Validator Python 3.14 Compatible</span>
            <span className="text-blue-300 font-semibold flex items-center gap-1">
              CIT Campus Grid <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

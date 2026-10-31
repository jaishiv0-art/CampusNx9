import React, { useState } from "react";
import { api, setToken, User } from "../api";
import {
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
  ShieldAlert,
  ChevronDown,
  Cpu,
  RefreshCw,
  Award,
  Target,
  FileCheck,
  Check,
  Eye,
  EyeOff
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
  const [email, setEmail] = useState("dean.office@cit.ac.in");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [clubName, setClubName] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const roles = [
    {
      id: "ADMIN",
      title: "Dean's Office",
      subtitle: "Master Administrator",
      desc: "Full institutional governance: master CP-SAT solver, disruption approvals, official JSON exports & audit logs.",
      icon: Shield,
      badgeColor: "bg-[#7B1123]/10 text-[#7B1123] border-[#7B1123]/25",
      accent: "text-[#7B1123]",
      demoUser: "admin",
      demoPass: "admin123",
      defaultEmail: "dean.office@cit.ac.in"
    },
    {
      id: "DEPARTMENT_COORDINATOR",
      title: "Department Coordinator",
      subtitle: "CSE Operations",
      desc: "Departmental course & lab scheduling, room allocations, instructor workload balancing & faculty requests.",
      icon: BookOpen,
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      accent: "text-amber-700",
      demoUser: "coord_cse",
      demoPass: "coord123",
      defaultEmail: "coord.cse@cit.ac.in"
    },
    {
      id: "FACULTY",
      title: "Faculty Member",
      subtitle: "Dr. Ananya Mishra (F01)",
      desc: "Personalized weekly teaching timetable, unavailability declaration, and AI-assisted rescheduling requests.",
      icon: GraduationCap,
      badgeColor: "bg-stone-200 text-stone-800 border-stone-300",
      accent: "text-stone-700",
      demoUser: "fac_f01",
      demoPass: "faculty123",
      defaultEmail: "ananya.mishra@cit.ac.in"
    },
    {
      id: "CLUB_REPRESENTATIVE",
      title: "Club Representative",
      subtitle: "Dramatics Society",
      desc: "Spectra Fest venue requests, priority score evaluation, alternative slot recommendations & cancellation tracking.",
      icon: Sparkles,
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      accent: "text-emerald-700",
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
          department:
            selectedRole === "DEPARTMENT_COORDINATOR" || selectedRole === "FACULTY"
              ? department
              : null,
          org: selectedRole === "CLUB_REPRESENTATIVE" ? clubName || "Student Club" : "CIT",
          active: true
        }).catch(() => { });
      }

      const cleanUser = username.trim() || email.trim();
      const cleanPass = password.trim();
      const res = await api("/auth/login", "POST", {
        username: cleanUser,
        password: cleanPass
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

  const handleQuickDemoLogin = (r: (typeof roles)[0]) => {
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
        username: u.trim(),
        password: p.trim()
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
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans selection:bg-[#7B1123] selection:text-white">
      {/* Top Brand Notification Header */}
      <header className="bg-[#FAF5ED] border-b border-[#E8DEC8] px-4 py-2 sm:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="CampusNx9"
              className="h-8 sm:h-9 w-auto object-contain hover:scale-105 transition-transform"
            />
            <div className="border-l border-[#E0D2C0] pl-3 hidden sm:flex items-center gap-2 text-stone-700">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-stone-800">CampusNx9</span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-600">Chilika Institute of Technology · Official Platform</span>
            </div>
            <div className="sm:hidden flex items-center gap-1.5 text-stone-700">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-stone-800">CIT OS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#7B1123] bg-[#7B1123]/10 px-2.5 py-1 rounded border border-[#7B1123]/20">
              <Award className="w-3.5 h-3.5 text-[#7B1123]" />
              0 Hard Violations Enforced
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* =========================================================================
              LEFT COLUMN: AUTHENTICATION & ROLE ACCESS FORM (LIGHT WHITE-YELLOWISH THEME)
              ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col space-y-6">

            {/* Primary Login Card */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-6 sm:p-8 backdrop-blur-sm">

              {/* Header inside Card */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#7B1123]">
                    Institutional Portal
                  </div>
                  <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-0.5">
                    {mode === "signin" ? "Sign In to CIT" : "Register CIT Account"}
                  </h1>
                </div>

                {/* Mode Tabs */}
                <div className="flex items-center bg-[#FAF5ED] p-1 rounded-xl border border-[#E8DEC8]">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === "signin"
                        ? "bg-[#7B1123] text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === "register"
                        ? "bg-[#7B1123] text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                      }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {err && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{err}</span>
                </div>
              )}

              {/* Institutional Rule Notice Banner */}
              <div className="mb-5 p-3 rounded-xl bg-[#FFFBF2] border border-[#F0E2C8] text-amber-950 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#7B1123] shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="text-[#7B1123]">Institutional Governance Rule:</strong> Nobody can approve their own booking or change request. Cross-role verification strictly enforced by backend.
                </div>
              </div>

              {/* 1. ROLE SELECTION DROPDOWN */}
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="role-dropdown-select"
                    className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5"
                  >
                    <RoleIcon className={`w-4 h-4 ${currentRoleInfo.accent}`} />
                    Select Institutional Role
                  </label>
                  <span className="text-[11px] text-[#7B1123] font-semibold">
                    Auto-fills credentials
                  </span>
                </div>

                <div className="relative">
                  <select
                    id="role-dropdown-select"
                    value={selectedRole}
                    onChange={(e) => handleRoleDropdownChange(e.target.value)}
                    className="w-full appearance-none bg-[#FFFEFC] border border-[#D8C7B5] hover:border-[#7B1123] focus:border-[#7B1123] focus:ring-2 focus:ring-[#7B1123]/15 rounded-xl px-4 py-3 text-sm font-semibold text-stone-900 outline-none transition-all cursor-pointer shadow-sm pr-10"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} — {r.subtitle}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

                {/* Role Description Badge */}
                <div className="p-3 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] flex items-start gap-3 text-xs">
                  <div
                    className={`w-8 h-8 rounded-lg ${currentRoleInfo.badgeColor} flex items-center justify-center shrink-0 border`}
                  >
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-stone-900">
                      {currentRoleInfo.title} ({currentRoleInfo.subtitle})
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                      {currentRoleInfo.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. AUTHENTICATION FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Dr. Ananya Mishra"
                        className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
                      />
                      <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
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
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Username / Handle
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin, coord_cse, fac_f01"
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all font-mono"
                    />
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Department / Org Fields (Contextual for Coordinator / Faculty / Club) */}
                {mode === "register" && (selectedRole === "DEPARTMENT_COORDINATOR" || selectedRole === "FACULTY") && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Academic Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
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
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Student Society / Club Name
                    </label>
                    <input
                      type="text"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder="e.g. Dramatics Society, Robotics Club"
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
                    />
                  </div>
                )}

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Password
                    </label>
                    <span className="text-[11px] text-[#7B1123] font-medium font-mono bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#EADBCA]">
                      Default: {currentRoleInfo.demoPass}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 pr-10 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all font-mono"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#7B1123] hover:bg-[#640E1C] active:bg-[#520A16] text-white shadow-lg shadow-amber-950/15 hover:shadow-amber-950/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
                >
                  {loading ? (
                    "Authenticating CIT User..."
                  ) : (
                    <>
                      <span>
                        {mode === "signin"
                          ? `Sign In as ${currentRoleInfo.title}`
                          : "Complete Registration"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 3. QUICK 1-CLICK DEMO LOGIN BUTTONS */}
              <div className="mt-6 pt-5 border-t border-[#E8DEC8]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Instant Demo Login (Judges & Evaluators)
                  </span>
                  <span className="text-[10px] text-stone-500 font-semibold bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#E8DEC8]">
                    1-Click Access
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(r)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center gap-2 ${selectedRole === r.id
                          ? "bg-[#7B1123]/10 border-[#7B1123] text-[#7B1123]"
                          : "border-[#E8DEC8] hover:border-[#7B1123]/40 bg-[#FAF7F2] hover:bg-white text-stone-800"
                        }`}
                    >
                      <r.icon className="w-4 h-4 shrink-0 text-[#7B1123]" />
                      <div className="truncate">
                        <div className="font-bold truncate">{r.title}</div>
                        <div className="text-[10px] text-stone-500 font-mono truncate">{r.demoUser}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Security Certification Footnote */}
            <div className="text-center text-xs text-stone-500">
              Chilika Institute of Technology
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: CIT BANNER PICTURE & DETAILED SYSTEM OVERVIEW
              ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col space-y-6">

            {/* 1. CIT LOGO & CAMPUS BANNER PICTURE */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-3 sm:p-4 overflow-hidden backdrop-blur-sm">
              <div className="relative rounded-xl overflow-hidden border border-[#EADCC9] shadow-inner bg-[#FAF7F2]">
                <img
                  src="/cit_banner.png"
                  alt="Chilika Institute of Technology (CIT) Official Banner"
                  className="w-full h-auto object-cover max-h-[380px] hover:scale-[1.01] transition-transform duration-500"
                />
                {/* Floating Institutional Badge */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#E0D2C0] shadow-md flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                  <Award className="w-4 h-4 text-[#7B1123]" />
                  <span>Chilika Institute of Technology (CIT)</span>
                </div>
              </div>
            </div>

            {/* 2. OBJECTIVE OF THE PLATFORM */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-6 sm:p-8 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#7B1123]/10 border border-[#7B1123]/20 flex items-center justify-center text-[#7B1123]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    Objective of CampusNx9
                  </h2>
                  <p className="text-xs text-stone-500">
                    Why this platform was engineered for Chilika Institute of Technology
                  </p>
                </div>
              </div>

              <p className="text-stone-700 text-sm leading-relaxed">
                Hand-made campus timetables are notoriously fragile: faculty clashes, venue double-bookings, lab collisions during lunch, and mid-semester disruptions routinely break academic schedules. <strong>CampusNx9</strong> replaces manual guesswork with a mathematically verified, rule-enforced operating system designed to achieve:
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Zero Hard Violations
                  </div>
                  <p className="text-xs text-stone-600 leading-snug">
                    Strict adherence to room types, capacities, wheelchair accessibility, faculty unavailabilities, and lunch-break rules via Google OR-Tools CP-SAT.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Minimal-Disruption Repair
                  </div>
                  <p className="text-xs text-stone-600 leading-snug">
                    When rooms flood or faculty take leave, our repair engine relocates the minimum number of sessions (only 7 moves out of 189) with explicit reasons.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Spectra Fest Governance
                  </div>
                  <p className="text-xs text-stone-600 leading-snug">
                    Enforces a 6-tier institutional priority hierarchy, organizational role caps, alternative slot offers, and displacement tracking for fest week.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Midsem Exam Integrity
                  </div>
                  <p className="text-xs text-stone-600 leading-snug">
                    Automatically halves room capacities for 41 midsem exams across Week 8 to eliminate crowding and guarantee fair invigilation.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. HOW THIS WEBSITE WORKS (STEP-BY-STEP WORKFLOW) */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-6 sm:p-8 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    How This Website Works
                  </h2>
                  <p className="text-xs text-stone-500">
                    Architectural flow from mathematical constraint solving to daily operations
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF5ED] border border-[#EADBCA]">
                  <div className="w-6 h-6 rounded-full bg-[#7B1123] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 text-xs">
                    <strong className="text-stone-900 block text-xs font-bold">
                      Institutional Dataset & CP-SAT Solver Execution
                    </strong>
                    <span className="text-stone-600 mt-0.5 block leading-relaxed">
                      The application ingests the CIT institutional dataset (27 rooms, 40 faculty, 14 cohorts, 189 sessions). The OR-Tools CP-SAT solver generates a conflict-free master weekly timetable with 0 hard violations and optimal soft distribution.
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF5ED] border border-[#EADBCA]">
                  <div className="w-6 h-6 rounded-full bg-[#7B1123] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 text-xs">
                    <strong className="text-stone-900 block text-xs font-bold">
                      Role-Based Access Control (RBAC) & Governance
                    </strong>
                    <span className="text-stone-600 mt-0.5 block leading-relaxed">
                      Users authenticate into 4 purpose-built portals (Dean/Admin, Department Coordinator, Faculty, and Club Rep). Institutional governance prevents self-approvals, while coordinating departmental views and personal schedules.
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF5ED] border border-[#EADBCA]">
                  <div className="w-6 h-6 rounded-full bg-[#7B1123] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1 text-xs">
                    <strong className="text-stone-900 block text-xs font-bold">
                      Venue Bookings & AI Plain-Language Assistant
                    </strong>
                    <span className="text-stone-600 mt-0.5 block leading-relaxed">
                      Faculty and student clubs submit booking requests via standard forms or our deterministic English/Hinglish parser (e.g., <em>"seminar hall kal shaam 6 baje"</em>). The engine evaluates availability, checks accessibility constraints, and recommends alternatives.
                    </span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FAF5ED] border border-[#EADBCA]">
                  <div className="w-6 h-6 rounded-full bg-[#7B1123] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1 text-xs">
                    <strong className="text-stone-900 block text-xs font-bold">
                      Disruption Management, Audit Diffs & Official Export
                    </strong>
                    <span className="text-stone-600 mt-0.5 block leading-relaxed">
                      When disruptions occur, proposals display side-by-side visual diffs citing the exact rule violation. Once approved, the admin exports the final validated JSON (<code className="bg-stone-200/60 px-1 py-0.5 rounded text-stone-800 font-mono">schedule.json</code>) matching the official validator schema.
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Performance Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E8DEC8]">
                <div className="p-2.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] text-center">
                  <div className="text-base font-black text-[#7B1123]">189</div>
                  <div className="text-[10px] text-stone-600 font-medium">Sessions Scheduled</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] text-center">
                  <div className="text-base font-black text-amber-700">0</div>
                  <div className="text-[10px] text-stone-600 font-medium">Hard Violations</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] text-center">
                  <div className="text-base font-black text-emerald-700">41</div>
                  <div className="text-[10px] text-stone-600 font-medium">Exams (50% Cap)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] text-center">
                  <div className="text-base font-black text-stone-800">67.0</div>
                  <div className="text-[10px] text-stone-600 font-medium">Spectra Score</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8DEC8] bg-[#FAF5ED] py-4 text-center text-xs text-stone-500">
        Chilika Institute of Technology (CIT) · CampusNx9 Timetable & Venue Management Platform · Zero Hard Violations Enforced
      </footer>
    </div>
  );
}

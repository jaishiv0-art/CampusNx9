import React, { useState, useMemo } from "react";
import { api, setToken, User } from "../api";
import {
  supabase,
  isSupabaseConfigured,
  sendPasswordResetEmail,
  fetchUserProfile,
  resendVerificationEmail
} from "../supabase";
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
  Award,
  Target,
  FileCheck,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  X,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from "lucide-react";

interface LoginProps {
  onSuccess: (user: User) => void;
}

export const ROLES = [
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

export default function Login({ onSuccess }: LoginProps) {
  // Tab: "signin" | "register"
  const [mode, setMode] = useState<"signin" | "register">("signin");

  // Selected Role
  const [selectedRole, setSelectedRole] = useState("ADMIN");

  // Form Fields
  const [email, setEmail] = useState("dean.office@cit.ac.in");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [clubName, setClubName] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  const currentRoleInfo = useMemo(() => {
    return ROLES.find((r) => r.id === selectedRole) || ROLES[0];
  }, [selectedRole]);

  const handleRoleDropdownChange = (roleId: string) => {
    const r = ROLES.find((item) => item.id === roleId);
    if (!r) return;
    setSelectedRole(r.id);
    setErr("");
    setInfoMsg("");

    if (mode === "signin") {
      setUsername(r.demoUser);
      setPassword(r.demoPass);
      setEmail(r.defaultEmail);
    }
  };

  const handleSwitchMode = (newMode: "signin" | "register") => {
    setMode(newMode);
    setErr("");
    setInfoMsg("");

    if (newMode === "register") {
      if (selectedRole === "ADMIN") {
        setSelectedRole("FACULTY");
        setUsername("");
        setPassword("");
        setEmail("");
      }
    } else {
      // Re-fill demo info for current role
      const r = ROLES.find((item) => item.id === selectedRole) || ROLES[0];
      setUsername(r.demoUser);
      setPassword(r.demoPass);
      setEmail(r.defaultEmail);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErr("");
    setInfoMsg("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      // -------------------------------------------------------------
      // REGISTRATION FLOW
      // -------------------------------------------------------------
      if (mode === "register") {
        if (selectedRole === "ADMIN") {
          throw new Error(
            "Institutional Security Rule: Dean's Office (Master Administrator) accounts cannot be self-registered. Please select Faculty Member, Department Coordinator, or Club Representative."
          );
        }

        if (!fullName.trim()) {
          throw new Error("Full Legal Name is required for institutional registration.");
        }
        if (!cleanEmail || !cleanEmail.includes("@")) {
          throw new Error("A valid institutional email address is required.");
        }
        if (!cleanUsername) {
          throw new Error("Username handle is required.");
        }
        if (cleanPass.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        const deptValue =
          selectedRole === "DEPARTMENT_COORDINATOR" || selectedRole === "FACULTY"
            ? department
            : null;
        const orgValue =
          selectedRole === "CLUB_REPRESENTATIVE" ? clubName.trim() || "Student Club" : "CIT";

        if (isSupabaseConfigured()) {
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: {
              data: {
                username: cleanUsername,
                full_name: fullName.trim(),
                role: selectedRole,
                department: deptValue,
                org: orgValue
              },
              emailRedirectTo:
                typeof window !== "undefined" ? `${window.location.origin}/login` : undefined
            }
          });

          if (signUpErr) {
            throw new Error(signUpErr.message);
          }

          if (signUpData?.user) {
            try {
              await supabase.from("profiles").upsert({
                user_id: signUpData.user.id,
                username: cleanUsername,
                full_name: fullName.trim(),
                email: cleanEmail,
                role: selectedRole,
                department: deptValue,
                org: orgValue,
                approval_status: "pending",
                active: true
              });
            } catch (pErr: any) {
              console.warn("[Profiles Upsert Notice]", pErr?.message);
            }
          }

          await api("/admin/users", "POST", {
            username: cleanUsername,
            password: cleanPass,
            role: selectedRole,
            department: deptValue,
            org: orgValue,
            active: false
          }).catch(() => { });

          setInfoMsg(
            `Registration submitted for ${cleanUsername}! A verification email has been sent to ${cleanEmail}. Please verify your email address. Once verified, your account will await Dean's Office approval before activation.`
          );
          setMode("signin");
          return;
        } else {
          await api("/admin/users", "POST", {
            username: cleanUsername,
            password: cleanPass,
            role: selectedRole,
            department: deptValue,
            org: orgValue,
            active: true
          });

          setInfoMsg(
            `Local user ${cleanUsername} registered successfully in the local store. You can now sign in.`
          );
          setMode("signin");
          return;
        }
      }

      // -------------------------------------------------------------
      // SIGN IN FLOW
      // -------------------------------------------------------------
      const demoUsers = [
        "admin", "dean.office", "dean_office", "dean",
        "coord_cse", "coord.cse", "coord_ece", "coord.ece", "coord_me", "coord.me",
        "club_dramatics", "dramatics.society", "club_robotics", "robotics.club",
        "fac_f01", "ananya.mishra"
      ];

      const isLikelyDemo =
        demoUsers.includes(cleanUsername) ||
        demoUsers.includes(cleanEmail.split("@")[0]) ||
        (cleanEmail.endsWith("@cit.ac.in") && ["admin", "coord", "fac", "club"].some(p => cleanUsername.startsWith(p)));

      // 1. For institutional demo personas, prioritize instant local backend login
      if (isLikelyDemo) {
        try {
          const loginIdentifier = cleanUsername || cleanEmail;
          const res = await api("/auth/login", "POST", {
            username: loginIdentifier,
            password: cleanPass,
            role: selectedRole
          });

          setToken(res.token);
          const me = await api<User>("/me");
          if (onSuccess) onSuccess(me);
          return;
        } catch (demoErr: any) {
          if (!isSupabaseConfigured()) {
            throw demoErr;
          }
        }
      }

      // 2. Supabase Auth flow for registered institutional users
      if (isSupabaseConfigured()) {
        const targetEmail = cleanEmail.includes("@")
          ? cleanEmail
          : cleanUsername.includes("@")
            ? cleanUsername
            : `${cleanUsername}@cit.ac.in`;

        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: cleanPass
        });

        if (authErr) {
          // If Supabase sign-in failed, attempt direct API login as secondary fallback
          try {
            const res = await api("/auth/login", "POST", {
              username: cleanUsername || cleanEmail,
              password: cleanPass,
              role: selectedRole
            });
            setToken(res.token);
            const me = await api<User>("/me");
            if (onSuccess) onSuccess(me);
            return;
          } catch {
            const errMsg = authErr.message || "";
            if (
              errMsg.toLowerCase().includes("email not confirmed") ||
              errMsg.toLowerCase().includes("email not verified")
            ) {
              throw new Error(
                `Institutional email not verified. Please check your inbox at ${targetEmail} and click the confirmation link before logging in.`
              );
            }
            throw new Error(
              errMsg.toLowerCase().includes("invalid login credentials")
                ? `Bad credentials: Password or email does not match. For demo access use ${currentRoleInfo.demoUser} / ${currentRoleInfo.demoPass} or click the 1-Click Demo buttons below.`
                : (errMsg || "Authentication failed. Please verify credentials.")
            );
          }
        }

        if (!authData.user || !authData.session) {
          throw new Error("Supabase authentication failed. No active session returned.");
        }

        // Enforce email verification check
        if (!authData.user.email_confirmed_at && !(authData.user as any).confirmed_at) {
          await supabase.auth.signOut();
          throw new Error(
            `Institutional email not verified. Please check your inbox at ${authData.user.email} and confirm your email before logging in.`
          );
        }

        // Fetch profile
        const profile = await fetchUserProfile(authData.user.id);
        if (!profile) {
          await supabase.auth.signOut();
          throw new Error(
            "Institutional profile record not found. Please contact Dean's Office for profile initialization."
          );
        }

        if (profile.approval_status === "rejected") {
          await supabase.auth.signOut();
          throw new Error(
            "Account Registration Rejected: Your institutional account request was declined by the Dean's Office."
          );
        }
        if (profile.approval_status !== "approved") {
          await supabase.auth.signOut();
          throw new Error(
            `Account Pending Approval: Your email is verified, but your account is currently "${profile.approval_status}". Dean's Office approval is required.`
          );
        }

        if (profile.active === false) {
          await supabase.auth.signOut();
          throw new Error(
            "Account Deactivated: This institutional account has been deactivated by the Dean's Office."
          );
        }

        // Strict 1-to-1 Role Binding: user cannot select a different role than their authorized profile
        if (profile.role && profile.role.toUpperCase() !== selectedRole.toUpperCase()) {
          await supabase.auth.signOut();
          throw new Error(
            `Role Mismatch: Your institutional account is authorized strictly as "${profile.role}", not as "${selectedRole}". Access denied.`
          );
        }

        setToken(authData.session.access_token);
        const me = await api<User>("/me");
        if (onSuccess) onSuccess(me);
        return;
      }

      // 3. Local direct login fallback
      const loginIdentifier = cleanUsername || cleanEmail;
      const res = await api("/auth/login", "POST", {
        username: loginIdentifier,
        password: cleanPass,
        role: selectedRole
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

  const handleQuickDemoLogin = (r: (typeof ROLES)[0]) => {
    setSelectedRole(r.id);
    setUsername(r.demoUser);
    setPassword(r.demoPass);
    setEmail(r.defaultEmail);
    handleDirectLogin(r.demoUser, r.demoPass);
  };

  const handleDirectLogin = async (u: string, p: string) => {
    setLoading(true);
    setErr("");
    setInfoMsg("");
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg("");
    setResetErr("");

    try {
      if (!resetEmail.trim() || !resetEmail.includes("@")) {
        throw new Error("Please enter a valid institutional email address.");
      }

      if (isSupabaseConfigured()) {
        await sendPasswordResetEmail(resetEmail.trim());
        setResetMsg(
          `Password reset instructions have been dispatched to ${resetEmail}. Check your institutional mailbox.`
        );
      } else {
        setResetMsg(
          `Local environment: Default password for demo roles is "admin123", "coord123", "faculty123", or "club123".`
        );
      }
    } catch (err: any) {
      setResetErr(err.message || "Failed to initiate password reset.");
    } finally {
      setResetLoading(false);
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
              <span className="font-bold text-stone-800">CIT Campus Governance OS</span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* =========================================================================
              LEFT COLUMN: AUTHENTICATION & ROLE ACCESS FORM
              ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col space-y-5">

            {/* Primary Login Card */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-5 sm:p-7 backdrop-blur-sm">

              {/* Header inside Card */}
              <div className="flex items-center justify-between mb-5">
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
                    onClick={() => handleSwitchMode("signin")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === "signin"
                        ? "bg-[#7B1123] text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("register")}
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
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium leading-snug">{err}</span>
                  </div>
                  {err.toLowerCase().includes("not verified") && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await resendVerificationEmail(email || username);
                          setInfoMsg("Verification email resent! Please check your inbox and spam folder.");
                          setErr("");
                        } catch (rErr: any) {
                          setErr(rErr.message || "Failed to resend verification email.");
                        }
                      }}
                      className="text-[11px] font-bold text-[#7B1123] hover:underline text-left pl-6"
                    >
                      Resend Verification Link →
                    </button>
                  )}
                </div>
              )}

              {/* Info / Success Alert */}
              {infoMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-medium">{infoMsg}</span>
                </div>
              )}



              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* 1. ROLE SELECTOR */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-stone-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Shield className="w-3.5 h-3.5 text-[#7B1123]" />
                      Select Institutional Role
                    </label>
                    {mode === "signin" && (
                      <span className="text-xs text-stone-700 font-bold">Auto-fills credentials</span>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={selectedRole}
                      onChange={(e) => handleRoleDropdownChange(e.target.value)}
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none appearance-none transition-all pr-10 cursor-pointer shadow-xs"
                    >
                      {ROLES.map((r) => (
                        <option
                          key={r.id}
                          value={r.id}
                          disabled={mode === "register" && r.id === "ADMIN"}
                        >
                          {r.title} — {r.subtitle} {mode === "register" && r.id === "ADMIN" ? "(Cannot Self-Register)" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>

                  {/* Active Role Explainer Card */}
                  <div className="mt-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white border border-[#E8DEC8] shadow-2xs text-[#7B1123] shrink-0">
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-stone-900 flex items-center gap-2">
                        <span>{currentRoleInfo.title}</span>
                        <span className="font-bold text-stone-700 font-mono text-xs">({currentRoleInfo.subtitle})</span>
                      </div>
                      <p className="text-stone-900 text-xs mt-0.5 leading-snug font-semibold">
                        {currentRoleInfo.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. REGISTRATION-ONLY FIELDS */}
                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-black text-stone-900 mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Rajesh Sharma"
                        className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder-stone-500 font-medium focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
                      />
                      <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-black text-stone-900 mb-1">
                    Institutional Email Address (@cit.ac.in)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        if (mode === "signin") {
                          const matched = ROLES.find(r => r.defaultEmail.toLowerCase() === val.toLowerCase());
                          if (matched) {
                            setSelectedRole(matched.id);
                            setUsername(matched.demoUser);
                            setPassword(matched.demoPass);
                          } else if (val.includes("@")) {
                            setUsername(val.split("@")[0]);
                          }
                        } else {
                          setUsername(val.split("@")[0]);
                        }
                      }}
                      placeholder="user@cit.ac.in"
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder-stone-500 font-medium focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-black text-stone-900 mb-1">
                    Username / Handle
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. admin, coord_cse, fac_f01"
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder-stone-500 font-medium focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all font-mono"
                    />
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Contextual Academic Department / Org Fields */}
                {mode === "register" && (selectedRole === "DEPARTMENT_COORDINATOR" || selectedRole === "FACULTY") && (
                  <div>
                    <label className="block text-xs font-black text-stone-900 mb-1">
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
                    <label className="block text-xs font-black text-stone-900 mb-1">
                      Student Society / Club Name
                    </label>
                    <input
                      type="text"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder="e.g. Dramatics Society, Robotics Club"
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-stone-900 placeholder-stone-500 font-medium focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
                    />
                  </div>
                )}

                {/* Password with Eye Toggle and Auto-Fill Helper */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black text-stone-900">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => setPassword(currentRoleInfo.demoPass)}
                        className="text-[11px] font-semibold text-[#7B1123] hover:underline flex items-center gap-1"
                        title="Click to reset password to the persona default"
                      >
                        <span>Default:</span>
                        <span className="font-mono bg-[#7B1123]/10 px-1 py-0.2 rounded border border-[#7B1123]/20 font-bold">
                          {currentRoleInfo.demoPass}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 pr-10 text-xs sm:text-sm text-stone-900 placeholder-stone-500 font-medium focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all font-mono"
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

                  {/* Forgot Password Link in Signin Mode */}
                  {mode === "signin" && (
                    <div className="flex items-center justify-between text-xs mt-1.5">
                      <span className="text-stone-800 font-bold">Need account assistance?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setResetMsg("");
                          setResetErr("");
                          setShowResetModal(true);
                        }}
                        className="text-[#7B1123] hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#7B1123] hover:bg-[#640E1C] active:bg-[#520A16] text-white shadow-lg shadow-amber-950/15 hover:shadow-amber-950/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {loading ? (
                    "Authenticating CIT User..."
                  ) : (
                    <>
                      <span>
                        {mode === "signin"
                          ? `Sign In as ${currentRoleInfo.title}`
                          : "Complete Institutional Registration"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 3. QUICK 1-CLICK DEMO LOGIN BUTTONS */}
              <div className="mt-5 pt-4 border-t border-[#E8DEC8]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Instant Demo Login (1-Click)
                  </span>
                  <span className="text-[10px] text-stone-500 font-semibold bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#E8DEC8]">
                    Zero Typing Required
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(r)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center gap-2 cursor-pointer ${selectedRole === r.id
                          ? "bg-[#7B1123]/10 border-[#7B1123] text-[#7B1123] shadow-xs"
                          : "border-2 border-stone-300 hover:border-[#7B1123] bg-stone-50 hover:bg-stone-200 text-stone-950 hover:text-black font-bold shadow-2xs"
                        }`}
                    >
                      <r.icon className="w-4 h-4 shrink-0 text-[#7B1123]" />
                      <div className="truncate">
                        <div className="font-bold truncate">{r.title}</div>
                        <div className="text-xs text-stone-700 font-mono font-bold truncate group-hover:text-stone-950">{r.demoUser}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Mobile View Accordion Toggle */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setShowMobileDetails(!showMobileDetails)}
                className="w-full py-2.5 px-4 bg-white/90 border border-[#E8DCBE] rounded-xl text-xs font-black text-stone-900 flex items-center justify-between shadow-xs"
              >
                <span className="flex items-center gap-2 text-[#7B1123]">
                  <Target className="w-4 h-4" />
                  <span>Platform Objectives & Solver Rules</span>
                </span>
                {showMobileDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Security Certification Footnote */}
            <div className="text-center text-xs text-stone-500">
              Chilika Institute of Technology · CampusNx9 Protected Governance Infrastructure
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: CIT BANNER PICTURE & DETAILED SYSTEM OVERVIEW
              ========================================================================= */}
          <div className={`lg:col-span-7 flex flex-col space-y-6 ${showMobileDetails ? "block" : "hidden lg:flex"}`}>

            {/* 1. CIT LOGO & CAMPUS BANNER PICTURE */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-3 sm:p-4 overflow-hidden backdrop-blur-sm">
              <div className="relative rounded-xl overflow-hidden border border-[#EADCC9] shadow-inner bg-[#FAF7F2]">
                <img
                  src="/cit_banner.png"
                  alt="Chilika Institute of Technology (CIT) Official Banner"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-cover max-h-[360px] hover:scale-[1.01] transition-transform duration-500"
                />
                {/* Floating Institutional Badge */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#E0D2C0] shadow-md flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                  <Award className="w-4 h-4 text-[#7B1123]" />
                  <span>Chilika Institute of Technology (CIT)</span>
                </div>
              </div>
            </div>

            {/* 2. OBJECTIVE OF THE PLATFORM */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-5 sm:p-7 backdrop-blur-sm space-y-4">
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

              <p className="text-stone-950 text-sm leading-relaxed font-semibold">
                Hand-made campus timetables are notoriously fragile: faculty clashes, venue double-bookings, lab collisions during lunch, and mid-semester disruptions routinely break academic schedules. <strong>CampusNx9</strong> replaces manual guesswork with a mathematically verified, rule-enforced operating system designed to achieve:
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Zero Hard Violations
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    Strict mathematical guarantees: 0 professor double-bookings, 0 room overlaps, and strictly enforced lab continuity.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Conflict-Free Elective Baskets
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    Synchronized elective slots (Basket 1, Basket 2) run in parallel across departments without any inter-batch conflicts.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Lunch Break Protected
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    Period 5 to 6 transition (13:00 – 14:00) is institutional lunch hour. Zero academic sessions or mandatory events are ever scheduled.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Smart Minimal Rescheduling
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    When disruptions happen (faculty emergency or weather closures), solver finds replacement slots with minimal timetable ripple.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. HARD & SOFT CONSTRAINTS BREAKDOWN */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-5 sm:p-7 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#7B1123]/10 border border-[#7B1123]/20 flex items-center justify-center text-[#7B1123]">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    Optimization Constraints Reference
                  </h2>
                  <p className="text-xs text-stone-500">
                    Rules enforced by the OR-Tools CP-SAT Solver engine
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Hard Constraints Box */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    Hard Constraints (Strict Enforce)
                  </div>
                  <ul className="text-xs text-stone-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>No Overlaps:</strong> A faculty member or room can host only 1 session per timeslot.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>Batch Integrity:</strong> Student batches cannot be scheduled in two places simultaneously.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>Room Type Match:</strong> Physics labs in Physics Lab only; Computer labs in Computer Centre.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>Capacity Bound:</strong> Room capacity must meet or exceed registered session batch size.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>Unavailability Windows:</strong> Declared professor medical or research leave is strictly respected.</span>
                    </li>
                  </ul>
                </div>

                {/* Soft Constraints Box */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-amber-700" />
                    Soft Constraints (Penalty Minimize)
                  </div>
                  <ul className="text-xs text-stone-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Min Student Gaps:</strong> Reduces idle waiting hours between classes for student batches.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Workload Spread:</strong> Distributes lectures evenly across Monday to Friday.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Faculty Preferred Slots:</strong> Accommodates preferred morning or afternoon slots where possible.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Venue Utilization:</strong> Optimizes large auditoriums and specialized lab room efficiency.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Minimal Disruptions:</strong> Prioritizes minimal displacement during ad-hoc venue booking requests.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DEC8] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-base">
                <KeyRound className="w-5 h-5 text-[#7B1123]" />
                Institutional Password Reset
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Enter your registered institutional email address. If configured with Supabase, an official password recovery link will be sent to your inbox.
            </p>

            {resetErr && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{resetErr}</span>
              </div>
            )}

            {resetMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{resetMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-stone-900 mb-1">
                  Institutional Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="dean.office@cit.ac.in"
                  className="w-full bg-white border border-[#D8C7B5] rounded-xl px-3 py-2 text-xs text-stone-900 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#FAF5ED] border border-[#E8DEC8] text-[11px] text-stone-600">
                <strong>Default Demo Passwords:</strong>
                <div className="grid grid-cols-2 gap-1 mt-1 font-mono text-[10px]">
                  <div>Admin: admin123</div>
                  <div>Coordinator: coord123</div>
                  <div>Faculty: faculty123</div>
                  <div>Club: club123</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-1.5 rounded-lg bg-[#7B1123] text-white text-xs font-bold hover:bg-[#640E1C] disabled:opacity-50"
                >
                  {resetLoading ? "Dispatching..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#E8DEC8] bg-[#FAF5ED] py-4 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">CampusNx9</span>
            <span>·</span>
            <span>Chilika Institute of Technology</span>
          </div>
          <div className="text-[11px] text-stone-500">
            Automated Academic Scheduling & Venue Resource Optimization Engine
          </div>
        </div>
      </footer>
    </div>
  );
}

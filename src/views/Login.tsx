import React, { useState } from "react";
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
  EyeOff,
  KeyRound,
  X
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
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [clubName, setClubName] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

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
        const fac = roles.find((r) => r.id === "FACULTY");
        if (fac) {
          setUsername("");
          setPassword("");
          setEmail("");
        }
      }
    } else {
      // Re-fill demo info for current role
      const r = roles.find((item) => item.id === selectedRole) || roles[0];
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
        // Enforce institutional rule: Never allow user to self-assign Admin privileges
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
          // 1. Supabase signUp() with user metadata
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

          // 2. Ensure public.profiles record is created with approval_status = 'pending'
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

          // 3. Best-effort registration into backend store for joins
          await api("/admin/users", "POST", {
            username: cleanUsername,
            password: cleanPass,
            role: selectedRole,
            department: deptValue,
            org: orgValue,
            active: false
          }).catch(() => {});

          setInfoMsg(
            `Registration submitted for ${cleanUsername}! A verification email has been sent to ${cleanEmail}. Please verify your email address. Once verified, your account will await Dean's Office approval before activation.`
          );
          setMode("signin");
          return;
        } else {
          // Local development fallback without active Supabase credentials
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
      const isDemoAccount = ["admin", "coord_cse", "fac_f01", "club_dramatics"].includes(
        cleanUsername
      );

      // If Supabase is configured and not an offline demo user, authenticate via Supabase
      if (isSupabaseConfigured() && !isDemoAccount) {
        const targetEmail = cleanEmail.includes("@")
          ? cleanEmail
          : cleanUsername.includes("@")
          ? cleanUsername
          : `${cleanUsername}@cit.ac.in`;

        // 1. Authenticate using Supabase signInWithPassword()
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: cleanPass
        });

        if (authErr) {
          const errMsg = authErr.message || "";
          if (
            errMsg.toLowerCase().includes("email not confirmed") ||
            errMsg.toLowerCase().includes("email not verified")
          ) {
            throw new Error(
              `Institutional email not verified. Please check your inbox at ${targetEmail} and click the verification link before logging in.`
            );
          }
          throw new Error(errMsg || "Invalid institutional email or password.");
        }

        if (!authData.user || !authData.session) {
          throw new Error("Supabase authentication failed. No active session returned.");
        }

        // 2. Enforce email confirmation check on the authenticated user object
        if (!authData.user.email_confirmed_at && !(authData.user as any).confirmed_at) {
          await supabase.auth.signOut();
          throw new Error(
            `Institutional email not verified. Please check your inbox at ${authData.user.email} and confirm your email before logging in.`
          );
        }

        // 3. Fetch authenticated user's profile from public.profiles
        const profile = await fetchUserProfile(authData.user.id);

        if (!profile) {
          await supabase.auth.signOut();
          throw new Error(
            "Institutional profile record not found. Please contact the Dean's Office for profile initialization."
          );
        }

        // 4. Verify that the supplied username matches the authenticated user's profile
        if (cleanUsername && profile.username) {
          const suppliedUser = cleanUsername.split("@")[0].trim().toLowerCase();
          const profileUser = profile.username.trim().toLowerCase();
          if (suppliedUser !== profileUser) {
            await supabase.auth.signOut();
            throw new Error(
              `Username mismatch: The supplied username "${username}" does not match the registered profile handle "${profile.username}".`
            );
          }
        }

        // 5. Check profile approval_status
        if (profile.approval_status === "rejected") {
          await supabase.auth.signOut();
          throw new Error(
            "Account Registration Rejected: Your institutional account request was declined by the Dean's Office. Please contact administration."
          );
        }
        if (profile.approval_status !== "approved") {
          await supabase.auth.signOut();
          throw new Error(
            `Account Pending Approval: Your email is verified, but your account is currently "${profile.approval_status}". Dean's Office approval is required before logging in.`
          );
        }

        // 6. Check active account status
        if (profile.active === false) {
          await supabase.auth.signOut();
          throw new Error(
            "Account Deactivated: This institutional account has been deactivated by the Dean's Office."
          );
        }

        // 7. Set Supabase access token for subsequent backend API requests
        setToken(authData.session.access_token);

        // 8. Call /me endpoint which verifies the token and returns authorized role
        const me = await api<User>("/me");
        if (onSuccess) onSuccess(me);
        return;
      }

      // Local / Instant Demo Account Login Fallback
      const loginIdentifier = cleanUsername || cleanEmail;
      const res = await api("/auth/login", "POST", {
        username: loginIdentifier,
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
      await sendPasswordResetEmail(resetEmail.trim());
      setResetMsg(
        `Password reset link has been dispatched to ${resetEmail.trim()}. Please check your inbox.`
      );
    } catch (resetError: any) {
      setResetErr(resetError.message || "Failed to send password reset email.");
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
                    onClick={() => handleSwitchMode("signin")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      mode === "signin"
                        ? "bg-[#7B1123] text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("register")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      mode === "register"
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
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{err}</span>
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
                      Resend Verification Email →
                    </button>
                  )}
                </div>
              )}

              {/* Success Info Banner */}
              {infoMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="font-medium">{infoMsg}</span>
                </div>
              )}

              {/* Institutional Rule Notice Banner */}
              <div className="mb-5 p-3 rounded-xl bg-[#FFFBF2] border border-[#F0E2C8] text-amber-950 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#7B1123] shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong className="text-[#7B1123]">Institutional Governance Rule:</strong> Nobody can approve their own booking or change request. Cross-role verification strictly enforced by backend.
                </div>
              </div>

              {/* Notice for Dean's Office in Register Mode */}
              {mode === "register" && selectedRole === "ADMIN" && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="text-rose-700">Administrative Provisioning Policy:</strong> Dean's Office (Master Administrator) accounts are centrally issued by the CIT Board. Self-registration is restricted. Please select <em>Faculty Member</em>, <em>Department Coordinator</em>, or <em>Club Representative</em>.
                  </div>
                </div>
              )}

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
                  {mode === "signin" && (
                    <span className="text-[11px] text-[#7B1123] font-semibold">
                      Auto-fills credentials
                    </span>
                  )}
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
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
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

                  {/* Forgot Password Link in Signin Mode */}
                  {mode === "signin" && (
                    <div className="flex items-center justify-between text-xs mt-1.5">
                      <span className="text-stone-500">Institutional Access Help</span>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setResetMsg("");
                          setResetErr("");
                          setShowResetModal(true);
                        }}
                        className="text-[#7B1123] font-semibold hover:underline flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3 text-[#7B1123]" />
                        Forgot password?
                      </button>
                    </div>
                  )}
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
                          : "Complete Institutional Registration"}
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
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center gap-2 ${
                        selectedRole === r.id
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
              Chilika Institute of Technology · CampusNx9 Protected Governance Infrastructure
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
                    Strict mathematical guarantees: 0 professor double-bookings, 0 room overlaps, and strictly enforced lab continuity.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Conflict-Free Elective Baskets
                  </div>
                  <p className="text-xs text-stone-600 leading-snug">
                    Synchronized elective slots (Basket 1, Basket 2) run in parallel across departments without any inter-batch conflicts.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Lunch Break Protected
                  </div>
                  <p className="text-xs text-stone-600 leading-snug">
                    Period 4 (12:45 – 13:45) is institutional lunch hour. Zero academic sessions or mandatory events are ever scheduled.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Smart Minimal Rescheduling
                  </div>
                  <p className="text-xs text-stone-600 leading-snug">
                    When disruptions happen (faculty emergency or weather closures), solver finds replacement slots with minimal timetable ripple.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. HARD & SOFT CONSTRAINTS BREAKDOWN */}
            <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-6 sm:p-8 backdrop-blur-sm space-y-5">
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
                      <span><strong>Student Group Integrity:</strong> A batch (e.g. CSE_A) can never have conflicting concurrent classes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>Lab Block Integrity:</strong> Practical labs require 2 continuous periods without break.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>Lunch Break Sanctuary:</strong> Period 4 is completely locked against academic scheduling.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                      <span><strong>Room Suitability:</strong> Lab sessions strictly scheduled into designated laboratory rooms with required equipment.</span>
                    </li>
                  </ul>
                </div>

                {/* Soft Constraints Box */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <Target className="w-4 h-4 text-amber-700" />
                    Soft Constraints (Cost Minimized)
                  </div>
                  <ul className="text-xs text-stone-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Workload Spread:</strong> Maximum 4 teaching periods per day per professor to prevent burnout.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Preferred Slots:</strong> Early morning vs afternoon preferences weighed according to department policy.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Campus Travel Buffer:</strong> Minimum 1 period between Main Campus and North Annex buildings.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Student Gap Minimization:</strong> Unproductive idle gaps between lectures kept below 1 period.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                      <span><strong>Extracurricular Shielding:</strong> Wednesday afternoon period 6–7 prioritized for clubs and society events.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* =========================================================================
          PASSWORD RESET MODAL
          ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DCBE] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
              <div className="flex items-center gap-2 text-stone-900">
                <div className="w-8 h-8 rounded-lg bg-[#7B1123]/10 border border-[#7B1123]/25 flex items-center justify-center text-[#7B1123]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black">Reset Account Password</h3>
                  <p className="text-[11px] text-stone-500">Chilika Institute of Technology</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Enter your registered institutional email address. If an account is associated with this email, Supabase will dispatch a secure password reset link.
            </p>

            {resetErr && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{resetErr}</span>
              </div>
            )}

            {resetMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resetMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Institutional Email (@cit.ac.in)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="user@cit.ac.in"
                    className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3 py-2.5 pl-9 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7B1123] text-white hover:bg-[#640E1C] active:bg-[#520A16] shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {resetLoading ? "Sending Link..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

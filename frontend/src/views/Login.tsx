import React, { useState, useMemo, useEffect, useRef } from "react";
import AmbientBackground from "../components/AmbientBackground";
import ScrollReveal from "../components/ScrollReveal";
import { DecorativeLineV } from "../components/DecorativeLines";
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
  // Tab: "signin" | "register" — defaults to "register" as requested
  const [mode, setMode] = useState<"signin" | "register">("register");

  // Selected Role (default to FACULTY for registration, since ADMIN cannot self-register)
  const [selectedRole, setSelectedRole] = useState("FACULTY");

  // Form Fields
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [clubName, setClubName] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
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
    setRegisteredUser(null);

    if (newMode === "register") {
      if (selectedRole === "ADMIN") {
        setSelectedRole("FACULTY");
      }
      // If fields contain demo username, reset for clean registration input
      const r = ROLES.find((item) => item.id === selectedRole) || ROLES[0];
      if (username === r.demoUser || username === "admin") {
        setUsername("");
        setPassword("");
        setEmail("");
      }
    } else {
      // If fields are empty when switching to signin, fill demo info for quick testing
      if (!username || !password) {
        const r = ROLES.find((item) => item.id === selectedRole) || ROLES[0];
        setUsername(r.demoUser);
        setPassword(r.demoPass);
        setEmail(r.defaultEmail);
      }
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
          throw new Error("A valid institutional email address is required (e.g. user@cit.ac.in).");
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

        // Call backend registration endpoint
        const regRes = await api<{
          ok: boolean;
          token: string;
          verified: boolean;
          user: User;
          message: string;
        }>("/auth/register", "POST", {
          username: cleanUsername,
          password: cleanPass,
          email: cleanEmail,
          full_name: fullName.trim(),
          role: selectedRole,
          department: deptValue,
          org: orgValue
        });

        if (regRes.token) {
          setToken(regRes.token);
        }

        // Also sync with Supabase if configured in environment
        if (isSupabaseConfigured()) {
          try {
            await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPass,
              options: {
                data: {
                  username: cleanUsername,
                  full_name: fullName.trim(),
                  role: selectedRole,
                  department: deptValue,
                  org: orgValue
                }
              }
            });
          } catch (sbErr) {
            console.warn("[Supabase Sync]", sbErr);
          }
        }

        const newUser = regRes.user || {
          username: cleanUsername,
          role: selectedRole,
          department: deptValue,
          org: orgValue,
          email: cleanEmail,
          full_name: fullName.trim()
        };

        setRegisteredUser(newUser as User);
        setInfoMsg(
          regRes.message ||
            `Account successfully registered and verified for ${cleanUsername}! You are now authenticated.`
        );
        return;
      }

      // -------------------------------------------------------------
      // SIGN IN FLOW
      // -------------------------------------------------------------
      const loginIdentifier = cleanUsername || cleanEmail;

      const isLikelyDemo =
        demoUsers.includes(cleanUsername) ||
        demoUsers.includes(cleanEmail.split("@")[0]) ||
        (cleanEmail.endsWith("@cit.ac.in") && ["admin", "coord", "fac", "club"].some(p => cleanUsername.startsWith(p)));

      // 1. For institutional demo personas, prioritize instant local backend login
      if (isLikelyDemo) {
        try {
          const loginIdentifier = cleanUsername || cleanEmail;
          const res = await api<{ token: string; user?: User }>("/auth/login", "POST", {
            username: loginIdentifier,
            password: cleanPass,
            role: selectedRole
          });

          if (res.token) {
            setToken(res.token);
            const me = await api<User>("/me");
            if (onSuccess) onSuccess(me);
            return;
          }
        } catch (loginErr: any) {
          console.warn("[Demo Login Notice]", loginErr?.message);
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
            const res = await api<{ token: string; user?: User }>("/auth/login", "POST", {
              username: cleanUsername || cleanEmail,
              password: cleanPass,
              role: selectedRole
            });
            setToken(res.token);
            const me = await api<User>("/me");
            if (onSuccess) onSuccess(me);
            return;
          } catch {}
        } else {
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
      }

      // 3. Local direct login fallback
      const res = await api<{ token: string; user?: User }>("/auth/login", "POST", {
        username: loginIdentifier,
        password: cleanPass,
        role: selectedRole
      });

      setToken(res.token);
      const me = await api<User>("/me");
      if (onSuccess) onSuccess(me);
      return;
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setLoading(true);
    setErr("");
    setInfoMsg("");

    try {
      if (!isSupabaseConfigured()) {
        throw new Error(
          "Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, or use the 1-Click Demo buttons below."
        );
      }

      // Persist chosen institutional role so Google account binds strictly 1-to-1 to this role
      if (typeof window !== "undefined") {
        localStorage.setItem("cit_auth_bound_role", selectedRole);
        sessionStorage.setItem("cit_auth_bound_role", selectedRole);
      }

      const redirectUrl = typeof window !== "undefined" ? window.location.origin : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url && typeof window !== "undefined") {
        window.location.assign(data.url);
      }
    } catch (error: any) {
      setErr(error.message || "Failed to initiate Google Sign-In.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setGoogleLoading(false);
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
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans selection:bg-[#7B1123] selection:text-white relative overflow-hidden">
      {/* Premium Ambient Background */}
      <AmbientBackground variant="hero" showGrid />
      {/* Top Brand Notification Header */}
      <header className="bg-[#FAF5ED]/90 backdrop-blur-md border-b border-[#E8DEC8] px-4 py-2 sm:px-8 shadow-xs relative z-10" style={{ animation: 'fade-down 0.5s cubic-bezier(0.19,1,0.22,1) both' }}>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* =========================================================================
              LEFT COLUMN: AUTHENTICATION & ROLE ACCESS FORM
              ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col space-y-5" style={{ animation: 'fade-right 0.7s cubic-bezier(0.19,1,0.22,1) 0.1s both' }}>

            {/* Primary Login Card */}
            <div className="card-premium bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-5 sm:p-7 backdrop-blur-sm">

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

              {/* Verified Account Action Banner */}
              {registeredUser && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-50/95 border border-emerald-300 text-emerald-950 text-xs space-y-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                        <span>Institutional Identity Verified</span>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-200 text-emerald-800 font-bold uppercase tracking-wide">
                          Active & Verified
                        </span>
                      </div>
                      <div className="text-emerald-800 mt-1 leading-relaxed">
                        Account created for <strong>{registeredUser.full_name || registeredUser.username}</strong> (@{registeredUser.username}).<br />
                        Designation: <span className="font-bold text-[#7B1123]">{registeredUser.role}</span> {registeredUser.department ? `(${registeredUser.department})` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSuccess(registeredUser)}
                      className="px-4 py-2 rounded-xl bg-[#7B1123] hover:bg-[#600d1b] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/15 cursor-pointer transition-all"
                    >
                      <span>Enter CIT Dashboard Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode("signin")}
                      className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs cursor-pointer transition-all"
                    >
                      Or Test Sign In
                    </button>
                  </div>
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
                  className="btn-premium w-full py-3 px-4 rounded-xl text-sm font-bold bg-[#7B1123] text-white shadow-lg shadow-amber-950/15 hover:shadow-amber-950/25 disabled:opacity-50 mt-2 cursor-pointer"
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
                      <ArrowRight className="w-4 h-4 btn-arrow" />
                    </>
                  )}
                </button>
              </form>

              {/* Institutional Single Sign-On (Google OAuth) */}
              <div className="relative my-3.5 text-center">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-[#E8DEC8]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2.5 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                    Or continue with Google
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border-2 border-stone-300 hover:border-[#7B1123] bg-white hover:bg-stone-50 text-stone-800 transition-all flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-[#7B1123] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
              </button>


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
                      style={{ animation: `fade-up-subtle 0.4s cubic-bezier(0.19,1,0.22,1) ${0.1 + ROLES.indexOf(r) * 0.06}s both` }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center gap-2 cursor-pointer hover:translate-y-[-1px] hover:shadow-md ${
                        selectedRole === r.id
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
          <div className={`lg:col-span-7 flex flex-col space-y-6 ${showMobileDetails ? "block" : "hidden lg:flex"}`} style={{ animation: 'fade-left 0.7s cubic-bezier(0.19,1,0.22,1) 0.2s both' }}>
            {/* 1. CIT LOGO & CAMPUS BANNER PICTURE */}
            <div className="card-premium bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-3 sm:p-4 overflow-hidden backdrop-blur-sm">
              <div className="img-reveal relative rounded-xl overflow-hidden border border-[#EADCC9] shadow-inner bg-[#FAF7F2]">
                <img
                  src="/cit_banner.png"
                  alt="Chilika Institute of Technology (CIT) Official Banner"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-cover max-h-[360px] transition-transform duration-700"
                />
                {/* Floating Institutional Badge */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#E0D2C0] shadow-md flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                  <Award className="w-4 h-4 text-[#7B1123]" />
                  <span>Chilika Institute of Technology (CIT)</span>
                </div>
              </div>
            </div>

            {/* Decorative connecting line between sections */}
            <div className="flex justify-center -my-3 relative z-10">
              <DecorativeLineV height={40} />
            </div>

            {/* 2. OBJECTIVE OF THE PLATFORM */}
            <div className="card-premium bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-5 sm:p-7 backdrop-blur-sm space-y-4" style={{ animation: 'fade-up 0.6s cubic-bezier(0.19,1,0.22,1) 0.3s both' }}>
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
                <ScrollReveal delay={0.1} className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs group">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 group-hover:scale-110" />
                    Zero Hard Violations
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    Strict mathematical guarantees: 0 professor double-bookings, 0 room overlaps, and strictly enforced lab continuity.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.18} className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs group">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 group-hover:scale-110" />
                    Conflict-Free Elective Baskets
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    Synchronized elective slots (Basket 1, Basket 2) run in parallel across departments without any inter-batch conflicts.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.26} className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs group">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 group-hover:scale-110" />
                    Lunch Break Protected
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    Period 5 to 6 transition (13:00 – 14:00) is institutional lunch hour. Zero academic sessions or mandatory events are ever scheduled.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.34} className="p-3.5 rounded-xl bg-white border-2 border-stone-300 hover:border-[#7B1123] hover:bg-stone-100 transition-all space-y-1 shadow-2xs group">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7B1123]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 group-hover:scale-110" />
                    Smart Minimal Rescheduling
                  </div>
                  <p className="text-xs text-stone-900 leading-snug font-bold">
                    When disruptions happen (faculty emergency or weather closures), solver finds replacement slots with minimal timetable ripple.
                  </p>
                </ScrollReveal>
              </div>
            </div>

            {/* Decorative connecting line between sections */}
            <div className="flex justify-center -my-3 relative z-10">
              <DecorativeLineV height={40} />
            </div>

            {/* 3. HARD & SOFT CONSTRAINTS BREAKDOWN */}
            <div className="card-premium bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xl shadow-amber-900/5 p-5 sm:p-7 backdrop-blur-sm space-y-4" style={{ animation: 'fade-up 0.6s cubic-bezier(0.19,1,0.22,1) 0.45s both' }}>
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

      {/* Premium Footer */}
      <footer className="relative z-10 border-t border-[#E8DEC8] bg-gradient-to-b from-[#FAF5ED]/95 to-[#F5EFE4]/95 backdrop-blur-md py-5 px-4 sm:px-8 mt-auto">
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7B1123]/20 to-transparent" />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#7B1123]/10 border border-[#7B1123]/20 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded bg-[#7B1123]" />
            </div>
            <div>
              <span className="font-bold text-stone-800 text-sm">Campus<span className="text-[#7B1123]">Nx9</span></span>
              <span className="text-stone-400 mx-1.5">·</span>
              <span>Chilika Institute of Technology</span>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-2">
            <span>Automated Academic Scheduling</span>
            <span className="text-stone-300">·</span>
            <span className="font-semibold text-[#7B1123]">Zero Violations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

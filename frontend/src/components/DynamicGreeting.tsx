import React, { useState, useEffect, useMemo, useRef } from "react";
import { User, RoleType, roleBadgeInfo } from "../api";
import {
  ShieldCheck,
  BookOpen,
  GraduationCap,
  Sparkles,
  Clock,
  Calendar,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  Sparkle
} from "lucide-react";

interface DynamicGreetingProps {
  user: User;
  variant?: "banner" | "compact";
  className?: string;
}

/**
 * Returns time-appropriate greeting and icon based on current local hour
 */
function getTimeGreeting(date = new Date()): { prefix: string; periodLabel: string; icon: React.ComponentType<{ className?: string }> } {
  const hour = date.getHours();
  if (hour >= 4 && hour < 12) {
    return { prefix: "Good Morning", periodLabel: "Morning Session", icon: Sun };
  } else if (hour >= 12 && hour < 17) {
    return { prefix: "Good Afternoon", periodLabel: "Afternoon Session", icon: Sun };
  } else if (hour >= 17 && hour < 22) {
    return { prefix: "Good Evening", periodLabel: "Evening Session", icon: Sunset };
  } else {
    return { prefix: "Good Evening", periodLabel: "Late Hours", icon: Moon };
  }
}

/**
 * Resolves comprehensive role metadata, display names, and institutional context
 */
export function getRoleGreetingData(user: User) {
  // 1. Resolve Display Name (prioritizing full legal name from auth/session)
  let displayName = (user.full_name || "").trim();

  if (!displayName) {
    if (user.role === "FACULTY") {
      displayName = (user.org || "").trim() || (user.username === "fac_f01" ? "Dr. Ananya Mishra" : user.username);
    } else if (user.role === "CLUB_REPRESENTATIVE") {
      displayName = (user.org || "").trim() || (user.username === "club_dramatics" ? "Dramatics Society" : user.username);
    } else if (user.role === "DEPARTMENT_COORDINATOR") {
      displayName = user.username === "coord_cse"
        ? "Prof. CSE Coordinator"
        : `${user.department || "Academic"} Coordinator`;
    } else if (user.role === "ADMIN") {
      displayName = user.username === "admin"
        ? "Dean of Academic Affairs"
        : "Dean's Office Administrator";
    } else {
      displayName = user.username;
    }
  }

  // 2. Resolve Role Title, Designation, and Context Description
  let designation = "";
  let departmentOrOrg = "";
  let roleIcon = ShieldCheck;
  let panelTagline = "";
  let roleSpecificGreeting = "";
  let badgeStyle = {
    bg: "bg-[#7B1123]/10",
    border: "border-[#7B1123]/30",
    text: "text-[#7B1123]",
    dot: "bg-[#7B1123]"
  };

  switch (user.role) {
    case "ADMIN":
      designation = "Dean of Academic Affairs · Central Administration";
      departmentOrOrg = "Dean's Office Governance Wing";
      roleIcon = ShieldCheck;
      panelTagline = "Master Academic Timetable Controls · Multi-Department Solvers · Zero Hard Violations";
      roleSpecificGreeting = "Honorable Dean & Administration";
      badgeStyle = {
        bg: "bg-[#7B1123]/10",
        border: "border-2 border-[#7B1123]/40",
        text: "text-[#7B1123]",
        dot: "bg-[#7B1123]"
      };
      break;

    case "DEPARTMENT_COORDINATOR":
      designation = `${user.department || "Engineering"} Academic Operations Lead`;
      departmentOrOrg = `${user.department || "Engineering"} Department · Curriculum Coordination`;
      roleIcon = BookOpen;
      panelTagline = "Curriculum Workload Distribution · Lab Session Approvals · Faculty Schedules";
      roleSpecificGreeting = "Respected Academic Coordinator";
      badgeStyle = {
        bg: "bg-blue-50",
        border: "border-2 border-blue-400/40",
        text: "text-blue-900",
        dot: "bg-blue-600"
      };
      break;

    case "FACULTY":
      designation = `Faculty Professor · ${user.department || "Computer Science"}`;
      departmentOrOrg = `${user.department || "Computer Science"} Department · Teaching Faculty`;
      roleIcon = GraduationCap;
      panelTagline = `Personalized Lecture Grid · Faculty ID: ${user.faculty_id || "F01"} · ≤ 4h Daily Limit Enforced`;
      roleSpecificGreeting = "Respected Professor";
      badgeStyle = {
        bg: "bg-purple-50",
        border: "border-2 border-purple-400/40",
        text: "text-purple-900",
        dot: "bg-purple-600"
      };
      break;

    case "CLUB_REPRESENTATIVE":
      designation = `${user.org || "Student Society"} Lead Representative`;
      departmentOrOrg = `${user.org || "Student Society"} · CIT Student Activity Wing`;
      roleIcon = Sparkles;
      panelTagline = "Spectra Fest Venue Bookings · Stage & Tech Requests · Room Availability Queries";
      roleSpecificGreeting = "Welcome, Student Activity Lead";
      badgeStyle = {
        bg: "bg-amber-50",
        border: "border-2 border-amber-400/40",
        text: "text-amber-900",
        dot: "bg-amber-600"
      };
      break;

    default:
      designation = "Institutional User";
      departmentOrOrg = user.department || user.org || "CIT Campus";
      roleIcon = ShieldCheck;
      panelTagline = "Connected to Chilika Institute of Technology Scheduling Engine";
      roleSpecificGreeting = "Welcome Back";
  }

  return {
    displayName,
    designation,
    departmentOrOrg,
    roleIcon,
    panelTagline,
    roleSpecificGreeting,
    badgeStyle
  };
}

export default function DynamicGreeting({
  user,
  variant = "banner",
  className = ""
}: DynamicGreetingProps) {
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const roleData = useMemo(() => getRoleGreetingData(user), [user]);
  const timeInfo = useMemo(() => getTimeGreeting(currentTime), [currentTime]);

  // Keep live time updated every 10 seconds
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(clockInterval);
  }, []);

  // Ordered list of dynamic animated greetings
  const greetingsList = useMemo(() => {
    return [
      timeInfo.prefix,               // 1. Time-aware: Good Morning / Good Afternoon / Good Evening
      "Namaste",                     // 2. Traditional respectful Indian academic greeting
      "Welcome",                     // 3. Welcome
      "Great to See You",            // 4. Great to See You
      "Welcome Back",                // 5. Welcome Back
      roleData.roleSpecificGreeting  // 6. Role-personalized designation greeting
    ];
  }, [timeInfo.prefix, roleData.roleSpecificGreeting]);

  // Rotate greeting every 3.5 seconds with smooth vertical slide + fade + subtle blur
  useEffect(() => {
    if (isPaused) return;

    const ROTATE_INTERVAL = 3500;
    const EXIT_DURATION = 350;

    const timer = setInterval(() => {
      // Phase 1: Trigger slide-up exit with blur
      setIsExiting(true);

      // Phase 2: After exit completes, increment index and trigger slide-up enter
      setTimeout(() => {
        setGreetingIndex((prev) => (prev + 1) % greetingsList.length);
        setIsExiting(false);
      }, EXIT_DURATION);
    }, ROTATE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, greetingsList.length]);

  const currentPrefix = greetingsList[greetingIndex] || "Welcome";
  const RoleIcon = roleData.roleIcon;
  const TimeIcon = timeInfo.icon;

  // Formatted date string (e.g. "Sunday, 1 Nov")
  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }, [currentTime]);

  // Formatted time string (e.g. "12:15 PM")
  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }, [currentTime]);

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-white/90 border border-[#E8DCBE] ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="h-8 flex items-center overflow-hidden">
          <div className={isExiting ? "greeting-slide-out" : "greeting-slide-in"}>
            <span className="text-sm font-black text-stone-900 mr-1.5">{currentPrefix},</span>
            <span className="text-sm font-extrabold text-[#7B1123]">{roleData.displayName}</span>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleData.badgeStyle.bg} ${roleData.badgeStyle.border} ${roleData.badgeStyle.text}`}>
          {roleData.designation}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#E8DCBE] bg-gradient-to-br from-white/98 via-[#FAF7F2]/95 to-[#FAF5ED]/90 shadow-md shadow-amber-950/5 backdrop-blur-md transition-all duration-300 ${className}`}
      style={{ animation: "fade-up 0.5s cubic-bezier(0.19,1,0.22,1) both" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="banner"
      aria-label="Welcome Dashboard Banner"
    >
      {/* =========================================================================
          BACKGROUND DECORATIVE EFFECTS (CREST WATERMARK & CIT ACCENT GLOWS)
          ========================================================================= */}
      {/* Ambient Burgundy Glow Accent */}
      <div
        className="absolute -right-16 -top-16 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, #7B1123 0%, #B45309 50%, transparent 70%)",
          animation: "glow-breathe 8s ease-in-out infinite"
        }}
        aria-hidden="true"
      />

      {/* Subtle CIT Crest Watermark in corner */}
      <div
        className="absolute right-4 -bottom-6 w-36 h-36 pointer-events-none select-none opacity-[0.06] blur-[0.5px]"
        aria-hidden="true"
      >
        <img
          src="/cit_crest.png"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Subtle dot pattern accent */}
      <div
        className="absolute right-36 top-3 w-28 h-20 dot-pattern opacity-25 rounded-xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Golden top decorative sheen line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7B1123]/35 to-transparent" />

      {/* =========================================================================
          MAIN CONTENT CONTAINER
          ========================================================================= */}
      <div className="p-4 sm:p-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left Column: Role Badges + Animated Rotating Heading */}
          <div className="flex-1 min-w-0">
            {/* Top metadata row: Role Pill + Department / Wing */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap mb-2">
              {/* Primary Role Pill */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight border shadow-2xs ${roleData.badgeStyle.bg} ${roleData.badgeStyle.border} ${roleData.badgeStyle.text}`}
                style={{ animation: "scale-in-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.15s both" }}
              >
                <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{roleBadgeInfo[user.role]?.label || user.role}</span>
              </div>

              {/* Department or Organization Badge */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-stone-700 bg-stone-100 border border-stone-200">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span className="truncate max-w-[240px]">{roleData.departmentOrOrg}</span>
              </div>

              {/* Time Indicator Badge */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-900 bg-amber-50/80 border border-amber-200/80">
                <TimeIcon className="w-3 h-3 text-amber-700" />
                <span>{timeInfo.periodLabel}</span>
              </div>
            </div>

            {/* =====================================================================
                DYNAMIC ANIMATED GREETING (FIXED HEIGHT CONTAINER — ZERO LAYOUT JUMP)
                ===================================================================== */}
            <div
              className="h-10 sm:h-12 flex items-center overflow-hidden"
              style={{ minHeight: "44px" }}
            >
              <div
                key={greetingIndex}
                className={`flex items-baseline gap-2 flex-wrap ${
                  isExiting ? "greeting-slide-out" : "greeting-slide-in"
                }`}
              >
                {/* Rotating greeting prefix */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight leading-none">
                  {currentPrefix},
                </h2>

                {/* Authenticated user's actual name with royal burgundy-amber gradient highlight */}
                <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-[#7B1123] via-[#9E1B32] to-[#B45309] bg-clip-text text-transparent">
                  {roleData.displayName}
                </span>

                <Sparkle className="w-4 h-4 text-amber-500 fill-amber-400 hidden sm:inline-block animate-pulse shrink-0" />
              </div>
            </div>

            {/* Official Designation & Dashboard Context Subtitle */}
            <p className="text-xs sm:text-sm text-stone-600 mt-1 font-medium flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-stone-900">{roleData.designation}</span>
              <span className="text-stone-300 hidden sm:inline">·</span>
              <span className="text-stone-500 text-xs hidden md:inline">{roleData.panelTagline}</span>
            </p>
          </div>

          {/* Right Column: Live Clock, Online Status & Greeting Rotator Indicators */}
          <div className="flex flex-row lg:flex-col items-start lg:items-end justify-between lg:justify-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E8DEC8]/60">
            
            {/* Live Clock & Date Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 border border-[#E8DCBE] shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#7B1123]" />
              <div className="text-xs font-bold text-stone-800">
                <span>{formattedTime}</span>
                <span className="text-stone-400 mx-1.5">|</span>
                <span className="text-stone-600 font-semibold">{formattedDate}</span>
              </div>
            </div>

            {/* System Status Pill with Animated Emerald Beacon */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-full shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-4" />
              <span className="text-[11px] font-bold text-emerald-900">
                Active Session · Online
              </span>
            </div>

            {/* Interactive Rotator Progress Dots */}
            <div className="hidden sm:flex items-center gap-1.5 pt-0.5" title="Greeting rotator dots (click to switch, hover banner to pause)">
              {greetingsList.map((g, idx) => {
                const isActive = idx === greetingIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsExiting(true);
                      setTimeout(() => {
                        setGreetingIndex(idx);
                        setIsExiting(false);
                      }, 200);
                    }}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      isActive
                        ? "w-5 h-1.5 bg-[#7B1123]"
                        : "w-1.5 h-1.5 bg-stone-300 hover:bg-stone-400"
                    }`}
                    aria-label={`Jump to greeting: ${g}`}
                  />
                );
              })}
              {isPaused && (
                <span className="text-[10px] text-amber-700 font-bold ml-1.5 animate-pulse">
                  Paused
                </span>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

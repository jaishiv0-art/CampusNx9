import React from "react";
import { User, roleBadgeInfo, RoleType } from "../api";
import {
  Shield,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileCheck2,
  CalendarDays,
  Zap,
  Lock,
  Database
} from "lucide-react";

interface RoleDashboardOverviewProps {
  user: User;
  onNavigateTab: (tab: string) => void;
}

export default function RoleDashboardOverview({ user, onNavigateTab }: RoleDashboardOverviewProps) {
  const badge = roleBadgeInfo[user.role as RoleType] || {
    label: user.role,
    bg: "bg-slate-800",
    border: "border-slate-700",
    text: "text-slate-300"
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}>
                {badge.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user.department ? `Dept: ${user.department}` : user.org || "CIT Administration"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome back, {user.username}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Active Session · Connected to Chilika Institute of Technology Scheduling Engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="glow-pill-emerald">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>0 Hard Violations (Verified)</span>
            </div>
            <div className="glow-pill-indigo hidden sm:flex">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase / PostgreSQL</span>
            </div>
            <div className="glow-pill-indigo hidden md:flex">
              <Zap className="w-3.5 h-3.5" />
              <span>CP-SAT OR-Tools 9.15</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {user.role === "ADMIN" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Teaching Sessions</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">189 / 189</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Conflict-Free
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Midsem Exams (W8)</span>
              <GraduationCap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">41 Scheduled</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Halved Capacity Enforced
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Spectra Fest Bookings</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">25 Evaluated</div>
            <div className="text-[11px] text-indigo-300 mt-1">
              Score: 67.0 | 0 Priority Inversions
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Disruption Stability</span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">7 Reassigned</div>
            <div className="text-[11px] text-slate-400 mt-1">
              1 Time Shift, 6 Room-Only
            </div>
          </div>
        </div>
      )}

      {user.role === "DEPARTMENT_COORDINATOR" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Department Context</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">{user.department || "Engineering"} Department</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Managing labs, faculty assignments & courses
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Department Permissions</span>
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-base font-semibold text-slate-200">Session Rescheduling & Lab Approvals</div>
            <div className="text-[11px] text-amber-300 mt-1">
              Can approve departmental lab bookings
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-slate-400 text-xs mb-1">Quick Action</div>
              <div className="text-sm font-semibold text-slate-200">View Department Timetable</div>
            </div>
            <button
              onClick={() => onNavigateTab("timetable")}
              className="btn-secondary text-xs mt-2 py-1.5"
            >
              Open Timetable Filter
            </button>
          </div>
        </div>
      )}

      {user.role === "FACULTY" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Faculty ID & Department</span>
              <GraduationCap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{user.faculty_id || "F01"} · {user.department || "Faculty"}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Personalized schedule view active
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Daily Workload Limit</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">≤ 4 Hours / Day</div>
            <div className="text-[11px] text-emerald-400 mt-1">
              ✓ Hard constraint H10 enforced
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-slate-400 text-xs mb-1">AI Rescheduling Assistant</div>
              <div className="text-xs text-slate-300">Reschedule sessions in plain English or Hinglish</div>
            </div>
            <button
              onClick={() => onNavigateTab("assistant")}
              className="btn-primary text-xs mt-2 py-1.5"
            >
              Ask AI Assistant
            </button>
          </div>
        </div>
      )}

      {user.role === "CLUB_REPRESENTATIVE" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Student Organization</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{user.org || "Student Club"}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Role capped category: <strong className="text-indigo-300">club_event</strong>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Spectra Week 7 Policy</span>
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-semibold text-slate-200">6-Tier Institutional Priority</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Exam &gt; Regular Class &gt; Inst Event &gt; Guest &gt; Dept &gt; Club
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-slate-400 text-xs mb-1">Venue Booking</div>
              <div className="text-xs text-slate-300">Submit new venue request with NLP parser</div>
            </div>
            <button
              onClick={() => onNavigateTab("bookings")}
              className="btn-primary text-xs mt-2 py-1.5"
            >
              Request a Venue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

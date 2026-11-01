import React from "react";
import { User, roleBadgeInfo, RoleType } from "../api";
import {
  Shield,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers
} from "lucide-react";

interface RoleDashboardOverviewProps {
  user: User;
  onNavigateTab: (tab: string) => void;
}

export default function RoleDashboardOverview({ user, onNavigateTab }: RoleDashboardOverviewProps) {
  const badge = roleBadgeInfo[user.role as RoleType] || {
    label: user.role,
    bg: "bg-[#7B1123]/10",
    border: "border-[#7B1123]/25",
    text: "text-[#7B1123]"
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Welcome Banner */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#E8DCBE] shadow-xs relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                {badge.label}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                {user.department ? `Dept: ${user.department}` : user.org || "CIT Administration"}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Welcome back, {user.username}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Active Session · Connected to Chilika Institute of Technology Scheduling Engine
            </p>
          </div>


        </div>
      </div>

      {/* Role-Specific Metric Cards */}
      {user.role === "ADMIN" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md hover:border-[#7B1123]/30 transition-all">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Teaching Sessions</span>
              <Layers className="w-4 h-4 text-[#7B1123]" />
            </div>
            <div className="text-2xl font-black text-stone-900">189 / 189</div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> 100% Conflict-Free
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md hover:border-[#7B1123]/30 transition-all">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Midsem Exams (W8)</span>
              <GraduationCap className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-2xl font-black text-stone-900">41 Scheduled</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Halved Capacity Enforced
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md hover:border-[#7B1123]/30 transition-all">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Spectra Fest Bookings</span>
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-2xl font-black text-stone-900">25 Evaluated</div>
            <div className="text-[11px] text-[#7B1123] mt-1 font-semibold">
              Score: 67.0 | 0 Inversions
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md hover:border-[#7B1123]/30 transition-all">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Disruption Stability</span>
              <Shield className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-stone-900">7 Reassigned</div>
            <div className="text-[11px] text-stone-500 mt-1">
              1 Time Shift, 6 Room-Only
            </div>
          </div>
        </div>
      )}

      {user.role === "DEPARTMENT_COORDINATOR" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Department Context</span>
              <BookOpen className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-xl font-black text-stone-900">{user.department || "Engineering"} Department</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Managing labs, faculty assignments & courses
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Department Permissions</span>
              <Shield className="w-4 h-4 text-[#7B1123]" />
            </div>
            <div className="text-base font-bold text-stone-800">Session Rescheduling & Lab Approvals</div>
            <div className="text-[11px] text-amber-800 mt-1 font-semibold">
              Can approve departmental lab bookings
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="text-stone-500 text-xs mb-1">Quick Action</div>
              <div className="text-sm font-bold text-stone-800">View Department Timetable</div>
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
          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Faculty ID & Department</span>
              <GraduationCap className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-xl font-black text-stone-900">{user.faculty_id || "F01"} · {user.department || "Faculty"}</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Personalized schedule view active
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Daily Workload Limit</span>
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-xl font-black text-stone-900">≤ 4 Hours / Day</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
              ✓ Hard constraint H10 enforced
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="text-stone-500 text-xs mb-1">AI Rescheduling Assistant</div>
              <div className="text-xs text-stone-600">Reschedule sessions in plain English or Hinglish</div>
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
          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Student Organization</span>
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl font-black text-stone-900">{user.org || "Student Club"}</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Role capped category: <strong className="text-[#7B1123]">club_event</strong>
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Spectra Week 7 Policy</span>
              <Shield className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-sm font-bold text-stone-800">6-Tier Institutional Priority</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Exam &gt; Regular Class &gt; Inst Event &gt; Guest &gt; Dept &gt; Club
            </div>
          </div>

          <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="text-stone-500 text-xs mb-1">Venue Booking</div>
              <div className="text-xs text-stone-600">Submit new venue request with NLP parser</div>
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

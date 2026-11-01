import React, { useEffect, useRef, useState } from "react";
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
import { useStaggerReveal, useCountUp } from "../hooks/useAnimations";
import DynamicGreeting from "../components/DynamicGreeting";

interface RoleDashboardOverviewProps {
  user: User;
  onNavigateTab: (tab: string) => void;
}

/* Animated counter component */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { count, ref } = useCountUp(value, { duration: 1600 });
  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export default function RoleDashboardOverview({ user, onNavigateTab }: RoleDashboardOverviewProps) {
  const badge = roleBadgeInfo[user.role as RoleType] || {
    label: user.role,
    bg: "bg-[#7B1123]/10",
    border: "border-[#7B1123]/25",
    text: "text-[#7B1123]"
  };

  const staggerRef = useStaggerReveal();

  return (
    <div className="mb-6 space-y-4">
      {/* Dynamic Animated Greeting Banner */}
      <DynamicGreeting user={user} />

      {/* Decorative separator with glow */}
      <div className="section-separator-glow" />

      {/* Role-Specific Metric Cards */}
      {user.role === "ADMIN" && (
        <div ref={staggerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card-metric reveal stagger-1 hover:border-[#7B1123]/30 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Teaching Sessions</span>
              <Layers className="w-4 h-4 text-[#7B1123] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              <AnimatedNumber value={189} /> / 189
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> 100% Conflict-Free
            </div>
          </div>

          <div className="card-metric reveal stagger-2 hover:border-purple-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Midsem Exams (W8)</span>
              <GraduationCap className="w-4 h-4 text-purple-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              <AnimatedNumber value={41} /> Scheduled
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Halved Capacity Enforced
            </div>
          </div>

          <div className="card-metric reveal stagger-3 hover:border-amber-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Spectra Fest Bookings</span>
              <Sparkles className="w-4 h-4 text-amber-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              <AnimatedNumber value={25} /> Evaluated
            </div>
            <div className="text-[11px] text-[#7B1123] mt-1 font-semibold">
              Score: 67.0 | 0 Inversions
            </div>
          </div>

          <div className="card-metric reveal stagger-4 hover:border-emerald-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Disruption Stability</span>
              <Shield className="w-4 h-4 text-emerald-700 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
            <div className="text-2xl font-black text-stone-900">
              <AnimatedNumber value={7} /> Reassigned
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              1 Time Shift, 6 Room-Only
            </div>
          </div>
        </div>
      )}

      {user.role === "DEPARTMENT_COORDINATOR" && (
        <div ref={staggerRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="card-metric reveal stagger-1 hover:border-blue-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Department Context</span>
              <BookOpen className="w-4 h-4 text-blue-700 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="text-xl font-black text-stone-900">{user.department || "Engineering"} Department</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Managing labs, faculty assignments & courses
            </div>
          </div>

          <div className="card-metric reveal stagger-2 hover:border-[#7B1123]/30 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Department Permissions</span>
              <Shield className="w-4 h-4 text-[#7B1123] transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="text-base font-bold text-stone-800">Session Rescheduling & Lab Approvals</div>
            <div className="text-[11px] text-amber-800 mt-1 font-semibold">
              Can approve departmental lab bookings
            </div>
          </div>

          <div className="card-metric reveal stagger-3 hover:border-[#7B1123]/30 flex flex-col justify-between group">
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
        <div ref={staggerRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="card-metric reveal stagger-1 hover:border-purple-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Faculty ID & Department</span>
              <GraduationCap className="w-4 h-4 text-purple-700 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="text-xl font-black text-stone-900">{user.faculty_id || "F01"} · {user.department || "Faculty"}</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Personalized schedule view active
            </div>
          </div>

          <div className="card-metric reveal stagger-2 hover:border-amber-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Daily Workload Limit</span>
              <Clock className="w-4 h-4 text-amber-700 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="text-xl font-black text-stone-900">≤ 4 Hours / Day</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
              ✓ Hard constraint H10 enforced
            </div>
          </div>

          <div className="card-metric reveal stagger-3 hover:border-[#7B1123]/30 flex flex-col justify-between group">
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
        <div ref={staggerRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="card-metric reveal stagger-1 hover:border-emerald-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Student Organization</span>
              <Sparkles className="w-4 h-4 text-emerald-700 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="text-xl font-black text-stone-900">{user.org || "Student Club"}</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Role capped category: <strong className="text-[#7B1123]">club_event</strong>
            </div>
          </div>

          <div className="card-metric reveal stagger-2 hover:border-amber-300/50 group">
            <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
              <span>Spectra Week 7 Policy</span>
              <Shield className="w-4 h-4 text-amber-700 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="text-sm font-bold text-stone-800">6-Tier Institutional Priority</div>
            <div className="text-[11px] text-stone-500 mt-1">
              Exam &gt; Regular Class &gt; Inst Event &gt; Guest &gt; Dept &gt; Club
            </div>
          </div>

          <div className="card-metric reveal stagger-3 hover:border-[#7B1123]/30 flex flex-col justify-between group">
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

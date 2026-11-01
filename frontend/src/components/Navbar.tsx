import React, { useState, useEffect } from "react";
import { User, RoleType, roleBadgeInfo, setToken, api } from "../api";
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Settings,
  LogOut,
  Building2,
  Users,
  Compass,
} from "lucide-react";

interface NavbarProps {
  user: User;
  tab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ user, tab, setTab, onLogout }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  // Scroll-based navbar background transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const has = (k: string) => user.permissions.includes("*") || user.permissions.includes(k);

  const tabs = [
    has("timetable.view_dept") || has("timetable.view_own")
      ? { id: "timetable", label: "Timetable Grid", icon: Calendar }
      : null,
    has("booking.create")
      ? { id: "bookings", label: "Venue Bookings", icon: Compass }
      : null,
    { id: "approvals", label: "Approvals & Changes", icon: ShieldCheck },
    has("*") ? { id: "exams", label: "Midsem Exams", icon: GraduationCap } : null,
    has("*") ? { id: "admin", label: "Admin Console", icon: Settings } : null,
    { id: "assistant", label: "AI Scheduler NLP", icon: Sparkles }
  ].filter(Boolean) as { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];


  const badge = roleBadgeInfo[user.role as RoleType] || {
    label: user.role,
    bg: "bg-slate-700/50",
    border: "border-slate-600",
    text: "text-slate-300"
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-500 ${
        scrolled
          ? "bg-slate-950/95 backdrop-blur-2xl border-slate-800/80 shadow-2xl shadow-black/20"
          : "bg-slate-950/80 backdrop-blur-xl border-slate-800/60 shadow-xl"
      }`}
      style={{ animation: "fade-down 0.4s cubic-bezier(0.19,1,0.22,1) both" }}
    >
      {/* =========================================================================
          NAVBAR HEADER
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* =====================================================================
              1. LOGO ICON & BRANDING
              ===================================================================== */}
          <div className="flex items-center gap-3 group">
            <div className="h-10 px-2 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-indigo-500/10 border border-slate-700 transition-all duration-300 group-hover:shadow-[#7B1123]/20 group-hover:border-[#7B1123]/40">
              <img
                src="/logo.png"
                alt="CampusNx9"
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* ===================================================================
                2. BRAND NAME & INSTITUTE TITLE
                =================================================================== */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  Campus<span className="text-indigo-400 transition-colors duration-300 group-hover:text-[#E8A0A0]">Nx9</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/30">
                  CIT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Chilika Institute of Technology · Timetable & Venue Operating System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t, i) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`nav-link flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "bg-[#7B1123] text-white border border-[#9b1d33] shadow-sm shadow-black/20"
                      : "text-slate-200 hover:text-white hover:bg-slate-800/80 font-medium"
                  }`}
                  style={{
                    animation: `fade-down 0.4s cubic-bezier(0.19,1,0.22,1) ${0.05 + i * 0.05}s both`,
                  }}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${active ? "text-white" : "text-slate-400"} ${active ? "" : "group-hover:scale-110"}`} />
                  {t.label}
                  {active && (
                    <span className="absolute bottom-0 left-[15%] w-[70%] h-0.5 bg-white/40 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Active Session Indicator (Role Locked) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 border-[#7B1123]/70 bg-[#7B1123]/25 hover:bg-[#7B1123] text-white text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-black/30 cursor-default group"
              title={`Active Session: ${user.username} (${badge.label}) - Role Locked`}
            >
              <Users className="w-3.5 h-3.5 text-amber-300 group-hover:text-amber-200 transition-colors" />
              <span className="max-w-[120px] truncate font-black text-white">{user.username}</span>
              <span className="hidden lg:inline-block text-stone-200 group-hover:text-white font-semibold">({badge.label})</span>
            </div>

            {/* Secure Sign Out Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-200 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 hover:border-rose-600 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                  active
                    ? "bg-[#7B1123]/25 text-rose-200 border border-[#7B1123]/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom glow accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7B1123]/30 to-transparent" />
    </header>
  );
}

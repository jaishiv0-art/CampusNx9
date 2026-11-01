import React, { useState } from "react";
import { User, RoleType, DEMO_USERS, roleBadgeInfo, setToken, api } from "../api";
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
  CheckCircle2,
  ChevronDown
} from "lucide-react";

interface NavbarProps {
  user: User;
  tab: string;
  setTab: (tab: string) => void;
  onUserSwitch?: (user: User) => void;
  onLogout: () => void;
}

export default function Navbar({ user, tab, setTab, onUserSwitch, onLogout }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      {/* =========================================================================
          NAVBAR HEADER (Change background opacity, borders, or layout here)
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* =====================================================================
              1. LOGO ICON & BRANDING
              - Change 'Building2' or replace the <div> with an <img> tag for custom logo
              - Change gradient 'from-indigo-500 ... to-violet-700' for different brand colors
              ===================================================================== */}
          <div className="flex items-center gap-3">
            <div className="h-10 px-2 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-indigo-500/10 border border-slate-700">
              <img
                src="/logo.png"
                alt="CampusNx9"
                className="h-8 w-auto object-contain"
              />
            </div>

            {/* ===================================================================
                2. BRAND NAME & INSTITUTE TITLE
                =================================================================== */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  Campus<span className="text-indigo-400">Nx9</span>
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
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-[#7B1123] text-white border border-[#9b1d33] shadow-sm shadow-black/20"
                      : "text-slate-200 hover:text-white hover:bg-slate-800/80 font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Quick Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${badge.bg} ${badge.border} ${badge.text} hover:brightness-110`}
                title="Quickly switch between official roles"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{user.username}</span>
                <span className="hidden lg:inline-block">({badge.label})</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#FFFDF9] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 border-2 border-stone-300 ring-2 ring-black/5">
                  <div className="px-3 py-2 border-b border-stone-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-stone-950">Active Session</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Session Locked
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-700 font-semibold mt-0.5">
                      {user.username} · {badge.label}
                    </p>
                  </div>
                  <div className="p-3 my-2 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-800 space-y-1">
                    <p className="font-bold text-stone-950">Role Binding Invariant Active</p>
                    <p className="text-[11px] text-stone-700 leading-relaxed font-medium">
                      In-app role switching is disabled by campus security policy. To access a different role or institutional account, you must log out.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-center px-4 py-2.5 rounded-xl text-xs font-bold bg-[#7B1123] hover:bg-[#5f0c1b] text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out to Switch Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/40"
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
    </header>
  );
}

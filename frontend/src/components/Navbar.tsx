import React, { useState, useEffect } from "react";
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
  onUserSwitch: (user: User) => void;
  onLogout: () => void;
}

export default function Navbar({ user, tab, setTab, onUserSwitch, onLogout }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
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

  const switchRole = async (demo: typeof DEMO_USERS[0]) => {
    setSwitching(true);
    try {
      const res = await api("/auth/login", "POST", {
        username: demo.username,
        password: demo.password
      });
      setToken(res.token);
      const me = await api<User>("/me");
      onUserSwitch(me);
      setDropdownOpen(false);
    } catch (e: any) {
      alert("Role switch failed: " + e.message);
    } finally {
      setSwitching(false);
    }
  };

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

          {/* User Profile & Quick Role Switcher */}
          <div
            className="flex items-center gap-2 sm:gap-3"
            style={{ animation: "fade-down 0.4s cubic-bezier(0.19,1,0.22,1) 0.3s both" }}
          >
            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-300 ${badge.bg} ${badge.border} ${badge.text} hover:brightness-110`}
                title="Quickly switch between official roles"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{user.username}</span>
                <span className="hidden lg:inline-block">({badge.label})</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-enter absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-stone-200 ring-1 ring-black/10">
                  <div className="px-3 py-2 border-b border-stone-200">
                    <p className="text-xs font-bold text-stone-900">Switch Active Role</p>
                    <p className="text-[11px] text-stone-600 font-medium">Instantly test the 4 competition user roles</p>
                  </div>
                  <div className="py-1 space-y-1">
                    {DEMO_USERS.map((demo, i) => {
                      const isCurrent = user.username === demo.username;
                      return (
                        <button
                          key={demo.username}
                          disabled={switching || isCurrent}
                          onClick={() => switchRole(demo)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all group ${
                            isCurrent
                              ? "bg-[#7B1123]/10 text-[#7B1123] font-bold border border-[#7B1123]/30 shadow-xs"
                              : "text-stone-800 hover:bg-stone-200 hover:text-stone-950 border border-transparent hover:border-stone-400 font-medium"
                          }`}
                          style={{
                            animation: `fade-up-subtle 0.3s cubic-bezier(0.19,1,0.22,1) ${0.05 + i * 0.04}s both`,
                          }}
                        >
                          <div>
                            <div className={`font-bold ${isCurrent ? "text-[#7B1123]" : "text-stone-900 group-hover:text-stone-950"}`}>
                              {demo.label}
                            </div>
                            <div className={`text-[10px] mt-0.5 ${isCurrent ? "text-[#7B1123]/90 font-medium" : "text-stone-600 group-hover:text-stone-800 font-medium"}`}>
                              {demo.badge}
                            </div>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#7B1123] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 border border-transparent hover:border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/5"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
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

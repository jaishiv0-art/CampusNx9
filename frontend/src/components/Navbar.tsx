import React, { useState } from "react";
import { User, RoleType, DEMO_USERS, roleBadgeInfo, setToken, api } from "../api";
import {
  Calendar,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Settings,
  LogOut,
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

  const switchRole = async (demo: (typeof DEMO_USERS)[0]) => {
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
    bg: "bg-[#7B1123]/10",
    border: "border-[#7B1123]/25",
    text: "text-[#7B1123]"
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF5ED]/95 backdrop-blur-xl border-b border-[#E8DEC8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Institute Branding */}
          <div className="flex items-center gap-3">
            <div className="h-10 px-2 rounded-xl bg-white flex items-center justify-center shadow-xs border border-[#E8DEC8]">
              <img
                src="/logo.png"
                alt="CampusNx9"
                className="h-8 w-auto object-contain"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-stone-900 text-base sm:text-lg">
                  Campus<span className="text-[#7B1123]">Nx9</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider bg-[#7B1123]/10 text-[#7B1123] rounded border border-[#7B1123]/20">
                  CIT
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Chilika Institute of Technology · Timetable & Venue Operating System
              </p>
            </div>
          </div>

          {/* Navigation Tabs with Grey Hover */}
          <nav className="hidden md:flex items-center gap-1.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-[#7B1123] text-white shadow-sm"
                      : "text-stone-700 hover:text-stone-950 hover:bg-stone-200/90 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-stone-500"}`} />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${badge.bg} ${badge.border} ${badge.text} hover:bg-stone-200/90 hover:text-stone-900`}
                title="Quickly switch between official roles"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{user.username}</span>
                <span className="hidden lg:inline-block">({badge.label})</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl shadow-xl p-2 z-50 bg-white border border-[#E8DEC8] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#E8DEC8]">
                    <p className="text-xs font-bold text-stone-900">Switch Active Role</p>
                    <p className="text-[11px] text-stone-500">Test the 4 institutional user portals</p>
                  </div>
                  <div className="py-1 space-y-1">
                    {DEMO_USERS.map((demo) => {
                      const isCurrent = user.username === demo.username;
                      return (
                        <button
                          key={demo.username}
                          disabled={switching || isCurrent}
                          onClick={() => switchRole(demo)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                            isCurrent
                              ? "bg-[#7B1123]/10 text-[#7B1123] font-bold border border-[#7B1123]/30"
                              : "text-stone-700 hover:bg-stone-200/90 hover:text-stone-950"
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-stone-900">{demo.label}</div>
                            <div className="text-[10px] text-stone-500">{demo.badge}</div>
                          </div>
                          {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#7B1123]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out Button with Grey Hover */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-stone-500 hover:text-rose-700 hover:bg-stone-200/90 transition-colors border border-transparent hover:border-stone-300"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-[#E8DEC8]">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-[#7B1123] text-white shadow-xs"
                    : "text-stone-700 hover:text-stone-950 hover:bg-stone-200/90"
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

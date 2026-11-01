import React, { useEffect, useState } from "react";
import { api, setToken, User } from "./api";
import { supabase } from "./supabase";
import Navbar from "./components/Navbar";
import AmbientBackground from "./components/AmbientBackground";
import Login from "./views/Login";
import HomePage from "./pages/HomePage";
import "./pages/HomePage.css";
import RoleDashboardOverview from "./views/RoleDashboardOverview";
import Timetable from "./views/Timetable";
import Bookings from "./views/Bookings";
import Approvals from "./views/Approvals";
import Admin from "./views/Admin";
import Exams from "./views/Exams";
import Assistant from "./views/Assistant";
import { useCursorGlow } from "./hooks/useAnimations";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("timetable");
  const [loading, setLoading] = useState(true);
  const [showHomepage, setShowHomepage] = useState(true);
  const { glowRef, dotRef } = useCursorGlow();

  useEffect(() => {
    api<User>("/me")
      .then((u) => {
        setUser(u);
        setShowHomepage(false); // Already authenticated, skip homepage
      })
      .catch(() => {
        setToken("");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut().catch(() => {});
    setToken("");
    setUser(null);
    setShowHomepage(true); // Show homepage again after logout
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient background glow */}
        <AmbientBackground variant="subtle" />

        {/* Faded Background Crest Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] blur-[2px]">
          <img src="/cit_crest.png" alt="CIT Crest" className="w-80 h-auto object-contain" />
        </div>

        {/* Animated loading indicator */}
        <div
          className="relative z-10"
          style={{ animation: "scale-in 0.5s cubic-bezier(0.19,1,0.22,1) both" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#7B1123]/10 border border-[#7B1123]/25 flex items-center justify-center relative">
            <div className="w-7 h-7 rounded-lg bg-[#7B1123]" style={{ animation: "glow-pulse 2s ease-in-out infinite" }} />
            {/* Rotating ring */}
            <div
              className="absolute inset-[-4px] rounded-2xl border border-[#7B1123]/15"
              style={{ animation: "spin-slow 3s linear infinite" }}
            />
          </div>
        </div>

        {/* Loading text with dots */}
        <div className="relative z-10 mt-4 flex flex-col items-center gap-1">
          <p className="text-stone-700 text-sm font-semibold tracking-tight"
            style={{ animation: "fade-up-subtle 0.6s cubic-bezier(0.19,1,0.22,1) 0.2s both" }}
          >
            Loading CampusNx9
          </p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show the animated homepage first, then login when CTA clicked
    if (showHomepage) {
      return (
        <>
          <HomePage onEnter={() => setShowHomepage(false)} />
          {/* Custom cursor for desktop */}
          <div ref={glowRef} className="cursor-glow" />
          <div ref={dotRef} className="cursor-dot" />
        </>
      );
    }

    return (
      <>
        <Login onSuccess={(u) => setUser(u)} />
        {/* Custom cursor for desktop */}
        <div ref={glowRef} className="cursor-glow" />
        <div ref={dotRef} className="cursor-dot" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col relative overflow-x-hidden selection:bg-[#7B1123] selection:text-white">
      {/* =========================================================================
          AMBIENT BACKGROUND EFFECTS (visible across all tabs)
          ========================================================================= */}
      <AmbientBackground variant="subtle" />

      {/* =========================================================================
          FADED & BLURRED CIT CREST BACKGROUND (VISIBLE ACROSS ALL TABS)
          ========================================================================= */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden"
      >
        <img
          src="/cit_crest.png"
          alt="Chilika Institute of Technology Crest Watermark"
          className="w-[720px] max-w-[85vw] h-auto object-contain opacity-[0.05] blur-[2px] select-none"
          style={{ animation: "glow-breathe 8s ease-in-out infinite" }}
        />
        {/* Soft parchment vignette gradient to blend seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/40 via-transparent to-[#FAF7F2]/60" />
      </div>

      {/* Custom cursor for desktop */}
      <div ref={glowRef} className="cursor-glow" />
      <div ref={dotRef} className="cursor-dot" />

      {/* Top Navbar */}
      <div className="relative z-20">
        <Navbar
          user={user}
          tab={tab}
          setTab={setTab}
          onUserSwitch={(u) => setUser(u)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <RoleDashboardOverview user={user} onNavigateTab={setTab} />

        <div className="mt-4" style={{ animation: "fade-up 0.5s cubic-bezier(0.19,1,0.22,1) 0.1s both" }}>
          {tab === "timetable" && <Timetable user={user} />}
          {tab === "bookings" && <Bookings user={user} />}
          {tab === "approvals" && <Approvals user={user} />}
          {tab === "exams" && <Exams />}
          {tab === "admin" && <Admin />}
          {tab === "assistant" && <Assistant />}
        </div>
      </main>

      {/* =========================================================================
          PREMIUM FOOTER
          ========================================================================= */}
      <footer className="relative z-10 border-t border-[#E8DEC8] bg-gradient-to-b from-[#FAF5ED]/95 to-[#F5EFE4]/95 backdrop-blur-md">
        {/* Decorative top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7B1123]/20 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7B1123]/10 border border-[#7B1123]/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded bg-[#7B1123]" />
              </div>
              <div>
                <span className="font-bold text-stone-800 text-sm tracking-tight">
                  Campus<span className="text-[#7B1123]">Nx9</span>
                </span>
                <p className="text-[11px] text-stone-500">
                  Chilika Institute of Technology
                </p>
              </div>
            </div>

            {/* Center: Tagline */}
            <div className="text-xs text-stone-500 text-center">
              <span className="font-medium">Automated Academic Scheduling</span>
              <span className="mx-1.5 text-stone-300">·</span>
              <span>Venue Resource Optimization</span>
              <span className="mx-1.5 text-stone-300">·</span>
              <span className="font-semibold text-[#7B1123]">Zero Hard Violations</span>
            </div>

            {/* Right: Status */}
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" style={{ animation: "glow-pulse 2s ease-in-out infinite" }} />
              <span className="text-[11px] font-medium text-stone-500">System Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

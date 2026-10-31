import React, { useEffect, useState } from "react";
import { api, setToken, User } from "./api";
import Navbar from "./components/Navbar";
import Login from "./views/Login";
import RoleDashboardOverview from "./views/RoleDashboardOverview";
import Timetable from "./views/Timetable";
import Bookings from "./views/Bookings";
import Approvals from "./views/Approvals";
import Admin from "./views/Admin";
import Exams from "./views/Exams";
import Assistant from "./views/Assistant";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState("timetable");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>("/me")
      .then((u) => {
        setUser(u);
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
    setToken("");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Faded Background Crest Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] blur-[2px]">
          <img src="/cit_crest.png" alt="CIT Crest" className="w-80 h-auto object-contain" />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#7B1123]/10 border border-[#7B1123]/30 flex items-center justify-center animate-pulse relative z-10">
          <div className="w-6 h-6 rounded-lg bg-[#7B1123]" />
        </div>
        <p className="text-stone-600 text-xs mt-3 font-mono font-semibold relative z-10">Loading CampusNx9...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col relative overflow-x-hidden selection:bg-[#7B1123] selection:text-white">
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
          className="w-[720px] max-w-[85vw] h-auto object-contain opacity-[0.07] blur-[2px] select-none scale-105"
        />
        {/* Soft parchment vignette gradient to blend seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/40 via-transparent to-[#FAF7F2]/60" />
      </div>

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

        <div className="mt-4">
          {tab === "timetable" && <Timetable user={user} />}
          {tab === "bookings" && <Bookings user={user} />}
          {tab === "approvals" && <Approvals user={user} />}
          {tab === "exams" && <Exams />}
          {tab === "admin" && <Admin />}
          {tab === "assistant" && <Assistant />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8DEC8] bg-[#FAF5ED]/90 py-4 text-center text-xs text-stone-600 relative z-10">
        Chilika Institute of Technology (CIT) · CampusNx9 Timetable & Venue Management Platform · Zero Hard Violations Enforced
      </footer>
    </div>
  );
}

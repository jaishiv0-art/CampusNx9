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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-lg bg-indigo-500" />
        </div>
        <p className="text-slate-400 text-xs mt-3 font-mono">Loading CampusNx9...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        user={user}
        tab={tab}
        setTab={setTab}
        onUserSwitch={(u) => setUser(u)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        Chilika Institute of Technology (CIT) · CampusNx9 Timetable & Venue Management Platform · Zero Hard Violations Enforced
      </footer>
    </div>
  );
}

import { useEffect, useState } from "react";
import { api, setToken, User } from "./api";
import Timetable from "./views/Timetable"; import Bookings from "./views/Bookings"; import Approvals from "./views/Approvals";
import Admin from "./views/Admin"; import Exams from "./views/Exams"; import Assistant from "./views/Assistant";

export default function App() {
  const [user, setUser] = useState<User | null>(null); const [tab, setTab] = useState("timetable");
  const [err, setErr] = useState(""); const [u, setU] = useState("admin"); const [p, setP] = useState("admin123");
  useEffect(() => { api<User>("/me").then(setUser).catch(() => setToken("")); }, []);
  const login = async () => { try { const r = await api("/auth/login", "POST", { username: u, password: p }); setToken(r.token); setUser(await api<User>("/me")); setErr(""); } catch (e: any) { setErr(e.message); } };
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4"><div className="card w-full max-w-sm space-y-3">
      <h1 className="text-xl font-bold">CIT Scheduler</h1><p className="text-sm text-slate-500">Chilika Institute of Technology</p>
      <input className="inp" value={u} onChange={e => setU(e.target.value)} placeholder="username" />
      <input className="inp" type="password" value={p} onChange={e => setP(e.target.value)} placeholder="password" />
      {err && <p className="text-sm text-rose-600">{err}</p>}<button className="btn w-full" onClick={login}>Sign in</button>
      <p className="text-xs text-slate-400">Demo: admin/admin123 · coord_cse/coord123 · fac_f01/faculty123 · club_dramatics/club123</p></div></div>);
  const has = (k: string) => user.permissions.includes("*") || user.permissions.includes(k);
  const tabs = [
    has("timetable.view_dept") || has("timetable.view_own") ? ["timetable", "Timetable"] : null,
    has("booking.create") ? ["bookings", "Bookings"] : null,
    ["approvals", "Approvals"], has("*") ? ["exams", "Exams"] : null, has("*") ? ["admin", "Admin"] : null, ["assistant", "Assistant"],
  ].filter(Boolean) as string[][];
  return (
    <div className="min-h-screen">
      <header className="bg-indigo-700 text-white px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <b>CIT Scheduler</b><nav className="flex flex-wrap gap-1">{tabs.map(([k, l]) =>
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1 rounded text-sm ${tab === k ? "bg-white text-indigo-700" : "hover:bg-indigo-600"}`}>{l}</button>)}</nav>
        <span className="text-sm">{user.username} · {user.role}<button className="ml-3 underline" onClick={() => { setToken(""); setUser(null); }}>sign out</button></span>
      </header>
      <main className="p-4 max-w-7xl mx-auto">
        {tab === "timetable" && <Timetable user={user} />}{tab === "bookings" && <Bookings user={user} />}
        {tab === "approvals" && <Approvals user={user} />}{tab === "exams" && <Exams />}
        {tab === "admin" && <Admin />}{tab === "assistant" && <Assistant />}
      </main>
    </div>);
}

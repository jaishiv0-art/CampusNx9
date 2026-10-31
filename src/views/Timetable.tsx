import { useEffect, useMemo, useState } from "react";
import { api, User } from "../api";
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"]; const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export default function Timetable({ user }: { user: User }) {
  const [meta, setMeta] = useState<any>(null); const [rows, setRows] = useState<any[]>([]); const [f, setF] = useState<Record<string, string>>({});
  const [view, setView] = useState("week"); const [conf, setConf] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { api("/meta").then(setMeta); }, []);
  useEffect(() => { const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    api(`/timetable?${q}`).then(r => setRows(r.sessions)).catch(e => setErr(e.message)); }, [f]);
  useEffect(() => { api("/conflicts").then(setConf).catch(() => {}); }, []);
  const grid = useMemo(() => { const g: Record<string, any[]> = {}; rows.forEach(r => { for (let i = 0; i < r.duration; i++) (g[`${r.day}-${r.start_period + i}`] ??= []).push(r); }); return g; }, [rows]);
  const sel = (k: string, label: string, opts: string[][]) => (
    <select className="inp" value={f[k] ?? ""} onChange={e => setF({ ...f, [k]: e.target.value })}><option value="">{label}</option>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>);
  if (!meta) return <p>Loading…</p>;
  return (<div className="space-y-3">
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
      {sel("day", "Day", DAYS.map(d => [d, d]))}{sel("period", "Period", PERIODS.map(p => [String(p), `P${p}`]))}
      {sel("faculty", "Faculty", meta.faculty.map((x: any) => [x.id, `${x.id} ${x.name}`]))}{sel("department", "Department", meta.departments.map((d: string) => [d, d]))}
      {sel("group", "Student group", meta.groups.map((g: any) => [g.id, g.id]))}{sel("room", "Room", meta.rooms.map((r: any) => [r.id, r.id]))}</div>
    <div className="flex gap-2 items-center"><button className={view === "week" ? "btn" : "btn-ghost"} onClick={() => setView("week")}>Weekly calendar</button>
      <button className={view === "list" ? "btn" : "btn-ghost"} onClick={() => setView("list")}>List</button><span className="text-sm text-slate-500">{rows.length} sessions</span>
      {conf && <span className={`text-xs px-2 py-1 rounded ${conf.hard_violation_count ? "bg-red-200 text-red-900" : "bg-emerald-100 text-emerald-800"}`}>
        {conf.hard_violation_count ? `${conf.hard_violation_count} hard violations (incl. unscheduled exams)` : "No hard violations"}</span>}</div>
    {err && <p className="text-rose-600 text-sm">{err}</p>}
    {view === "week" ? <div className="overflow-x-auto card p-0"><table className="min-w-full text-xs"><thead><tr><th className="p-2">Period</th>{DAYS.map(d => <th key={d} className="p-2">{d}</th>)}</tr></thead>
      <tbody>{PERIODS.map(p => <tr key={p} className="border-t align-top"><td className="p-2 font-semibold">P{p}<div className="text-slate-400">{p <= 5 ? 7 + p : 8 + p}:00</div></td>
        {DAYS.map(d => <td key={d} className="p-1 border-l min-w-[130px]">{(grid[`${d}-${p}`] ?? []).map(r =>
          <div key={r.session_id} className={`mb-1 rounded p-1 ${r.kind === "lab" ? "bg-violet-100" : r.kind === "tutorial" ? "bg-amber-100" : "bg-sky-100"}`}>
            <b>{r.course_id}</b> <span className="text-slate-600">{r.room_id}</span><div className="truncate">{r.faculty}</div><div className="text-slate-500">{r.groups.join(", ")}</div></div>)}</td>)}</tr>)}</tbody></table></div>
    : <div className="card overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left">{["Session", "Day", "Start", "Dur", "Room", "Faculty", "Groups"].map(h => <th key={h} className="p-1">{h}</th>)}</tr></thead>
      <tbody>{rows.map(r => <tr key={r.session_id} className="border-t"><td className="p-1">{r.session_id}</td><td>{r.day}</td><td>P{r.start_period}</td><td>{r.duration}</td><td>{r.room_id}</td><td>{r.faculty}</td><td>{r.groups.join(", ")}</td></tr>)}</tbody></table></div>}
    {conf?.violations?.length > 0 && <details className="card"><summary className="cursor-pointer text-sm font-medium">Current scheduling conflicts</summary>
      <ul className="text-xs mt-2 space-y-1">{conf.violations.slice(0, 40).map((v: any, i: number) => <li key={i}><b className="text-red-700">{v.rule}</b> {v.detail}</li>)}</ul></details>}
  </div>);
}

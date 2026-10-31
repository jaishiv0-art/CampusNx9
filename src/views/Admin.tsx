import { useEffect, useState } from "react"; import { api, upload } from "../api";
export default function Admin() {
  const [out, setOut] = useState<any>(null); const [util, setUtil] = useState<any>(null); const [audit, setAudit] = useState<any[]>([]); const [busy, setBusy] = useState(""); const [users, setUsers] = useState<any[]>([]);
  const [prio, setPrio] = useState<string[]>([]);
  const refresh = () => { api("/stats/utilization").then(setUtil).catch(() => {}); api("/audit").then(r => setAudit(r.events)); api("/admin/users").then(r => setUsers(r.users)); api("/meta").then(m => setPrio(m.priority_order)); };
  useEffect(refresh, []);
  const run = async (label: string, path: string, method = "POST") => { setBusy(label); try { setOut(await api(path, method)); } catch (e: any) { setOut({ error: e.message }); } setBusy(""); refresh(); };
  return (<div className="space-y-4"><div className="card space-y-2"><h2 className="font-semibold">Operations</h2><div className="flex flex-wrap gap-2">
    <label className="btn-ghost cursor-pointer">Import dataset JSON<input type="file" accept=".json" hidden onChange={async e => { try { setOut(await upload("/admin/dataset/import", e.target.files![0])); } catch (x: any) { setOut({ error: x.message }); } refresh(); }} /></label>
    <button className="btn" disabled={!!busy} onClick={() => run("t", "/admin/timetable/generate")}>{busy === "t" ? "Solving…" : "Generate timetable"}</button>
    <button className="btn" disabled={!!busy} onClick={() => run("e", "/admin/exams/generate")}>Generate exams</button>
    <button className="btn" disabled={!!busy} onClick={() => run("b", "/admin/bookings/decide-dataset")}>Decide Spectra bookings</button>
    <button className="btn-ghost" onClick={() => run("v", "/admin/validate", "GET")}>Run official validator</button>
    <button className="btn-ghost" onClick={() => run("d", "/disruptions/sample")}>Apply sample disruption (proposal)</button>
    <button className="btn-ghost" onClick={() => run("x", "/admin/export")}>Export schedule.json / schedule_after.json</button></div>
    {out && <pre className="text-xs bg-slate-900 text-slate-100 p-2 rounded max-h-64 overflow-auto">{JSON.stringify(out, null, 1).slice(0, 4000)}</pre>}</div>
    <div className="grid md:grid-cols-2 gap-4"><div className="card"><h2 className="font-semibold mb-2">Room utilisation</h2>
      {util?.rooms.map((r: any) => <div key={r.room_id} className="flex items-center gap-2 text-xs"><span className="w-24">{r.room_id}</span><div className="flex-1 bg-slate-100 h-3 rounded"><div className="bg-indigo-500 h-3 rounded" style={{ width: `${r.utilization * 100}%` }} /></div><span>{Math.round(r.utilization * 100)}%</span></div>)}
      {util && <p className="text-xs mt-2">Sessions below 40% fill: {util.sessions_below_40pct_fill}</p>}</div>
      <div className="card"><h2 className="font-semibold mb-2">Priority order</h2><ol className="list-decimal ml-5 text-sm">{prio.map((p, i) => <li key={p} className="flex gap-2">{p}{i > 0 && <button className="underline text-xs" onClick={async () => { const n = [...prio]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; await api("/admin/priority", "PUT", { order: n }); refresh(); }}>↑</button>}</li>)}</ol>
        <h2 className="font-semibold mt-4 mb-1">Users</h2><div className="text-xs max-h-40 overflow-auto">{users.map(u => <div key={u.username}>{u.username} · {u.role}</div>)}</div></div></div>
    <div className="card"><h2 className="font-semibold mb-2">Audit history</h2><div className="max-h-64 overflow-auto text-xs space-y-1">{audit.map(a => <div key={a.id}><span className="text-slate-400">{a.ts}</span> <b>{a.actor}</b> {a.action} <span className="text-slate-500">{a.detail}</span></div>)}</div></div></div>);
}

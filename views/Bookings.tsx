import { useEffect, useState } from "react";
import { api, statusColor, User } from "../api";
const ROOM_TYPES = ["classroom", "lecture_hall", "auditorium", "seminar_hall", "outdoor", "lab_cs", "lab_elec", "lab_phy", "lab_civil", "workshop"];
const NEEDS = ["projector", "pa_system", "stage", "computers", "accessible", "power_benches", "ac"];
export default function Bookings({ user }: { user: User }) {
  const [text, setText] = useState(""); const [draft, setDraft] = useState<any>(null); const [list, setList] = useState<any>(null); const [msg, setMsg] = useState("");
  const load = () => api("/bookings").then(setList).catch(e => setMsg(e.message)); useEffect(() => { load(); }, []);
  const parse = async () => { setMsg(""); try { setDraft(await api("/bookings/parse", "POST", { text })); } catch (e: any) { setMsg(e.message); } };
  const submit = async () => { try { const d = draft; const r = await api("/bookings", "POST", { title: d.title ?? "Untitled", attendance: d.attendance, duration_periods: d.duration_periods,
      windows: d.windows, room_types: d.room_types, needs: d.needs, requested_room: d.requested_room, mandatory_for_groups: d.mandatory_for_groups,
      requested_category: d.requested_category, raw_text: d.raw_text, requester: d.requester, confirm: true });
      setMsg(`Submitted ${r.id}. Engine recommendation: ${r.recommendation.status} - ${r.recommendation.reason}`); setDraft(null); setText(""); load(); } catch (e: any) { setMsg(e.message); } };
  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const tog = (k: string, v: string) => set(k, draft[k].includes(v) ? draft[k].filter((x: string) => x !== v) : [...draft[k], v]);
  return (<div className="grid md:grid-cols-2 gap-4">
    <div className="space-y-3"><div className="card space-y-2"><h2 className="font-semibold">Request a venue (English / Hinglish)</h2>
      <textarea className="inp h-24" value={text} onChange={e => setText(e.target.value)} placeholder="Spectra ke liye Friday ko 6 baje se auditorium chahiye, around 200 students." />
      <button className="btn" disabled={!text} onClick={parse}>Extract details</button></div>
      {draft && <div className="card space-y-2"><h3 className="font-semibold">Review & edit - nothing is submitted until you confirm</h3>
        {draft.follow_up && <p className="bg-amber-50 border border-amber-300 p-2 text-sm rounded">❓ {draft.follow_up}</p>}
        {draft.warnings.map((w: string, i: number) => <p key={i} className="bg-rose-50 border border-rose-300 p-2 text-sm rounded">⚠ {w}</p>)}
        {draft.assumptions.length > 0 && <ul className="text-xs text-slate-600 list-disc ml-4">{draft.assumptions.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>}
        <label className="text-xs">Event name<input className="inp" value={draft.title ?? ""} onChange={e => set("title", e.target.value)} /></label>
        <label className="text-xs">Requesting organisation<input className="inp" value={draft.requester ?? ""} onChange={e => set("requester", e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-2"><label className="text-xs">Attendance<input type="number" className="inp" value={draft.attendance ?? ""} onChange={e => set("attendance", +e.target.value)} /></label>
          <label className="text-xs">Duration (periods)<input type="number" className="inp" value={draft.duration_periods ?? 1} onChange={e => set("duration_periods", +e.target.value)} /></label></div>
        {draft.windows.map((w: any, i: number) => <div key={i} className="grid grid-cols-3 gap-2 text-xs">
          <label>Day<select className="inp" value={w.day} onChange={e => set("windows", draft.windows.map((x: any, j: number) => j === i ? { ...x, day: e.target.value } : x))}>{["MON", "TUE", "WED", "THU", "FRI"].map(d => <option key={d}>{d}</option>)}</select></label>
          <label>From P<input type="number" className="inp" value={w.from_period} onChange={e => set("windows", draft.windows.map((x: any, j: number) => j === i ? { ...x, from_period: +e.target.value } : x))} /></label>
          <label>To P<input type="number" className="inp" value={w.to_period} onChange={e => set("windows", draft.windows.map((x: any, j: number) => j === i ? { ...x, to_period: +e.target.value } : x))} /></label></div>)}
        <div className="text-xs">Room types<div className="flex flex-wrap gap-1">{ROOM_TYPES.map(t => <button key={t} onClick={() => tog("room_types", t)} className={draft.room_types.includes(t) ? "btn" : "btn-ghost"}>{t}</button>)}</div></div>
        <div className="text-xs">Needs<div className="flex flex-wrap gap-1">{NEEDS.map(t => <button key={t} onClick={() => tog("needs", t)} className={draft.needs.includes(t) ? "btn" : "btn-ghost"}>{t}</button>)}</div></div>
        <label className="text-xs">Mandatory groups (comma separated)<input className="inp" value={draft.mandatory_for_groups.join(",")} onChange={e => set("mandatory_for_groups", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} /></label>
        <p className="text-xs text-slate-500">Category (capped by your role by the server): {draft.requested_category}</p>
        <button className="btn" disabled={!draft.windows.length || !draft.attendance} onClick={submit}>Confirm & submit</button></div>}
      {msg && <p className="text-sm card">{msg}</p>}</div>
    <div className="card space-y-2"><h2 className="font-semibold">My bookings</h2>
      {list?.user_bookings?.map((b: any) => <div key={b.id} className="border rounded p-2 text-sm"><div className="flex justify-between"><b>{b.id} · {b.request.title}</b>
        <span className={`px-2 rounded text-xs ${statusColor[b.status] ?? ""}`}>{b.status}</span></div>
        <p className="text-xs text-slate-600">{(b.decision ?? b.recommended)?.reason}</p>
        {b.status === "pending" && <button className="btn-danger mt-1" onClick={async () => { await api(`/bookings/${b.id}/cancel`, "POST"); load(); }}>Cancel request</button>}</div>)}
      {!list?.user_bookings?.length && <p className="text-sm text-slate-500">No requests yet.</p>}</div></div>);
}

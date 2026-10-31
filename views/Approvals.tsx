import { useEffect, useState } from "react";
import { api, statusColor, User } from "../api";
export default function Approvals({ user }: { user: User }) {
  const [pend, setPend] = useState<any[]>([]); const [props, setProps] = useState<any[]>([]); const [msg, setMsg] = useState("");
  const load = () => { api("/bookings/pending").then(r => setPend(r.pending)).catch(() => setPend([])); api("/proposals").then(r => setProps(r.proposals)).catch(() => {}); };
  useEffect(load, []);
  const act = async (url: string, body?: any) => { try { setMsg(JSON.stringify(await api(url, "POST", body)).slice(0, 300)); } catch (e: any) { setMsg("Blocked: " + e.message); } load(); };
  return (<div className="space-y-4">{msg && <p className="card text-sm break-words">{msg}</p>}
    <div className="card space-y-2"><h2 className="font-semibold">Pending booking approvals</h2>
      {pend.map(b => <div key={b.id} className="border rounded p-2 text-sm"><b>{b.id} · {b.request.title}</b> <span className="text-xs">({b.request.requester}, {b.request.attendance} people)</span>
        <p className="text-xs">Engine recommendation: <span className={`px-1 rounded ${statusColor[b.recommended.status]}`}>{b.recommended.status}</span> {b.recommended.reason}</p>
        <div className="flex gap-2 mt-1"><button className="btn" onClick={() => act(`/bookings/${b.id}/decide`, { action: "approve" })}>Approve</button>
          <button className="btn-danger" onClick={() => act(`/bookings/${b.id}/decide`, { action: "reject", note: prompt("Reason?") ?? "" })}>Reject</button></div></div>)}
      {!pend.length && <p className="text-sm text-slate-500">Nothing pending.</p>}</div>
    <div className="card space-y-2"><h2 className="font-semibold">Timetable change proposals</h2>
      {props.map(p => <div key={p.id} className="border rounded p-2 text-sm"><div className="flex justify-between"><b>#{p.id} {p.kind} by {p.created_by}</b><span className={`px-2 rounded text-xs ${statusColor[p.status] ?? "bg-red-100"}`}>{p.status}</span></div>
        <p className="text-xs text-slate-600">{p.payload.changes.map((c: any) => c.type).join(", ")} → {p.result.status}{p.result.moved !== undefined && ` · ${p.result.moved} sessions moved`}</p>
        {p.result.reasons && <ul className="text-xs text-rose-700 list-disc ml-4">{p.result.reasons.slice(0, 6).map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>}
        {p.result.diff?.length > 0 && <table className="text-xs w-full mt-1"><thead><tr className="text-left"><th>Session</th><th>Change</th><th>Old → New</th><th>Why</th></tr></thead><tbody>
          {p.result.diff.map((d: any) => <tr key={d.session_id} className="border-t align-top"><td>{d.session_id}</td><td>{d.change}</td>
            <td>{d.old ? `${d.old[0]} P${d.old[1]} ${d.old[2]}` : "—"} → {d.new ? `${d.new[0]} P${d.new[1]} ${d.new[2]}` : "—"}</td><td>{d.reason}</td></tr>)}</tbody></table>}
        {p.status === "pending" && user.permissions.includes("*") && <div className="flex gap-2 mt-2"><button className="btn" onClick={() => act(`/proposals/${p.id}/approve`)}>Approve & apply</button>
          <button className="btn-danger" onClick={() => act(`/proposals/${p.id}/reject`)}>Reject</button></div>}</div>)}
      {!props.length && <p className="text-sm text-slate-500">No proposals.</p>}</div></div>);
}

import { useState } from "react"; import { api } from "../api";
export default function Assistant() {
  const [m, setM] = useState(""); const [log, setLog] = useState<any[]>([]);
  const send = async () => { const q = m; setM(""); try { const r = await api("/assistant", "POST", { message: q }); setLog(l => [...l, { q, r }]); } catch (e: any) { setLog(l => [...l, { q, r: { message: e.message } }]); } };
  const submitProposal = async (r: any) => { try { const path = r.proposal.changes[0].type === "move_session" ? "/requests/change" : "/faculty/unavailability";
      const res = await api(path, "POST", { changes: r.proposal.changes, note: "via assistant" }); alert(`Submitted for admin approval (proposal #${res.id}: ${res.result.status})`); } catch (e: any) { alert(e.message); } };
  return (<div className="card space-y-3 max-w-2xl"><h2 className="font-semibold">Assistant</h2><p className="text-xs text-slate-500">Drafts only: every proposal is re-checked by the scheduling engine and needs human approval. Works without an AI key.</p>
    {log.map((x, i) => <div key={i} className="text-sm"><p className="font-medium">You: {x.q}</p><p className="bg-slate-100 rounded p-2">{x.r.message}</p>
      {x.r.proposal?.changes?.length > 0 && <button className="btn mt-1" onClick={() => submitProposal(x.r)}>Submit this request</button>}
      {x.r.draft && <p className="text-xs text-slate-500">Open “Bookings” and paste the same text to review/edit the extracted form.</p>}</div>)}
    <div className="flex gap-2"><input className="inp" value={m} onChange={e => setM(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Kal physics lab available nahi hai" /><button className="btn" onClick={send}>Send</button></div></div>);
}

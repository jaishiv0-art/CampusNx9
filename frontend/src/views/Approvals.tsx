import React, { useEffect, useState } from "react";
import { api, statusColor, User } from "../api";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function Approvals({ user }: { user: User }) {
  const [pend, setPend] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"bookings" | "proposals">("bookings");

  const load = async () => {
    setLoading(true);
    try {
      const bRes = await api("/bookings/pending").catch(() => ({ pending: [] }));
      setPend(bRes.pending || []);
      const pRes = await api("/proposals").catch(() => ({ proposals: [] }));
      setProps(pRes.proposals || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (url: string, body?: any) => {
    setLoading(true);
    try {
      const res = await api(url, "POST", body);
      setMsg(JSON.stringify(res).slice(0, 200));
    } catch (e: any) {
      setMsg("Action blocked: " + e.message);
    } finally {
      load();
    }
  };

  return (
    <div className="space-y-6">
      {/* Institutional Rule Notice Banner */}
      <div className="bg-amber-50/95 rounded-2xl p-4 sm:p-5 border border-amber-300/90 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-amber-950 flex items-center gap-2">
              Institutional Governance Rule Enforced
            </h3>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed font-medium">
              <strong className="text-amber-950 font-bold">"Nobody can approve their own request."</strong> Both the frontend UI and the backend security layer strictly prohibit any user—including Administrators and Department Coordinators—from authorizing requests they authored.
            </p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Subtabs & Refresh Bar */}
      <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("bookings")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === "bookings"
                ? "bg-[#7B1123] text-white shadow-sm shadow-[#7B1123]/25"
                : "bg-white text-stone-700 border border-[#D8C7B5] hover:bg-stone-200 hover:text-stone-950 hover:border-stone-400"
            }`}
          >
            Pending Venue Bookings ({pend.length})
          </button>
          <button
            onClick={() => setActiveSubTab("proposals")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === "proposals"
                ? "bg-[#7B1123] text-white shadow-sm shadow-[#7B1123]/25"
                : "bg-white text-stone-700 border border-[#D8C7B5] hover:bg-stone-200 hover:text-stone-950 hover:border-stone-400"
            }`}
          >
            Timetable Change Proposals ({props.length})
          </button>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="btn-ghost text-xs"
          title="Refresh queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* 1. Pending Bookings Queue */}
      {activeSubTab === "bookings" && (
        <div className="space-y-3">
          {pend.map((b) => {
            const isOwn = b.owner === user.username;
            return (
              <div
                key={b.id}
                className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-300 font-bold">
                      {b.id}
                    </span>
                    <h3 className="font-semibold text-stone-900 text-sm sm:text-base">
                      {b.request.title}
                    </h3>
                    <span className="text-xs text-slate-600 font-medium">
                      by <strong className="text-stone-900">{b.request.requester}</strong> ({b.request.attendance} attendees)
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-2">
                    <span>Engine Verdict:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusColor[b.recommended.status]}`}>
                      {b.recommended.status}
                    </span>
                    <span className="text-slate-700 font-medium">{b.recommended.reason}</span>
                  </div>

                  {b.recommended.room_id && (
                    <div className="text-xs text-indigo-700 font-medium flex items-center gap-2">
                      <span>Assigned Venue:</span>
                      <strong className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        {b.recommended.room_id} ({b.recommended.day} P{b.recommended.start_period}–P{b.recommended.end_period})
                      </strong>
                    </div>
                  )}
                </div>

                {/* Actions Guarded by Institutional Rule */}
                <div className="flex items-center gap-2 shrink-0">
                  {isOwn ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Self-Approval Prohibited</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => act(`/bookings/${b.id}/decide`, { action: "approve" })}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt("Enter rejection reason:") ?? "";
                          act(`/bookings/${b.id}/decide`, { action: "reject", note });
                        }}
                        className="btn-danger text-xs py-1.5 px-3"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {!pend.length && (
            <div className="card text-center py-12 text-slate-600 font-medium text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              All booking requests are processed. No pending requests awaiting your authorization.
            </div>
          )}
        </div>
      )}

      {/* 2. Timetable Change Proposals Queue */}
      {activeSubTab === "proposals" && (
        <div className="space-y-4">
          {props.map((p) => {
            const isOwn = p.created_by === user.username && p.kind !== "disruption";
            const canApprove = user.permissions.includes("*") || user.permissions.includes("timetable.approve");
            return (
              <div
                key={p.id}
                className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-bold border border-stone-300">
                      Proposal #{p.id}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      {p.kind}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      submitted by <strong className="text-stone-900">{p.created_by}</strong>
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor[p.status] ?? "bg-slate-100 text-slate-700 border border-slate-300 font-semibold"}`}>
                    {p.status}
                  </span>
                </div>

                <div className="text-xs text-slate-700 font-medium space-y-1">
                  <p>
                    <span className="text-slate-600 font-semibold">Changes:</span>{" "}
                    {p.payload.changes.map((c: any) => c.type).join(", ")} →{" "}
                    <strong className="text-indigo-400">{p.result.status}</strong>
                    {p.result.moved !== undefined && ` · ${p.result.moved} sessions moved`}
                  </p>

                  {p.result.diff?.length > 0 && (
                    <div className="overflow-x-auto mt-2 rounded-xl border border-slate-800">
                      <table className="min-w-full text-xs">
                        <thead className="bg-[#FAF5ED] text-stone-700 font-semibold border-b border-[#E8DEC8]">
                          <tr className="text-left">
                            <th className="p-2">Session</th>
                            <th className="p-2">Action</th>
                            <th className="p-2">Relocation (Old → New)</th>
                            <th className="p-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {p.result.diff.map((d: any) => (
                            <tr key={d.session_id} className="text-slate-700 border-b border-stone-200">
                              <td className="p-2 font-mono font-medium">{d.session_id}</td>
                              <td className="p-2">{d.change}</td>
                              <td className="p-2 text-indigo-700 font-mono font-medium">
                                {d.old ? `${d.old[0]} P${d.old[1]} ${d.old[2]}` : "—"} →{" "}
                                {d.new ? `${d.new[0]} P${d.new[1]} ${d.new[2]}` : "—"}
                              </td>
                              <td className="p-2 text-slate-600">{d.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {p.status === "pending" && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {isOwn ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Self-Approval Prohibited (Institutional Rule)</span>
                      </div>
                    ) : canApprove ? (
                      <>
                        <button
                          onClick={() => act(`/proposals/${p.id}/approve`)}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve & Apply Timetable
                        </button>
                        <button
                          onClick={() => act(`/proposals/${p.id}/reject`)}
                          className="btn-danger text-xs py-1.5 px-3"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Awaiting Dean's Office / Admin Approval</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!props.length && (
            <div className="card text-center py-12 text-slate-600 font-medium text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              No disruption or reschedule change proposals currently pending.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

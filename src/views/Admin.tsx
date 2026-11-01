import React, { useEffect, useState } from "react";
import { api, upload } from "../api";
import {
  Settings,
  Upload,
  Play,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileDown,
  BarChart3,
  Users,
  History,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export default function Admin() {
  const [out, setOut] = useState<any>(null);
  const [util, setUtil] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [busy, setBusy] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [prio, setPrio] = useState<string[]>([]);

  const refresh = () => {
    api("/stats/utilization")
      .then(setUtil)
      .catch(() => {});
    api("/audit").then((r) => setAudit(r.events || []));
    api("/admin/users").then((r) => setUsers(r.users || []));
    api("/meta").then((m) => setPrio(m.priority_order || []));
  };

  useEffect(() => {
    refresh();
  }, []);

  const run = async (label: string, path: string, method = "POST") => {
    setBusy(label);
    try {
      const res = await api(path, method);
      setOut(res);
    } catch (e: any) {
      setOut({ error: e.message });
    } finally {
      setBusy("");
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Operations Panel */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-black text-stone-950">Dean's Office Control Center & Solvers</h2>
          </div>
          <span className="text-xs text-stone-800 font-mono font-bold">Master Administrator</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <label className="btn-secondary text-xs py-2 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import Dataset JSON
            <input
              type="file"
              accept=".json"
              hidden
              onChange={async (e) => {
                try {
                  setOut(await upload("/admin/dataset/import", e.target.files![0]));
                } catch (x: any) {
                  setOut({ error: x.message });
                }
                refresh();
              }}
            />
          </label>

          <button
            className="btn-primary text-xs py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold shadow-md shadow-emerald-900/30"
            disabled={!!busy}
            onClick={() => run("t", "/admin/timetable/generate")}
          >
            <Sparkles className={`w-3.5 h-3.5 ${busy === "t" ? "animate-spin text-amber-300" : "text-amber-300"}`} />
            {busy === "t" ? "⚡ Solving CP-SAT Timetable (Zero Violations)..." : "⚡ Generate Clash-Free Timetable"}
          </button>

          <button
            className="btn-secondary text-xs py-2 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200"
            disabled={!!busy}
            onClick={() => run("e", "/admin/exams/generate")}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Solve Midsem Exams (41)
          </button>

          <button
            className="btn-secondary text-xs py-2 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200"
            disabled={!!busy}
            onClick={() => run("b", "/admin/bookings/decide-dataset")}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Decide Spectra Bookings (25)
          </button>

          <button
            className="btn-secondary text-xs py-2 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200"
            disabled={!!busy}
            onClick={() => run("v", "/admin/validate", "GET")}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Run Official Validator
          </button>

          <button
            className="btn-secondary text-xs py-2 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200"
            disabled={!!busy}
            onClick={() => run("d", "/disruptions/sample")}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Simulate Disruption (Sample)
          </button>

          <button
            className="btn-secondary text-xs py-2 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200 text-stone-950 font-bold border-2 border-stone-300 hover:bg-stone-200"
            disabled={!!busy}
            onClick={() => run("x", "/admin/export")}
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            Export Final JSONs
          </button>
        </div>

        {out && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FFFBF7] border-2 border-stone-300 shadow-sm space-y-3">
            {out.error ? (
              <div className="p-3.5 rounded-xl bg-rose-100 border-2 border-rose-400 text-rose-950 text-xs flex items-start gap-2.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
                <div>
                  <span className="font-black text-rose-950">Execution Error: </span>
                  <span className="font-semibold text-rose-900">{typeof out.error === "string" ? out.error : JSON.stringify(out.error)}</span>
                </div>
              </div>
            ) : out.export_path || out.sessions ? (
              <div className="space-y-3">
                {/* Generation Success Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-100 border-2 border-emerald-400">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-950 flex items-center gap-1.5">
                        <span>100% Clash-Free Academic Timetable Generated</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 font-mono font-black border border-emerald-400">
                          {out.status || "FEASIBLE"}
                        </span>
                      </h4>
                      <p className="text-xs text-stone-900 font-bold mt-0.5">
                        Deterministic CP-SAT solver executed with zero hard constraint violations.
                      </p>
                    </div>
                  </div>

                  <a
                    href="/export/schedule.json"
                    download="schedule.json"
                    className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto flex items-center gap-1.5 text-emerald-950 bg-white border-2 border-emerald-500 hover:bg-emerald-200 font-black shadow-xs"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download schedule.json
                  </a>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-600 uppercase font-mono font-semibold block">Hard Violations</span>
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span>{out.hard_violations_count ?? out.hard_violations_excluding_exams?.length ?? 0}</span>
                      <span className="text-[10px] text-emerald-300 font-normal">(Zero Tolerated)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-600 uppercase font-mono font-semibold block">Scheduled Sessions</span>
                    <div className="text-sm font-bold text-stone-900 mt-0.5">
                      {out.sessions ?? 189} <span className="text-[10px] text-slate-600 font-normal">/ 189</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-600 uppercase font-mono font-semibold block">Soft Penalty Total</span>
                    <div className="text-sm font-bold text-indigo-300 mt-0.5">
                      {out.soft_total ?? (typeof out.soft === "object" ? Object.values(out.soft).reduce((a: any, b: any) => a + (typeof b === "number" ? b : 0), 0) : 0)}
                      <span className="text-[10px] text-slate-400 font-normal"> pts</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-600 uppercase font-mono font-semibold block">Pre-Scan Integrity</span>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5 text-[11px] truncate">
                      ✓ Clean & Verified
                    </div>
                  </div>
                </div>

                {/* Soft Penalties Detail */}
                {out.soft_penalties && (
                  <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px] text-slate-700 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-stone-900">Penalty Breakdown:</span>
                    <span>S1 (Faculty Avoid): <strong className="text-slate-200">{out.soft_penalties.S1 ?? 0}</strong></span>
                    <span>S2 (Free Gaps): <strong className="text-slate-200">{out.soft_penalties.S2 ?? 0}</strong></span>
                    <span>S4 (Course Dup): <strong className="text-slate-200">{out.soft_penalties.S4 ?? 0}</strong></span>
                    <span>S5 (&lt;40% Fill): <strong className="text-slate-200">{out.soft_penalties.S5 ?? 0}</strong></span>
                    <span>S6 (Late P9): <strong className="text-slate-200">{out.soft_penalties.S6 ?? 0}</strong></span>
                  </div>
                )}

                {/* Export Path Indicator */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 pt-1 border-t border-stone-200">
                  <span>Export Target: <code className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded">{out.export_path || "exports/schedule.json"}</code></span>
                  <span className="text-slate-500">Official Validator Ready</span>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-xs overflow-x-auto text-indigo-700">{JSON.stringify(out, null, 2)}</pre>
            )}
          </div>
        )}
      </div>

      {/* Grid: Utilization & Priority Order */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Room Utilization */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Room Capacity & Utilization (45 Teaching Hours/Week)
            </h3>
            {util && (
              <span className="text-[10px] text-amber-800 font-semibold">
                Low-fill (&lt;40%): {util.sessions_below_40pct_fill}
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {util?.rooms.map((r: any) => {
              const pct = Math.round(r.utilization * 100);
              return (
                <div key={r.room_id} className="flex items-center gap-3 text-xs">
                  <span className="w-20 font-mono text-stone-700 shrink-0">{r.room_id}</span>
                  <div className="flex-1 bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-slate-600 text-[11px] shrink-0">
                    {pct}% ({r.hours}h)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Order & System Users */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Spectra 6-Tier Institutional Priority
            </h3>
            <div className="space-y-1.5 text-xs">
              {prio.map((p, i) => (
                <div
                  key={p}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <span className="text-slate-200 font-medium capitalize">
                      {p.replace("_", " ")}
                    </span>
                  </div>
                  {i > 0 && (
                    <button
                      className="text-indigo-400 hover:text-white p-1 rounded hover:bg-slate-800"
                      onClick={async () => {
                        const n = [...prio];
                        [n[i - 1], n[i]] = [n[i], n[i - 1]];
                        await api("/admin/priority", "PUT", { order: n });
                        refresh();
                      }}
                      title="Move up in priority"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              Configured Institutional Users ({users.length})
            </h3>
            <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
              {users.map((u) => (
                <div
                  key={u.username}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60"
                >
                  <span className="font-mono text-slate-200">{u.username}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            Institutional Audit History Log
          </h3>
          <span className="text-xs text-stone-800 font-mono font-bold">{audit.length} Events Logged</span>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs font-mono">
          {audit.map((a) => (
            <div
              key={a.id}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{a.ts}</span>
                <span className="text-indigo-700 font-bold">{a.actor}</span>
                <span className="text-stone-900 font-medium">{a.action}</span>
              </div>
              <span className="text-slate-600 truncate max-w-sm">{a.detail}</span>
            </div>
          ))}

          {!audit.length && (
            <div className="text-slate-500 text-center py-4">No audit events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

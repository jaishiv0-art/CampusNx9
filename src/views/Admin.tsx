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
            <h2 className="text-base font-bold text-white">Dean's Office Control Center & Solvers</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Master Administrator</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <label className="btn-secondary text-xs py-2 cursor-pointer">
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
            className="btn-primary text-xs py-2"
            disabled={!!busy}
            onClick={() => run("t", "/admin/timetable/generate")}
          >
            <Play className="w-3.5 h-3.5" />
            {busy === "t" ? "Solving CP-SAT (OR-Tools)..." : "Solve Timetable (Zero Hard)"}
          </button>

          <button
            className="btn-secondary text-xs py-2"
            disabled={!!busy}
            onClick={() => run("e", "/admin/exams/generate")}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Solve Midsem Exams (41)
          </button>

          <button
            className="btn-secondary text-xs py-2"
            disabled={!!busy}
            onClick={() => run("b", "/admin/bookings/decide-dataset")}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Decide Spectra Bookings (25)
          </button>

          <button
            className="btn-secondary text-xs py-2"
            disabled={!!busy}
            onClick={() => run("v", "/admin/validate", "GET")}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Run Official Validator
          </button>

          <button
            className="btn-secondary text-xs py-2"
            disabled={!!busy}
            onClick={() => run("d", "/disruptions/sample")}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Simulate Disruption (Sample)
          </button>

          <button
            className="btn-secondary text-xs py-2"
            disabled={!!busy}
            onClick={() => run("x", "/admin/export")}
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            Export Final JSONs
          </button>
        </div>

        {out && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs overflow-x-auto text-indigo-300">
            <pre>{JSON.stringify(out, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Grid: Utilization & Priority Order */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Room Utilization */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Room Capacity & Utilization (45 Teaching Hours/Week)
            </h3>
            {util && (
              <span className="text-[10px] text-amber-300">
                Low-fill (&lt;40%): {util.sessions_below_40pct_fill}
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {util?.rooms.map((r: any) => {
              const pct = Math.round(r.utilization * 100);
              return (
                <div key={r.room_id} className="flex items-center gap-3 text-xs">
                  <span className="w-20 font-mono text-slate-300 shrink-0">{r.room_id}</span>
                  <div className="flex-1 bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-slate-400 text-[11px] shrink-0">
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
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
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
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
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
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            Institutional Audit History Log
          </h3>
          <span className="text-xs text-slate-400 font-mono">{audit.length} Events Logged</span>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs font-mono">
          {audit.map((a) => (
            <div
              key={a.id}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{a.ts}</span>
                <span className="text-indigo-300 font-bold">{a.actor}</span>
                <span className="text-white">{a.action}</span>
              </div>
              <span className="text-slate-400 truncate max-w-sm">{a.detail}</span>
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

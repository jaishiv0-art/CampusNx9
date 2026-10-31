import React, { useEffect, useMemo, useState } from "react";
import { api, User } from "../api";
import {
  Calendar,
  List,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  GraduationCap
} from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Timetable({ user }: { user: User }) {
  const [meta, setMeta] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState<Record<string, string>>({});
  const [view, setView] = useState<"week" | "list">("week");
  const [conf, setConf] = useState<any>(null);
  const [err, setErr] = useState("");
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    api("/meta").then(setMeta);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    api(`/timetable?${q}`)
      .then((r) => setRows(r.sessions))
      .catch((e) => setErr(e.message));
  }, [f]);

  useEffect(() => {
    api("/conflicts").then(setConf).catch(() => {});
  }, []);

  const grid = useMemo(() => {
    const g: Record<string, any[]> = {};
    rows.forEach((r) => {
      for (let i = 0; i < r.duration; i++) {
        (g[`${r.day}-${r.start_period + i}`] ??= []).push(r);
      }
    });
    return g;
  }, [rows]);

  const sel = (k: string, label: string, opts: string[][]) => (
    <select
      className="inp text-xs py-1.5"
      value={f[k] ?? ""}
      onChange={(e) => setF({ ...f, [k]: e.target.value })}
    >
      <option value="">{label}: All</option>
      {opts.map(([v, t]) => (
        <option key={v} value={v}>
          {t}
        </option>
      ))}
    </select>
  );

  if (!meta) {
    return (
      <div className="card text-center py-12 text-slate-400 text-xs">
        Loading CIT Master Timetable Matrix...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Schedule Filters & View Controls</span>
          </div>
          {Object.values(f).some(Boolean) && (
            <button
              onClick={() => setF({})}
              className="text-[11px] text-indigo-400 hover:text-white underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {sel("day", "Day", DAYS.map((d) => [d, d]))}
          {sel("period", "Period", PERIODS.map((p) => [String(p), `P${p} (${p <= 5 ? 7 + p : 8 + p}:00)`]))}
          {sel("faculty", "Faculty", meta.faculty.map((x: any) => [x.id, `${x.id} ${x.name}`]))}
          {sel("department", "Department", meta.departments.map((d: string) => [d, d]))}
          {sel("group", "Student Group", meta.groups.map((g: any) => [g.id, g.id]))}
          {sel("room", "Room", meta.rooms.map((r: any) => [r.id, `${r.id} (${r.type})`]))}
        </div>
      </div>

      {/* View Switcher & Validation Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                view === "week"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setView("week")}
            >
              <Calendar className="w-3.5 h-3.5" />
              Weekly Grid
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                view === "list"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setView("list")}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {rows.length} sessions active
          </span>
        </div>

        {conf && (
          <div className="flex items-center gap-2">
            {conf.hard_violation_count > 0 ? (
              <div className="glow-pill-rose">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{conf.hard_violation_count} Hard Conflicts</span>
              </div>
            ) : (
              <div className="glow-pill-emerald">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Hard Violations (H1–H14 Satisfied)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {err && <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{err}</p>}

      {/* Weekly Grid */}
      {view === "week" ? (
        <div className="overflow-x-auto glass-panel rounded-2xl border border-slate-800 shadow-xl">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-300">
                <th className="p-3 text-left w-24">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="p-3 text-center border-l border-slate-800/80 font-bold tracking-wider">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {PERIODS.map((p) => {
                const isLunch = p === 5;
                return (
                  <tr key={p} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-3 font-semibold text-slate-300 align-top bg-slate-950/40 border-r border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-mono">
                        <Clock className="w-3 h-3" />
                        P{p}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {p <= 5 ? 7 + p : 8 + p}:00–{p <= 5 ? 8 + p : 9 + p}:00
                      </div>
                      {isLunch && (
                        <div className="text-[9px] text-amber-400 font-semibold mt-1 uppercase">
                          Lunch 13-14
                        </div>
                      )}
                    </td>

                    {DAYS.map((d) => {
                      const items = grid[`${d}-${p}`] ?? [];
                      return (
                        <td key={d} className="p-1.5 border-l border-slate-800/60 align-top min-w-[170px]">
                          {items.map((r) => {
                            const isLab = r.kind === "lab";
                            const isTut = r.kind === "tutorial";
                            const bgCard = isLab
                              ? "bg-violet-500/15 text-violet-200 border-violet-500/30 hover:border-violet-400/60"
                              : isTut
                              ? "bg-amber-500/15 text-amber-200 border-amber-500/30 hover:border-amber-400/60"
                              : "bg-indigo-500/15 text-indigo-200 border-indigo-500/30 hover:border-indigo-400/60";

                            return (
                              <div
                                key={r.session_id}
                                onClick={() => setSelectedSession(r)}
                                className={`mb-1.5 rounded-xl p-2.5 border transition-all cursor-pointer shadow-sm hover:scale-[1.01] ${bgCard}`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <strong className="font-bold tracking-tight text-white">
                                    {r.course_id}
                                  </strong>
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900/70 border border-white/10 text-slate-200">
                                    {r.room_id}
                                  </span>
                                </div>

                                <div className="text-[11px] font-medium truncate opacity-90">
                                  {r.faculty}
                                </div>

                                <div className="text-[10px] opacity-75 mt-0.5 truncate flex items-center justify-between">
                                  <span>{r.groups.join(", ")}</span>
                                  {r.duration > 1 && (
                                    <span className="font-mono text-[9px] bg-white/10 px-1 rounded">
                                      {r.duration}h
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto shadow-xl">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
              <tr className="text-left">
                <th className="p-3">Session ID</th>
                <th className="p-3">Course</th>
                <th className="p-3">Kind</th>
                <th className="p-3">Day & Time</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Room</th>
                <th className="p-3">Faculty</th>
                <th className="p-3">Student Groups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rows.map((r) => (
                <tr
                  key={r.session_id}
                  onClick={() => setSelectedSession(r)}
                  className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                >
                  <td className="p-3 font-mono font-bold text-indigo-300">{r.session_id}</td>
                  <td className="p-3 font-semibold text-white">{r.course_id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {r.kind}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    {r.day} P{r.start_period}
                  </td>
                  <td className="p-3 font-mono">{r.duration} hr</td>
                  <td className="p-3 font-mono font-semibold text-slate-200">{r.room_id}</td>
                  <td className="p-3 text-slate-300">{r.faculty}</td>
                  <td className="p-3 text-slate-400">{r.groups.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Session Drawer Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedSession.session_id}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedSession.course_id} · {selectedSession.title || "Course"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Assigned Faculty:</span>
                <strong className="text-white">{selectedSession.faculty} ({selectedSession.faculty_id})</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Venue & Room Type:</span>
                <strong className="text-white font-mono">{selectedSession.room_id}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Scheduled Slot:</span>
                <strong className="text-indigo-300 font-mono">
                  {selectedSession.day} Period {selectedSession.start_period} (Duration: {selectedSession.duration}h)
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Student Groups:</span>
                <strong className="text-white">{selectedSession.groups.join(", ")}</strong>
              </div>
              {selectedSession.basket && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Elective Basket:</span>
                  <strong className="text-amber-300 font-mono">{selectedSession.basket}</strong>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSession(null)}
              className="btn-secondary w-full text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

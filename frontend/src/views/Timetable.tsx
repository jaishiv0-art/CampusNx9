import React, { useEffect, useMemo, useState } from "react";
import { api, User } from "../api";
import {
  Calendar,
  List,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Utensils
} from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const DAY_NAMES: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday"
};

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

  const renderPeriodCell = (d: string, p: number) => {
    const items = grid[`${d}-${p}`] ?? [];
    return (
      <td
        key={p}
        className="p-1.5 border-r border-[#E8DEC8] align-top min-w-[130px] hover:bg-[#FAF7F2]/80 transition-colors"
      >
        {items.length === 0 ? (
          <div className="h-full min-h-[56px] flex items-center justify-center text-stone-300 text-[11px] select-none font-mono">
            —
          </div>
        ) : (
          items.map((r) => {
            const isStart = r.start_period === p;
            const isLab = r.kind === "lab";
            const isTut = r.kind === "tutorial";

            const bgCard = isLab
              ? "bg-amber-50 text-amber-950 border-amber-300/80 hover:border-amber-500 shadow-xs"
              : isTut
              ? "bg-emerald-50 text-emerald-950 border-emerald-300/80 hover:border-emerald-500 shadow-xs"
              : "bg-[#7B1123]/10 text-stone-900 border-[#7B1123]/25 hover:border-[#7B1123]/60 shadow-xs";

            if (!isStart) {
              // Elegant continuation indicator for multi-hour labs (P2-P4 or P6-P8)
              return (
                <div
                  key={`${r.session_id}-${p}`}
                  onClick={() => setSelectedSession(r)}
                  className="mb-1 rounded-lg px-2 py-1 border border-dashed border-amber-300/90 bg-amber-50/70 text-amber-900 text-[10px] font-medium cursor-pointer transition-all hover:bg-amber-100/80 flex items-center justify-between"
                  title={`${r.course_id} continued from P${r.start_period}`}
                >
                  <span className="truncate">↳ {r.course_id}</span>
                  <span className="font-mono text-[9px] text-amber-800 font-bold opacity-80 shrink-0 ml-1">
                    {r.room_id}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={r.session_id}
                onClick={() => setSelectedSession(r)}
                className={`mb-1.5 rounded-xl p-2 border transition-all cursor-pointer hover:scale-[1.01] ${bgCard}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <strong className="font-bold tracking-tight text-stone-900 text-[11px]">
                    {r.course_id}
                  </strong>
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-white border border-[#D8C7B5] text-stone-800 font-semibold shadow-xs">
                    {r.room_id}
                  </span>
                </div>

                <div className="text-[10px] font-medium truncate opacity-90 text-stone-800">
                  {r.faculty}
                </div>

                <div className="text-[9px] text-stone-600 mt-0.5 truncate flex items-center justify-between">
                  <span className="truncate">{r.groups.join(", ")}</span>
                  {r.duration > 1 && (
                    <span className="font-mono text-[8px] bg-stone-200/90 px-1 rounded font-bold text-stone-800 ml-1 shrink-0">
                      {r.duration}h
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </td>
    );
  };

  if (!meta) {
    return (
      <div className="card text-center py-12 text-stone-500 text-xs font-semibold">
        Loading CIT Master Timetable Matrix...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs space-y-3 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-bold text-stone-800">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#7B1123]" />
            <span>Schedule Filters & View Controls</span>
          </div>
          {Object.values(f).some(Boolean) && (
            <button
              onClick={() => setF({})}
              className="text-[11px] text-[#7B1123] hover:text-stone-900 underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {sel("day", "Day", DAYS.map((d) => [d, `${d} (${DAY_NAMES[d]})`]))}
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
          <div className="bg-[#FAF5ED] p-1 rounded-xl border border-[#E8DEC8] flex items-center gap-1">
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === "week"
                  ? "bg-[#7B1123] text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-950 hover:bg-stone-200"
              }`}
              onClick={() => setView("week")}
            >
              <Calendar className="w-3.5 h-3.5" />
              Weekly Grid (Periods Horizontal)
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                view === "list"
                  ? "bg-[#7B1123] text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-950 hover:bg-stone-200"
              }`}
              onClick={() => setView("list")}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
          </div>
          <span className="text-xs text-stone-600 font-mono font-semibold">
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

      {err && <p className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium">{err}</p>}

      {/* Weekly Grid: Days Vertically (Rows), Periods Horizontally (Columns) */}
      {view === "week" ? (
        <div className="overflow-x-auto bg-white/95 rounded-2xl border border-[#E8DCBE] shadow-xs backdrop-blur-md">
          <table className="min-w-[1280px] w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF5ED] border-b border-[#E8DEC8] text-stone-800">
                {/* Fixed Sticky Header for Day */}
                <th className="p-3 text-left w-32 font-bold sticky left-0 bg-[#FAF5ED] z-20 border-r border-[#E8DEC8] shadow-xs">
                  <div className="text-stone-900 font-bold uppercase tracking-wider text-[11px]">
                    Day \ Period
                  </div>
                </th>

                {/* Periods 1 to 5 (Morning) */}
                {[1, 2, 3, 4, 5].map((p) => (
                  <th key={p} className="p-2.5 text-center border-r border-[#E8DEC8] font-bold min-w-[125px]">
                    <div className="flex items-center justify-center gap-1 text-[#7B1123] font-mono font-bold">
                      <Clock className="w-3 h-3" />
                      P{p}
                    </div>
                    <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                      {p <= 5 ? 7 + p : 8 + p}:00–{p <= 5 ? 8 + p : 9 + p}:00
                    </div>
                  </th>
                ))}

                {/* Lunch Break Column (13:00 - 14:00) */}
                <th className="p-2 text-center bg-amber-50/80 text-amber-900 border-r border-amber-200 font-bold w-16 min-w-[64px]">
                  <div className="flex items-center justify-center gap-1 text-amber-900">
                    <Utensils className="w-3 h-3 text-amber-700" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Lunch</span>
                  </div>
                  <div className="text-[9px] text-amber-700 font-mono mt-0.5">
                    13:00–14:00
                  </div>
                </th>

                {/* Periods 6 to 9 (Afternoon) */}
                {[6, 7, 8, 9].map((p) => (
                  <th key={p} className="p-2.5 text-center border-r border-[#E8DEC8] font-bold min-w-[125px]">
                    <div className="flex items-center justify-center gap-1 text-[#7B1123] font-mono font-bold">
                      <Clock className="w-3 h-3" />
                      P{p}
                    </div>
                    <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                      {8 + p}:00–{9 + p}:00
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DEC8]">
              {DAYS.map((d) => {
                const daySessions = rows.filter((r) => r.day === d);
                return (
                  <tr key={d} className="hover:bg-[#FAF7F2]/40 transition-colors">
                    {/* Day Column (Sticky Left) */}
                    <td className="p-3 font-semibold text-stone-900 align-top bg-[#FAF5ED]/90 sticky left-0 z-10 border-r border-[#E8DEC8] shadow-xs">
                      <div className="text-sm font-bold text-stone-900 font-mono tracking-wide">
                        {d}
                      </div>
                      <div className="text-[11px] text-stone-500 font-sans mt-0.5">
                        {DAY_NAMES[d]}
                      </div>
                      <div className="text-[10px] text-stone-600 font-mono mt-1 bg-white/80 px-1.5 py-0.5 rounded border border-[#E8DEC8] inline-block font-semibold">
                        {daySessions.length} classes
                      </div>
                    </td>

                    {/* Periods 1 to 5 */}
                    {[1, 2, 3, 4, 5].map((p) => renderPeriodCell(d, p))}

                    {/* Lunch Break Cell */}
                    <td className="p-1 bg-amber-50/40 border-r border-amber-200/80 text-center align-middle">
                      <div className="h-full flex flex-col items-center justify-center py-4 text-amber-800/60 select-none">
                        <Utensils className="w-3.5 h-3.5 mb-1 opacity-70" />
                        <span className="text-[9px] font-bold tracking-widest uppercase [writing-mode:vertical-lr] rotate-180">
                          Lunch
                        </span>
                      </div>
                    </td>

                    {/* Periods 6 to 9 */}
                    {[6, 7, 8, 9].map((p) => renderPeriodCell(d, p))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* List View */
        <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] overflow-x-auto shadow-xs backdrop-blur-md">
          <table className="min-w-full text-xs">
            <thead className="bg-[#FAF5ED] border-b border-[#E8DEC8] text-stone-800 font-bold">
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
            <tbody className="divide-y divide-[#E8DEC8]">
              {rows.map((r) => (
                <tr
                  key={r.session_id}
                  onClick={() => setSelectedSession(r)}
                  className="hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  <td className="p-3 font-mono font-bold text-[#7B1123]">{r.session_id}</td>
                  <td className="p-3 font-bold text-stone-900">{r.course_id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#FAF5ED] text-stone-800 border border-[#E8DEC8]">
                      {r.kind}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-stone-800">
                    {r.day} P{r.start_period}
                  </td>
                  <td className="p-3 font-mono text-stone-700">{r.duration} hr</td>
                  <td className="p-3 font-mono font-bold text-stone-800">{r.room_id}</td>
                  <td className="p-3 text-stone-800">{r.faculty}</td>
                  <td className="p-3 text-stone-600">{r.groups.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Session Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DCBE] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#7B1123]/10 text-[#7B1123] border border-[#7B1123]/20">
                  {selectedSession.session_id}
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1">
                  {selectedSession.course_id} · {selectedSession.title || "Course"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-stone-700">
              <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                <span className="text-stone-500 font-medium">Assigned Faculty:</span>
                <strong className="text-stone-900">{selectedSession.faculty} ({selectedSession.faculty_id})</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                <span className="text-stone-500 font-medium">Venue & Room:</span>
                <strong className="text-stone-900 font-mono">{selectedSession.room_id}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                <span className="text-stone-500 font-medium">Scheduled Slot:</span>
                <strong className="text-[#7B1123] font-mono">
                  {selectedSession.day} Period {selectedSession.start_period} ({selectedSession.duration}h)
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                <span className="text-stone-500 font-medium">Student Groups:</span>
                <strong className="text-stone-900">{selectedSession.groups.join(", ")}</strong>
              </div>
              {selectedSession.basket && (
                <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                  <span className="text-stone-500 font-medium">Elective Basket:</span>
                  <strong className="text-amber-800 font-mono font-bold">{selectedSession.basket}</strong>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSession(null)}
              className="btn-secondary w-full text-xs py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

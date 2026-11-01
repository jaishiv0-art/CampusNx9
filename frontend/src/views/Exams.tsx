import React, { useEffect, useState } from "react";
import { api } from "../api";
import { GraduationCap, Clock, CheckCircle2, MapPin, AlertCircle } from "lucide-react";

export default function Exams() {
  const [ex, setEx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/exams")
      .then((r) => setEx(r.exams || []))
      .catch(() => setEx([]))
      .finally(() => setLoading(false));
  }, []);

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

  return (
    <div className="space-y-4">
      {/* Exam Header Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-bold text-white">
              Midsem Examination Allocation Matrix (Week 8)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Official Midsem Exam Schedule · Room capacities halved · Mon–Sat AM & PM slots
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="glow-pill-emerald">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>41 Exams Allocated</span>
          </div>
          <div className="glow-pill-indigo">
            <span>50% Seating Capacity</span>
          </div>
        </div>
      </div>

      {/* Examination Schedule Matrix */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-x-auto shadow-2xl p-0">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF5ED] border-b border-[#E8DEC8] text-stone-800 font-semibold">
              <th className="p-3.5 text-left w-28 font-bold">Session Slot</th>
              {days.map((d) => (
                <th key={d} className="p-3.5 text-center border-l border-slate-800 font-bold tracking-wider">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {[
              { id: "AM", time: "09:30–11:30" },
              { id: "PM", time: "14:00–16:00" }
            ].map(({ id: s, time }) => (
              <tr key={s} className="hover:bg-slate-900/20 transition-colors">
                <td className="p-3.5 font-bold text-slate-200 align-top bg-slate-950/40 border-r border-slate-800">
                  <div className="text-sm text-indigo-400 font-mono">{s}</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">{time}</div>
                </td>

                {days.map((d) => {
                  const items = ex.filter((e) => e.day === d && e.session === s);
                  return (
                    <td key={d} className="p-2 border-l border-slate-800/60 align-top min-w-[170px]">
                      {items.map((e) => (
                        <div
                          key={e.exam_id}
                          className="mb-2 rounded-xl p-2.5 bg-purple-500/10 border border-purple-500/25 hover:border-purple-400/50 transition-all shadow-sm"
                        >
                          <div className="font-bold text-stone-900 text-xs">{e.exam_id}</div>
                          <div className="text-[10px] text-purple-300/80 mt-1 flex items-center gap-1 font-mono">
                            <MapPin className="w-3 h-3 text-purple-400" />
                            {e.rooms.join(", ")}
                          </div>
                        </div>
                      ))}

                      {!items.length && (
                        <div className="text-[10px] text-slate-600 text-center py-4 italic">
                          No exams scheduled
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

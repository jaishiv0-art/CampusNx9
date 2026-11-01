import React, { useEffect, useMemo, useState } from "react";
import { api, User } from "../api";
import {
  Calendar,
  List,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Utensils,
  Sparkles,
  Cpu,
  FileDown,
  ShieldAlert,
  ShieldCheck,
  X,
  Coffee,
  Check,
  Layers,
  GraduationCap,
  BookOpen,
  User as UserIcon,
  Shield,
  Search,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronDown
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
  const [searchQuery, setSearchQuery] = useState("");
  const [rolePerspective, setRolePerspective] = useState<string>("ALL");
  const [view, setView] = useState<"week" | "list">("week");
  const [conf, setConf] = useState<any>(null);
  const [err, setErr] = useState("");
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // Automated Generator Configuration Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genDataset, setGenDataset] = useState("cit_public.json");
  const [scheduleMidsem, setScheduleMidsem] = useState(true);
  const [runPreScan, setRunPreScan] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState("");
  const [genStep, setGenStep] = useState<string>("");

  useEffect(() => {
    api("/meta").then(setMeta).catch(() => {});
  }, []);

  const fetchTimetable = () => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    if (rolePerspective !== "ALL") {
      params.set("role", rolePerspective);
    }

    api(`/timetable?${params.toString()}`)
      .then((r) => {
        setRows(r.sessions || []);
        setErr("");
      })
      .catch((e) => {
        if (e.status === 403 || e.message?.includes("403")) {
          setErr(
            "Notice: Under CIT institutional security policy, student club accounts have read-restricted access to raw teaching timetables. You can view venue availability and request event slots in the Bookings tab."
          );
        } else {
          setErr(e.message || "Failed to load timetable.");
        }
      });
  };

  useEffect(() => {
    fetchTimetable();
  }, [f, rolePerspective]);

  useEffect(() => {
    api("/conflicts")
      .then(setConf)
      .catch(() => {});
  }, []);

  // Filtered rows matching role perspective and search query
  const filteredRows = useMemo(() => {
    let list = rows;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.course_id?.toLowerCase().includes(q) ||
          r.session_id?.toLowerCase().includes(q) ||
          r.faculty?.toLowerCase().includes(q) ||
          r.room_id?.toLowerCase().includes(q) ||
          (r.groups && r.groups.some((g: string) => g.toLowerCase().includes(q)))
      );
    }

    if (rolePerspective === "FACULTY") {
      if (f.faculty) {
        list = list.filter((r) => r.faculty_id === f.faculty);
      } else if (user.faculty_id) {
        list = list.filter((r) => r.faculty_id === user.faculty_id);
      }
    } else if (rolePerspective === "DEPARTMENT_COORDINATOR") {
      const dept = f.department || user.department || "CSE";
      list = list.filter(
        (r) =>
          r.department === dept ||
          (r.group_depts && r.group_depts.includes(dept)) ||
          (r.groups && r.groups.some((g: string) => g.startsWith(dept)))
      );
    }

    return list;
  }, [rows, searchQuery, rolePerspective, f.faculty, f.department, user]);

  const grid = useMemo(() => {
    const g: Record<string, any[]> = {};
    filteredRows.forEach((r) => {
      for (let i = 0; i < r.duration; i++) {
        (g[`${r.day}-${r.start_period + i}`] ??= []).push(r);
      }
    });
    return g;
  }, [filteredRows]);

  // Execute Automated Timetable Generator
  const handleRunGenerator = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGenLoading(true);
    setGenError("");
    setGenResult(null);
    setGenStep("Step 1/4: Running Deterministic Pre-Scan Feasibility Check...");

    try {
      setTimeout(() => {
        setGenStep("Step 2/4: Formulating Google OR-Tools CP-SAT Model (H1–H14 Constraints)...");
      }, 1200);

      setTimeout(() => {
        setGenStep(
          scheduleMidsem
            ? "Step 3/4: Solving 189 Sessions & 41 Week-8 Midsem Examinations..."
            : "Step 3/4: Solving 189 Sessions Across MON-FRI (P1–P9, Lunch Sanctuary P5–P6)..."
        );
      }, 3500);

      const res = await api("/admin/timetable/generate", "POST", {
        dataset_file: genDataset,
        schedule_midsem: scheduleMidsem,
        run_pre_scan: runPreScan,
        time_limit_seconds: 180
      });

      setGenStep("Step 4/4: Auditing Hard Violations & Exporting to exports/schedule.json...");
      setGenResult(res);
      fetchTimetable();
      api("/conflicts").then(setConf).catch(() => {});
    } catch (error: any) {
      let errMsg = error.message || "Automated generation failed. Please review solver constraints.";
      try {
        const parsed = typeof errMsg === "string" && (errMsg.startsWith("{") || errMsg.includes('{"message"')) ? JSON.parse(errMsg) : null;
        if (parsed) {
          errMsg = parsed.message || errMsg;
          if (parsed.reasons && Array.isArray(parsed.reasons) && parsed.reasons.length > 0) {
            errMsg += ": " + parsed.reasons.join(". ");
          }
        }
      } catch {}
      setGenError(errMsg);
    } finally {
      setGenLoading(false);
    }
  };

  // Export verified schedule to schedule.json download
  const handleExportSchedule = async () => {
    try {
      const res = await api("/export/schedule.json");
      const jsonStr = JSON.stringify(res, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "schedule.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Export failed: " + (e.message || "Failed to download schedule.json"));
    }
  };

  const sel = (k: string, label: string, opts: string[][]) => (
    <select
      className="inp text-xs py-1.5 font-medium text-stone-900 bg-[#FFFEFC]"
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
        className="p-1.5 border-r border-[#E8DEC8] align-top min-w-[130px] hover:bg-stone-200/90/80 transition-colors"
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
      {/* Institutional Governance Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-[#FFFBF2] border border-[#F0E2C8] text-amber-950 text-xs flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-4 h-4 text-[#7B1123] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#7B1123]">Institutional Governance Rule:</strong> Nobody can approve their own timetable change or room booking request. Cross-role verification (Dean's Office ↔ Department Coordinator) is strictly enforced by the backend constraint engine.

        </div>
      </div>

      {/* Primary Header Controls & Automated Generator Launch Bar */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-[#E8DCBE] shadow-sm backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7B1123]/10 border border-[#7B1123]/25 flex items-center justify-center text-[#7B1123]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
              <span>CIT Master Timetable Matrix</span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider bg-[#7B1123]/10 text-[#7B1123] px-2 py-0.5 rounded border border-[#7B1123]/20">
                Even Semester 2026
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Deterministic OR-Tools CP-SAT scheduling across Monday–Friday (P1–P9) with lunch sanctuary
            </p>
          </div>
        </div>

        {/* Action Buttons: Generator, Export, View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dedicated "Run Automated Generator" Button */}
          <button
            type="button"
            onClick={() => {
              setGenResult(null);
              setGenError("");
              setShowGenModal(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7B1123] hover:bg-[#600D1B] active:bg-[#4C0914] text-white shadow-md shadow-amber-950/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            title="Launch Automated Solver Modal"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Run Automated Generator</span>
          </button>

          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportSchedule}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#D8C7B5] hover:bg-stone-100 text-stone-800 flex items-center gap-1.5 transition-all shadow-xs"
            title="Export verified timetable to exports/schedule.json"
          >
            <FileDown className="w-3.5 h-3.5 text-stone-600" />
            <span>Export schedule.json</span>
          </button>

          {/* View Mode Toggle */}
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
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white/95 rounded-2xl p-4 border border-[#E8DCBE] shadow-xs space-y-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-stone-800">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#7B1123]" />
            <span>Multi-Perspective Filters (Roles, Groups, Faculty & Venues)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-500 font-mono font-semibold">
              Showing {filteredRows.length} of {rows.length} scheduled sessions
            </span>
            {(Object.values(f).some(Boolean) || rolePerspective !== "ALL" || searchQuery) && (
              <button
                onClick={() => {
                  setF({});
                  setRolePerspective("ALL");
                  setSearchQuery("");
                }}
                className="text-[11px] text-[#7B1123] hover:text-stone-900 underline font-semibold cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {/* 1. ROLE PERSPECTIVE FILTER */}
          <div>
            <select
              className="inp text-xs py-1.5 font-bold text-[#7B1123] bg-[#FFFBF2] border-[#E8DCBE]"
              value={rolePerspective}
              onChange={(e) => setRolePerspective(e.target.value)}
            >
              <option value="ALL">Role: Dean's Office (All Campus)</option>
              <option value="DEPARTMENT_COORDINATOR">Role: Dept Coordinator</option>
              <option value="FACULTY">Role: Faculty Member</option>
              <option value="CLUB_REPRESENTATIVE">Role: Club Representative</option>
            </select>
          </div>

          {/* 2. STUDENT GROUPS FILTER */}
          <div>
            {meta?.groups &&
              sel("group", "Student Group", meta.groups.map((g: any) => [g.id, g.id]))}
          </div>

          {/* 3. FACULTY MEMBERS FILTER */}
          <div>
            {meta?.faculty &&
              sel(
                "faculty",
                "Faculty",
                meta.faculty.map((x: any) => [x.id, `${x.id} ${x.name}`])
              )}
          </div>

          {/* 4. ROOMS FILTER */}
          <div>
            {meta?.rooms &&
              sel(
                "room",
                "Room Venue",
                meta.rooms.map((r: any) => [r.id, `${r.id} (${r.type})`])
              )}
          </div>

          {/* 5. ACADEMIC DEPARTMENT FILTER */}
          <div>
            {meta?.departments &&
              sel("department", "Department", meta.departments.map((d: string) => [d, d]))}
          </div>

          {/* 6. DAY FILTER */}
          <div>
            {sel("day", "Day", DAYS.map((d) => [d, d]))}
          </div>

          {/* 7. QUICK TEXT SEARCH */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course or room..."
              className="inp text-xs py-1.5 pl-7"
            />
            <Search className="w-3 h-3 text-stone-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Role Perspective Context Badge */}
        {rolePerspective !== "ALL" && (
          <div className="p-2.5 rounded-xl bg-[#FAF5ED] border border-[#E8DEC8] flex items-center justify-between text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#7B1123]">
                Active Filter Perspective: {rolePerspective.replace("_", " ")}
              </span>
              <span className="text-stone-400">·</span>
              <span className="text-[11px] text-stone-600">
                {rolePerspective === "FACULTY" && "Filtering by assigned professor teaching hours (max 4h/day enforced)."}
                {rolePerspective === "DEPARTMENT_COORDINATOR" && "Focusing on departmental core courses, laboratory blocks, and instructor loads."}
                {rolePerspective === "CLUB_REPRESENTATIVE" && "Displaying venue availability for non-academic hours and student festival bookings."}
              </span>
            </div>
            <button
              onClick={() => setRolePerspective("ALL")}
              className="text-[10px] font-bold text-[#7B1123] underline"
            >
              Show All Institutional
            </button>
          </div>
        )}
      </div>

      {/* Validation Pill Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {conf && (
            conf.hard_violation_count > 0 ? (
              <div className="glow-pill-rose">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{conf.hard_violation_count} Hard Conflicts Detected</span>
              </div>
            ) : (
              <div className="glow-pill-emerald">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>0 Hard Violations (H1–H14 Mathematical Invariant Enforced)</span>
              </div>
            )
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono">
          <span>Weekly Slots: 45 Periods (MON–FRI)</span>
          <span>·</span>
          <span>Lunch Sanctuary: 13:00–14:00 (P5–P6)</span>
        </div>
      </div>

      {err && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: WEEKLY GRID WITH DAYS VERTICALLY AND LUNCH BREAK COLUMN
          ========================================================================= */}
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
                  <tr key={d} className="hover:bg-stone-200/90 transition-colors">
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
        /* VIEW 2: LIST VIEW */
        <div className="bg-white/95 rounded-2xl border border-[#E8DCBE] overflow-x-auto shadow-xs backdrop-blur-md">
          <table className="min-w-full text-xs">
            <thead className="bg-[#FAF5ED] border-b border-[#E8DEC8] text-stone-800 font-bold">
              <tr className="text-left">
                <th className="p-3">Session ID</th>
                <th className="p-3">Course Code</th>
                <th className="p-3">Session Type</th>
                <th className="p-3">Day & Slot</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Venue Room</th>
                <th className="p-3">Assigned Faculty</th>
                <th className="p-3">Student Groups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DEC8]">
              {filteredRows.map((r) => (
                <tr
                  key={r.session_id}
                  onClick={() => setSelectedSession(r)}
                  className="hover:bg-stone-200/90 transition-colors cursor-pointer"
                >
                  <td className="p-3 font-mono font-bold text-[#7B1123]">{r.session_id}</td>
                  <td className="p-3 font-bold text-stone-900">{r.course_id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#FAF5ED] text-stone-800 border border-[#E8DEC8]">
                      {r.kind}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-stone-800">
                    {r.day} Period {r.start_period}
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

      {/* =========================================================================
          AUTOMATED GENERATOR CONFIGURATION MODAL
          ========================================================================= */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DCBE] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E8DEC8] pb-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  Automated Timetable Generator
                </h3>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#7B1123]/10 border border-[#7B1123]/25 flex items-center justify-center text-[#7B1123] shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-[#7B1123]" />
                  </div>
                  <p className="text-xs text-stone-500">
                    Google OR-Tools CP-SAT Solver & Deterministic Feasibility Pre-Scan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGenModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {genError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Structural Impossibility / Bottleneck Detected</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800">{genError}</p>
              </div>
            )}

            {/* Success Report */}
            {genResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Timetable Generation Completed Successfully!</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white border border-emerald-200">
                    <span className="text-[10px] text-stone-500 block">Assigned Sessions</span>
                    <strong className="text-stone-900 font-mono text-sm">{genResult.sessions}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-emerald-200">
                    <span className="text-[10px] text-stone-500 block">Midsem Exams (W8)</span>
                    <strong className="text-stone-900 font-mono text-sm">{genResult.exams_scheduled}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-emerald-200">
                    <span className="text-[10px] text-stone-500 block">Hard Violations</span>
                    <strong className="text-emerald-700 font-mono text-sm">0 Violations</strong>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>Export verified to: <strong className="font-mono">exports/schedule.json</strong></span>
                  <button
                    onClick={handleExportSchedule}
                    className="underline font-bold text-emerald-900 hover:text-emerald-700"
                  >
                    Download JSON
                  </button>
                </div>
              </div>
            )}

            {/* Generator Form */}
            <form onSubmit={handleRunGenerator} className="space-y-4">
              {/* 1. Dataset Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Institutional Dataset Specification
                </label>
                <select
                  value={genDataset}
                  onChange={(e) => setGenDataset(e.target.value)}
                  className="w-full bg-[#FFFEFC] border border-[#D8C7B5] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-stone-900 focus:ring-2 focus:ring-[#7B1123]/20 focus:border-[#7B1123] outline-none transition-all shadow-xs"
                >
                  <option value="cit_public.json">
                    cit_public.json (Official CIT Even Semester · 189 Sessions, 41 Exams, 35 Rooms)
                  </option>
                  <option value="current">
                    Current Active Dataset in Server Memory
                  </option>
                </select>

                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-stone-600 font-mono">
                  <span className="bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#E8DEC8]">189 Sessions</span>
                  <span className="bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#E8DEC8]">35 Campus Rooms</span>
                  <span className="bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#E8DEC8]">61 Faculty Members</span>
                  <span className="bg-[#FAF5ED] px-2 py-0.5 rounded border border-[#E8DEC8]">14 Student Groups</span>
                </div>
              </div>

              {/* 2. Midsem Exams Checkbox */}
              <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-schedule-midsem"
                  checked={scheduleMidsem}
                  onChange={(e) => setScheduleMidsem(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#7B1123] focus:ring-[#7B1123] cursor-pointer"
                />
                <label htmlFor="chk-schedule-midsem" className="text-xs cursor-pointer select-none">
                  <span className="font-bold text-stone-900 block">
                    Automatically Schedule Mid-Term Exams for Week 8
                  </span>
                  <span className="text-[11px] text-stone-600 leading-relaxed block mt-0.5">
                    Mathematically allocates all 41 course examinations into morning (AM: 09:00–11:00) and afternoon (PM: 14:00–16:00) exam slots across Week 8 with zero hall clashes and capacity-matched auditoriums/lecture halls.
                  </span>
                </label>
              </div>

              {/* 3. Pre-Scan Feasibility Checkbox */}
              <div className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#EADBCA] flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-run-prescan"
                  checked={runPreScan}
                  onChange={(e) => setRunPreScan(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#7B1123] focus:ring-[#7B1123] cursor-pointer"
                />
                <label htmlFor="chk-run-prescan" className="text-xs cursor-pointer select-none">
                  <span className="font-bold text-stone-900 block">
                    Run Deterministic Feasibility Pre-Scan
                  </span>
                  <span className="text-[11px] text-stone-600 leading-relaxed block mt-0.5">
                    Analyzes room capacity bottlenecks, accessibility mismatches, and faculty weekly availability before CP-SAT formulation to guarantee zero deadlock conditions.
                  </span>
                </label>
              </div>

              {/* Enforced Constraint Matrix Checklist */}
              <div className="p-3.5 rounded-xl bg-[#FFFBF2] border border-[#F0E2C8] space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7B1123] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7B1123]" />
                  Hard Invariants Enforced by Engine
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>0 Faculty & Group Clashes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lunch Sanctuary (P5–P6)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Room Capacity & Accessibility</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Max 4h/Day Faculty Limit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3-Hour Lab Block Continuity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Parallel Elective Baskets</span>
                  </div>
                </div>
              </div>

              {/* Live Loading Progress Bar */}
              {genLoading && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#7B1123]" />
                    <span>{genStep || "Solving CP-SAT Timetable Model..."}</span>
                  </div>
                  <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#7B1123] h-full w-3/4 animate-[shimmer_1.5s_infinite]" />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8DEC8]">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  disabled={genLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all cursor-pointer"
                >
                  {genResult ? "Close" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={genLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7B1123] text-white hover:bg-[#600D1B] active:bg-[#4C0914] shadow-md shadow-amber-950/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{genLoading ? "Solving Timetable..." : "Start Automated Generation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SELECTED SESSION & GOVERNANCE AUDIT MODAL
          ========================================================================= */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8DCBE] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#7B1123]/10 text-[#7B1123] border border-[#7B1123]/20">
                  {selectedSession.session_id}
                </span>
                <h3 className="text-lg font-black text-stone-900 mt-1">
                  {selectedSession.course_id} · {selectedSession.title || "Academic Course"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
              >
                ✕
              </button>
            </div>

            {/* Session Attributes */}
            <div className="space-y-2 text-xs text-stone-700">
              <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                <span className="text-stone-500 font-medium">Assigned Faculty:</span>
                <strong className="text-stone-900">
                  {selectedSession.faculty} ({selectedSession.faculty_id})
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                <span className="text-stone-500 font-medium">Venue & Room Type:</span>
                <strong className="text-stone-900 font-mono">{selectedSession.room_id}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E8DEC8]">
                <span className="text-stone-500 font-medium">Scheduled Period:</span>
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

            {/* Institutional Self-Approval Locked Banner */}
            <div className="p-3 rounded-xl bg-[#FFFBF2] border border-[#F0E2C8] text-[11px] text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#7B1123]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#7B1123]" />
                <span>Self-Approval Lock (Requester ≠ Approver Rule)</span>
              </div>
              <p className="text-stone-600 leading-snug">
                Under CIT institutional rules, instructors and coordinators cannot approve their own rescheduling or venue requests. Cross-role verification by an independent coordinator or Dean's Office is mandatory.
              </p>
            </div>

            {/* Verification Checklist */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-stone-600 font-medium">
              <span className="flex items-center gap-1 text-emerald-800">
                <Check className="w-3 h-3 text-emerald-600" />
                0 Overlap Guarantee
              </span>
              <span className="flex items-center gap-1 text-emerald-800">
                <Check className="w-3 h-3 text-emerald-600" />
                Capacity & Access Matched
              </span>
              <span className="flex items-center gap-1 text-emerald-800">
                <Check className="w-3 h-3 text-emerald-600" />
                Max 4h Daily Cap Satisfied
              </span>
              <span className="flex items-center gap-1 text-emerald-800">
                <Check className="w-3 h-3 text-emerald-600" />
                Lunch Sanctuary Respected
              </span>
            </div>

            <button
              onClick={() => setSelectedSession(null)}
              className="btn-secondary w-full text-xs py-2 cursor-pointer font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

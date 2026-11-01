import React, { useEffect, useState } from "react";
import { api, statusColor, User } from "../api";
import {
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  Send,
  XCircle,
  HelpCircle,
  Calendar
} from "lucide-react";

const ROOM_TYPES = [
  "classroom",
  "lecture_hall",
  "auditorium",
  "seminar_hall",
  "outdoor",
  "lab_cs",
  "lab_elec",
  "lab_phy",
  "lab_civil",
  "workshop"
];

const NEEDS = ["projector", "pa_system", "stage", "computers", "accessible", "power_benches", "ac"];

const SAMPLE_PROMPTS = [
  "Spectra ke liye Friday ko 6 baje se auditorium chahiye, around 200 students.",
  "Dramatics needs SH-1 Thursday 6 to 9 pm for stage play rehearsal, 130 people, stage and sound needed.",
  "Robotics Club workshop on Saturday from 10 am to 1 pm in CS Lab, 40 attendees.",
  "Need seminar hall on Wednesday 2 pm for guest lecture by Dr. Sen, 80 students."
];

export default function Bookings({ user }: { user: User }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<any>(null);
  const [list, setList] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api("/bookings")
      .then(setList)
      .catch((e) => setMsg(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const parse = async () => {
    setMsg("");
    setParsing(true);
    try {
      const res = await api("/bookings/parse", "POST", { text });
      setDraft(res);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setParsing(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const d = draft;
      const r = await api("/bookings", "POST", {
        title: d.title ?? "Untitled",
        attendance: d.attendance,
        duration_periods: d.duration_periods,
        windows: d.windows,
        room_types: d.room_types,
        needs: d.needs,
        requested_room: d.requested_room,
        mandatory_for_groups: d.mandatory_for_groups,
        requested_category: d.requested_category,
        raw_text: d.raw_text || text,
        requester: d.requester,
        confirm: true
      });
      setMsg(`Submitted ${r.id}. Engine verdict: ${r.recommendation.status} - ${r.recommendation.reason}`);
      setDraft(null);
      setText("");
      load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const tog = (k: string, v: string) =>
    set(k, draft[k].includes(v) ? draft[k].filter((x: string) => x !== v) : [...draft[k], v]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left Column: Natural Language Input & Draft Review */}
      <div className="space-y-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-stone-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-700" />
              AI Natural Language Venue Request (English / Hinglish)
            </h2>
            <span className="text-[10px] text-slate-700 font-mono font-semibold">Spectra Week 7</span>
          </div>

          <p className="text-xs text-stone-900 font-bold leading-relaxed">
            Enter your booking needs in plain language. Our deterministic parser extracts the title, window, capacity, needs, and role-capped category before final confirmation.
          </p>

          <textarea
            className="inp h-24 text-xs font-sans text-stone-950 placeholder:text-stone-600 font-semibold"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Spectra ke liye Friday ko 6 baje se auditorium chahiye, around 200 students..."
          />

          {/* Quick Clickable Sample Prompts */}
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-black text-stone-900">Quick test requests:</p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(p)}
                  className="text-[11px] text-left text-stone-950 hover:text-black px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 border-2 border-stone-300 hover:border-stone-500 transition-all truncate max-w-full font-bold shadow-2xs"
                >
                  "{p.slice(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              className="btn-primary w-full text-xs"
              disabled={!text.trim() || parsing}
              onClick={parse}
            >
              <Send className="w-3.5 h-3.5" />
              {parsing ? "Parsing via NLP Layer..." : "Extract Booking Details"}
            </button>
          </div>
        </div>

        {/* Extracted Form Draft */}
        {draft && (
          <div className="glass-card rounded-2xl p-5 border border-indigo-500/40 space-y-3 bg-indigo-950/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-stone-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Review & Confirm Booking Specifications
              </h3>
              <button onClick={() => setDraft(null)} className="text-slate-600 hover:text-slate-900 text-xs font-medium">
                Cancel
              </button>
            </div>

            {draft.follow_up && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-xs flex items-center gap-2 font-medium">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>{draft.follow_up}</span>
              </div>
            )}

            {draft.warnings?.map((w: string, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{w}</span>
              </div>
            ))}

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Event Name</label>
                <input
                  className="inp text-xs"
                  value={draft.title ?? ""}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Requesting Organization</label>
                <input
                  className="inp text-xs"
                  value={draft.requester ?? ""}
                  onChange={(e) => set("requester", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Expected Attendance</label>
                  <input
                    type="number"
                    className="inp text-xs"
                    value={draft.attendance ?? ""}
                    onChange={(e) => set("attendance", +e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Duration (periods)</label>
                  <input
                    type="number"
                    className="inp text-xs"
                    value={draft.duration_periods ?? 1}
                    onChange={(e) => set("duration_periods", +e.target.value)}
                  />
                </div>
              </div>

              {/* Windows */}
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold block">Requested Window(s)</label>
                {draft.windows?.map((w: any, i: number) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <select
                      className="inp text-xs"
                      value={w.day}
                      onChange={(e) =>
                        set(
                          "windows",
                          draft.windows.map((x: any, j: number) =>
                            j === i ? { ...x, day: e.target.value } : x
                          )
                        )
                      }
                    >
                      {["MON", "TUE", "WED", "THU", "FRI"].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="From P"
                      className="inp text-xs"
                      value={w.from_period}
                      onChange={(e) =>
                        set(
                          "windows",
                          draft.windows.map((x: any, j: number) =>
                            j === i ? { ...x, from_period: +e.target.value } : x
                          )
                        )
                      }
                    />
                    <input
                      type="number"
                      placeholder="To P"
                      className="inp text-xs"
                      value={w.to_period}
                      onChange={(e) =>
                        set(
                          "windows",
                          draft.windows.map((x: any, j: number) =>
                            j === i ? { ...x, to_period: +e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Room Types */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Acceptable Room Types</label>
                <div className="flex flex-wrap gap-1">
                  {ROOM_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => tog("room_types", t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        draft.room_types?.includes(t)
                          ? "bg-indigo-600 text-white"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300 font-medium"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Needs */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Equipment / Accessibility Needs</label>
                <div className="flex flex-wrap gap-1">
                  {NEEDS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => tog("needs", t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        draft.needs?.includes(t)
                          ? "bg-indigo-600 text-white"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300 font-medium"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px] text-slate-700 font-medium">
                Institutional Role Cap: Category is capped at <strong className="text-indigo-700 font-bold">{draft.requested_category}</strong> based on your role privileges.
              </div>
            </div>

            <button
              className="btn-primary w-full text-xs py-2.5 mt-2"
              disabled={!draft.windows?.length || !draft.attendance || submitting}
              onClick={submit}
            >
              {submitting ? "Submitting Request..." : "Confirm & Submit Booking Request"}
            </button>
          </div>
        )}

        {msg && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg("")} className="text-indigo-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Right Column: Submitted Bookings Status */}
      <div className="space-y-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-stone-950 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-700" />
              Booking Requests & Status Tracker
            </h2>
            <span className="text-xs text-slate-700 font-mono font-semibold">
              {list?.user_bookings?.length || 0} Records
            </span>
          </div>

          <div className="space-y-2.5">
            {list?.user_bookings?.map((b: any) => {
              const rec = b.decision ?? b.recommended;
              return (
                <div
                  key={b.id}
                  className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#7B1123]">
                        {b.id}
                      </span>
                      <strong className="text-stone-950 text-xs sm:text-sm font-black">
                        {b.request.title}
                      </strong>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        statusColor[b.status] ?? "bg-slate-100 text-slate-700 border border-slate-300 font-semibold"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-900 font-bold leading-relaxed">
                    {rec?.reason || "Pending review by Dean's Office / Coordinator"}
                  </p>

                  {rec?.room_id && (
                    <div className="text-xs text-[#7B1123] font-mono font-black flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-700" />
                      Assigned Room: {rec.room_id} ({rec.day} P{rec.start_period}–P{rec.end_period})
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200 text-xs text-stone-700 font-bold">
                    <span>Submitted: {b.created || "Recently"}</span>
                    {b.status === "pending" && (
                      <button
                        className="text-rose-800 hover:text-rose-950 underline font-black"
                        onClick={async () => {
                          if (confirm(`Cancel booking request ${b.id}?`)) {
                            await api(`/bookings/${b.id}/cancel`, "POST");
                            load();
                          }
                        }}
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!list?.user_bookings?.length && (
              <div className="card text-center py-10 text-slate-700 text-xs font-medium">
                No active booking requests found. Enter a venue request on the left to begin.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

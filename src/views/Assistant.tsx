import React, { useState } from "react";
import { api } from "../api";
import {
  Sparkles,
  Send,
  User as UserIcon,
  Bot,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight
} from "lucide-react";

const SUGGESTIONS = [
  "Kal physics lab available nahi hai",
  "Move CS203-L3 to Thursday period 8",
  "F07 unavailable on Monday periods 1 to 9",
  "Spectra ke liye Friday ko auditorium chahiye 200 log"
];

export default function Assistant() {
  const [m, setM] = useState("");
  const [log, setLog] = useState<any[]>([
    {
      q: "System initialized",
      r: {
        message:
          "Namaste! I am the CampusNx9 Scheduling Copilot. You can talk to me in English or Hinglish to check timetable status, report faculty/room unavailability, or prepare reschedule requests. All drafts are strictly validated by the CP-SAT engine and require human approval."
      }
    }
  ]);
  const [loading, setLoading] = useState(false);

  const send = async (msg = m) => {
    if (!msg.trim()) return;
    const q = msg;
    setM("");
    setLoading(true);
    try {
      const r = await api("/assistant", "POST", { message: q });
      setLog((l) => [...l, { q, r }]);
    } catch (e: any) {
      setLog((l) => [...l, { q, r: { message: "Error: " + e.message } }]);
    } finally {
      setLoading(false);
    }
  };

  const submitProposal = async (r: any) => {
    try {
      const path =
        r.proposal.changes[0].type === "move_session"
          ? "/requests/change"
          : "/faculty/unavailability";
      const res = await api(path, "POST", {
        changes: r.proposal.changes,
        note: "Submitted via AI Scheduler Assistant"
      });
      alert(`Proposal #${res.id} submitted for Admin approval! (Solver Status: ${res.result.status})`);
    } catch (e: any) {
      alert("Submission failed: " + e.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Scheduling & Disruption Copilot</h2>
              <p className="text-xs text-slate-400">
                Deterministic NLP parser · English & Hinglish support · Zero hard violation policy
              </p>
            </div>
          </div>
          <span className="glow-pill-indigo hidden sm:flex">Deterministic Validation</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 min-h-[380px] max-h-[500px] overflow-y-auto">
        {log.map((x, i) => (
          <div key={i} className="space-y-2">
            {x.q !== "System initialized" && (
              <div className="flex items-start justify-end gap-2.5">
                <div className="bg-indigo-600/30 border border-indigo-500/30 text-indigo-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm max-w-[85%]">
                  {x.q}
                </div>
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 text-xs">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-sm p-3.5 text-xs sm:text-sm max-w-[85%] space-y-2">
                <p className="leading-relaxed whitespace-pre-wrap">{x.r.message}</p>

                {x.r.proposal?.changes?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-indigo-300">
                      Draft ready: {x.r.proposal.changes.length} change action(s)
                    </span>
                    <button
                      className="btn-primary text-xs py-1 px-3"
                      onClick={() => submitProposal(x.r)}
                    >
                      Submit for Admin Approval <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {x.r.draft && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    Tip: Open the <strong>Venue Bookings</strong> tab to review the pre-filled form.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse pl-9">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Analyzing scheduling constraints and timetable matrix...
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-[11px] text-slate-400 font-semibold mr-1">Try asking:</span>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => send(s)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
          >
            "{s}"
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="flex gap-2">
        <input
          className="inp text-xs sm:text-sm"
          value={m}
          onChange={(e) => setM(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type in English or Hinglish (e.g. 'Kal physics lab available nahi hai')..."
        />
        <button
          className="btn-primary shrink-0"
          disabled={!m.trim() || loading}
          onClick={() => send()}
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>
    </div>
  );
}

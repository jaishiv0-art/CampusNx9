import { useEffect, useState } from "react"; import { api } from "../api";
export default function Exams() {
  const [ex, setEx] = useState<any[]>([]); useEffect(() => { api("/exams").then(r => setEx(r.exams)); }, []);
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return (<div className="card overflow-x-auto"><h2 className="font-semibold mb-2">Midsem examination timetable ({ex.length} exams)</h2>
    <table className="min-w-full text-xs"><thead><tr><th></th>{days.map(d => <th key={d} className="p-2">{d}</th>)}</tr></thead><tbody>{["AM", "PM"].map(s => <tr key={s} className="border-t align-top"><td className="p-2 font-semibold">{s}</td>
      {days.map(d => <td key={d} className="p-1 border-l min-w-[140px]">{ex.filter(e => e.day === d && e.session === s).map(e => <div key={e.exam_id} className="bg-indigo-50 rounded p-1 mb-1"><b>{e.exam_id}</b><div className="text-slate-500">{e.rooms.join(", ")}</div></div>)}</td>)}</tr>)}</tbody></table></div>);
}

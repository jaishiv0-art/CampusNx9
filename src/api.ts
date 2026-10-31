const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000";
let token = localStorage.getItem("token") ?? "";
export const setToken = (t: string) => { token = t; t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); };
export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail ?? j));
  return j as T;
}
export async function upload(path: string, file: File) {
  const f = new FormData(); f.append("file", file);
  const r = await fetch(BASE + path, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: f });
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j.detail ?? j)); return j;
}
export type User = { username: string; role: string; department?: string; faculty_id?: string; org?: string; permissions: string[] };
export const statusColor: Record<string, string> = { approved: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800", alternative_offered: "bg-sky-100 text-sky-800", cancelled: "bg-slate-200 text-slate-600", conflict: "bg-red-200 text-red-900" };

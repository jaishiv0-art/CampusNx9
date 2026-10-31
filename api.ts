export const getApiBase = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return "/api";
    }
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  return "http://localhost:8000";
};

let token = localStorage.getItem("token") ?? "";

export const setToken = (t: string) => {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const r = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail ?? j);
    throw new Error(msg);
  }
  return j as T;
}

export async function upload(path: string, file: File) {
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const f = new FormData();
  f.append("file", file);
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: f
  });
  const j = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(j.detail ?? j));
  return j;
}

export type RoleType = "ADMIN" | "DEPARTMENT_COORDINATOR" | "FACULTY" | "CLUB_REPRESENTATIVE";

export type User = {
  username: string;
  role: RoleType;
  department?: string;
  faculty_id?: string;
  org?: string;
  permissions: string[];
};

export const DEMO_USERS = [
  {
    role: "ADMIN" as RoleType,
    label: "Admin (Dean's Office)",
    username: "admin",
    password: "admin123",
    badge: "Master Controls & Approvals",
    desc: "Full institutional control, master timetable solver, validator audits & disruption approvals",
    color: "from-amber-500 to-orange-600"
  },
  {
    role: "DEPARTMENT_COORDINATOR" as RoleType,
    label: "Coordinator (CSE Dept)",
    username: "coord_cse",
    password: "coord123",
    badge: "CSE Dept Operations",
    desc: "Course & lab scheduling, departmental bookings, workload balance tracking",
    color: "from-blue-500 to-indigo-600"
  },
  {
    role: "FACULTY" as RoleType,
    label: "Faculty (Dr. Ananya Mishra)",
    username: "fac_f01",
    password: "faculty123",
    badge: "F01 - Computer Science",
    desc: "Personal weekly grid, unavailability windows, AI-assisted rescheduling requests",
    color: "from-purple-500 to-pink-600"
  },
  {
    role: "CLUB_REPRESENTATIVE" as RoleType,
    label: "Club Rep (Dramatics Society)",
    username: "club_dramatics",
    password: "club123",
    badge: "Student Activity Wing",
    desc: "Spectra week venue requests, availability checks, cancellation & decision tracking",
    color: "from-emerald-500 to-teal-600"
  }
];

export const statusColor: Record<string, string> = {
  approved: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  alternative_offered: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  cancelled: "bg-slate-700/40 text-slate-400 border border-slate-700",
  conflict: "bg-red-500/20 text-red-300 border border-red-500/40"
};

export const roleBadgeInfo: Record<RoleType, { label: string; bg: string; border: string; text: string }> = {
  ADMIN: {
    label: "Dean's Office (Admin)",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-300"
  },
  DEPARTMENT_COORDINATOR: {
    label: "Department Coordinator",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-300"
  },
  FACULTY: {
    label: "Faculty Member",
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-300"
  },
  CLUB_REPRESENTATIVE: {
    label: "Club Representative",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-300"
  }
};

const getApiBase = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== null && envUrl !== "") {
    return envUrl;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "/api";
  }
  return "http://localhost:8000";
};

const BASE = getApiBase();
let token = localStorage.getItem("token") ?? "";

export const setToken = (t: string) => {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(BASE + path, {
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
  const f = new FormData();
  f.append("file", file);
  const r = await fetch(BASE + path, {
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
  approved: "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold",
  pending: "bg-amber-50 text-amber-900 border border-amber-300 font-semibold",
  rejected: "bg-rose-50 text-rose-800 border border-rose-300 font-semibold",
  alternative_offered: "bg-sky-50 text-sky-800 border border-sky-300 font-semibold",
  cancelled: "bg-stone-100 text-stone-600 border border-stone-300 font-medium",
  conflict: "bg-red-50 text-red-900 border border-red-300 font-bold"
};

export const roleBadgeInfo: Record<RoleType, { label: string; bg: string; border: string; text: string }> = {
  ADMIN: {
    label: "Dean's Office (Admin)",
    bg: "bg-[#7B1123]/10",
    border: "border-[#7B1123]/25",
    text: "text-[#7B1123]"
  },
  DEPARTMENT_COORDINATOR: {
    label: "Department Coordinator",
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-900"
  },
  FACULTY: {
    label: "Faculty Member",
    bg: "bg-stone-100",
    border: "border-stone-300",
    text: "text-stone-800"
  },
  CLUB_REPRESENTATIVE: {
    label: "Club Representative",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    text: "text-emerald-900"
  }
};

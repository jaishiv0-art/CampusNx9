export const getApiBase = (): string => {
  // 1. Browser runtime: dynamically determine based on current origin/host
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local");

    const envUrl = (((import.meta as any).env?.VITE_API_URL as string) || "").trim();

    // In production (e.g. *.vercel.app, custom production domain):
    // NEVER allow localhost or 127.0.0.1 even if VITE_API_URL was set in Vercel env!
    if (!isLocalhost) {
      if (
        envUrl &&
        !envUrl.includes("localhost") &&
        !envUrl.includes("127.0.0.1") &&
        !envUrl.includes("0.0.0.0")
      ) {
        return envUrl.replace(/\/+$/, "");
      }
      return "/api";
    }

    // In local development:
    // Vite dev server proxy automatically rewrites /api -> http://127.0.0.1:8000
    if (envUrl) {
      return envUrl.replace(/\/+$/, "");
    }
    return "/api";
  }

  // 2. SSR / Non-browser fallback
  const envUrl = (((import.meta as any).env?.VITE_API_URL as string) || "").trim();
  if (
    envUrl &&
    !envUrl.includes("localhost") &&
    !envUrl.includes("127.0.0.1") &&
    !envUrl.includes("0.0.0.0")
  ) {
    return envUrl.replace(/\/+$/, "");
  }
  return "/api";
};

let token = localStorage.getItem("token") ?? "";

export const setToken = (t: string) => {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  const base = getApiBase().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = (path.startsWith("http://") || path.startsWith("https://"))
    ? path
    : (base === "/api" && cleanPath.startsWith("/api/"))
      ? cleanPath
      : `${base}${cleanPath}`;

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
  const base = getApiBase().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = (path.startsWith("http://") || path.startsWith("https://"))
    ? path
    : (base === "/api" && cleanPath.startsWith("/api/"))
      ? cleanPath
      : `${base}${cleanPath}`;

  const f = new FormData();
  f.append("file", file);
  const r = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: f
  });
  const j = await r.json().catch(() => ({}));
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
  full_name?: string;
  email?: string;
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
  approved: "bg-emerald-100 text-emerald-950 border-2 border-emerald-400 font-black",
  pending: "bg-amber-100 text-amber-950 border-2 border-amber-400 font-black",
  rejected: "bg-rose-100 text-rose-950 border-2 border-rose-400 font-black",
  alternative_offered: "bg-sky-100 text-sky-950 border-2 border-sky-400 font-black",
  cancelled: "bg-slate-200 text-slate-700 border border-slate-300 font-semibold",
  conflict: "bg-red-500/15 text-red-800 border border-red-500/40 font-semibold"
};

export const roleBadgeInfo: Record<RoleType, { label: string; bg: string; border: string; text: string }> = {
  ADMIN: {
    label: "Dean's Office (Admin)",
    bg: "bg-[#7B1123]/10",
    border: "border-2 border-[#7B1123]/30",
    text: "text-[#7B1123] font-black"
  },
  DEPARTMENT_COORDINATOR: {
    label: "Department Coordinator",
    bg: "bg-[#7B1123]/10",
    border: "border-2 border-[#7B1123]/30",
    text: "text-[#7B1123] font-black"
  },
  FACULTY: {
    label: "Faculty Member",
    bg: "bg-[#7B1123]/10",
    border: "border-2 border-[#7B1123]/30",
    text: "text-[#7B1123] font-black"
  },
  CLUB_REPRESENTATIVE: {
    label: "Club Representative",
    bg: "bg-[#7B1123]/10",
    border: "border-2 border-[#7B1123]/30",
    text: "text-[#7B1123] font-black"
  }
};

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  "https://placeholder.supabase.co";

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

// Safe initialized client for frontend authentication, subscriptions and queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseUrl.includes("your-project-id") &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes("placeholder")
  );
};

export interface UserProfile {
  id?: string;
  user_id: string;
  username: string;
  full_name?: string;
  email: string;
  role: "ADMIN" | "DEPARTMENT_COORDINATOR" | "FACULTY" | "CLUB_REPRESENTATIVE";
  department?: string | null;
  faculty_id?: string | null;
  org?: string | null;
  approval_status: "pending" | "approved" | "rejected";
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch profile associated with an auth user id
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[Supabase] fetchUserProfile notice:", error.message);
      return null;
    }
    return data as UserProfile | null;
  } catch (err) {
    console.warn("[Supabase] fetchUserProfile error:", err);
    return null;
  }
}

/**
 * Request a password reset email via Supabase
 */
export async function sendPasswordResetEmail(email: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured yet. Please configure VITE_SUPABASE_URL.");
  }
  const cleanEmail = email.trim();
  const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined
  });
  if (error) throw error;
  return data;
}

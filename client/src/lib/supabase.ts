import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(projectUrl && publishableKey && isHttpUrl(projectUrl));
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(projectUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
      global: { headers: { "Cache-Control": "no-store" } },
    })
  : null;

export const SUPABASE_SETUP_MESSAGE =
  "Connect a Supabase project to enable live products, owner sign-in and image uploads. Follow the setup guide in the project README.";

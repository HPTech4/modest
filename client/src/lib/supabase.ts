import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isBrowserSafeSupabaseKey, isSafeSupabaseProjectUrl } from "../../../scripts/supabase-key-policy.mjs";

const projectUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const keyCandidate = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  || "";
const publishableKey = isBrowserSafeSupabaseKey(keyCandidate) ? keyCandidate : "";

export const isSupabaseConfigured = Boolean(projectUrl && publishableKey && isSafeSupabaseProjectUrl(projectUrl));
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

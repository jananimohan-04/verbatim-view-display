import { createClient } from '@supabase/supabase-js';

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

// In local dev, use /api/supabase proxy to bypass browser adblockers.
// In production (Vercel) and SSR, connect directly to the live Supabase instance.
const defaultUrl = isLocalhost
  ? `${window.location.origin}/api/supabase`
  : "https://poioxmtrlqbiurrpgehd.supabase.co";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || defaultUrl;
const supabaseAnonKey =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] || "sb_publishable_4eaPHUDkrAorDrlWn3G2Sw_2T79KVhD";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

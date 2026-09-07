import { createClient } from '@supabase/supabase-js';

const isBrowser = typeof window !== "undefined";
const defaultDirectUrl = "https://poioxmtrlqbiurrpgehd.supabase.co";
const supabaseUrl =
  import.meta.env["VITE_SUPABASE_URL"] ||
  (isBrowser ? `${window.location.origin}/api/supabase` : defaultDirectUrl);
const supabaseAnonKey =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] || "sb_publishable_4eaPHUDkrAorDrlWn3G2Sw_2T79KVhD";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

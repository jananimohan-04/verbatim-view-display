import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || 'https://poioxmtrlqbiurrpgehd.supabase.co';
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || 'sb_publishable_4eaPHUDkrAorDrlWn3G2Sw_2T79KVhD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

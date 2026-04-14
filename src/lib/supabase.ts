import { createClient } from '@supabase/supabase-js';

// Use process.env for Node.js (server) and import.meta.env for Vite (client)
const supabaseUrl = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL);
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

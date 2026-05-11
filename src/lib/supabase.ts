import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http');
  } catch {
    return false;
  }
};

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey) {
  console.error('Supabase credentials missing or invalid:', { supabaseUrl, supabaseAnonKeyPresent: !!supabaseAnonKey });
}
console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');

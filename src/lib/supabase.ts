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
  console.warn('Supabase credentials missing or invalid. Please check your environment variables.');
}

try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage is available');
} catch (e) {
  console.error('localStorage is NOT available');
}

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');

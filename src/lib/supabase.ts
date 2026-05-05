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

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'sb-custom-auth',
        flowType: 'pkce'
      }
    })
  : createClient('https://placeholder.supabase.co', 'placeholder');

let cachedSession: any = null;

export const getSessionSafe = async () => {
    if (cachedSession) return cachedSession;

    const { data } = await supabase.auth.getSession();
    cachedSession = data.session;

    return cachedSession;
};

export const safeFetch = async (fn: any) => {
  try {
    return await fn();
  } catch (err: any) {
    console.error('Fetch failed:', err);
    return { data: null, error: err };
  }
};

export const fetchWithTimeout = async (url: string, options: any = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(id);
  }
};

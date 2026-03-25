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
} else {
  console.log('Supabase client initialized with URL:', supabaseUrl);
  console.log('Supabase Anon Key present:', !!supabaseAnonKey);
}

// Use robust storage mechanism for iframe compatibility
const cookieStorage = {
  getItem: (key: string) => {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(key + '=')) {
        return cookie.substring(key.length + 1);
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    document.cookie = `${key}=${value}; path=/; SameSite=None; Secure`;
  },
  removeItem: (key: string) => {
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
  },
};

const localStorageStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};

const storage = (() => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('localStorage is available');
    return localStorageStorage;
  } catch {
    console.log('localStorage is NOT available, falling back to cookies');
    return cookieStorage;
  }
})();

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'supabase.auth.token',
        storage: storage,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder');

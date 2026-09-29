import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lcmfscnvhhybeetjskyg.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_In9IvDBoRP6kCAo093CL3Q_nkbmzDK7';

const isValidUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string) ||
  DEFAULT_SUPABASE_URL;

const rawKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) ||
  DEFAULT_ANON_KEY;

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = rawKey && typeof rawKey === 'string' && rawKey.trim().length > 0 ? rawKey.trim() : DEFAULT_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    isValidUrl(supabaseUrl) &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-anon-key'
  );
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

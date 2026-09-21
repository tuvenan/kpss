import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string) ||
  'https://lcmfscnvhhybeetjskyg.supabase.co';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) ||
  'sb_publishable_In9IvDBoRP6kCAo093CL3Q_nkbmzDK7';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-anon-key'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Yönetici yetkili istemcisi (Admin Client).
 * Eğer kullanıcı veya ortam değişkenleri 'service_role / secret' anahtarı sağlamışsa
 * RLS kurallarını atlayarak doğrudan tam yetkiyle çalışır; aksi halde standart istemciyi döner.
 */
export const getAdminClient = (): SupabaseClient => {
  const secretKey =
    (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string) ||
    (typeof window !== 'undefined' ? localStorage.getItem('kpss_supabase_secret_key') : null);

  if (secretKey && secretKey.trim()) {
    return createClient(supabaseUrl, secretKey.trim());
  }
  return supabase;
};

export const hasAdminSecretKey = (): boolean => {
  const secretKey =
    (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string) ||
    (typeof window !== 'undefined' ? localStorage.getItem('kpss_supabase_secret_key') : null);
  return Boolean(secretKey && secretKey.trim());
};

export const setAdminSecretKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('kpss_supabase_secret_key', key.trim());
    } else {
      localStorage.removeItem('kpss_supabase_secret_key');
    }
  }
};

export default supabase;

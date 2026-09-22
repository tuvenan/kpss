import { supabase, isSupabaseConfigured } from './supabase';
import { userProfileService, UserProfile } from './userProfileService';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  isLoggedIn: boolean;
  role: 'student' | 'admin';
  createdAt?: string;
  avatarUrl?: string;
}

const AUTH_STORAGE_KEY = 'kpss_auth_session_v1';

const DEFAULT_GUEST: AuthUser = {
  id: 'guest',
  email: 'misafir@kpss.com',
  name: 'Öğrenci',
  username: 'ogrenci',
  isLoggedIn: false,
  role: 'student',
};

class AuthService {
  private currentUser: AuthUser = this.loadInitialUser();

  private loadInitialUser(): AuthUser {
    if (typeof window === 'undefined') return DEFAULT_GUEST;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('loadInitialUser error:', e);
    }
    // Varsayılan kayıtlı profil varsa onu alalım
    const profile = userProfileService.getProfile();
    return {
      id: 'local_user_1',
      email: profile.email || 'ali.kpss2026@gmail.com',
      name: profile.name || 'Ali Kaya',
      username: profile.username || 'alikaya',
      isLoggedIn: true,
      role: 'student',
      createdAt: '2026-09-01',
    };
  }

  public getCurrentUser(): AuthUser {
    return this.currentUser;
  }

  public isUserLoggedIn(): boolean {
    return this.currentUser.isLoggedIn;
  }

  private saveSession(user: AuthUser): void {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('kpss_auth_changed', { detail: user }));
      } catch (e) {
        console.warn('saveSession error:', e);
      }
    }
  }

  /** Giriş Yap (Supabase veya Yerel Doğrulama) */
  public async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Lütfen e-posta ve şifrenizi giriniz.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            username: data.user.user_metadata?.username || cleanEmail.split('@')[0],
            isLoggedIn: true,
            role: 'student',
            createdAt: data.user.created_at,
          };
          this.saveSession(authUser);
          return { success: true, user: authUser };
        }
      } catch (err: any) {
        console.warn('Supabase auth login exception, falling back to local auth:', err);
      }
    }

    // Yerel / Demo Giriş
    const profile = userProfileService.getProfile();
    const authUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      name: profile.name || cleanEmail.split('@')[0],
      username: profile.username || cleanEmail.split('@')[0],
      isLoggedIn: true,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    this.saveSession(authUser);
    return { success: true, user: authUser };
  }

  /** Kayıt Ol (Yeni Öğrenci Hesabı) */
  public async register(name: string, email: string, password: string, examType = 'KPSS Lisans (GY-GK)'): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      return { success: false, error: 'Lütfen tüm zorunlu alanları doldurunuz.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Şifre en az 6 karakter olmalıdır.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              exam_type: examType,
            },
          },
        });

        if (!error && data.user) {
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: cleanName,
            username: cleanEmail.split('@')[0],
            isLoggedIn: true,
            role: 'student',
            createdAt: data.user.created_at,
          };
          this.saveSession(authUser);
          // Profil servisine de yansıt
          userProfileService.saveProfile({
            ...userProfileService.getProfile(),
            name: cleanName,
            email: cleanEmail,
            examType,
          });
          return { success: true, user: authUser };
        }
      } catch (err: any) {
        console.warn('Supabase auth register exception, local fallback:', err);
      }
    }

    // Yerel kayıt
    const authUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      username: cleanEmail.split('@')[0],
      isLoggedIn: true,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    this.saveSession(authUser);
    userProfileService.saveProfile({
      ...userProfileService.getProfile(),
      name: cleanName,
      email: cleanEmail,
      examType,
    });
    return { success: true, user: authUser };
  }

  /** Şifre Sıfırlama */
  public async resetPassword(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Lütfen kayıtlı e-posta adresinizi giriniz.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin + '/#reset-password',
        });
        if (error) {
          return { success: false, message: 'Şifre sıfırlama bağlantısı gönderilemedi: ' + error.message };
        }
      } catch (e: any) {
        console.warn('Supabase reset password error:', e);
      }
    }

    return {
      success: true,
      message: `${cleanEmail} adresine şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol ediniz.`,
    };
  }

  /** Oturumu Kapat / Çıkış Yap */
  public async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
    const guestUser: AuthUser = {
      id: 'guest_' + Date.now(),
      email: '',
      name: 'Misafir Öğrenci',
      username: 'misafir',
      isLoggedIn: false,
      role: 'student',
    };
    this.saveSession(guestUser);
  }
}

export const authService = new AuthService();

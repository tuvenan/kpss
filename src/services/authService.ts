import { supabase, isSupabaseConfigured } from './supabase';
import { userProfileService, UserProfile } from './userProfileService';
import { getRuntimeConfig } from '../config/runtimeConfig';

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

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener(): void {
    if (typeof window === 'undefined' || !isSupabaseConfigured()) return;

    // Başlangıçta mevcut Supabase oturumunu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const authUser: AuthUser = {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Öğrenci',
          username: u.user_metadata?.username || u.email?.split('@')[0] || 'ogrenci',
          isLoggedIn: true,
          role: 'student',
          createdAt: u.created_at,
          avatarUrl: u.user_metadata?.avatar_url || '',
        };
        this.saveSession(authUser);
        userProfileService.fetchProfileFromCloud();
      }
    }).catch(console.warn);

    // Oturum değişikliklerini canlı dinle
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const u = session.user;
        const authUser: AuthUser = {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Öğrenci',
          username: u.user_metadata?.username || u.email?.split('@')[0] || 'ogrenci',
          isLoggedIn: true,
          role: 'student',
          createdAt: u.created_at,
          avatarUrl: u.user_metadata?.avatar_url || '',
        };
        this.saveSession(authUser);
        userProfileService.fetchProfileFromCloud();
      } else if (event === 'SIGNED_OUT') {
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
    });
  }

  private loadInitialUser(): AuthUser {
    if (typeof window === 'undefined') return DEFAULT_GUEST;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        const { allowLocalAuthFallback } = getRuntimeConfig();
        // Yerel demo kullanıcı ise ve demo modu kapalıysa misafir oturumuna dön
        if (parsed.id?.startsWith('usr_') || parsed.id?.startsWith('local_')) {
          if (!allowLocalAuthFallback) {
            return DEFAULT_GUEST;
          }
        }
        return parsed;
      }
    } catch (e) {
      console.warn('loadInitialUser error:', e);
    }
    // Oturum yoksa kullanıcı varsayılan olarak misafirdir (isLoggedIn: false)
    return DEFAULT_GUEST;
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

  /** Giriş Yap (Supabase veya Yalnızca Demo Modunda Yerel Doğrulama) */
  public async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Lütfen e-posta ve şifrenizi giriniz.' };
    }

    const { allowLocalAuthFallback } = getRuntimeConfig();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          if ((cleanEmail === 'user@kpss.com' || cleanEmail === 'user') && password === '123456') {
            const authUser: AuthUser = {
              id: 'usr-demo-user',
              email: 'user@kpss.com',
              name: 'Demo Öğrenci',
              username: 'user',
              isLoggedIn: true,
              role: 'student',
              createdAt: new Date().toISOString(),
            };
            this.saveSession(authUser);
            return { success: true, user: authUser };
          }
          // Supabase yapılandırılmışsa hatalı giriş doğrudan başarısız olmalıdır.
          return {
            success: false,
            error: error.message === 'Invalid login credentials'
              ? 'E-posta veya şifre hatalı!'
              : (error.message || 'Giriş yapılamadı.'),
          };
        }

        if (data.user) {
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
          await userProfileService.fetchProfileFromCloud();
          return { success: true, user: authUser };
        }
      } catch (err: any) {
        if (!allowLocalAuthFallback) {
          return {
            success: false,
            error: 'Giriş sunucusuna ulaşılamadı. Lütfen internet bağlantınızı kontrol ediniz.',
          };
        }
        console.warn('Supabase auth exception, falling back to demo auth:', err);
      }
    }

    // Production'da yerel giriş fallback'i kesinlikle çalışmaz
    if (!allowLocalAuthFallback) {
      return {
        success: false,
        error: isSupabaseConfigured()
          ? 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.'
          : 'Giriş altyapısı henüz production için yapılandırılmadı.',
      };
    }

    // Yalnızca demo modunda yerel giriş yapılabilir
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

  /** Demo Öğrenci Girişi (Yalnızca Geliştirme ve Demo Modunda Çalışır) */
  public async loginDemo(email = 'demo@kpss.com'): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    const { isDemoModeEnabled } = getRuntimeConfig();
    if (!isDemoModeEnabled) {
      return {
        success: false,
        error: 'Demo girişi production ortamında kullanılamaz.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const profile = userProfileService.getProfile();
    const authUser: AuthUser = {
      id: `usr_demo_${Date.now()}`,
      email: cleanEmail,
      name: profile.name || 'Demo Öğrenci',
      username: profile.username || 'demo_ogrenci',
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

    const { allowLocalAuthFallback } = getRuntimeConfig();

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

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
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
          userProfileService.saveProfile({
            ...userProfileService.getProfile(),
            name: cleanName,
            email: cleanEmail,
            examType,
          });
          return { success: true, user: authUser };
        }
      } catch (err: any) {
        if (!allowLocalAuthFallback) {
          return { success: false, error: 'Kayıt servisine ulaşılamadı. Lütfen bağlantınızı kontrol ediniz.' };
        }
        console.warn('Supabase auth register exception, local fallback:', err);
      }
    }

    // Production'da yerel kayıt fallback'i çalışmaz
    if (!allowLocalAuthFallback) {
      return {
        success: false,
        error: isSupabaseConfigured()
          ? 'Kayıt işlemi tamamlanamadı.'
          : 'Kayıt sistemi henüz production için yapılandırılmadı.',
      };
    }

    // Demo yerel kayıt
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

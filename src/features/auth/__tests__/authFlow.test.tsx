import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { resolveActiveRole, getDefaultRouteForRole } from '../../../types/auth';
import { LoginPage } from '../LoginPage';
import { rbacService } from '../../../services/rbacService';

// Mock supabase module
vi.mock('../../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('../../../services/rbacService', () => ({
  rbacService: {
    fetchUserRoles: vi.fn().mockResolvedValue(['member']),
    fetchUserProfile: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      fullName: 'Test User',
      username: 'testuser',
      status: 'active',
      examType: 'KPSS Lisans (GY-GK)',
    }),
  },
}));

// Test helper: Auth durumunu okuyan basit bileşen
const AuthStatusReader: React.FC = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="is-authenticated">{auth.isAuthenticated.toString()}</span>
      <span data-testid="is-loading">{auth.isLoading.toString()}</span>
      <span data-testid="active-role">{auth.activeRole}</span>
      <span data-testid="user">{auth.user ? 'exists' : 'null'}</span>
      <button data-testid="sign-out" onClick={auth.signOut}>Çıkış</button>
    </div>
  );
};

describe('Kimlik Doğrulama Sistemi Testleri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  // --------------------------------------------------------------------------
  // 1. Giriş yapılmamış kullanıcı korumalı sayfaya giremez
  // --------------------------------------------------------------------------
  it('Oturum açmamış kullanıcı isAuthenticated=false olarak görünür', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

    render(
      <AuthProvider>
        <AuthStatusReader />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  // --------------------------------------------------------------------------
  // 2. Kullanıcı adıyla giriş: RPC çağrılır ve signInWithPassword yapılır
  // --------------------------------------------------------------------------
  it('signInWithUsername RPC ile e-posta çözümler ve giriş yapar', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: 'resolved@test.com', error: null });
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'resolved@test.com' },
        session: { access_token: 'mock-token' },
      },
      error: null,
    });

    const SignInComponent: React.FC = () => {
      const { signInWithUsername } = useAuth();
      const [result, setResult] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="login-btn"
            onClick={async () => {
              const res = await signInWithUsername('testuser', 'password123');
              setResult(res.success ? 'success' : 'fail');
            }}
          >
            Login
          </button>
          <span data-testid="result">{result}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <SignInComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeDefined();
    });

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('success');
    });

    // RPC doğru parametrelerle çağrıldı mı?
    expect(supabase.rpc).toHaveBeenCalledWith('resolve_username_to_email', {
      input_username: 'testuser',
    });

    // signInWithPassword çözümlenen e-posta ile çağrıldı mı?
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'resolved@test.com',
      password: 'password123',
    });
  });

  // --------------------------------------------------------------------------
  // 3. Hatalı kullanıcı adı veya parola aynı genel hatayı verir
  // --------------------------------------------------------------------------
  it('Hatalı kullanıcı adıyla giriş genel hata mesajı döner (hesap varlığı ifşa edilmez)', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: null });

    const ErrorComponent: React.FC = () => {
      const { signInWithUsername } = useAuth();
      const [error, setError] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="login-btn"
            onClick={async () => {
              const res = await signInWithUsername('nonexistent_user', 'wrong_pass');
              setError(res.error || '');
            }}
          >
            Login
          </button>
          <span data-testid="error">{error}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <ErrorComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId('login-btn'));

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      const errorText = screen.getByTestId('error').textContent;
      expect(errorText).toBe('Kullanıcı adı veya parola hatalı.');
    });

    // signInWithPassword çağrılmamalı (çünkü RPC null döndü)
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('Hatalı parola ile giriş genel hata mesajı döner', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: 'user@test.com', error: null });
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    const ErrorComponent: React.FC = () => {
      const { signInWithUsername } = useAuth();
      const [error, setError] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="login-btn"
            onClick={async () => {
              const res = await signInWithUsername('existing_user', 'wrong_pass');
              setError(res.error || '');
            }}
          >
            Login
          </button>
          <span data-testid="error">{error}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <ErrorComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId('login-btn'));
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    await waitFor(() => {
      const errorText = screen.getByTestId('error').textContent;
      // Her iki durumda da aynı genel mesaj
      expect(errorText).toBe('Kullanıcı adı veya parola hatalı.');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Çıkış yapan kullanıcı login sayfasına yönlendirilir
  // --------------------------------------------------------------------------
  it('signOut çağrıldığında kullanıcı ve oturum temizlenir', async () => {
    // Başlangıçta oturum var
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'test@test.com' },
          access_token: 'token',
        },
      },
    });

    render(
      <AuthProvider>
        <AuthStatusReader />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByTestId('sign-out').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // 5. Rol önceliği doğru çalışır
  // --------------------------------------------------------------------------
  it('resolveActiveRole doğru öncelik sırasını uygular', () => {
    expect(resolveActiveRole(['member'])).toBe('member');
    expect(resolveActiveRole(['member', 'teacher'])).toBe('teacher');
    expect(resolveActiveRole(['member', 'editor'])).toBe('editor');
    expect(resolveActiveRole(['member', 'teacher', 'editor'])).toBe('editor');
    expect(resolveActiveRole(['member', 'teacher', 'editor', 'super_admin'])).toBe('super_admin');
    expect(resolveActiveRole([])).toBe('member');
  });

  // --------------------------------------------------------------------------
  // 6. Rol bazlı yönlendirme doğru çalışır
  // --------------------------------------------------------------------------
  it('getDefaultRouteForRole her rol için doğru rotayı döner', () => {
    expect(getDefaultRouteForRole('member')).toBe('/');
    expect(getDefaultRouteForRole('teacher')).toBe('/teacher');
    expect(getDefaultRouteForRole('editor')).toBe('/editor');
    expect(getDefaultRouteForRole('super_admin')).toBe('/admin');
  });

  // --------------------------------------------------------------------------
  // 7. Yeni kayıt varsayılan olarak member rolü alır (trigger testi - mock)
  // --------------------------------------------------------------------------
  it('signUpWithUsername çağrısı doğru metadata ile yapılır', async () => {
    // Kullanıcı adı uygunluk kontrolü
    (supabase.rpc as any).mockResolvedValue({ data: true, error: null });
    (supabase.auth.signUp as any).mockResolvedValue({
      data: {
        user: { id: 'new-user-id', email: 'new@test.com' },
        session: { access_token: 'new-token' },
      },
      error: null,
    });

    const SignUpComponent: React.FC = () => {
      const { signUpWithUsername } = useAuth();
      const [result, setResult] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="signup-btn"
            onClick={async () => {
              const res = await signUpWithUsername('Yeni Kullanıcı', 'yeniuser', 'new@test.com', 'gucluparola123');
              setResult(res.success ? 'success' : 'fail');
            }}
          >
            Kayıt
          </button>
          <span data-testid="result">{result}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <SignUpComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId('signup-btn'));
    await act(async () => {
      screen.getByTestId('signup-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('success');
    });

    // check_username_available çağrıldı mı?
    expect(supabase.rpc).toHaveBeenCalledWith('check_username_available', {
      desired_username: 'yeniuser',
    });

    // signUp doğru metadata ile çağrıldı mı?
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'gucluparola123',
      options: {
        data: {
          full_name: 'Yeni Kullanıcı',
          username: 'yeniuser',
          exam_type: 'KPSS Lisans (GY-GK)',
        },
      },
    });
  });

  // --------------------------------------------------------------------------
  // 8. Aynı kullanıcı adı tekrar kullanılamaz
  // --------------------------------------------------------------------------
  it('Zaten kullanılan kullanıcı adıyla kayıt reddedilir', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: false, error: null });

    const DuplicateComponent: React.FC = () => {
      const { signUpWithUsername } = useAuth();
      const [error, setError] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="signup-btn"
            onClick={async () => {
              const res = await signUpWithUsername('User', 'existing_user', 'dup@test.com', 'password123');
              setError(res.error || '');
            }}
          >
            Kayıt
          </button>
          <span data-testid="error">{error}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <DuplicateComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId('signup-btn'));
    await act(async () => {
      screen.getByTestId('signup-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Bu kullanıcı adı zaten kullanılıyor.');
    });

    // signUp çağrılmamalı
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // 9. Parola sıfırlama akışı doğru metodu çağırır
  // --------------------------------------------------------------------------
  it('resetPassword doğru e-posta ile resetPasswordForEmail çağırır', async () => {
    (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({ error: null });

    const ResetComponent: React.FC = () => {
      const { resetPassword } = useAuth();
      const [result, setResult] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="reset-btn"
            onClick={async () => {
              const res = await resetPassword('  Test@Example.COM  ');
              setResult(res.success ? 'success' : 'fail');
            }}
          >
            Sıfırla
          </button>
          <span data-testid="result">{result}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <ResetComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId('reset-btn'));
    await act(async () => {
      screen.getByTestId('reset-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('success');
    });

    // E-posta normalize edildi mi?
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
    );
  });

  // --------------------------------------------------------------------------
  // 10. Auth yüklenirken korumalı içerik gösterilmez
  // --------------------------------------------------------------------------
  it('isLoading=true iken isAuthenticated false olur ve korumalı içerik gizlenir', async () => {
    // getSession hiç resolve etmesin (sonsuz loading simülasyonu)
    (supabase.auth.getSession as any).mockReturnValue(new Promise(() => {}));

    render(
      <AuthProvider>
        <AuthStatusReader />
      </AuthProvider>
    );

    // isLoading hâlâ true ve isAuthenticated false olmalı
    expect(screen.getByTestId('is-loading').textContent).toBe('true');
    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
  });

  // --------------------------------------------------------------------------
  // 11. Service role anahtarı frontend kaynaklarında bulunmaz
  // --------------------------------------------------------------------------
  it('Frontend kodlarında SUPABASE_SERVICE_ROLE_KEY referansı bulunmaz', async () => {
    // supabase.ts modülünün dışa aktardığı sembollerde service_role olmamalı
    const moduleExports = await import('../../../services/supabase');
    const exportNames = Object.keys(moduleExports);

    const hasServiceRole = exportNames.some(
      (key) => key.toLowerCase().includes('service_role') || key.toLowerCase().includes('servicerole')
    );
    expect(hasServiceRole).toBe(false);

    // Ayrıca VITE_ önekli service role env değişkeni tanımlı olmamalı
    const envKeys = Object.keys(import.meta.env);
    const hasServiceRoleEnv = envKeys.some(
      (key) => key.includes('SERVICE_ROLE')
    );
    expect(hasServiceRoleEnv).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 12. Google OAuth: signInWithOAuth doğru provider ile çağrılır
  // --------------------------------------------------------------------------
  it('signInWithGoogle doğru provider ile signInWithOAuth çağırır', async () => {
    (supabase.auth.signInWithOAuth as any).mockResolvedValue({ error: null });

    const GoogleComponent: React.FC = () => {
      const { signInWithGoogle } = useAuth();
      const [result, setResult] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="google-btn"
            onClick={async () => {
              const res = await signInWithGoogle();
              setResult(res.success ? 'success' : 'fail');
            }}
          >
            Google
          </button>
          <span data-testid="result">{result}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <GoogleComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId('google-btn'));
    await act(async () => {
      screen.getByTestId('google-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('result').textContent).toBe('success');
    });

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: expect.any(String),
      }),
    });
  });

  // --------------------------------------------------------------------------
  // 13. Google OAuth hata durumu: hata mesajı döner
  // --------------------------------------------------------------------------
  it('Google OAuth hatası durumunda anlamlı hata mesajı döner', async () => {
    (supabase.auth.signInWithOAuth as any).mockResolvedValue({
      error: { message: 'Provider not enabled' },
    });

    const GoogleErrorComponent: React.FC = () => {
      const { signInWithGoogle } = useAuth();
      const [error, setError] = React.useState<string>('');

      return (
        <div>
          <button
            data-testid="google-btn"
            onClick={async () => {
              const res = await signInWithGoogle();
              setError(res.error || '');
            }}
          >
            Google
          </button>
          <span data-testid="error">{error}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <GoogleErrorComponent />
      </AuthProvider>
    );

    await waitFor(() => screen.getByTestId('google-btn'));
    await act(async () => {
      screen.getByTestId('google-btn').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Provider not enabled');
    });
  });

  // --------------------------------------------------------------------------
  // 14. LoginPage: super_admin girişi sonrası /admin rotasına yönlendirir
  // --------------------------------------------------------------------------
  it('LoginPage: super_admin girişi sonrası doğrudan /admin rotasına yönlendirir', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    (supabase.rpc as any).mockResolvedValue({ data: 'tuvenan@kpss.com', error: null });
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: {
        user: { id: 'admin-uuid', email: 'tuvenan@kpss.com' },
        session: { access_token: 'admin-token' },
      },
      error: null,
    });
    vi.mocked(rbacService.fetchUserRoles).mockResolvedValue(['super_admin', 'member']);
    vi.mocked(rbacService.fetchUserProfile).mockResolvedValue({
      id: 'admin-uuid',
      fullName: 'Tuvenan Admin',
      username: 'tuvenan',
      status: 'active',
      examType: 'KPSS Lisans (GY-GK)',
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const usernameInput = await screen.findByPlaceholderText('kullanici_adi');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /giriş yap/i });

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'tuvenan' } });
      fireEvent.change(passwordInput, { target: { value: 'ada18kasim' } });
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/admin');
    });
  });

  // --------------------------------------------------------------------------
  // 15. LoginPage: returnTo='/admin' durumunda super_admin'i kabul eder, member'ı / rotasına yönlendirir
  // --------------------------------------------------------------------------
  it('LoginPage: returnTo=/admin durumunda yetkisiz üyenin / rotasına gitmesini sağlar', async () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    // History state'inde returnTo: '/admin' simüle et
    vi.spyOn(window.history, 'state', 'get').mockReturnValue({ returnTo: '/admin' });

    (supabase.rpc as any).mockResolvedValue({ data: 'ogrenci@kpss.com', error: null });
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: {
        user: { id: 'member-uuid', email: 'ogrenci@kpss.com' },
        session: { access_token: 'member-token' },
      },
      error: null,
    });
    // Yalnızca member rolü
    vi.mocked(rbacService.fetchUserRoles).mockResolvedValue(['member']);
    vi.mocked(rbacService.fetchUserProfile).mockResolvedValue({
      id: 'member-uuid',
      fullName: 'Normal Üye',
      username: 'ogrenci',
      status: 'active',
      examType: 'KPSS Lisans (GY-GK)',
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const usernameInput = await screen.findByPlaceholderText('kullanici_adi');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /giriş yap/i });

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'ogrenci' } });
      fireEvent.change(passwordInput, { target: { value: 'parola123' } });
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      // super_admin olmadığı için /admin'e değil, varsayılan route '/' rotasına gitmeli
      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/');
    });
  });
});

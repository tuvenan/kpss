import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../authService';
import { adminAuthService, ADMIN_AUTH_SESSION_KEY } from '../adminAuthService';
import { subscriptionService, SUB_STORAGE_KEY } from '../subscriptionService';
import { setRuntimeConfigOverride } from '../../config/runtimeConfig';
import { supabase } from '../supabase';

describe('Kimlik Doğrulama ve Güvenlik Kısıtlamaları (Auth & Security Restrictions)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setRuntimeConfigOverride(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setRuntimeConfigOverride(null);
  });

  it('Oturum bulunmadığında kullanıcı varsayılan olarak misafir (guest) ve isLoggedIn false olmalıdır', async () => {
    // Tüm oturumu temizle
    await authService.logout();

    const user = authService.getCurrentUser();
    expect(user.isLoggedIn).toBe(false);
    expect(user.role).toBe('student');
    expect(authService.isUserLoggedIn()).toBe(false);
  });

  it('Production modunda Supabase hatalı parola döndürdüğünde yerel fallback ÇALIŞMAZ ve doğrudan hata döner', async () => {
    // Production ortamı simüle edilir
    setRuntimeConfigOverride({
      isDevelopment: false,
      isProduction: true,
      isDemoModeEnabled: false,
      allowLocalAuthFallback: false,
    });

    // Supabase'in hatalı parola hatası döndürdüğünü mockla
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 } as any,
    });

    const result = await authService.login('ogrenci@kpss.com', 'yanlis_parola');

    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
    expect(result.error).toContain('E-posta veya şifre hatalı');
    expect(authService.isUserLoggedIn()).toBe(false);

    // Production'da demo girişi de reddedilmelidir
    const demoInProd = await authService.loginDemo('demo@kpss.com');
    expect(demoInProd.success).toBe(false);
    expect(demoInProd.error).toContain('production');
  });

  it('Production modunda localStorage içine PRO değeri yazılsa bile isPro() yetki VERMEMELİDİR', () => {
    // Production ortamı
    setRuntimeConfigOverride({
      isDevelopment: false,
      isProduction: true,
      isDemoModeEnabled: false,
      allowLocalSubscriptionDemo: false,
    });

    // Kötü niyetli kullanıcı localStorage'a sahte PRO nesnesi yerleştiriyor
    localStorage.setItem(
      SUB_STORAGE_KEY,
      JSON.stringify({
        tier: 'pro_annual',
        isPro: true,
        planName: 'Sahte PRO',
        validUntil: '2030-01-01',
      })
    );

    // Production'da kontrol edilir
    expect(subscriptionService.isPro()).toBe(false);
    expect(subscriptionService.getSubscription().isPro).toBe(false);
    expect(subscriptionService.getSubscription().tier).toBe('free');

    // Upgrade denemesi de production'da engellenmelidir
    const upgraded = subscriptionService.upgradeToPlan('pro_annual');
    expect(upgraded.isPro).toBe(false);
    expect(upgraded.tier).toBe('free');
  });

  it('Production modunda sessionStorage içine admin token yazılsa bile isAuthenticated() yetki VERMEMELİDİR', () => {
    // Production ortamı
    setRuntimeConfigOverride({
      isDevelopment: false,
      isProduction: true,
      isDemoModeEnabled: false,
      allowClientAdminDemo: false,
    });

    // Kötü niyetli kullanıcı sessionStorage'a admin token yerleştiriyor
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'fake_admin_token_123');
    sessionStorage.setItem('kpss_admin_auth', 'true');

    // Production'da istemci tabanlı admin yetkilendirmesi kapalı olmalıdır
    expect(adminAuthService.isAuthenticated()).toBe(false);

    // Parola doğrulaması da production'da kapalı olmalıdır
    return adminAuthService.verifyPassword('admin2026').then((isValid) => {
      expect(isValid).toBe(false);
    });
  });

  it('Geliştirme modunda (Development + Demo TRUE) demo akışları başarıyla çalışmalıdır', async () => {
    // Demo modu açık geliştirme ortamı
    setRuntimeConfigOverride({
      isDevelopment: true,
      isProduction: false,
      isDemoModeEnabled: true,
      allowLocalAuthFallback: true,
      allowClientAdminDemo: true,
      allowLocalSubscriptionDemo: true,
    });

    // 1. Yerel demo login
    const loginRes = await authService.loginDemo('demo@kpss.com');
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.email).toBe('demo@kpss.com');
    expect(authService.isUserLoggedIn()).toBe(true);

    // 2. Demo admin doğrulaması (tuvenan / ada18kasim)
    const isTuvenanValid = await adminAuthService.verifyCredentials('tuvenan', 'ada18kasim');
    expect(isTuvenanValid).toBe(true);

    const isWrongPass = await adminAuthService.verifyCredentials('tuvenan', 'yanlis_sifre');
    expect(isWrongPass).toBe(false);

    const isWrongUser = await adminAuthService.verifyCredentials('baskasi', 'ada18kasim');
    expect(isWrongUser).toBe(false);

    adminAuthService.createSession();
    expect(adminAuthService.isAuthenticated()).toBe(true);

    // 3. Demo abonelik yükseltmesi
    const subRes = subscriptionService.upgradeToPlan('pro_annual');
    expect(subRes.isPro).toBe(true);
    expect(subscriptionService.isPro()).toBe(true);
  });
});

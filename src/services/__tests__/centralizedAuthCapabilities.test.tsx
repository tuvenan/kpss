import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { RequireAuth, RequireRole, RequireCapability } from '../../components/rbac';
import { supabase } from '../supabase';
import { rbacService } from '../rbacService';
import { AppCapability, computeCapabilities, ROLE_CAPABILITIES } from '../../types/auth';

describe('Merkezi Supabase Oturumu ve Yetki Sistemi (Centralized Auth & Capabilities)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  // 1. Oturumu olmayan kullanıcının korumalı ekrana girememesi
  it('1. Oturumu olmayan kullanıcının korumalı ekrana girememesi ve giriş uyarısı alması', async () => {
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    render(
      <AuthProvider>
        <RequireAuth>
          <div>GİZLİ_ÖĞRENCİ_İÇERİĞİ</div>
        </RequireAuth>
      </AuthProvider>
    );

    // Başlangıçta oturum doğrulanıyor gösterilir veya giriş ekranı çıkar
    await waitFor(() => {
      expect(screen.queryByText('GİZLİ_ÖĞRENCİ_İÇERİĞİ')).toBeNull();
      expect(screen.getByText('Giriş Yapılması Gerekiyor')).toBeDefined();
    });
  });

  // 2. Member rolündeki kullanıcının admin ekranına girememesi
  it('2. Member rolündeki kullanıcının admin ekranına ve yönetim capability\'sine erişememesi', async () => {
    const fakeSession = {
      user: { id: 'usr-student-1', email: 'ogrenci@kpss.com' },
      access_token: 'valid-token',
    };

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    } as any);

    vi.spyOn(rbacService, 'fetchUserRoles').mockResolvedValue(['member']);
    vi.spyOn(rbacService, 'fetchUserProfile').mockResolvedValue({
      id: 'usr-student-1',
      fullName: 'Öğrenci Ali',
      username: 'ogrenciali',
      examType: 'KPSS Lisans',
      status: 'active',
    });

    render(
      <AuthProvider>
        <RequireCapability
          capability="manage_system_settings"
          fallback={<div>YETKİSİZ_ADMİN_GİRİŞİ_ENGELİ</div>}
        >
          <div>SÜPER_ADMİN_KONSOLU</div>
        </RequireCapability>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('YETKİSİZ_ADMİN_GİRİŞİ_ENGELİ')).toBeDefined();
      expect(screen.queryByText('SÜPER_ADMİN_KONSOLU')).toBeNull();
    });
  });

  // 3. Teacher rolündeki kullanıcının yalnızca öğretmen yetkilerini alması
  it('3. Teacher rolündeki kullanıcının yalnızca öğretmen yetkilerini alması ve sistem yönetimini alamaması', () => {
    const teacherCaps = computeCapabilities(['teacher']);

    // Sahip olması gerekenler:
    expect(teacherCaps).toContain('view_student_app');
    expect(teacherCaps).toContain('manage_own_profile');
    expect(teacherCaps).toContain('manage_own_progress');
    expect(teacherCaps).toContain('view_assigned_students');
    expect(teacherCaps).toContain('manage_own_classes');
    expect(teacherCaps).toContain('create_assignments');

    // Asla sahip olmaması gerekenler:
    expect(teacherCaps).not.toContain('manage_global_content');
    expect(teacherCaps).not.toContain('publish_content');
    expect(teacherCaps).not.toContain('manage_users');
    expect(teacherCaps).not.toContain('manage_roles');
    expect(teacherCaps).not.toContain('manage_system_settings');
  });

  // 4. Editor rolündeki kullanıcının içerik yönetip rol yönetememesi
  it('4. Editor rolündeki kullanıcının içerik yönetebilmesi fakat kullanıcı ve rol yönetememesi', () => {
    const editorCaps = computeCapabilities(['editor']);

    // Sahip olması gereken içerik yetkileri:
    expect(editorCaps).toContain('manage_global_content');
    expect(editorCaps).toContain('publish_content');

    // Kesinlikle rol/kullanıcı yönetim yetkisi OLMAMALI:
    expect(editorCaps).not.toContain('manage_users');
    expect(editorCaps).not.toContain('manage_roles');
    expect(editorCaps).not.toContain('manage_system_settings');
    expect(editorCaps).not.toContain('manage_own_classes');
  });

  // 5. Super admin kullanıcısının yönetim ekranlarını açabilmesi
  it('5. Super admin kullanıcısının tüm capability yetkilerine ve yönetim ekranlarına sahip olması', async () => {
    const fakeSession = {
      user: { id: 'usr-admin-tuvenan', email: 'tuvenan@kpss.com' },
      access_token: 'admin-token',
    };

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    } as any);

    vi.spyOn(rbacService, 'fetchUserRoles').mockResolvedValue(['super_admin']);
    vi.spyOn(rbacService, 'fetchUserProfile').mockResolvedValue({
      id: 'usr-admin-tuvenan',
      fullName: 'Süper Yönetici Tuvenan',
      username: 'tuvenan',
      examType: 'Genel',
      status: 'active',
    });

    render(
      <AuthProvider>
        <RequireCapability capability="manage_roles">
          <div>ROL_YÖNETİM_PANELİ_AÇIK</div>
        </RequireCapability>
        <RequireCapability capability="manage_system_settings">
          <div>SİSTEM_AYARLARI_AÇIK</div>
        </RequireCapability>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ROL_YÖNETİM_PANELİ_AÇIK')).toBeDefined();
      expect(screen.getByText('SİSTEM_AYARLARI_AÇIK')).toBeDefined();
    });
  });

  // 6. Oturum kapatıldığında capability gate’lerinin anında kilitlenmesi
  it('6. Oturum kapatıldığında capability gate’lerinin anında kilitlenmesi', async () => {
    let capturedSignOutCallback: any = null;
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((cb: any) => {
      capturedSignOutCallback = cb;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      } as any;
    });

    const fakeSession = {
      user: { id: 'usr-admin-1', email: 'admin@kpss.com' },
      access_token: 'tok-1',
    };

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    } as any);
    vi.spyOn(rbacService, 'fetchUserRoles').mockResolvedValue(['super_admin']);

    let authContextRef: any = null;
    const TestConsumer = () => {
      const auth = useAuth();
      authContextRef = auth;
      return (
        <div>
          {auth.can('manage_system_settings') ? (
            <div>GÜVENLİ_ALAN_AÇIK</div>
          ) : (
            <div>KİLİTLİ_ALAN</div>
          )}
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('GÜVENLİ_ALAN_AÇIK')).toBeDefined();
    });

    // Oturumu kapat
    await act(async () => {
      if (capturedSignOutCallback) {
        capturedSignOutCallback('SIGNED_OUT', null);
      } else {
        await authContextRef.signOut();
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('GÜVENLİ_ALAN_AÇIK')).toBeNull();
      expect(screen.getByText('KİLİTLİ_ALAN')).toBeDefined();
      expect(authContextRef.can('manage_system_settings')).toBe(false);
      expect(authContextRef.roles).toEqual([]);
      expect(authContextRef.capabilities).toEqual([]);
    });
  });

  // 7. Rol değiştiğinde yetki listesinin yenilenmesi
  it('7. refreshAuthorization çağrıldığında kullanıcının güncel rolleri veritabanından çekilip capability güncellenmeli', async () => {
    const fakeSession = {
      user: { id: 'usr-user-upgrade', email: 'user@kpss.com' },
      access_token: 'upgrade-tok',
    };

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    } as any);

    // Başlangıçta yalnızca member rolü
    const fetchRolesSpy = vi.spyOn(rbacService, 'fetchUserRoles').mockResolvedValueOnce(['member']);

    let authRef: any = null;
    const TestConsumer = () => {
      const auth = useAuth();
      authRef = auth;
      return (
        <div>
          <span>Roller: {auth.roles.join(',')}</span>
          <span>CanManageClasses: {auth.can('manage_own_classes') ? 'EVET' : 'HAYIR'}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Roller: member')).toBeDefined();
      expect(screen.getByText('CanManageClasses: HAYIR')).toBeDefined();
    });

    // Veritabanında kullanıcıya teacher rolü atandı ve refreshAuthorization çağrıldı
    fetchRolesSpy.mockResolvedValueOnce(['member', 'teacher']);

    await act(async () => {
      await authRef.refreshAuthorization();
    });

    await waitFor(() => {
      expect(screen.getByText('Roller: member,teacher')).toBeDefined();
      expect(screen.getByText('CanManageClasses: EVET')).toBeDefined();
      expect(authRef.can('manage_own_classes')).toBe(true);
    });
  });

  // 8. localStorage / sessionStorage manipülasyonunun capability üretmemesi
  it('8. İstemci localStorage veya sessionStorage manipülasyonunun yetki üretmemesi', async () => {
    // Kötü niyetli kullanıcı depolama alanına sahte yönetici verileri enjekte eder
    localStorage.setItem('kpss_user_role', 'super_admin');
    localStorage.setItem('user_roles', JSON.stringify(['super_admin']));
    localStorage.setItem('capabilities', JSON.stringify(['manage_system_settings']));
    sessionStorage.setItem('kpss_user_role', 'super_admin');

    const fakeSession = {
      user: { id: 'usr-hacker-1', email: 'hacker@kpss.com' },
      access_token: 'fake-jwt',
    };

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    } as any);

    // Supabase user_roles tablosu gerçekte yalnızca 'member' döndürür
    vi.spyOn(rbacService, 'fetchUserRoles').mockResolvedValue(['member']);

    let authRef: any = null;
    const TestConsumer = () => {
      authRef = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authRef.roles).toEqual(['member']);
      expect(authRef.can('manage_system_settings')).toBe(false);
      expect(authRef.can('manage_roles')).toBe(false);
      expect(authRef.can('manage_users')).toBe(false);
      expect(authRef.isSuperAdmin).toBe(false);
    });
  });

  // Ek Güvenlik Kuralı: useAuth Provider dışı kullanımında anlamlı hata vermeli
  it('useAuth hook\'u AuthProvider dışında kullanıldığında anlamlı hata fırlatmalıdır', () => {
    const BadComponent = () => {
      useAuth();
      return null;
    };

    // Vitest render hatasını yakalar
    expect(() => render(<BadComponent />)).toThrow('useAuth must be used within an AuthProvider');
  });
});

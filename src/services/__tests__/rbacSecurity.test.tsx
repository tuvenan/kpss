import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { rbacService } from '../rbacService';
import { supabase } from '../supabase';
import { UserRole } from '../../types/auth';
import { RequireRole } from '../../components/rbac/RequireRole';
import { AuthContext } from '../../contexts/AuthContext';

describe('RBAC & Güvenlik Yetkilendirme Testleri (Role-Based Access Control)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('Kullanıcı rolleri localStorage veya istemci metadata üzerinden değiştirilemez, Supabase user_roles kaynağından çekilir', async () => {
    // Kötü niyetli kullanıcı localStorage'a super_admin yazsa bile
    localStorage.setItem('kpss_user_role', 'super_admin');
    localStorage.setItem('user_roles', JSON.stringify(['super_admin']));

    // Supabase tablosu yalnızca 'member' döndürdüğünde
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ role: 'member' }],
        error: null,
      }),
    });
    vi.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect,
    } as any);

    const roles = await rbacService.fetchUserRoles('user-123');

    expect(roles).toEqual(['member']);
    expect(roles).not.toContain('super_admin');
  });

  it('assignRole güvenli RPC fonksiyonunu çağırır ve yeni rolü tanımlar', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: { success: true, message: 'Rol başarıyla atandı.' },
      error: null,
    } as any);

    const result = await rbacService.assignRole('user-abc', 'teacher');

    expect(rpcSpy).toHaveBeenCalledWith('assign_user_role', {
      target_user_id: 'user-abc',
      new_role: 'teacher',
    });
    expect(result.success).toBe(true);
  });

  it('removeRole fonksiyonu son süper admin silinmek istendiğinde veritabanı koruma hatasını yakalar', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: { message: 'Sistemde en az bir aktif süper admin bulunmalıdır.' },
    } as any);

    const result = await rbacService.removeRole('admin-1', 'super_admin');

    expect(result.success).toBe(false);
    expect(result.message).toContain('en az bir aktif süper admin');
  });

  it('suspendUser RPC fonksiyonunu doğru parametrelerle çağırır', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: { success: true, message: 'Kullanıcı askıya alındı.' },
      error: null,
    } as any);

    const result = await rbacService.suspendUser('bad-user', 'Kural ihlali');

    expect(rpcSpy).toHaveBeenCalledWith('suspend_user', {
      target_user_id: 'bad-user',
      reason: 'Kural ihlali',
    });
    expect(result.success).toBe(true);
  });

  it('joinClassByInviteCode RPC ile davet kodunu doğrular ve sınıf kaydı yapar', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Sınıfa katılım başarılı.',
        class_name: '2026 KPSS A Grubu',
        class_id: 'class-999',
      },
      error: null,
    } as any);

    const result = await rbacService.joinClassByInviteCode('KPSS-123456');

    expect(rpcSpy).toHaveBeenCalledWith('join_class_by_invite_code', {
      code: 'KPSS-123456',
    });
    expect(result.success).toBe(true);
    expect(result.className).toBe('2026 KPSS A Grubu');
  });

  it('RequireRole bileşeni üye (member) kullanıcının süper admin alanına erişimini engeller ve fallback gösterir', () => {
    const mockAuthContextValue = {
      user: { id: 'user-1', email: 'member@kpss.com' } as any,
      session: {} as any,
      profile: null,
      roles: ['member'] as UserRole[],
      isLoading: false,
      isAuthenticated: true,
      hasRole: (role: UserRole) => role === 'member',
      refreshRoles: vi.fn(),
      signOut: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContextValue as any}>
        <RequireRole role="super_admin" fallback={<div>YETKİSİZ ERİŞİM ENGELİ</div>}>
          <div>SÜPER ADMİN GİZLİ VERİSİ</div>
        </RequireRole>
      </AuthContext.Provider>
    );

    expect(screen.getByText('YETKİSİZ ERİŞİM ENGELİ')).toBeDefined();
    expect(screen.queryByText('SÜPER ADMİN GİZLİ VERİSİ')).toBeNull();
  });

  it('RequireRole bileşeni öğretmen (teacher) rolüne sahip kullanıcının öğretmen alanına erişimine izin verir', () => {
    const mockAuthContextValue = {
      user: { id: 'user-2', email: 'ogretmen@kpss.com' } as any,
      session: {} as any,
      profile: null,
      roles: ['member', 'teacher'] as UserRole[],
      isLoading: false,
      isAuthenticated: true,
      hasRole: (role: UserRole) => role === 'member' || role === 'teacher',
      refreshRoles: vi.fn(),
      signOut: vi.fn(),
    };

    render(
      <AuthContext.Provider value={mockAuthContextValue as any}>
        <RequireRole role="teacher" fallback={<div>YETKİSİZ ERİŞİM ENGELİ</div>}>
          <div>ÖĞRETMEN ÇALIŞMA ALANI</div>
        </RequireRole>
      </AuthContext.Provider>
    );

    expect(screen.getByText('ÖĞRETMEN ÇALIŞMA ALANI')).toBeDefined();
    expect(screen.queryByText('YETKİSİZ ERİŞİM ENGELİ')).toBeNull();
  });
});

import { supabase, isSupabaseConfigured } from './supabase';
import { UserRole, UserProfileData } from '../types/auth';
import { getRuntimeConfig } from '../config/runtimeConfig';

export interface AuditLogItem {
  id: string;
  actor_user_id: string | null;
  actor_id?: string | null;
  target_user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data?: any;
  after_data?: any;
  details?: any;
  metadata?: any;
  created_at: string;
}

export type AuditLogEntry = AuditLogItem;

export interface RbacActionResult {
  success: boolean;
  message: string;
  error?: string;
  className?: string;
  classId?: string;
}

export interface UserRoleItem {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  assigned_by?: string | null;
}

export interface UserProfileWithRoles extends UserProfileData {
  roles: UserRole[];
  email?: string;
  full_name?: string;
  is_suspended?: boolean;
}

export const rbacService = {
  /**
   * Giriş yapmış kullanıcının Supabase `user_roles` tablosundaki gerçek rollerini çeker.
   * Asla localStorage veya istemci metadata'sına güvenilmez.
   */
  async fetchUserRoles(userId: string): Promise<UserRole[]> {
    if (!isSupabaseConfigured() || !userId) {
      const { isDemoModeEnabled } = getRuntimeConfig();
      // Yalnızca demo modunda test için member rolü verilir
      return isDemoModeEnabled ? ['member'] : [];
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.warn('fetchUserRoles error:', error.message);
        return ['member'];
      }

      if (data && data.length > 0) {
        return data.map((r: any) => r.role as UserRole);
      }

      return ['member'];
    } catch (err) {
      console.warn('fetchUserRoles exception:', err);
      return ['member'];
    }
  },

  /**
   * Supabase `profiles` tablosundan kullanıcı profilini çeker.
   */
  async fetchUserProfile(userId: string): Promise<UserProfileData | null> {
    if (!isSupabaseConfigured() || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        fullName: data.full_name || data.display_name || 'Öğrenci',
        displayName: data.display_name,
        username: data.username || '',
        avatarUrl: data.avatar_url || '',
        examType: data.exam_type || 'KPSS Lisans (GY-GK)',
        dailyGoal: data.daily_goal || 60,
        status: data.status || 'active',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      console.warn('fetchUserProfile error:', err);
      return null;
    }
  },

  /**
   * Süper Admin: Bir kullanıcıya yeni rol atar (RPC)
   */
  async assignRole(targetUserId: string, newRole: UserRole): Promise<RbacActionResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase yapılandırılmamış.', error: 'Supabase yapılandırılmamış.' };
    }

    try {
      const { data, error } = await supabase.rpc('assign_user_role', {
        target_user_id: targetUserId,
        new_role: newRole,
      });

      if (error) return { success: false, message: error.message, error: error.message };
      return { success: true, message: (data as any)?.message || 'Rol başarıyla atandı.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Rol atanamadı.', error: err?.message };
    }
  },

  /**
   * Süper Admin: Bir kullanıcının rolünü kaldırır (RPC - Son süper admin korumalı)
   */
  async removeRole(targetUserId: string, targetRole: UserRole): Promise<RbacActionResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase yapılandırılmamış.', error: 'Supabase yapılandırılmamış.' };
    }

    try {
      const { data, error } = await supabase.rpc('remove_user_role', {
        target_user_id: targetUserId,
        target_role: targetRole,
      });

      if (error) return { success: false, message: error.message, error: error.message };
      return { success: true, message: (data as any)?.message || 'Rol kaldırıldı.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Rol kaldırılamadı.', error: err?.message };
    }
  },

  /**
   * Süper Admin: Kullanıcıyı askıya alır (RPC)
   */
  async suspendUser(targetUserId: string, reason = ''): Promise<RbacActionResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase yapılandırılmamış.', error: 'Supabase yapılandırılmamış.' };
    }

    try {
      const { data, error } = await supabase.rpc('suspend_user', {
        target_user_id: targetUserId,
        reason,
      });

      if (error) return { success: false, message: error.message, error: error.message };
      return { success: true, message: (data as any)?.message || 'Kullanıcı askıya alındı.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'İşlem başarısız.', error: err?.message };
    }
  },

  /**
   * Süper Admin: Askıdaki kullanıcıyı yeniden etkinleştirir (RPC)
   */
  async reactivateUser(targetUserId: string): Promise<RbacActionResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase yapılandırılmamış.', error: 'Supabase yapılandırılmamış.' };
    }

    try {
      const { data, error } = await supabase.rpc('reactivate_user', {
        target_user_id: targetUserId,
      });

      if (error) return { success: false, message: error.message, error: error.message };
      return { success: true, message: (data as any)?.message || 'Kullanıcı etkinleştirildi.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'İşlem başarısız.', error: err?.message };
    }
  },

  /**
   * Öğrenci: Davet koduyla sınıfa katılır (RPC)
   */
  async joinClassByInviteCode(code: string): Promise<RbacActionResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase yapılandırılmamış.', error: 'Supabase yapılandırılmamış.' };
    }

    try {
      const { data, error } = await supabase.rpc('join_class_by_invite_code', {
        code: code.trim(),
      });

      if (error) return { success: false, message: error.message, error: error.message };
      const res = data as any;
      return {
        success: true,
        message: res?.message || 'Sınıfa başarıyla katıldınız!',
        className: res?.class_name,
        classId: res?.class_id,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Sınıfa katılınamadı.', error: err?.message };
    }
  },

  /**
   * Süper Admin: Audit loglarını listeler
   */
  async getAuditLogs(limit = 50): Promise<AuditLogItem[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data as AuditLogItem[];
    } catch (err) {
      console.warn('getAuditLogs error:', err);
      return [];
    }
  },

  /**
   * Süper Admin: Tüm kullanıcı profillerini ve atanmış rollerini listeler
   */
  async getAllUsersWithRoles(): Promise<UserProfileWithRoles[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError || !profiles) return [];

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map<string, UserRole[]>();
      (rolesData || []).forEach((r: any) => {
        const list = roleMap.get(r.user_id) || [];
        list.push(r.role as UserRole);
        roleMap.set(r.user_id, list);
      });

      return profiles.map((p: any) => ({
        id: p.id,
        fullName: p.full_name || p.display_name || 'Kullanıcı',
        full_name: p.full_name || p.display_name || 'Kullanıcı',
        displayName: p.display_name,
        username: p.username || '',
        avatarUrl: p.avatar_url || '',
        examType: p.exam_type || 'KPSS Lisans (GY-GK)',
        dailyGoal: p.daily_goal || 60,
        status: p.status || 'active',
        is_suspended: p.status === 'suspended',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        roles: roleMap.get(p.id) || ['member'],
      }));
    } catch (err) {
      console.warn('getAllUsersWithRoles error:', err);
      return [];
    }
  },
};

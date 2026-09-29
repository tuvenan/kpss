import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

export const ROLE_LABELS: Record<UserRole, string> = {
  member: 'Üye',
  teacher: 'Öğretmen',
  editor: 'Editör',
  super_admin: 'Süper Admin',
};

export const useAuthorization = () => {
  const { roles, isMember, isTeacher, isEditor, isSuperAdmin, hasRole, user, isLoading } = useAuth();

  const canManageContent = useMemo(() => isEditor || isSuperAdmin, [isEditor, isSuperAdmin]);
  const canManageUsers = useMemo(() => isSuperAdmin, [isSuperAdmin]);
  const canManageClasses = useMemo(() => isTeacher || isSuperAdmin, [isTeacher, isSuperAdmin]);

  const primaryRole = useMemo<UserRole>(() => {
    if (isSuperAdmin) return 'super_admin';
    if (isEditor) return 'editor';
    if (isTeacher) return 'teacher';
    return 'member';
  }, [isSuperAdmin, isEditor, isTeacher]);

  const primaryRoleLabel = useMemo(() => {
    return ROLE_LABELS[primaryRole] || 'Üye';
  }, [primaryRole]);

  return {
    roles,
    primaryRole,
    primaryRoleLabel,
    isMember,
    isTeacher,
    isEditor,
    isSuperAdmin,
    canManageContent,
    canManageUsers,
    canManageClasses,
    hasRole,
    user,
    isLoading,
  };
};

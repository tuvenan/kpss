import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, AppCapability } from '../types/auth';

export const ROLE_LABELS: Record<UserRole, string> = {
  member: 'Üye',
  teacher: 'Öğretmen',
  editor: 'Editör',
  super_admin: 'Süper Admin',
};

export const useAuthorization = () => {
  const {
    roles,
    capabilities,
    isMember,
    isTeacher,
    isEditor,
    isSuperAdmin,
    hasRole,
    hasAnyRole,
    can,
    user,
    profile,
    isLoading,
    isAuthenticated,
  } = useAuth();

  const canManageContent = useMemo(() => {
    return typeof can === 'function' ? can('manage_global_content') : Boolean(isEditor || isSuperAdmin);
  }, [can, isEditor, isSuperAdmin]);

  const canManageUsers = useMemo(() => {
    return typeof can === 'function' ? can('manage_users') : Boolean(isSuperAdmin);
  }, [can, isSuperAdmin]);

  const canManageClasses = useMemo(() => {
    return typeof can === 'function' ? can('manage_own_classes') : Boolean(isTeacher || isSuperAdmin);
  }, [can, isTeacher, isSuperAdmin]);

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
    capabilities,
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
    hasAnyRole,
    can,
    user,
    profile,
    isLoading,
    isAuthenticated,
  };
};

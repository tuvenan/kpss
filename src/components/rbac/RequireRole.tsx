import React from 'react';
import { useAuthorization } from '../../hooks/useAuthorization';
import { UserRole } from '../../types/auth';
import { UnauthorizedView } from './UnauthorizedView';
import { AuthLoadingView } from './AuthLoadingView';

interface RequireRoleProps {
  role: UserRole;
  children: React.ReactNode;
  onNavigateHome?: () => void;
  fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  role,
  children,
  onNavigateHome,
  fallback,
}) => {
  const { roles, isSuperAdmin, isLoading } = useAuthorization();

  if (isLoading) {
    return <AuthLoadingView message="Yetkiler kontrol ediliyor..." />;
  }

  const hasAccess = isSuperAdmin || roles.includes(role);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return <UnauthorizedView requiredRole={role} onNavigateHome={onNavigateHome} />;
  }

  return <>{children}</>;
};

import React from 'react';
import { useAuthorization } from '../../hooks/useAuthorization';
import { UserRole } from '../../types/auth';
import { UnauthorizedView } from './UnauthorizedView';

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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ fontSize: '14px', color: '#64748B' }}>Yetkiler kontrol ediliyor...</div>
      </div>
    );
  }

  const hasAccess = isSuperAdmin || roles.includes(role);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return <UnauthorizedView requiredRole={role} onNavigateHome={onNavigateHome} />;
  }

  return <>{children}</>;
};

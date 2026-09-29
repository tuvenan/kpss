import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AppCapability } from '../../types/auth';
import { AuthLoadingView } from './AuthLoadingView';
import { UnauthorizedView } from './UnauthorizedView';

interface RequireCapabilityProps {
  capability: AppCapability;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onNavigateHome?: () => void;
}

export const RequireCapability: React.FC<RequireCapabilityProps> = ({
  capability,
  children,
  fallback,
  onNavigateHome,
}) => {
  const { can, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingView message="Yetkiler doğrulanıyor..." />;
  }

  if (!can(capability)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <UnauthorizedView
        title="Yetkisiz Erişim"
        message="Bu işlemi gerçekleştirmek veya sayfayı görüntülemek için gereken yetkiye sahip değilsiniz."
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return <>{children}</>;
};

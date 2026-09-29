import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn } from 'lucide-react';

import { AuthLoadingView } from './AuthLoadingView';

interface RequireAuthProps {
  children: React.ReactNode;
  onOpenAuthModal?: () => void;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  onOpenAuthModal,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingView message="Oturum doğrulanıyor..." />;
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '16px',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <LogIn size={24} color="var(--kpss-text, #0F172A)" />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '8px' }}>
            Giriş Yapılması Gerekiyor
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
            Bu sayfaya ve içeriklerine erişmek için lütfen öğrenci veya yetkili hesabınızla giriş yapınız.
          </p>

          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              style={{
                width: '100%',
                padding: '11px 18px',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Giriş Yap / Kaydol
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

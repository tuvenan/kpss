import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { ROLE_LABELS } from '../../hooks/useAuthorization';
import { UserRole } from '../../types/auth';

interface UnauthorizedViewProps {
  requiredRole?: UserRole;
  title?: string;
  message?: string;
  onGoBack?: () => void;
  onNavigateHome?: () => void;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  requiredRole,
  title,
  message,
  onGoBack,
  onNavigateHome,
}) => {
  const roleName = requiredRole ? ROLE_LABELS[requiredRole] : 'Yetkili';
  const handleBack = onGoBack || onNavigateHome;

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          border: '1px solid var(--kpss-border, #E2E8F0)',
          borderRadius: '16px',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
          }}
        >
          <ShieldAlert size={28} color="var(--kpss-text, #0F172A)" />
        </div>

        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--kpss-text, #0F172A)',
            marginBottom: '10px',
          }}
        >
          {title || 'Yetkisiz Erişim'}
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: '#64748B',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          {message || (
            <>
              Bu alana erişebilmek için <strong>{roleName}</strong> rolüne sahip olmanız gerekmektedir. Hesabınızın yetkileri bu işlem için yeterli değildir.
            </>
          )}
        </p>

        {handleBack && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 20px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            <ArrowLeft size={16} />
            <span>Ana Sayfaya Dön</span>
          </button>
        )}
      </div>
    </div>
  );
};

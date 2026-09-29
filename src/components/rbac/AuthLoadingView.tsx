import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingViewProps {
  message?: string;
}

export const AuthLoadingView: React.FC<AuthLoadingViewProps> = ({
  message = 'Oturum ve yetkiler doğrulanıyor...',
}) => {
  return (
    <div
      style={{
        minHeight: '55vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
          border: '1px solid var(--kpss-border, #E2E8F0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Loader2
          size={24}
          color="var(--kpss-text, #0F172A)"
          style={{ animation: 'kpss-spin 1s linear infinite' }}
        />
      </div>
      <p
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--kpss-text, #0F172A)',
          margin: 0,
        }}
      >
        {message}
      </p>
      <style>{`
        @keyframes kpss-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

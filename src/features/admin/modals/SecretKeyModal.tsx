import React from 'react';
import { X } from 'lucide-react';
import { adminStyles } from '../AdminPanel.styles';

interface SecretKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretInput: string;
  setSecretInput: (val: string) => void;
  isSecretActive: boolean;
  onSave: () => void;
  onClear: () => void;
}

export const SecretKeyModal: React.FC<SecretKeyModalProps> = ({
  isOpen,
  onClose,
  secretInput,
  setSecretInput,
  isSecretActive,
  onSave,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div style={adminStyles.modalBackdrop}>
      <div style={{ ...adminStyles.modalCard, maxWidth: '480px' }}>
        <div style={adminStyles.modalHeader}>
          <h2 style={adminStyles.modalTitle}>Supabase Admin Secret Key</h2>
          <button onClick={onClose} style={adminStyles.modalCloseBtn}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
          Supabase Row Level Security (RLS) kuralını doğrudan aşarak içerik yazmak ve silmek için{' '}
          <b>service_role</b> anahtarınızı buraya girebilirsiniz. Bu anahtar sadece tarayıcınızın yerel hafızasında saklanır.
        </p>

        <div style={{ margin: '14px 0' }}>
          <label style={adminStyles.label}>Service Role / Secret Key:</label>
          <input
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            style={adminStyles.inputField}
          />
        </div>

        <div style={adminStyles.modalActions}>
          {isSecretActive && (
            <button type="button" onClick={onClear} style={adminStyles.dangerBtn}>
              Anahtarı Kaldır
            </button>
          )}
          <button type="button" onClick={onClose} style={adminStyles.secondaryBtn}>
            Vazgeç
          </button>
          <button type="button" onClick={onSave} style={adminStyles.primaryBtn}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<{ success: boolean; error?: string }>;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const res = await onSubmit(name.trim(), description.trim());
    setIsSubmitting(false);

    if (res.success) {
      setName('');
      setDescription('');
      onClose();
    } else {
      setError(res.error || 'Sınıf oluşturulamadı.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          border: '1px solid var(--kpss-border, #E2E8F0)',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
            Yeni Sınıf Oluştur
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FECACA',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Sınıf Adı *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: 2026 KPSS A Grubu Hukuk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                color: 'var(--kpss-text, #0F172A)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Açıklama (İsteğe bağlı)
            </label>
            <textarea
              rows={3}
              placeholder="Sınıf hedefleri, ders programı veya özel açıklamalar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                color: 'var(--kpss-text, #0F172A)',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--kpss-text, #0F172A)',
                cursor: 'pointer',
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Sınıfı Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

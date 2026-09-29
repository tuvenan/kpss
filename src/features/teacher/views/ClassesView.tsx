import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Archive,
  Edit2,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { TeacherClass } from '../../../services/teacherService';

interface ClassesViewProps {
  classes: TeacherClass[];
  onOpenNewClass: () => void;
  onUpdateClass: (classId: string, name: string, description: string) => Promise<boolean>;
  onArchiveClass: (classId: string) => Promise<boolean>;
  onRegenerateCode: (classId: string) => Promise<string | null>;
  onRevokeCode: (classId: string) => Promise<boolean>;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  onOpenNewClass,
  onUpdateClass,
  onArchiveClass,
  onRegenerateCode,
  onRevokeCode,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const startEdit = (c: TeacherClass) => {
    setEditingClassId(c.id);
    setEditName(c.name);
    setEditDesc(c.description || '');
  };

  const saveEdit = async (classId: string) => {
    if (!editName.trim()) return;
    setIsProcessing(classId);
    const ok = await onUpdateClass(classId, editName.trim(), editDesc.trim());
    setIsProcessing(null);
    if (ok) setEditingClassId(null);
  };

  return (
    <div>
      {/* BAŞLIK & EKLE BUTONU */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
            Aktif Sınıflar ({classes.filter((c) => c.is_active).length})
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Öğrencilerinizi davet koduyla sınıflarınıza kaydedebilir, grup çalışmalarını yönetebilirsiniz.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewClass}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Yeni Sınıf Oluştur</span>
        </button>
      </div>

      {classes.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px dashed var(--kpss-border, #CBD5E1)',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
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
              margin: '0 auto 16px',
            }}
          >
            <GraduationCap size={28} color="var(--kpss-text, #0F172A)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
            Henüz Bir Sınıf Oluşturmadınız
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Öğrencilerinizi bir arada takip etmek ve ödev atamak için ilk sınıfınızı hemen oluşturun.
          </p>
          <button
            type="button"
            onClick={onOpenNewClass}
            style={{
              padding: '10px 20px',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sınıf Oluştur
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '18px',
          }}
        >
          {classes.map((c) => {
            const isEditing = editingClassId === c.id;
            const isExpired = c.invite_expires_at && new Date(c.invite_expires_at).getTime() < Date.now();

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  opacity: c.is_active ? 1 : 0.6,
                }}
              >
                <div>
                  {/* SINIF BAŞLIĞI VEYA DÜZENLEME FORMU */}
                  {isEditing ? (
                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Sınıf Adı"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid var(--kpss-border, #E2E8F0)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 700,
                          marginBottom: '8px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Açıklama"
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid var(--kpss-border, #E2E8F0)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                          resize: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => saveEdit(c.id)}
                          disabled={isProcessing === c.id}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#111111',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingClassId(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--kpss-border, #E2E8F0)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
                          {c.name}
                        </h3>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            title="Düzenle"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          {c.is_active && (
                            <button
                              type="button"
                              onClick={() => onArchiveClass(c.id)}
                              title="Sınıfı Arşivle"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {c.description && (
                        <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.4, margin: '0 0 14px 0' }}>
                          {c.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                          {c.student_count || 0}
                        </span>{' '}
                        Kayıtlı Öğrenci
                        {!c.is_active && <span style={{ color: '#EF4444', fontWeight: 600 }}>• Arşivlendi</span>}
                      </div>
                    </div>
                  )}

                  {/* DAVET KODU BÖLÜMÜ */}
                  {c.is_active && (
                    <div
                      style={{
                        backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                          ÖĞRENCİ DAVET KODU
                        </span>
                        {isExpired ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626' }}>
                            Süresi Doldu
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>
                            Aktif
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <code
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            color: isExpired ? '#94A3B8' : 'var(--kpss-text, #0F172A)',
                            textDecoration: isExpired ? 'line-through' : 'none',
                          }}
                        >
                          {c.invite_code}
                        </code>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!isExpired && (
                            <button
                              type="button"
                              onClick={() => handleCopy(c.invite_code)}
                              title="Kodu Kopyala"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                                border: '1px solid var(--kpss-border, #CBD5E1)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {copiedCode === c.invite_code ? <Check size={13} color="#166534" /> : <Copy size={13} />}
                              <span>{copiedCode === c.invite_code ? 'Kopyalandı' : 'Kopyala'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onRegenerateCode(c.id)}
                            title="Yeni Kod Üret"
                            style={{
                              padding: '5px 8px',
                              backgroundColor: 'transparent',
                              border: '1px solid var(--kpss-border, #CBD5E1)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#64748B',
                            }}
                          >
                            <RefreshCw size={12} />
                          </button>

                          {!isExpired && (
                            <button
                              type="button"
                              onClick={() => onRevokeCode(c.id)}
                              title="Kodu İptal Et / Kapat"
                              style={{
                                padding: '5px 8px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--kpss-border, #CBD5E1)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#EF4444',
                              }}
                            >
                              <Ban size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {c.invite_expires_at && !isExpired && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                          <Clock size={11} />
                          <span>Son Kullanım: {new Date(c.invite_expires_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: '#94A3B8', borderTop: '1px solid var(--kpss-border, #E2E8F0)', paddingTop: '10px' }}>
                  Oluşturulma: {new Date(c.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

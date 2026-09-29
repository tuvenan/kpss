import React, { useState } from 'react';
import {
  FolderPlus,
  Plus,
  Trash2,
  Lock,
  BookOpen,
  Calendar,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { TeacherQuestionSet } from '../../../services/teacherService';

interface QuestionSetsViewProps {
  questionSets: TeacherQuestionSet[];
  onOpenNewSet: () => void;
  onDeleteSet: (setId: string) => Promise<boolean>;
}

export const QuestionSetsView: React.FC<QuestionSetsViewProps> = ({
  questionSets,
  onOpenNewSet,
  onDeleteSet,
}) => {
  const [inspectingSet, setInspectingSet] = useState<TeacherQuestionSet | null>(null);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
              Özel Soru Setlerim ({questionSets.length})
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                color: '#64748B',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Lock size={11} />
              <span>Gizli & Size Özel</span>
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Bu sorular yalnızca sizin sınıflarınızda kullanılabilir; genel KPSS havuzuna karışmaz ve başka öğretmenler göremez.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewSet}
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
          <span>Yeni Soru Seti Ekle</span>
        </button>
      </div>

      {questionSets.length === 0 ? (
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
            <FolderPlus size={28} color="var(--kpss-text, #0F172A)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
            Özel Soru Seti Bulunmuyor
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Sınıflarınıza özel deneme ve quiz hazırlamak için kendi özgün sorularınızı içeren ilk soru setinizi oluşturun.
          </p>
          <button
            type="button"
            onClick={onOpenNewSet}
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
            Soru Seti Oluştur
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {questionSets.map((qs) => (
            <div
              key={qs.id}
              style={{
                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
                    {qs.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onDeleteSet(qs.id)}
                    title="Seti Sil"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {qs.description && (
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                    {qs.description}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                      color: 'var(--kpss-text, #0F172A)',
                    }}
                  >
                    {qs.questions?.length || 0} Soru
                  </span>

                  {qs.class_name && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                      }}
                    >
                      {qs.class_name}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--kpss-border, #E2E8F0)',
                  paddingTop: '12px',
                }}
              >
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {new Date(qs.created_at).toLocaleDateString('tr-TR')}
                </span>

                <button
                  type="button"
                  onClick={() => setInspectingSet(qs)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--kpss-text, #0F172A)',
                  }}
                >
                  <Eye size={13} />
                  <span>Soruları Gör</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SORULARI İNCELEME MODALI */}
      {inspectingSet && (
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
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
                  {inspectingSet.title}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Toplam {inspectingSet.questions?.length || 0} özel soru
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSet(null)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Kapat
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {(inspectingSet.questions || []).map((q: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '8px' }}>
                    {idx + 1}. {q.question}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    {(q.options || []).map((opt: any) => {
                      const isCorrect = opt.id === q.correctAnswer;
                      return (
                        <div
                          key={opt.id}
                          style={{
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: isCorrect ? '#F0FDF4' : 'transparent',
                            color: isCorrect ? '#166534' : 'var(--kpss-text, #0F172A)',
                            fontWeight: isCorrect ? 700 : 400,
                          }}
                        >
                          <strong>{opt.id})</strong> {opt.text} {isCorrect && '✓ (Doğru)'}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                      Açıklama: {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInspectingSet(null)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

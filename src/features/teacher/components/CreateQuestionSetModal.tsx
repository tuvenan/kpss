import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { TeacherClass } from '../../../services/teacherService';

interface CreateQuestionSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: TeacherClass[];
  onSubmit: (params: {
    title: string;
    description: string;
    classId: string | null;
    questions: any[];
  }) => Promise<{ success: boolean; error?: string }>;
}

interface DraftQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string; E: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
}

export const CreateQuestionSetModal: React.FC<CreateQuestionSetModalProps> = ({
  isOpen,
  onClose,
  classes,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    {
      question: '',
      options: { A: '', B: '', C: '', D: '', E: '' },
      correctAnswer: 'A',
      explanation: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: { A: '', B: '', C: '', D: '', E: '' },
        correctAnswer: 'A',
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestionField = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    if (field.startsWith('option_')) {
      const optKey = field.replace('option_', '') as 'A' | 'B' | 'C' | 'D' | 'E';
      updated[idx].options[optKey] = value;
    } else {
      (updated[idx] as any)[field] = value;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Lütfen soru seti başlığı girin.');
      return;
    }

    const validQuestions = questions.filter(
      (q) => q.question.trim() && q.options.A.trim() && q.options.B.trim()
    );

    if (validQuestions.length === 0) {
      setError('Lütfen en az bir geçerli soru ekleyin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formattedQuestions = validQuestions.map((q, idx) => ({
      id: `tq_${Date.now()}_${idx}`,
      question: q.question.trim(),
      options: [
        { id: 'A', text: q.options.A },
        { id: 'B', text: q.options.B },
        { id: 'C', text: q.options.C },
        { id: 'D', text: q.options.D },
        { id: 'E', text: q.options.E },
      ],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation.trim(),
    }));

    const res = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      classId: classId || null,
      questions: formattedQuestions,
    });

    setIsSubmitting(false);

    if (res.success) {
      setTitle('');
      setDescription('');
      onClose();
    } else {
      setError(res.error || 'Soru seti oluşturulamadı.');
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
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
              Yeni Özel Soru Seti
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' }}>
              Bu soru seti tamamen size özeldir; platformun genel havuzunu etkilemez.
            </p>
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
                Set Başlığı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: 2026 Vatandaşlık 50 Özgün Soru"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
                İlişkili Sınıf (İsteğe bağlı)
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  color: 'var(--kpss-text, #0F172A)',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Tüm Sınıflarım Kullanabilsin</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Açıklama
            </label>
            <textarea
              rows={2}
              placeholder="Soru setinin kapsamı ve hedef kazanımları..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '8px',
                fontSize: '13px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                color: 'var(--kpss-text, #0F172A)',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          {/* SORULAR LİSTESİ */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                Sorular ({questions.length})
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
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
                <Plus size={14} />
                <span>Soru Ekle</span>
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                style={{
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '14px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                    Soru #{qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  required
                  placeholder="Soru metnini buraya yazınız..."
                  value={q.question}
                  onChange={(e) => updateQuestionField(qIndex, 'question', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                    color: 'var(--kpss-text, #0F172A)',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                    resize: 'none',
                  }}
                />

                {/* ŞIKLAR */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => (
                    <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, width: '16px' }}>{opt}:</span>
                      <input
                        type="text"
                        placeholder={`Seçenek ${opt}`}
                        value={q.options[opt]}
                        onChange={(e) => updateQuestionField(qIndex, `option_${opt}`, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px solid var(--kpss-border, #E2E8F0)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* DOĞRU CEVAP VE AÇIKLAMA */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                      Doğru Seçenek:
                    </label>
                    <select
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestionField(qIndex, 'correctAnswer', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                      }}
                    >
                      {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => (
                        <option key={opt} value={opt}>
                          Seçenek {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                      Çözüm Açıklaması:
                    </label>
                    <input
                      type="text"
                      placeholder="Neden bu seçenek doğru?"
                      value={q.explanation}
                      onChange={(e) => updateQuestionField(qIndex, 'explanation', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
              disabled={isSubmitting || !title.trim()}
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
              {isSubmitting ? 'Kaydediliyor...' : 'Seti Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

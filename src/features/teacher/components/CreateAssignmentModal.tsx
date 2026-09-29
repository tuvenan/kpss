import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TeacherClass, ClassStudent } from '../../../services/teacherService';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: TeacherClass[];
  students: ClassStudent[];
  onSubmit: (params: {
    classId: string;
    title: string;
    description: string;
    assignmentType: 'quiz' | 'mock_exam' | 'study_plan';
    dueDays: number;
    targetStudentIds: string[];
    status: 'draft' | 'published';
  }) => Promise<{ success: boolean; error?: string }>;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  onSubmit,
}) => {
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<'quiz' | 'mock_exam' | 'study_plan'>('quiz');
  const [dueDays, setDueDays] = useState(7);
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredStudents = students.filter((s) => !classId || s.class_id === classId);

  const toggleStudent = (sid: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !title.trim()) {
      setError('Lütfen bir sınıf seçin ve ödev başlığı girin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await onSubmit({
      classId,
      title: title.trim(),
      description: description.trim(),
      assignmentType,
      dueDays,
      targetStudentIds: targetType === 'specific' ? selectedStudentIds : [],
      status,
    });

    setIsSubmitting(false);

    if (res.success) {
      setTitle('');
      setDescription('');
      setSelectedStudentIds([]);
      onClose();
    } else {
      setError(res.error || 'Ödev atanamadı.');
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
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
            Yeni Ödev / Çalışma Ata
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
          {/* SINIF SEÇİMİ */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Hedef Sınıf *
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
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
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.student_count || 0} Öğrenci)
                </option>
              ))}
            </select>
          </div>

          {/* BAŞLIK */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Ödev Başlığı *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Anayasa Hukuku Temel Haklar Testi"
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

          {/* AÇIKLAMA */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Açıklama / Yönergeler
            </label>
            <textarea
              rows={2}
              placeholder="Öğrenciler için talimatlar ve çalışma ipuçları..."
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

          {/* ÇALIŞMA TİPİ VE SÜRE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
                Çalışma Türü
              </label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as any)}
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
                <option value="quiz">Konu Testi</option>
                <option value="mock_exam">Deneme Sınavı</option>
                <option value="study_plan">Çalışma Planı</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
                Teslim Süresi
              </label>
              <select
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
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
                <option value={3}>3 Gün</option>
                <option value={7}>1 Hafta (7 Gün)</option>
                <option value={14}>2 Hafta (14 Gün)</option>
                <option value={30}>1 Ay (30 Gün)</option>
              </select>
            </div>
          </div>

          {/* KİME ATANACAK: TÜM SINIF VEYA BELİRLİ ÖĞRENCİLER */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Atama Kapsamı
            </label>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === 'all'}
                  onChange={() => setTargetType('all')}
                />
                Tüm Sınıfa Ata
              </label>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === 'specific'}
                  onChange={() => setTargetType('specific')}
                />
                Belirli Öğrencilere Ata
              </label>
            </div>

            {targetType === 'specific' && (
              <div
                style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '8px',
                  padding: '8px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {filteredStudents.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Sınıfta kayıtlı öğrenci bulunamadı.</span>
                ) : (
                  filteredStudents.map((s) => (
                    <label key={s.student_id} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.student_id)}
                        onChange={() => toggleStudent(s.student_id)}
                      />
                      <span>{s.full_name || s.username}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* YAYIN DURUMU */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
              Yayın Durumu
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="status"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                />
                Hemen Yayınla (Öğrenciler görür)
              </label>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="status"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                />
                Taslak Olarak Kaydet
              </label>
            </div>
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
              {isSubmitting ? 'Atanıyor...' : status === 'published' ? 'Ödevi Ata' : 'Taslak Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

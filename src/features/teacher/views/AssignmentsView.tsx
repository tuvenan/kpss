import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Archive,
  Send,
  Eye,
  Users,
} from 'lucide-react';
import { TeacherAssignment } from '../../../services/teacherService';

interface AssignmentsViewProps {
  assignments: TeacherAssignment[];
  onOpenNewAssignment: () => void;
  onUpdateStatus: (assignmentId: string, status: 'draft' | 'published' | 'archived') => Promise<boolean>;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  onOpenNewAssignment,
  onUpdateStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  const filteredAssignments = assignments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

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
            Ödev ve Çalışma Listesi ({assignments.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Sınıflarınıza atadığınız quizler, deneme sınavları ve teslim durumları.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {/* DURUM FİLTRESİ */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              padding: '9px 12px',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '8px',
              fontSize: '13px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              color: 'var(--kpss-text, #0F172A)',
            }}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="archived">Arşivlendi</option>
          </select>

          <button
            type="button"
            onClick={onOpenNewAssignment}
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
            <span>Yeni Ödev Ata</span>
          </button>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
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
            <FileCheck size={28} color="var(--kpss-text, #0F172A)" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', marginBottom: '6px' }}>
            Henüz Bir Ödev Atanmadı
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Öğrencilerinizin konuları pekiştirmesi için hemen bir quiz veya deneme sınavı atayın.
          </p>
          <button
            type="button"
            onClick={onOpenNewAssignment}
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
            Ödev Oluştur
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredAssignments.map((a) => {
            const isPublished = a.status === 'published';
            const isDraft = a.status === 'draft';
            const isArchived = a.status === 'archived';

            return (
              <div
                key={a.id}
                style={{
                  backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  opacity: isArchived ? 0.6 : 1,
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                        color: 'var(--kpss-text, #0F172A)',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                      }}
                    >
                      {a.class_name || 'Sınıf'}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor:
                          a.assignment_type === 'quiz'
                            ? '#EEF2FF'
                            : a.assignment_type === 'mock_exam'
                            ? '#FEF3C7'
                            : '#F0FDF4',
                        color:
                          a.assignment_type === 'quiz'
                            ? '#4F46E5'
                            : a.assignment_type === 'mock_exam'
                            ? '#D97706'
                            : '#15803D',
                      }}
                    >
                      {a.assignment_type === 'quiz'
                        ? 'Konu Testi'
                        : a.assignment_type === 'mock_exam'
                        ? 'Deneme Sınavı'
                        : 'Çalışma Planı'}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: isPublished ? '#F0FDF4' : isDraft ? '#FEF3C7' : '#F1F5F9',
                        color: isPublished ? '#166534' : isDraft ? '#D97706' : '#64748B',
                      }}
                    >
                      {isPublished ? 'Yayında' : isDraft ? 'Taslak' : 'Arşivlendi'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: '0 0 6px 0' }}>
                    {a.title}
                  </h3>

                  {a.description && (
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      {a.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#64748B' }}>
                    {a.due_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        <span>Son Teslim: {new Date(a.due_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={13} color="#166534" />
                      <span>{a.completed_count || 0} Öğrenci Tamamladı</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(a.id, 'published')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#111111',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Send size={13} />
                      <span>Yayınla</span>
                    </button>
                  )}

                  {isPublished && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(a.id, 'archived')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--kpss-text, #0F172A)',
                        cursor: 'pointer',
                      }}
                    >
                      <Archive size={13} />
                      <span>Arşivle</span>
                    </button>
                  )}

                  {isArchived && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(a.id, 'published')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                        border: '1px solid var(--kpss-border, #E2E8F0)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--kpss-text, #0F172A)',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Yeniden Aç</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

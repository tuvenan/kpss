import React, { useState } from 'react';
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Award,
  Filter,
} from 'lucide-react';
import { ClassStudent, TeacherClass } from '../../../services/teacherService';

interface StudentsViewProps {
  students: ClassStudent[];
  classes: TeacherClass[];
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [inspectingStudent, setInspectingStudent] = useState<ClassStudent | null>(null);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || s.class_id === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div>
      {/* BAŞLIK & ARAMA ÇUBUĞU */}
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
            Bağlı Öğrenciler ({students.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Yalnızca sınıflarınıza kayıtlı aktif öğrencileri görüntülüyorsunuz. (Salt Okunur)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* SINIF FİLTRESİ */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '8px',
              fontSize: '13px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              color: 'var(--kpss-text, #0F172A)',
            }}
          >
            <option value="all">Tüm Sınıflar</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* ARAMA İNPUTU */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Öğrenci ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '9px 12px 9px 32px',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                borderRadius: '8px',
                fontSize: '13px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                color: 'var(--kpss-text, #0F172A)',
                minWidth: '200px',
              }}
            />
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            padding: '40px',
            textAlign: 'center',
            color: '#64748B',
          }}
        >
          Bağlı öğrenci bulunamadı veya arama kriterine uygun sonuç yok.
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)', borderBottom: '1px solid var(--kpss-border, #E2E8F0)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>Öğrenci</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>Sınıf</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>Sınav Türü</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>Katılım Tarihi</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', textAlign: 'right' }}>İncele</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid var(--kpss-border, #E2E8F0)', transition: 'background-color 0.1s' }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--kpss-text, #0F172A)',
                          }}
                        >
                          {s.full_name[0] || 'Ö'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                            {s.full_name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            @{s.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748B' }}>
                      {s.class_name || 'Kayıtlı Sınıf'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748B' }}>
                      {s.exam_type || 'KPSS Lisans'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#64748B' }}>
                      {new Date(s.joined_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setInspectingStudent(s)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
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
                        <span>Detay</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ÖĞRENCİ DETAY VE PERFORMANS MODALI (SALT OKUNUR) */}
      {inspectingStudent && (
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)', margin: 0 }}>
                  {inspectingStudent.full_name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  @{inspectingStudent.username} • {inspectingStudent.exam_type || 'KPSS Adayı'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
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

            {/* AKADEMİK PERFORMANS ÖZETİ (SALT OKUNUR) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)',
                  borderRadius: '10px',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Kayıtlı Sınıf</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                  {inspectingStudent.class_name || 'Aktif Sınıf'}
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)',
                  borderRadius: '10px',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Katılım Tarihi</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)' }}>
                  {new Date(inspectingStudent.joined_at).toLocaleDateString('tr-TR')}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                marginBottom: '20px',
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kpss-text, #0F172A)', margin: '0 0 8px 0' }}>
                Akademik İlerleme & Devamlılık
              </h4>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                Öğrenci sınav ve quiz çalışmalarını bağımsız olarak sürdürmektedir. Öğretmenler öğrenci sonuçlarını yalnızca salt-okunur olarak izleyebilir; veritabanı RLS seviyesinde öğrenci sonuçlarının değiştirilmesi kesin olarak engellenmiştir.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
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

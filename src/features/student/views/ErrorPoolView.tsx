import React, { useState } from 'react';
import {
  ChevronDown,
  Clock,
  Zap,
  Database,
  Play,
  ChevronRight,
  BookOpen,
  Calculator,
  Landmark,
  Globe,
} from 'lucide-react';
import { styles } from '../../../pages/StudentQuiz.styles';

interface ErrorPoolViewProps {
  leitnerStats: {
    dueTodayCount: number;
    boxes: { count: number }[];
  };
  mistakesBankCount: number;
  onStartMistakesBankQuiz: () => void;
}

export const ErrorPoolView: React.FC<ErrorPoolViewProps> = ({
  leitnerStats,
  mistakesBankCount,
  onStartMistakesBankQuiz,
}) => {
  const [errorFilter, setErrorFilter] = useState('Tümü');

  const errorQuestions = [
    { id: '1', subject: 'Tarih', topic: 'İslamiyet Öncesi', unit: 'İslamiyet Öncesi Türk Tarihi', qNumber: 'Soru 07', wrong: 'C', correct: 'B', icon: 'landmark' },
    { id: '2', subject: 'Türkçe', topic: 'Sözcükte Anlam', unit: 'Sözcükte Anlam', qNumber: 'Soru 13', wrong: 'D', correct: 'A', icon: 'book' },
    { id: '3', subject: 'Matematik', topic: 'Problemler', unit: 'Problemler', qNumber: 'Soru 05', wrong: 'B', correct: 'C', icon: 'calculator' },
    { id: '4', subject: 'Coğrafya', topic: 'Türkiye Fiziki Yapısı', unit: "Türkiye'nin Fiziki Yapısı", qNumber: 'Soru 11', wrong: 'A', correct: 'earth' },
  ];

  const filteredErrorQuestions =
    errorFilter === 'Tümü'
      ? errorQuestions
      : errorQuestions.filter((q) => q.subject.toLowerCase() === errorFilter.toLowerCase());

  const renderIcon = (iconName: string) => {
    const iconColor = 'var(--kpss-primary, #4F46E5)';
    switch (iconName) {
      case 'calculator':
        return <Calculator size={20} color={iconColor} />;
      case 'landmark':
        return <Landmark size={20} color={iconColor} />;
      case 'earth':
        return <Globe size={20} color={iconColor} />;
      case 'book':
      default:
        return <BookOpen size={20} color={iconColor} />;
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
      <div style={styles.errorHeaderRow}>
        <div>
          <h1 style={styles.errorMainTitle}>Hata Havuzu</h1>
          <div style={styles.errorSubCountText}>{filteredErrorQuestions.length} hata sorusu</div>
        </div>
        <button
          onClick={() => {
            const filters = ['Tümü', 'Tarih', 'Türkçe', 'Matematik', 'Coğrafya'];
            const nextIdx = (filters.indexOf(errorFilter) + 1) % filters.length;
            setErrorFilter(filters[nextIdx]);
          }}
          style={styles.errorFilterButton}
        >
          <span>{errorFilter}</span>
          <ChevronDown size={14} color="var(--kpss-text, #333)" style={{ marginLeft: '6px' }} />
        </button>
      </div>

      {/* ARALIKLI TEKRAR (SPACED REPETITION / LEITNER 5-KUTU SİSTEMİ) KARTI */}
      <div
        style={{
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--kpss-border, #E0E7FF)',
          padding: '20px',
          marginBottom: '18px',
          boxShadow: 'var(--kpss-shadow, 0 4px 14px rgba(79, 70, 229, 0.06))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--kpss-subtle-bg, #EEF2FF)',
                color: 'var(--kpss-primary, #4F46E5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--kpss-text, #0F172A)' }}>
                  Aralıklı Tekrar & Kalıcı Hafıza (Leitner)
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--kpss-subtle-bg, #EEF2FF)',
                    color: 'var(--kpss-primary, #4F46E5)',
                  }}
                >
                  5-Kutu Algoritması
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #64748B)', marginTop: '2px' }}>
                Öğrendiğiniz ve hata yaptığınız sorular unutma eğrisine göre periyodik olarak önünüze gelir.
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: leitnerStats.dueTodayCount > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${leitnerStats.dueTodayCount > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}
          >
            <Zap size={14} color={leitnerStats.dueTodayCount > 0 ? '#F59E0B' : '#10B981'} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: leitnerStats.dueTodayCount > 0 ? '#F59E0B' : '#10B981' }}>
              {leitnerStats.dueTodayCount > 0
                ? `Bugün ${leitnerStats.dueTodayCount} soru tekrar bekliyor`
                : 'Bugün için tüm tekrarlar tamamlandı!'}
            </span>
          </div>
        </div>

        {/* 5 Kutu İlerleme Izgarası */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { box: 1, name: '1. Kutu', interval: '1 Gün', count: leitnerStats.boxes[0]?.count || 0, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
            { box: 2, name: '2. Kutu', interval: '3 Gün', count: leitnerStats.boxes[1]?.count || 0, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' },
            { box: 3, name: '3. Kutu', interval: '7 Gün', count: leitnerStats.boxes[2]?.count || 0, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
            { box: 4, name: '4. Kutu', interval: '14 Gün', count: leitnerStats.boxes[3]?.count || 0, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
            { box: 5, name: '5. Kutu (Kalıcı)', interval: '30 Gün', count: leitnerStats.boxes[4]?.count || 0, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
          ].map((b) => (
            <div
              key={b.box}
              style={{
                backgroundColor: 'var(--kpss-subtle-bg, #F8FAFC)',
                borderRadius: '12px',
                padding: '12px 10px',
                border: '1px solid var(--kpss-border, #F1F5F9)',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--kpss-text-muted, #475569)' }}>{b.name}</span>
                <span style={{ fontSize: '9px', fontWeight: 600, color: b.color, backgroundColor: b.bg, padding: '1px 5px', borderRadius: '4px' }}>
                  {b.interval}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--kpss-text, #0F172A)' }}>
                {b.count}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #94A3B8)', marginTop: '2px' }}>
                soru hafızada
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 'Yanlışlarım' Özel Soru Bankası Kartı */}
      <div
        style={{
          backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--kpss-border, #FECACA)',
          padding: '16px 20px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--kpss-shadow, 0 4px 14px rgba(220, 38, 38, 0.06))',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(220, 38, 38, 0.12)',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Database size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--kpss-text, #111827)' }}>
                'Yanlışlarım' Soru Bankası
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(220, 38, 38, 0.12)',
                  color: '#DC2626',
                }}
              >
                Otomatik Banka
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--kpss-text-muted, #6B7280)', marginTop: '3px' }}>
              Deneme sınavlarında yanlış çözdüğünüz sorular otomatik olarak bu soru bankasında birikir. ({mistakesBankCount} Soru)
            </div>
          </div>
        </div>

        <button
          onClick={onStartMistakesBankQuiz}
          disabled={mistakesBankCount === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 18px',
            backgroundColor: mistakesBankCount > 0 ? '#DC2626' : 'var(--kpss-subtle-bg, #E5E7EB)',
            color: mistakesBankCount > 0 ? '#FFFFFF' : 'var(--kpss-text-muted, #9CA3AF)',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            fontSize: '13px',
            cursor: mistakesBankCount > 0 ? 'pointer' : 'not-allowed',
            boxShadow: mistakesBankCount > 0 ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
          }}
        >
          <Play size={15} fill={mistakesBankCount > 0 ? '#FFFFFF' : 'var(--kpss-text-muted, #9CA3AF)'} />
          <span>Yanlışlarımı Çöz ({mistakesBankCount})</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredErrorQuestions.map((item) => (
          <div key={item.id} style={styles.errorCardWeb}>
            <div style={styles.errorCardLeft}>
              <div style={styles.errorIconContainer}>{renderIcon(item.icon || 'book')}</div>
              <div style={styles.errorInfoContainer}>
                <div style={styles.errorSubjectName}>{item.subject}</div>
                <div style={styles.errorUnitName}>{item.unit}</div>
                <div style={styles.errorQNumberText}>{item.qNumber}</div>
              </div>
            </div>
            <div style={styles.errorCardRight}>
              <div style={styles.errorBadgeRow}>
                <span style={styles.errorWrongBadge}>Yanlış: {item.wrong}</span>
                <span style={styles.errorCorrectBadge}>Doğru: {item.correct}</span>
              </div>
              <ChevronRight size={18} color="#666" style={{ marginTop: '8px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

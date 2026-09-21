import React, { useState, useEffect } from 'react';
import { studentProgressService, TopicRecord } from '../services/studentProgressService';

interface DetailedTopicAnalysisCardProps {
  onSelectTopic?: (topicId: string) => void;
}

export const DetailedTopicAnalysisCard: React.FC<DetailedTopicAnalysisCardProps> = ({ onSelectTopic }) => {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('Türkçe');
  const [topicList, setTopicList] = useState<TopicRecord[]>([]);

  useEffect(() => {
    loadTopics();
  }, [selectedSubjectFilter]);

  const loadTopics = () => {
    const list = studentProgressService.getTopicAnalysisList(selectedSubjectFilter);
    setTopicList(list);
  };

  const subjectFilters = ['Türkçe', 'Tarih', 'Matematik', 'Coğrafya', 'Vatandaşlık', 'Tümü'];

  return (
    <div style={styles.cardContainer} className="detailed-topic-analysis-card">
      <style>{`
        .detailed-topic-analysis-card {
          background-color: #FFFFFF;
          border-radius: 24px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          margin-bottom: 40px;
        }
        .topic-row {
          display: flex;
          align-items: center;
          padding: 18px 32px;
          border-bottom: 1px solid #F1F5F9;
          transition: background-color 0.15s ease;
        }
        .topic-row:hover {
          background-color: #FAFAFC;
        }
        .topic-row:last-child {
          border-bottom: none;
        }
        @media (max-width: 768px) {
          .topic-row {
            padding: 14px 16px !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .topic-col-title {
            width: 100% !important;
            margin-bottom: 4px !important;
          }
          .topic-col-bar {
            width: 100px !important;
          }
        }
      `}</style>

      {/* ÜST BAŞLIK VE DERS FİLTRELERİ */}
      <div style={styles.headerArea}>
        <div style={styles.titleRow}>
          <h2 style={styles.headingTitle}>Detaylı Konu Bazlı Analiz</h2>

          {/* Konu Ders Filtresi */}
          <div style={styles.filterPillsContainer}>
            {subjectFilters.map((sub) => {
              const isActive = selectedSubjectFilter === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubjectFilter(sub)}
                  style={{
                    ...styles.filterPillBtn,
                    backgroundColor: isActive ? '#0F172A' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KONU LİSTESİ SATIRLARI */}
      <div style={styles.listContainer}>
        {topicList.map((item) => {
          const isNotAttempted = item.solvedCount === 0;

          return (
            <div
              key={item.id}
              className="topic-row"
              onClick={() => onSelectTopic && onSelectTopic(item.id)}
              style={{ cursor: onSelectTopic ? 'pointer' : 'default' }}
            >
              {/* 1. Sütun: Konu Adı */}
              <div style={styles.titleCol} className="topic-col-title">
                <span style={styles.topicTitleText} title={item.topicTitle}>
                  {item.topicTitle}
                </span>
                {item.unitTitle && (
                  <span style={styles.unitSubText}>{item.unitTitle}</span>
                )}
              </div>

              {/* 2. Sütun: Durum Bilgisi */}
              <div style={styles.statusCol}>
                <span
                  style={{
                    ...styles.statusText,
                    color: isNotAttempted ? '#94A3B8' : '#0F172A',
                    fontWeight: isNotAttempted ? 400 : 600,
                  }}
                >
                  {isNotAttempted ? 'Henüz yok' : `${item.solvedCount} soru çözüldü`}
                </span>
              </div>

              {/* 3. Sütun: İlerleme Çubuğu */}
              <div style={styles.barCol} className="topic-col-bar">
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${item.percentage}%`,
                      backgroundColor:
                        item.percentage >= 70
                          ? '#10B981'
                          : item.percentage >= 40
                          ? '#0F172A'
                          : '#EF4444',
                    }}
                  />
                </div>
              </div>

              {/* 4. Sütun: Başarı Yüzdesi */}
              <div style={styles.percentCol}>
                <span style={styles.percentText}>
                  %{item.percentage}
                </span>
              </div>

              {/* 5. Sütun: Gösterge */}
              <div style={styles.actionCol}>
                <span
                  style={{
                    ...styles.indicatorText,
                    color: isNotAttempted ? '#CBD5E1' : '#10B981',
                    fontWeight: isNotAttempted ? 400 : 700,
                  }}
                >
                  {isNotAttempted ? '-' : '✓'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    marginBottom: '40px',
  },
  headerArea: {
    padding: '28px 32px 20px',
    borderBottom: '1px solid #F1F5F9',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headingTitle: {
    fontFamily: "'Playfair Display', 'Merriweather', Georgia, serif",
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    lineHeight: 1.25,
  },
  filterPillsContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterPillBtn: {
    border: 'none',
    borderRadius: '9999px',
    padding: '5px 14px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  titleCol: {
    flex: 1.4,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '200px',
    paddingRight: '16px',
  },
  topicTitleText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#0F172A',
    lineHeight: 1.4,
  },
  unitSubText: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
  },
  statusCol: {
    width: '130px',
    textAlign: 'left',
  },
  statusText: {
    fontSize: '13px',
  },
  barCol: {
    width: '180px',
    padding: '0 16px',
    boxSizing: 'border-box',
  },
  barTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: '#F1F5F9',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.4s ease',
  },
  percentCol: {
    width: '70px',
    textAlign: 'right',
  },
  percentText: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontStyle: 'italic',
    fontSize: '16px',
    fontWeight: 700,
    color: '#0F172A',
  },
  actionCol: {
    width: '35px',
    textAlign: 'right',
  },
  indicatorText: {
    fontSize: '14px',
  },
};

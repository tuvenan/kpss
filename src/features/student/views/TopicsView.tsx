import React from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Unit, Topic } from '../../../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface TopicsViewProps {
  selectedUnit: Unit;
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  onBack: () => void;
}

export const TopicsView: React.FC<TopicsViewProps> = ({
  selectedUnit,
  topics,
  onSelectTopic,
  onBack,
}) => {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      {/* Üst Geri Tuşu ve Başlık */}
      <div style={styles.unitHeader}>
        <button
          onClick={onBack}
          style={styles.unitBackButton}
          title="Ünitelere Dön"
        >
          <ChevronLeft size={22} color="var(--kpss-text, #111)" />
        </button>
        <div style={styles.unitHeaderTitle}>{selectedUnit.title}</div>
        <div style={{ width: '40px' }} />
      </div>

      {/* Sayfa Alt Başlığı */}
      <h1 style={styles.subTitle}>{selectedUnit.title} Konuları</h1>

      {/* Konu Listesi Kartları */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {topics.map((topic, index) => {
          const formattedNumber = String(topic.topicNumber || index + 1).padStart(2, '0');
          const isUnder20 = (topic.questionCount ?? 0) < 20;

          return (
            <div
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              style={{
                ...styles.unitCard,
                opacity: isUnder20 ? 0.8 : 1,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  ...styles.unitNumberBadge,
                  backgroundColor: isUnder20 ? '#F1F5F9' : undefined,
                }}
              >
                <span
                  style={{
                    ...styles.unitNumberText,
                    color: isUnder20 ? '#94A3B8' : undefined,
                  }}
                >
                  {formattedNumber}
                </span>
              </div>
              <div style={styles.unitInfo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={styles.unitName}>{topic.title}</div>
                  {isUnder20 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                      }}
                    >
                      🔒 Hazırlık Aşamasında ({topic.questionCount || 0}/20 Soru)
                    </span>
                  )}
                </div>
                <div style={styles.unitQuestionText}>
                  {isUnder20
                    ? `${topic.questionCount || 0} Soru • Henüz Yayınlanmadı (Hazırlıkta)`
                    : `${topic.questionCount || 20} Soru • Test`}
                </div>
              </div>
              {isUnder20 ? (
                <Lock size={18} color="#94A3B8" />
              ) : (
                <ChevronRight size={18} color="var(--kpss-text-muted, #94A3B8)" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

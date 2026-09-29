import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Subject, Unit } from '../../../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface UnitsViewProps {
  selectedSubject: Subject;
  units: Unit[];
  onSelectUnit: (unit: Unit) => void;
  onBack: () => void;
}

export const UnitsView: React.FC<UnitsViewProps> = ({
  selectedSubject,
  units,
  onSelectUnit,
  onBack,
}) => {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      {/* Üst Geri Tuşu ve Başlık */}
      <div style={styles.unitHeader}>
        <button
          onClick={onBack}
          style={styles.unitBackButton}
          title="Derslere Dön"
        >
          <ChevronLeft size={22} color="var(--kpss-text, #111)" />
        </button>
        <div style={styles.unitHeaderTitle}>{selectedSubject.title}</div>
        <div style={{ width: '40px' }} />
      </div>

      {/* Sayfa Alt Başlığı */}
      <h1 style={styles.subTitle}>{selectedSubject.title} Üniteleri</h1>

      {/* Ünite Listesi Kartları */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {units.map((unit, index) => {
          const formattedNumber = String(unit.unitNumber || index + 1).padStart(2, '0');
          return (
            <div
              key={unit.id}
              onClick={() => onSelectUnit(unit)}
              style={styles.unitCard}
            >
              <div style={styles.unitNumberBadge}>
                <span style={styles.unitNumberText}>{formattedNumber}</span>
              </div>
              <div style={styles.unitInfo}>
                <div style={styles.unitName}>{unit.title}</div>
                <div style={styles.unitQuestionText}>{unit.topicCount || 3} Konu • Testler</div>
              </div>
              <ChevronRight size={18} color="var(--kpss-text-muted, #94A3B8)" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

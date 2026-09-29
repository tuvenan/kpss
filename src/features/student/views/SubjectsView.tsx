import React from 'react';
import {
  Calculator,
  Landmark,
  Globe,
  Users,
  Shield,
  Newspaper,
  Bookmark,
  BookOpen,
  ChevronRight,
  Timer,
} from 'lucide-react';
import { SubjectCardItem } from '../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface SubjectsViewProps {
  generalTalentSubjects: SubjectCardItem[];
  generalCultureSubjects: SubjectCardItem[];
  extraSubjects: SubjectCardItem[];
  onSubjectClick: (item: { id: string; title: string; unitCount: number }) => void;
  onOpenDenemeSetup: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  generalTalentSubjects,
  generalCultureSubjects,
  extraSubjects,
  onSubjectClick,
  onOpenDenemeSetup,
}) => {
  const renderIcon = (iconName: string) => {
    const iconColor = 'var(--kpss-primary, #4F46E5)';
    switch (iconName) {
      case 'calculator':
        return <Calculator size={20} color={iconColor} />;
      case 'landmark':
        return <Landmark size={20} color={iconColor} />;
      case 'earth':
      case 'globe':
        return <Globe size={20} color={iconColor} />;
      case 'users':
        return <Users size={20} color={iconColor} />;
      case 'shield':
        return <Shield size={20} color={iconColor} />;
      case 'newspaper':
        return <Newspaper size={20} color={iconColor} />;
      case 'bookmark':
        return <Bookmark size={20} color={iconColor} />;
      case 'book':
      default:
        return <BookOpen size={20} color={iconColor} />;
    }
  };

  const renderSubjectCard = (subject: SubjectCardItem) => (
    <div
      key={subject.id}
      onClick={() => onSubjectClick(subject)}
      style={styles.subjectCard}
    >
      <div style={styles.iconContainer}>{renderIcon(subject.icon)}</div>
      <div style={styles.subjectInfo}>
        <div style={styles.subjectRow}>
          <span style={styles.subjectTitle}>{subject.title}</span>
          <ChevronRight size={18} color="var(--kpss-text-muted, #94A3B8)" />
        </div>
        <div style={styles.unitText}>{subject.unitCount} Ünite</div>

        {/* İlerleme Çubuğu ve Yüzde */}
        <div style={styles.progressRow}>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.cardProgressBarFill, width: `${subject.percentage}%` }} />
          </div>
          <span style={styles.percentageText}>%{subject.percentage}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ ...styles.mainTitle, margin: 0 }}>Dersler</h1>
        <button
          onClick={onOpenDenemeSetup}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--kpss-primary, #4F46E5)',
            color: '#FFFFFF',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Timer size={15} />
          <span>Deneme Sınavı (20 Soru)</span>
        </button>
      </div>

      <div style={styles.categoryTitle}>KPSS Genel Yetenek</div>
      {generalTalentSubjects.map(renderSubjectCard)}

      <div style={{ ...styles.categoryTitle, marginTop: '24px' }}>KPSS Genel Kültür</div>
      {generalCultureSubjects.map(renderSubjectCard)}

      {extraSubjects.length > 0 && (
        <>
          <div style={{ ...styles.categoryTitle, marginTop: '24px' }}>Özel Eklenen Dersler</div>
          {extraSubjects.map(renderSubjectCard)}
        </>
      )}
    </div>
  );
};

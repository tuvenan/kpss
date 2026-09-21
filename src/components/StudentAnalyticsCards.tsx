import React, { useState } from 'react';

interface DayData {
  day: string;
  count: number;
}

interface StudentAnalyticsCardsProps {
  correctPercentage?: number;
  solvedCount?: number;
  targetCount?: number;
  weeklyData?: DayData[];
}

export const StudentAnalyticsCards: React.FC<StudentAnalyticsCardsProps> = ({
  correctPercentage = 80,
  solvedCount = 340,
  targetCount = 500,
  weeklyData,
}) => {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // G├╝nl├╝k Soru Da─ş─▒l─▒m─▒ (Referans g├Ârseldeki y├╝kseklikler ve toplam 340 soru)
  const defaultWeeklyData: DayData[] = weeklyData || [
    { day: 'Pzt', count: 44 },
    { day: 'Sal', count: 52 },
    { day: '├çar', count: 34 },
    { day: 'Per', count: 70 },
    { day: 'Cum', count: 46 },
    { day: 'Cmt', count: 74 },
    { day: 'Paz', count: 20 },
  ];

  const days = defaultWeeklyData;
  const maxDayCount = 85; // ├£st tavan s─▒n─▒r

  // Halka Grafik (Donut Chart) Geometrisi
  const donutSize = 220;
  const donutCenter = donutSize / 2;
  const donutRadius = 78;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * donutRadius;
  const correctRatio = Math.min(100, Math.max(0, correctPercentage)) / 100;
  const correctDash = circumference * correctRatio;

  // Hedef Y├╝zdesi
  const goalPercentage = Math.min(100, Math.round((solvedCount / targetCount) * 100));

  return (
    <div style={styles.gridContainer} className="analytics-cards-grid">
      <style>{`
        .analytics-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        @media (max-width: 860px) {
          .analytics-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>

      {/* 1. KART: GENEL BA┼ŞARI DA─ŞILIMI */}
      <div style={styles.card}>
        <h3 style={styles.cardHeading}>Genel Ba┼şar─▒ Da─ş─▒l─▒m─▒</h3>

        {/* Halka Grafik */}
        <div style={styles.donutWrapper}>
          <svg
            width={donutSize}
            height={donutSize}
            viewBox={`0 0 ${donutSize} ${donutSize}`}
            style={{ overflow: 'visible' }}
          >
            {/* Yanl─▒┼ş / Bo┼ş Halka B├Âl├╝m├╝ (A├ğ─▒k Gri Arka Katman) */}
            <circle
              cx={donutCenter}
              cy={donutCenter}
              r={donutRadius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
            />

            {/* Do─şru Halka B├Âl├╝m├╝ (Koyu Siyah / Lacivert) */}
            <circle
              cx={donutCenter}
              cy={donutCenter}
              r={donutRadius}
              fill="none"
              stroke="#0F172A"
              strokeWidth={strokeWidth}
              strokeDasharray={`${correctDash} ${circumference}`}
              strokeDashoffset={0}
              transform={`rotate(-90 ${donutCenter} ${donutCenter})`}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-dasharray 0.6s ease-in-out',
              }}
            />
          </svg>
        </div>

        {/* Lejant (Do─şru / Yanl─▒┼ş-Bo┼ş) */}
        <div style={styles.legendRow}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: '#0F172A' }} />
            <span style={styles.legendText}>Do─şru</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: '#E2E8F0' }} />
            <span style={{ ...styles.legendText, color: '#94A3B8' }}>Yanl─▒┼ş/Bo┼ş</span>
          </div>
        </div>

        {/* Alt B├╝y├╝k Ba┼şar─▒ Skoru */}
        <div style={styles.scoreContainer}>
          <div style={styles.scorePercentText}>%{correctPercentage}</div>
          <div style={styles.scoreLabel}>BA┼ŞARI DA─ŞILIMI</div>
        </div>
      </div>

      {/* 2. KART: HAFTALIK SORU ├ç├ûZ├£M├£ */}
      <div style={styles.card}>
        <h3 style={styles.cardHeading}>Haftal─▒k Soru ├ç├Âz├╝m├╝</h3>

        {/* ├çubuk Grafik (Bar Chart) */}
        <div style={styles.barChartWrapper}>
          {/* Arka Plan Yatay ├çizgiler */}
          <div style={styles.guidelinesContainer}>
            <div style={styles.guideline} />
            <div style={styles.guideline} />
            <div style={styles.guideline} />
          </div>

          {/* S├╝tunlar */}
          <div style={styles.barsFlexRow}>
            {days.map((item, idx) => {
              const heightPercent = Math.round((item.count / maxDayCount) * 100);
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={item.day}
                  style={styles.barColumn}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Hover Edildi─şinde Soru Say─▒s─▒ Tooltip */}
                  {isHovered && (
                    <div style={styles.tooltipBox}>
                      {item.count} soru
                    </div>
                  )}

                  {/* S├╝tun ├çubu─şu */}
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        height: `${heightPercent}%`,
                        backgroundColor: isHovered ? '#1E293B' : '#0F172A',
                      }}
                    />
                  </div>

                  {/* G├╝n Etiketi */}
                  <span style={styles.dayLabel}>{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alt Hedef ─░lerleme ├çubu─şu */}
        <div style={styles.goalSection}>
          <div style={styles.goalHeaderRow}>
            <span style={styles.goalTitle}>TOPLAM SORU HEDEF─░</span>
            <span style={styles.goalCountText}>
              <strong style={{ color: '#0F172A' }}>{solvedCount}</strong> / {targetCount}
            </span>
          </div>

          <div style={styles.goalProgressBarBg}>
            <div
              style={{
                ...styles.goalProgressBarFill,
                width: `${goalPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  gridContainer: {
    width: '100%',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    border: '1px solid #E5E7EB',
    padding: '32px 28px 28px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  cardHeading: {
    fontFamily: "'Playfair Display', 'Merriweather', Georgia, serif",
    fontSize: '22px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 24px 0',
    lineHeight: 1.3,
  },
  donutWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '8px 0 20px',
  },
  legendRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '24px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  legendText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#0F172A',
  },
  scoreContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercentText: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontStyle: 'italic',
    fontSize: '44px',
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1,
    marginBottom: '6px',
  },
  scoreLabel: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    color: '#10B981', // Canl─▒ Z├╝mr├╝t Ye┼şili
    textAlign: 'center',
  },
  barChartWrapper: {
    position: 'relative',
    height: '190px',
    marginBottom: '28px',
    paddingTop: '20px',
  },
  guidelinesContainer: {
    position: 'absolute',
    top: '20px',
    left: 0,
    right: 0,
    bottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  guideline: {
    width: '100%',
    borderBottom: '1px dashed #F1F5F9',
  },
  barsFlexRow: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1,
    padding: '0 4px',
  },
  barColumn: {
    position: 'relative',
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    cursor: 'pointer',
    margin: '0 4px',
  },
  tooltipBox: {
    position: 'absolute',
    top: '-8px',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    zIndex: 10,
    pointerEvents: 'none',
  },
  barTrack: {
    width: '100%',
    maxWidth: '38px',
    height: '145px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.4s ease, background-color 0.15s ease',
  },
  dayLabel: {
    marginTop: '10px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748B',
    textAlign: 'center',
  },
  goalSection: {
    marginTop: 'auto',
  },
  goalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  goalTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    color: '#475569',
  },
  goalCountText: {
    fontSize: '14px',
    color: '#64748B',
  },
  goalProgressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: '#F1F5F9',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: '9999px',
    transition: 'width 0.5s ease',
  },
};

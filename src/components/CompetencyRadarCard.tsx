import React, { useState } from 'react';
import { Star } from 'lucide-react';

export type RadarTab = 'dersler' | 'uniteler' | 'konular';

interface RadarDataPoint {
  label: string;
  score: number; // 0 - 100
  subtext?: string;
}

interface CompetencyRadarCardProps {
  // Optional custom data
  derslerData?: RadarDataPoint[];
  unitelerData?: RadarDataPoint[];
  konularData?: RadarDataPoint[];
}

export const CompetencyRadarCard: React.FC<CompetencyRadarCardProps> = ({
  derslerData,
  unitelerData,
  konularData,
}) => {
  const [activeTab, setActiveTab] = useState<RadarTab>('dersler');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasData, setHasData] = useState<boolean>(true); // Can toggle or show data

  // KPSS M├╝fredat─▒na Uygun ├ûrnek ve Canl─▒ Ba┼şar─▒ Verileri
  const defaultDersler: RadarDataPoint[] = derslerData || [
    { label: 'T├╝rk├ğe', score: 82, subtext: '320 soru ├ğ├Âz├╝ld├╝' },
    { label: 'Matematik', score: 65, subtext: '280 soru ├ğ├Âz├╝ld├╝' },
    { label: 'Tarih', score: 88, subtext: '350 soru ├ğ├Âz├╝ld├╝' },
    { label: 'Co─şrafya', score: 72, subtext: '210 soru ├ğ├Âz├╝ld├╝' },
    { label: 'Vatanda┼şl─▒k', score: 78, subtext: '160 soru ├ğ├Âz├╝ld├╝' },
    { label: 'G├╝ncel Bilgiler', score: 60, subtext: '120 soru ├ğ├Âz├╝ld├╝' },
  ];

  const defaultUniteler: RadarDataPoint[] = unitelerData || [
    { label: 'S├Âzc├╝kte Anlam', score: 90, subtext: 'T├╝rk├ğe' },
    { label: 'Problemler', score: 58, subtext: 'Matematik' },
    { label: '─░slamiyet ├ûncesi', score: 85, subtext: 'Tarih' },
    { label: 'T├╝rkiye Fiziki Yap─▒s─▒', score: 68, subtext: 'Co─şrafya' },
    { label: 'Temel Hukuk', score: 75, subtext: 'Vatanda┼şl─▒k' },
    { label: 'G├╝ncel Olaylar', score: 64, subtext: 'Genel K├╝lt├╝r' },
  ];

  const defaultKonular: RadarDataPoint[] = konularData || [
    { label: 'C├╝mlede Anlam', score: 88, subtext: 'S├Âzc├╝kte Anlam' },
    { label: 'Say─▒ Problemleri', score: 54, subtext: 'Problemler' },
    { label: '─░lk T├╝rk Devletleri', score: 92, subtext: '─░slamiyet ├ûncesi' },
    { label: 'T├╝rkiye ─░klimi', score: 70, subtext: 'Fiziki Yap─▒' },
    { label: 'Anayasa Tarihi', score: 76, subtext: 'Temel Hukuk' },
    { label: 'Uluslararas─▒ ├ûrg├╝tler', score: 62, subtext: 'G├╝ncel Bilgiler' },
  ];

  const getCurrentDataset = (): RadarDataPoint[] => {
    switch (activeTab) {
      case 'dersler':
        return defaultDersler;
      case 'uniteler':
        return defaultUniteler;
      case 'konular':
        return defaultKonular;
    }
  };

  const currentDataset = getCurrentDataset();

  // Radar ├çizim Geometrisi
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 115;
  const levels = [0.25, 0.5, 0.75, 1.0];
  const numAxes = currentDataset.length;

  // Vertex koordinatlar─▒n─▒ hesaplama
  const getCoordinates = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numAxes;
    const x = cx + radius * ratio * Math.cos(angle);
    const y = cy + radius * ratio * Math.sin(angle);
    return { x, y, angle };
  };

  // Veri Poligonu SVG points dizesi
  const dataPolygonPoints = currentDataset
    .map((d, i) => {
      const ratio = hasData ? Math.max(0.08, d.score / 100) : 0;
      const { x, y } = getCoordinates(i, ratio);
      return `${x},${y}`;
    })
    .join(' ');

  // Dinamik Geli┼şim ├ûzeti Metinleri
  const getSummaryText = () => {
    if (!hasData) {
      return 'Hen├╝z yeterli soru ├ğ├Âz├╝m├╝ yap─▒lmad─▒. Soru ├ğ├Âzd├╝k├ğe bu radar analiz paneli g├╝├ğl├╝ ve zay─▒f konular─▒n─▒z─▒ otomatik olarak tespit edecektir.';
    }

    if (activeTab === 'dersler') {
      return 'Tarih (%88) ve T├╝rk├ğe (%82) derslerinde akademik yeterlilik d├╝zeyiniz g├╝├ğl├╝. Matematik (%65) ve G├╝ncel Bilgiler (%60) alanlar─▒nda soru prati─şi yaparak netlerinizi art─▒rabilirsiniz.';
    } else if (activeTab === 'uniteler') {
      return 'S├Âzc├╝kte Anlam (%90) ve ─░slamiyet ├ûncesi (%85) ├╝nitelerinde kavray─▒┼ş─▒n─▒z tam. Problemler (%58) ve T├╝rkiye Fiziki Yap─▒s─▒ (%68) ├╝nitelerindeki eksikleri gidermeye odaklanabilirsiniz.';
    } else {
      return '─░lk T├╝rk Devletleri (%92) ve C├╝mlede Anlam (%88) konular─▒nda ba┼şar─▒ oran─▒n─▒z m├╝kemmel. Say─▒ Problemleri (%54) konusunda soru ├ğ├Âz├╝m videolar─▒n─▒ tekrar izlemeniz tavsiye edilir.';
    }
  };

  return (
    <div style={styles.cardContainer} className="competency-radar-card">
      <style>{`
        .competency-radar-card {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 32px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .competency-radar-card {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
            padding: 20px !important;
          }
          .radar-title-text {
            font-size: 24px !important;
          }
          .radar-svg-container {
            min-height: 320px !important;
          }
        }
      `}</style>

      {/* SOL KOLON: B─░LG─░, SEKME VE ├ûZET ALANI */}
      <div style={styles.leftCol}>
        {/* ├£st Rozet */}
        <div style={styles.badgeWrapper}>
          <span style={styles.badgeText}>YETERL─░L─░K RADARI</span>
        </div>

        {/* Ana Ba┼şl─▒k */}
        <h2 style={styles.headingTitle} className="radar-title-text">
          Kazan─▒m &amp; Konu Analizi
        </h2>

        {/* A├ğ─▒klama Metni */}
        <p style={styles.descriptionText}>
          ├ç├Âzd├╝─ş├╝n├╝z sorular─▒n ders, ├╝nite ve konu d├╝zeyindeki ba┼şar─▒ oranlar─▒na g├Âre akademik yeterlilik haritan─▒z ├ğ─▒kar─▒lm─▒┼şt─▒r.
        </p>

        {/* Segmented Switcher (Dersler / ├£niteler / Konular) */}
        <div style={styles.tabsContainer}>
          <button
            type="button"
            onClick={() => setActiveTab('dersler')}
            style={activeTab === 'dersler' ? styles.tabBtnActive : styles.tabBtnInactive}
          >
            Dersler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uniteler')}
            style={activeTab === 'uniteler' ? styles.tabBtnActive : styles.tabBtnInactive}
          >
            ├£niteler
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('konular')}
            style={activeTab === 'konular' ? styles.tabBtnActive : styles.tabBtnInactive}
          >
            Konular
          </button>
        </div>

        {/* Geli┼şim ├ûzeti Kart─▒ */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryHeader}>
            <Star size={15} color="#0F172A" strokeWidth={2.2} style={{ marginRight: '6px' }} />
            <span style={styles.summaryTitle}>GEL─░┼Ş─░M ├ûZET─░N─░Z</span>
          </div>
          <p style={styles.summaryBodyText}>{getSummaryText()}</p>
        </div>

        {/* Durum Ge├ği┼şi (Opsiyonel Canl─▒ / S─▒f─▒r Durumu ─░nceleme) */}
        <div style={styles.toggleRow}>
          <button
            type="button"
            onClick={() => setHasData(!hasData)}
            style={styles.toggleStateBtn}
          >
            {hasData ? 'ÔÇó Bo┼ş / S─▒f─▒r Durumu G├Âr' : 'ÔÇó Analiz Verilerini G├Âster'}
          </button>
        </div>
      </div>

      {/* SA─Ş KOLON: ─░NTERAKT─░F RADAR / SPIDER CHART ALANI */}
      <div style={styles.rightCol} className="radar-svg-container">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          style={styles.radarSvg}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 1. Konsantrik Izgara Halkalar─▒ (Seviyeler: 25, 50, 75, 100) */}
          {levels.map((level, idx) => {
            const points = Array.from({ length: numAxes })
              .map((_, i) => {
                const { x, y } = getCoordinates(i, level);
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <polygon
                key={`grid-${idx}`}
                points={points}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* 2. Merkezden K├Â┼şelere Uzanan Eksen ├çizgileri */}
          {Array.from({ length: numAxes }).map((_, i) => {
            const { x, y } = getCoordinates(i, 1.0);
            return (
              <line
                key={`spoke-${i}`}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* 3. Matematik Ekseni ├£zerindeki Say─▒sal ├ûl├ğek (0, 25, 50, 75, 100) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
            const { x, y } = getCoordinates(1, val);
            const labelText = idx === 0 ? '0' : String(idx * 25);
            return (
              <text
                key={`scale-${idx}`}
                x={x - 4}
                y={y - 4}
                fill="#94A3B8"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                transform={`rotate(28, ${x}, ${y})`}
              >
                {labelText}
              </text>
            );
          })}

          {/* 4. Veri Poligonu (E─şer veri varsa) */}
          {hasData && (
            <>
              <polygon
                points={dataPolygonPoints}
                fill="rgba(15, 23, 42, 0.08)"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinejoin="round"
                style={{
                  transition: 'all 0.4s ease-in-out',
                }}
              />

              {/* K├Â┼şe Noktalar─▒ (Vertices) */}
              {currentDataset.map((d, i) => {
                const ratio = Math.max(0.08, d.score / 100);
                const { x, y } = getCoordinates(i, ratio);
                const isHovered = hoveredIndex === i;

                return (
                  <g
                    key={`point-${i}`}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#0F172A"
                      strokeWidth={isHovered ? 2.5 : 2}
                      style={{ transition: 'r 0.15s ease' }}
                    />

                    {/* Hover Edildi─şinde Skor Rozeti */}
                    {isHovered && (
                      <g>
                        <rect
                          x={x - 22}
                          y={y - 24}
                          width="44"
                          height="18"
                          rx="4"
                          fill="#0F172A"
                        />
                        <text
                          x={x}
                          y={y - 12}
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          %{d.score}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* 5. K├Â┼şe ─░sim Etiketleri */}
          {currentDataset.map((d, i) => {
            const { x, y } = getCoordinates(i, 1.25);
            let textAnchor: 'start' | 'end' | 'middle' = 'middle';
            let dy = 4;

            if (i === 0) {
              // ├£st
              dy = -6;
              textAnchor = 'middle';
            } else if (i === 3) {
              // Alt
              dy = 14;
              textAnchor = 'middle';
            } else if (x > cx) {
              // Sa─ş
              textAnchor = 'start';
              dy = 4;
            } else {
              // Sol
              textAnchor = 'end';
              dy = 4;
            }

            const isHovered = hoveredIndex === i;

            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                dy={dy}
                textAnchor={textAnchor}
                fill={isHovered ? '#0F172A' : '#334155'}
                fontSize={isHovered ? '12.5' : '11.5'}
                fontWeight={isHovered ? '700' : '600'}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    border: '1px solid #E5E7EB',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    margin: '24px 0',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  badgeWrapper: {
    display: 'inline-block',
    backgroundColor: '#EDF2F7',
    padding: '5px 12px',
    borderRadius: '9999px',
    marginBottom: '14px',
  },
  badgeText: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#334155',
  },
  headingTitle: {
    fontFamily: "'Playfair Display', 'Merriweather', Georgia, serif",
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 10px 0',
    lineHeight: 1.25,
  },
  descriptionText: {
    fontSize: '14px',
    color: '#64748B',
    lineHeight: 1.6,
    margin: '0 0 22px 0',
  },
  tabsContainer: {
    display: 'inline-flex',
    backgroundColor: '#F1F5F9',
    padding: '4px',
    borderRadius: '12px',
    gap: '4px',
    marginBottom: '20px',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    border: '1.5px solid #0F172A',
    borderRadius: '8px',
    color: '#0F172A',
    fontWeight: 700,
    fontSize: '13px',
    padding: '7px 22px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    outline: 'none',
  },
  tabBtnInactive: {
    backgroundColor: 'transparent',
    border: '1.5px solid transparent',
    borderRadius: '8px',
    color: '#64748B',
    fontWeight: 600,
    fontSize: '13px',
    padding: '7px 22px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'color 0.15s ease',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '16px 20px',
    width: '100%',
    boxSizing: 'border-box',
  },
  summaryHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  summaryTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: '#0F172A',
  },
  summaryBodyText: {
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.55,
    margin: 0,
  },
  toggleRow: {
    marginTop: '12px',
  },
  toggleStateBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
  rightCol: {
    backgroundColor: '#FAFAFC',
    border: '1px solid #F1F5F9',
    borderRadius: '20px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '360px',
    boxSizing: 'border-box',
  },
  radarSvg: {
    width: '100%',
    maxWidth: '380px',
    height: 'auto',
    overflow: 'visible',
  },
};

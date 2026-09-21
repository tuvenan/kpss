import React, { useState } from 'react';
import { Calendar, ExternalLink, Plus, Clock, CheckCircle } from 'lucide-react';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// Haftanın başlangıcını hesapla (Pazartesi)
function getWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Pazar
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Mock çalışma verileri (gün → saat)
const studyHours: Record<string, number> = {
  Mon: 2.5,
  Tue: 1.5,
  Wed: 3,
  Thu: 0,
  Fri: 2,
  Sat: 4,
  Sun: 1,
};

const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const upcomingEvents = [
  { id: 1, title: 'Türkçe — Sözcükte Anlam', date: 'Yarın 09:00', duration: '1.5 saat', done: false, color: '#2563EB' },
  { id: 2, title: 'Tarih — İslamiyet Öncesi', date: 'Çarşamba 10:00', duration: '2 saat', done: false, color: '#7C3AED' },
  { id: 3, title: 'Matematik — Problemler', date: 'Perşembe 14:00', duration: '1 saat', done: false, color: '#059669' },
];

function buildGCalUrl(title: string, durationHours = 1.5) {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + durationHours * 60);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent('KPSS hazırlık çalışması')}&location=KPSS+Çalışma+Odası`;
}

export const StudyCalendarCard: React.FC = () => {
  const weekDays = getWeekDays();
  const today = new Date();
  const [connected, setConnected] = useState(false);

  const maxHours = Math.max(...Object.values(studyHours), 1);

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #EFEFF2',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    }}>
      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} color="#4F46E5" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111' }}>Çalışma Takvimi</h2>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Bu haftaki çalışma planın</p>
          </div>
        </div>

        {/* Google Takvim Bağlantısı */}
        {connected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: '13px', fontWeight: 600 }}>
            <CheckCircle size={15} color="#16A34A" />
            Google Takvim Bağlı
          </div>
        ) : (
          <button
            onClick={() => {
              window.open('https://calendar.google.com', '_blank');
              setConnected(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '10px',
              border: '1px solid #E5E7EB', backgroundColor: '#fff',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
              transition: 'all 0.15s',
            }}
          >
            <img
              src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_32dp.png"
              alt="Google Calendar"
              style={{ width: '16px', height: '16px' }}
            />
            Google Takvim'e Bağlan
            <ExternalLink size={13} color="#9CA3AF" />
          </button>
        )}
      </div>

      {/* Haftalık Çalışma Bar Chart */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', fontWeight: 500 }}>Bu Haftaki Çalışma Saatleri</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px' }}>
          {weekDays.map((day, i) => {
            const key = dayKeys[i];
            const hours = studyHours[key] || 0;
            const isToday = day.toDateString() === today.toDateString();
            const barHeight = hours === 0 ? 4 : Math.max(8, (hours / maxHours) * 70);

            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                {hours > 0 && (
                  <span style={{ fontSize: '10px', color: '#666', fontWeight: 600 }}>{hours}s</span>
                )}
                <div style={{
                  width: '100%', height: `${barHeight}px`,
                  borderRadius: '6px',
                  backgroundColor: isToday
                    ? '#4F46E5'
                    : hours === 0
                    ? '#F3F4F6'
                    : '#C7D2FE',
                  transition: 'height 0.3s ease',
                }} />
                <div style={{
                  fontSize: '11px',
                  color: isToday ? '#4F46E5' : '#888',
                  fontWeight: isToday ? 700 : 400,
                }}>
                  {DAYS[i]}
                </div>
                <div style={{ fontSize: '10px', color: '#aaa' }}>{day.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#888' }}>
          <span>Toplam: <b style={{ color: '#111' }}>14 saat</b></span>
          <span>Hedef: <b style={{ color: '#4F46E5' }}>20 saat/hafta</b></span>
        </div>
      </div>

      {/* Yaklaşan Çalışma Etkinlikleri */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Yaklaşan Çalışma Seansları</span>
          <button
            onClick={() => window.open(buildGCalUrl('KPSS Çalışma Seansı'), '_blank')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '8px',
              border: '1px dashed #C7D2FE', backgroundColor: '#EEF2FF',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#4F46E5',
            }}
          >
            <Plus size={13} color="#4F46E5" />
            Seans Ekle
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#F9F9FB',
                borderRadius: '10px',
                border: '1px solid #EFEFF2',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={{ width: '4px', height: '36px', borderRadius: '4px', backgroundColor: event.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>{event.date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#888' }}>
                      <Clock size={10} color="#9CA3AF" />
                      {event.duration}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.open(buildGCalUrl(event.title), '_blank')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '5px 10px', borderRadius: '7px',
                  border: '1px solid #E5E7EB', backgroundColor: '#fff',
                  cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#374151',
                  flexShrink: 0,
                }}
              >
                <ExternalLink size={11} color="#9CA3AF" />
                Ekle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

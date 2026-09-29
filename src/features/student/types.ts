import { MockExamType } from '../../services/mockExamService';

export type StudentTabType = 'home' | 'subjects' | 'errors' | 'classes' | 'profile' | 'settings';

export type StudentViewState = 'subjects' | 'units' | 'topics' | 'unit-detail' | 'quiz' | 'feedback';

export interface StudentNotificationItem {
  id: string;
  icon: string;
  title: string;
  sub: string;
  time: string;
  unread: boolean;
  actionType: 'calendar' | 'radar' | 'errors' | 'deneme';
  badgeText?: string;
}

export interface SubjectCardItem {
  id: string;
  title: string;
  unitCount: number;
  percentage: number;
  icon: string;
}

export const INITIAL_STUDENT_NOTIFICATIONS: StudentNotificationItem[] = [
  {
    id: 'notif-1',
    icon: '🎯',
    title: 'Günlük hedefin tamamlandı!',
    sub: 'Bugün 60 soru çözdün. Çalışma takvimini ve hedeflerini gör.',
    time: '5 dk önce',
    unread: true,
    actionType: 'calendar',
    badgeText: 'Takvim & Hedef',
  },
  {
    id: 'notif-2',
    icon: '🔥',
    title: '7 günlük seri devam ediyor',
    sub: 'Düzenli soru çözme serini korumak için bugün de soru çöz.',
    time: '1 saat önce',
    unread: true,
    actionType: 'calendar',
    badgeText: 'Seri',
  },
  {
    id: 'notif-3',
    icon: '📊',
    title: 'Yeterlilik raporun hazır',
    sub: 'Ders ve konu bazlı akademik yeterlilik radarını incele.',
    time: '2 saat önce',
    unread: true,
    actionType: 'radar',
    badgeText: 'Radar',
  },
  {
    id: 'notif-4',
    icon: '⏱️',
    title: '20 Soruluk Deneme Sınavı',
    sub: 'Rastgele konulardan 20 soruyla canlı süreli sınav simülasyonu başlat.',
    time: 'Bugün',
    unread: true,
    actionType: 'deneme',
    badgeText: 'Deneme',
  },
  {
    id: 'notif-5',
    icon: '⚠️',
    title: 'Hata Havuzu & Yanlışlarım',
    sub: 'Yanlış yaptığın soruları tekrar çözerek kalıcı öğrenme sağla.',
    time: 'Dün',
    unread: false,
    actionType: 'errors',
    badgeText: 'Yanlışlarım',
  },
];

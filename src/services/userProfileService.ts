// Rozet altyapısı — ileride aktif edilecek
export interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  earnedAt: string | null; // null = henüz kazanılmadı
  condition: string;       // backend'e bağlanacak koşul açıklaması
}

export const ALL_BADGES: Badge[] = [
  { id: 'first-quiz',   label: 'İlk Adım',      emoji: '🚀', description: 'İlk testini tamamla',           earnedAt: '2026-09-01', condition: 'quizCount >= 1' },
  { id: 'streak-7',     label: '7 Günlük Seri',  emoji: '🔥', description: '7 gün üst üste çalış',         earnedAt: '2026-09-10', condition: 'streak >= 7' },
  { id: 'hundred',      label: 'Yüzler Kulübü',  emoji: '💯', description: '100 soru çöz',                  earnedAt: null,         condition: 'totalSolved >= 100' },
  { id: 'perfect',      label: 'Mükemmel',        emoji: '⭐', description: 'Bir testte %100 al',            earnedAt: null,         condition: 'hasPerfectScore' },
  { id: 'night-owl',    label: 'Gece Kuşu',       emoji: '🦉', description: 'Gece 23:00 sonrası çalış',     earnedAt: null,         condition: 'studiedAfterMidnight' },
  { id: 'speed-reader', label: 'Hız Okuyucu',     emoji: '⚡', description: '10 soruyu 5 dk\'da bitir',     earnedAt: null,         condition: 'fastQuiz' },
  { id: 'champion',     label: 'Şampiyon',        emoji: '🏆', description: 'Tüm konularda %80 üzeri al',   earnedAt: null,         condition: 'allTopicsAbove80' },
  { id: 'consistent',   label: 'Tutarlı',         emoji: '📅', description: '30 gün üst üste çalış',        earnedAt: null,         condition: 'streak >= 30' },
];

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  username: string;
  bio: string;
  examType: string;
  targetScore: number;
  dailyGoal: number;
  branch: string;
  autoShowExplanation: boolean;
  showTimer: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  avatarIcon: string;
  photoUrl: string;        // base64 ya da URL — boşsa avatarIcon kullanılır
  earnedBadgeIds: string[]; // kazanılan rozet id'leri
}

const PROFILE_KEY = 'kpss_user_profile_data_v1';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Ali Kaya',
  email: 'ali.kpss2026@gmail.com',
  phone: '+90 (555) 123 45 67',
  username: 'alikaya',
  bio: '2026 KPSS Lisans sınavında Genel Yetenek ve Genel Kültür alanında derece hedefliyorum.',
  examType: 'KPSS Lisans (GY-GK)',
  targetScore: 88,
  dailyGoal: 60,
  branch: 'Memurluk (B Grubu)',
  autoShowExplanation: true,
  showTimer: true,
  dailyReminder: true,
  reminderTime: '20:30',
  avatarIcon: 'user-1',
  photoUrl: '',
  earnedBadgeIds: ['first-quiz', 'streak-7'],
};

export const userProfileService = {
  getProfile(): UserProfile {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('getProfile error:', e);
    }
    return DEFAULT_PROFILE;
  },

  saveProfile(profile: UserProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new Event('kpss_profile_updated'));
    } catch (e) {
      console.warn('saveProfile error:', e);
    }
  },

  /** Fotoğrafı base64 olarak profile kaydeder */
  savePhoto(base64: string): void {
    const profile = userProfileService.getProfile();
    userProfileService.saveProfile({ ...profile, photoUrl: base64 });
  },

  /** Fotoğrafı kaldır, emoji avatar'a dön */
  removePhoto(): void {
    const profile = userProfileService.getProfile();
    userProfileService.saveProfile({ ...profile, photoUrl: '' });
  },

  /** Rozet ekle (ileride backend/logic tarafından çağrılacak) */
  awardBadge(badgeId: string): void {
    const profile = userProfileService.getProfile();
    if (!profile.earnedBadgeIds.includes(badgeId)) {
      userProfileService.saveProfile({
        ...profile,
        earnedBadgeIds: [...profile.earnedBadgeIds, badgeId],
      });
    }
  },

  /** Rozet durumunu tersine çevir (toggle) */
  toggleBadge(badgeId: string): void {
    const profile = userProfileService.getProfile();
    const hasBadge = profile.earnedBadgeIds.includes(badgeId);
    const updatedBadges = hasBadge
      ? profile.earnedBadgeIds.filter((id) => id !== badgeId)
      : [...profile.earnedBadgeIds, badgeId];
    userProfileService.saveProfile({ ...profile, earnedBadgeIds: updatedBadges });
  },

  /** Tüm kayıtlı öğrenci profillerini getirir */
  getAllProfiles(): UserProfile[] {
    if (typeof window === 'undefined') return [DEFAULT_PROFILE];
    try {
      const raw = localStorage.getItem('kpss_all_profiles_list_v1');
      if (raw) {
        const list: UserProfile[] = JSON.parse(raw);
        if (list.length > 0) return list;
      }
    } catch {}
    const current = userProfileService.getProfile();
    return [current];
  },

  /** Yeni bir profil oluşturup kaydeder */
  createProfile(newProfile: UserProfile): void {
    if (typeof window === 'undefined') return;
    const list = userProfileService.getAllProfiles();
    const idx = list.findIndex((p) => p.username === newProfile.username);
    if (idx >= 0) {
      list[idx] = newProfile;
    } else {
      list.push(newProfile);
    }
    localStorage.setItem('kpss_all_profiles_list_v1', JSON.stringify(list));
    userProfileService.saveProfile(newProfile);
  },

  /** Profiller arasında geçiş yapar */
  switchProfile(username: string): void {
    const list = userProfileService.getAllProfiles();
    const target = list.find((p) => p.username === username);
    if (target) {
      userProfileService.saveProfile(target);
    }
  },

  /** Bir profili siler */
  deleteProfile(username: string): void {
    const list = userProfileService.getAllProfiles().filter((p) => p.username !== username);
    localStorage.setItem('kpss_all_profiles_list_v1', JSON.stringify(list));
    if (list.length > 0) {
      userProfileService.saveProfile(list[0]);
    } else {
      userProfileService.saveProfile(DEFAULT_PROFILE);
    }
  },

  resetProgressData(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('kpss_real_student_progress_v1');
      localStorage.removeItem('kpss_weekly_activity');
      window.dispatchEvent(new Event('kpss_profile_updated'));
    } catch (e) {
      console.warn('resetProgressData error:', e);
    }
  },

  /** Test simülasyon verisi yükle (örnek ilerleme) */
  injectSimulationProgress(sampleType: 'light' | 'moderate' | 'intensive'): void {
    if (typeof window === 'undefined') return;
    const progress: Record<string, { solved: number; correct: number; wrong: number }> = {};
    const multiplier = sampleType === 'light' ? 1 : sampleType === 'moderate' ? 2.5 : 5;

    const baseTopics = [
      { key: 'tr-gercek-mecaz', solved: 20, correct: 18, wrong: 2 },
      { key: 'tr-soz-obekleri', solved: 20, correct: 16, wrong: 4 },
      { key: 'tar-orta-asya', solved: 20, correct: 15, wrong: 5 },
      { key: 'tar-ilk-devletler', solved: 20, correct: 17, wrong: 3 },
      { key: 'mat-temel-kavramlar', solved: 20, correct: 14, wrong: 6 },
      { key: 'mat-sayi-kesir', solved: 20, correct: 12, wrong: 8 },
      { key: 'cog-fiziki-yapi', solved: 20, correct: 19, wrong: 1 },
      { key: 'vat-temel-hukuk', solved: 20, correct: 16, wrong: 4 },
    ];

    baseTopics.forEach((t) => {
      progress[t.key] = {
        solved: Math.round(t.solved * multiplier),
        correct: Math.round(t.correct * multiplier),
        wrong: Math.round(t.wrong * multiplier),
      };
    });

    localStorage.setItem('kpss_real_student_progress_v1', JSON.stringify(progress));
    window.dispatchEvent(new Event('kpss_profile_updated'));
  },
};

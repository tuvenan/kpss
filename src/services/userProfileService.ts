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
}

const PROFILE_KEY = 'kpss_user_profile_data_v1';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Ali Kaya',
  email: 'ali.kpss2026@gmail.com',
  phone: '+90 (555) 123 45 67',
  username: 'alikaya',
  bio: '2026 KPSS Lisans s─▒nav─▒nda Genel Yetenek ve Genel K├╝lt├╝r alan─▒nda derece hedefliyorum.',
  examType: 'KPSS Lisans (GY-GK)',
  targetScore: 88,
  dailyGoal: 60,
  branch: 'Memurluk (B Grubu)',
  autoShowExplanation: true,
  showTimer: true,
  dailyReminder: true,
  reminderTime: '20:30',
  avatarIcon: 'user-1',
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
      // ├ûzel event tetikle, sayfalar an─▒nda g├╝ncellensin
      window.dispatchEvent(new Event('kpss_profile_updated'));
    } catch (e) {
      console.warn('saveProfile error:', e);
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
};

export interface TopicRecord {
  id: string;
  topicTitle: string;
  subjectTitle: string;
  unitTitle?: string;
  solvedCount: number;
  correctCount: number;
  wrongCount: number;
  percentage: number;
}

const STORAGE_KEY = 'kpss_real_student_progress_v1';

// Referans g├Ârseldeki ve standart KPSS m├╝fredat─▒ndaki ana konu listesi
export const INITIAL_KPSS_TOPICS: { id: string; topicTitle: string; subjectTitle: string; unitTitle?: string }[] = [
  // T├╝rk├ğe (G├Ârseldeki tam liste)
  { id: 'tr-gercek-mecaz', topicTitle: 'Ger├ğek ve Mecaz Anlam', subjectTitle: 'T├╝rk├ğe', unitTitle: 'S├Âzc├╝kte Anlam' },
  { id: 'tr-terim-es-anlam', topicTitle: 'Terim ve E┼ş Anlaml─▒ S├Âzc├╝kler', subjectTitle: 'T├╝rk├ğe', unitTitle: 'S├Âzc├╝kte Anlam' },
  { id: 'tr-soz-obekleri', topicTitle: 'S├Âz ├ûbeklerinde Anlam', subjectTitle: 'T├╝rk├ğe', unitTitle: 'S├Âzc├╝kte Anlam' },
  { id: 'tr-oznel-nesnel', topicTitle: '├ûznel ve Nesnel Anlat─▒m', subjectTitle: 'T├╝rk├ğe', unitTitle: 'C├╝mlede Anlam' },
  { id: 'tr-neden-sonuc', topicTitle: 'Neden-Sonu├ğ, Ama├ğ-Sonu├ğ', subjectTitle: 'T├╝rk├ğe', unitTitle: 'C├╝mlede Anlam' },
  { id: 'tr-ortulu-anlam', topicTitle: '├ûrt├╝l├╝ Anlam', subjectTitle: 'T├╝rk├ğe', unitTitle: 'C├╝mlede Anlam' },
  { id: 'tr-paragraf-ana-fikir', topicTitle: 'Paragraf─▒n Ana Fikri', subjectTitle: 'T├╝rk├ğe', unitTitle: 'Paragraf Bilgisi' },
  { id: 'tr-yardimci-dusunce', topicTitle: 'Yard─▒mc─▒ D├╝┼ş├╝nceler', subjectTitle: 'T├╝rk├ğe', unitTitle: 'Paragraf Bilgisi' },
  { id: 'tr-anlatim-teknikleri', topicTitle: 'Anlat─▒m Teknikleri', subjectTitle: 'T├╝rk├ğe', unitTitle: 'Paragraf Bilgisi' },
  { id: 'tr-buyuk-harfler', topicTitle: 'B├╝y├╝k Harflerin Kullan─▒m─▒', subjectTitle: 'T├╝rk├ğe', unitTitle: 'Yaz─▒m Kurallar─▒' },

  // Tarih
  { id: 'tar-orta-asya', topicTitle: 'Orta Asya K├╝lt├╝r Merkezleri', subjectTitle: 'Tarih', unitTitle: '─░slamiyet ├ûncesi' },
  { id: 'tar-ilk-devletler', topicTitle: '─░lk T├╝rk Devletleri (Hun, G├Âkt├╝rk, Uygur)', subjectTitle: 'Tarih', unitTitle: '─░slamiyet ├ûncesi' },
  { id: 'tar-buyuk-selcuklu', topicTitle: 'B├╝y├╝k Sel├ğuklu Devleti', subjectTitle: 'Tarih', unitTitle: 'T├╝rk-─░slam Devletleri' },
  { id: 'tar-osmanli-kurulus', topicTitle: 'Osmanl─▒ Devleti Kurulu┼ş ve Y├╝kselme', subjectTitle: 'Tarih', unitTitle: 'Osmanl─▒ Tarihi' },
  { id: 'tar-kurtulus-savasi', topicTitle: 'Kurtulu┼ş Sava┼ş─▒ ve Kongreler', subjectTitle: 'Tarih', unitTitle: 'Cumhuriyet Tarihi' },

  // Matematik
  { id: 'mat-temel-kavramlar', topicTitle: 'Temel Kavramlar ve Say─▒ K├╝meleri', subjectTitle: 'Matematik', unitTitle: 'Say─▒lar' },
  { id: 'mat-bolunebilme', topicTitle: 'B├Âl├╝nebilme Kurallar─▒ ve EBOB-EKOK', subjectTitle: 'Matematik', unitTitle: 'Say─▒lar' },
  { id: 'mat-sayi-kesir', topicTitle: 'Say─▒ ve Kesir Problemleri', subjectTitle: 'Matematik', unitTitle: 'Problemler' },
  { id: 'mat-yas-hareket', topicTitle: 'Ya┼ş ve Hareket Problemleri', subjectTitle: 'Matematik', unitTitle: 'Problemler' },

  // Co─şrafya
  { id: 'cog-fiziki-yapi', topicTitle: "T├╝rkiye'nin Yer ┼Şekilleri ve Da─şlar─▒", subjectTitle: 'Co─şrafya', unitTitle: 'Fiziki Co─şrafya' },
  { id: 'cog-iklim-bitki', topicTitle: "T├╝rkiye'de ─░klim ve Bitki ├ûrt├╝s├╝", subjectTitle: 'Co─şrafya', unitTitle: 'Fiziki Co─şrafya' },
  { id: 'cog-nufus-yerlesme', topicTitle: "T├╝rkiye'de N├╝fus ve Yerle┼şme", subjectTitle: 'Co─şrafya', unitTitle: 'Be┼şeri Co─şrafya' },

  // Vatanda┼şl─▒k
  { id: 'vat-temel-hukuk', topicTitle: 'Temel Hukuk Kavramlar─▒', subjectTitle: 'Vatanda┼şl─▒k', unitTitle: 'Temel Hukuk' },
  { id: 'vat-1982-anayasa', topicTitle: '1982 Anayasas─▒ ve Temel Esaslar', subjectTitle: 'Vatanda┼şl─▒k', unitTitle: 'Anayasa Hukuku' },
];

export const studentProgressService = {
  /**
   * Yerel depodan mevcut konu ilerlemelerini ├ğeker.
   */
  getStoredProgress(): Record<string, { solved: number; correct: number; wrong: number }> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  /**
   * ├û─şrencinin bir soruya verdi─şi cevab─▒ ger├ğek zamanl─▒ olarak kaydeder.
   */
  recordAnswer(topicIdOrTitle: string, isCorrect: boolean) {
    if (typeof window === 'undefined') return;
    try {
      const progress = this.getStoredProgress();
      const key = topicIdOrTitle.toLowerCase().trim();

      if (!progress[key]) {
        progress[key] = { solved: 0, correct: 0, wrong: 0 };
      }

      progress[key].solved += 1;
      if (isCorrect) {
        progress[key].correct += 1;
      } else {
        progress[key].wrong += 1;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

      // Haftal─▒k soru aktivitesini de g├╝ncelle
      this.recordWeeklyActivity(1);
    } catch (e) {
      console.warn('recordAnswer error:', e);
    }
  },

  /**
   * T├╝m konular i├ğin detayl─▒ analiz verilerini d├Âner.
   */
  getTopicAnalysisList(filterSubject?: string): TopicRecord[] {
    const progress = this.getStoredProgress();

    let list = INITIAL_KPSS_TOPICS;
    if (filterSubject && filterSubject !== 'T├╝m├╝') {
      list = list.filter((item) => item.subjectTitle.toLowerCase() === filterSubject.toLowerCase());
    }

    return list.map((item) => {
      // Hem ID hem ba┼şl─▒k e┼şle┼şmesini kontrol et
      const match =
        progress[item.id.toLowerCase()] ||
        progress[item.topicTitle.toLowerCase()] ||
        Object.entries(progress).find(([k]) => item.topicTitle.toLowerCase().includes(k) || k.includes(item.id.toLowerCase()))?.[1] ||
        { solved: 0, correct: 0, wrong: 0 };

      const solvedCount = match.solved || 0;
      const correctCount = match.correct || 0;
      const wrongCount = match.wrong || 0;
      const percentage = solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;

      return {
        id: item.id,
        topicTitle: item.topicTitle,
        subjectTitle: item.subjectTitle,
        unitTitle: item.unitTitle,
        solvedCount,
        correctCount,
        wrongCount,
        percentage,
      };
    });
  },

  /**
   * Haftal─▒k g├╝n bazl─▒ soru ├ğ├Âz├╝m say─▒s─▒
   */
  getWeeklyActivity(): { day: string; count: number }[] {
    const defaultWeekly = [
      { day: 'Pzt', count: 44 },
      { day: 'Sal', count: 52 },
      { day: '├çar', count: 34 },
      { day: 'Per', count: 70 },
      { day: 'Cum', count: 46 },
      { day: 'Cmt', count: 74 },
      { day: 'Paz', count: 20 },
    ];

    if (typeof window === 'undefined') return defaultWeekly;

    try {
      const raw = localStorage.getItem('kpss_weekly_activity');
      if (raw) return JSON.parse(raw);
    } catch {}

    return defaultWeekly;
  },

  recordWeeklyActivity(increment: number = 1) {
    if (typeof window === 'undefined') return;
    try {
      const weekly = this.getWeeklyActivity();
      const dayMap: Record<number, string> = { 1: 'Pzt', 2: 'Sal', 3: '├çar', 4: 'Per', 5: 'Cum', 6: 'Cmt', 0: 'Paz' };
      const currentDay = dayMap[new Date().getDay()] || 'Pzt';

      const found = weekly.find((d) => d.day === currentDay);
      if (found) {
        found.count += increment;
      }
      localStorage.setItem('kpss_weekly_activity', JSON.stringify(weekly));
    } catch {}
  },

  /**
   * Genel toplam istatistikler
   */
  getOverallStats() {
    const progress = this.getStoredProgress();
    let totalSolved = 0;
    let totalCorrect = 0;
    let totalWrong = 0;

    Object.values(progress).forEach((item) => {
      const i = item as { solved: number; correct: number; wrong: number };
      totalSolved += i.solved;
      totalCorrect += i.correct;
      totalWrong += i.wrong;
    });

    if (totalSolved === 0) {
      // Ba┼şlang─▒├ğ varsay─▒lanlar─▒ (Referans g├Ârseldeki 340 soru ve %80 ba┼şar─▒ oran─▒)
      return {
        totalSolved: 340,
        totalCorrect: 272,
        totalWrong: 68,
        percentage: 80,
      };
    }

    const percentage = Math.round((totalCorrect / totalSolved) * 100);
    return {
      totalSolved,
      totalCorrect,
      totalWrong,
      percentage,
    };
  },
};

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

// Referans görseldeki ve standart KPSS müfredatındaki ana konu listesi
export const INITIAL_KPSS_TOPICS: { id: string; topicTitle: string; subjectTitle: string; unitTitle?: string }[] = [
  // Türkçe (Görseldeki tam liste)
  { id: 'tr-gercek-mecaz', topicTitle: 'Gerçek ve Mecaz Anlam', subjectTitle: 'Türkçe', unitTitle: 'Sözcükte Anlam' },
  { id: 'tr-terim-es-anlam', topicTitle: 'Terim ve Eş Anlamlı Sözcükler', subjectTitle: 'Türkçe', unitTitle: 'Sözcükte Anlam' },
  { id: 'tr-soz-obekleri', topicTitle: 'Söz Öbeklerinde Anlam', subjectTitle: 'Türkçe', unitTitle: 'Sözcükte Anlam' },
  { id: 'tr-oznel-nesnel', topicTitle: 'Öznel ve Nesnel Anlatım', subjectTitle: 'Türkçe', unitTitle: 'Cümlede Anlam' },
  { id: 'tr-neden-sonuc', topicTitle: 'Neden-Sonuç, Amaç-Sonuç', subjectTitle: 'Türkçe', unitTitle: 'Cümlede Anlam' },
  { id: 'tr-ortulu-anlam', topicTitle: 'Örtülü Anlam', subjectTitle: 'Türkçe', unitTitle: 'Cümlede Anlam' },
  { id: 'tr-paragraf-ana-fikir', topicTitle: 'Paragrafın Ana Fikri', subjectTitle: 'Türkçe', unitTitle: 'Paragraf Bilgisi' },
  { id: 'tr-yardimci-dusunce', topicTitle: 'Yardımcı Düşünceler', subjectTitle: 'Türkçe', unitTitle: 'Paragraf Bilgisi' },
  { id: 'tr-anlatim-teknikleri', topicTitle: 'Anlatım Teknikleri', subjectTitle: 'Türkçe', unitTitle: 'Paragraf Bilgisi' },
  { id: 'tr-buyuk-harfler', topicTitle: 'Büyük Harflerin Kullanımı', subjectTitle: 'Türkçe', unitTitle: 'Yazım Kuralları' },

  // Tarih
  { id: 'tar-orta-asya', topicTitle: 'Orta Asya Kültür Merkezleri', subjectTitle: 'Tarih', unitTitle: 'İslamiyet Öncesi' },
  { id: 'tar-ilk-devletler', topicTitle: 'İlk Türk Devletleri (Hun, Göktürk, Uygur)', subjectTitle: 'Tarih', unitTitle: 'İslamiyet Öncesi' },
  { id: 'tar-buyuk-selcuklu', topicTitle: 'Büyük Selçuklu Devleti', subjectTitle: 'Tarih', unitTitle: 'Türk-İslam Devletleri' },
  { id: 'tar-osmanli-kurulus', topicTitle: 'Osmanlı Devleti Kuruluş ve Yükselme', subjectTitle: 'Tarih', unitTitle: 'Osmanlı Tarihi' },
  { id: 'tar-kurtulus-savasi', topicTitle: 'Kurtuluş Savaşı ve Kongreler', subjectTitle: 'Tarih', unitTitle: 'Cumhuriyet Tarihi' },

  // Matematik
  { id: 'mat-temel-kavramlar', topicTitle: 'Temel Kavramlar ve Sayı Kümeleri', subjectTitle: 'Matematik', unitTitle: 'Sayılar' },
  { id: 'mat-bolunebilme', topicTitle: 'Bölünebilme Kuralları ve EBOB-EKOK', subjectTitle: 'Matematik', unitTitle: 'Sayılar' },
  { id: 'mat-sayi-kesir', topicTitle: 'Sayı ve Kesir Problemleri', subjectTitle: 'Matematik', unitTitle: 'Problemler' },
  { id: 'mat-yas-hareket', topicTitle: 'Yaş ve Hareket Problemleri', subjectTitle: 'Matematik', unitTitle: 'Problemler' },

  // Coğrafya
  { id: 'cog-fiziki-yapi', topicTitle: "Türkiye'nin Yer Şekilleri ve Dağları", subjectTitle: 'Coğrafya', unitTitle: 'Fiziki Coğrafya' },
  { id: 'cog-iklim-bitki', topicTitle: "Türkiye'de İklim ve Bitki Örtüsü", subjectTitle: 'Coğrafya', unitTitle: 'Fiziki Coğrafya' },
  { id: 'cog-nufus-yerlesme', topicTitle: "Türkiye'de Nüfus ve Yerleşme", subjectTitle: 'Coğrafya', unitTitle: 'Beşeri Coğrafya' },

  // Vatandaşlık
  { id: 'vat-temel-hukuk', topicTitle: 'Temel Hukuk Kavramları', subjectTitle: 'Vatandaşlık', unitTitle: 'Temel Hukuk' },
  { id: 'vat-1982-anayasa', topicTitle: '1982 Anayasası ve Temel Esaslar', subjectTitle: 'Vatandaşlık', unitTitle: 'Anayasa Hukuku' },
];

export const studentProgressService = {
  /**
   * Yerel depodan mevcut konu ilerlemelerini çeker.
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
   * Öğrencinin bir soruya verdiği cevabı gerçek zamanlı olarak kaydeder.
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

      // Haftalık soru aktivitesini de güncelle
      this.recordWeeklyActivity(1);
    } catch (e) {
      console.warn('recordAnswer error:', e);
    }
  },

  /**
   * Tüm konular için detaylı analiz verilerini döner.
   */
  getTopicAnalysisList(filterSubject?: string): TopicRecord[] {
    const progress = this.getStoredProgress();

    let list = INITIAL_KPSS_TOPICS;
    if (filterSubject && filterSubject !== 'Tümü') {
      list = list.filter((item) => item.subjectTitle.toLowerCase() === filterSubject.toLowerCase());
    }

    return list.map((item) => {
      // Hem ID hem başlık eşleşmesini kontrol et
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
   * Haftalık gün bazlı soru çözüm sayısı
   */
  getWeeklyActivity(): { day: string; count: number }[] {
    const defaultWeekly = [
      { day: 'Pzt', count: 44 },
      { day: 'Sal', count: 52 },
      { day: 'Çar', count: 34 },
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
      const dayMap: Record<number, string> = { 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt', 0: 'Paz' };
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
      totalSolved += item.solved;
      totalCorrect += item.correct;
      totalWrong += item.wrong;
    });

    if (totalSolved === 0) {
      // Başlangıç varsayılanları (Referans görseldeki 340 soru ve %80 başarı oranı)
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

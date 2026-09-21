import { supabase, isSupabaseConfigured, getAdminClient } from './supabase';
import { Subject, Unit, Topic, Question, OptionId } from '../types';
import { SAMPLE_20_QUESTIONS } from '../data/samplePackage';

// ==========================================
// YEREL KALICI DEPOLAMA (LOCAL PERSISTENCE)
// ==========================================
const LOCAL_SUBJECTS_KEY = 'kpss_local_custom_subjects';
const LOCAL_UNITS_KEY = 'kpss_local_custom_units';
const LOCAL_TOPICS_KEY = 'kpss_local_custom_topics';
const LOCAL_QUESTIONS_KEY = 'kpss_local_custom_questions';

export const isUuid = (val?: string): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getLocalSubjects = (): Subject[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalSubject = (subject: Subject): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalSubjects();
    const idx = list.findIndex(s => s.id === subject.id || s.title.toLowerCase() === subject.title.toLowerCase());
    if (idx >= 0) {
      list[idx] = subject;
    } else {
      list.push(subject);
    }
    localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('saveLocalSubject error:', e);
  }
};

const removeLocalSubject = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalSubjects().filter(s => s.id !== id);
    localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(list));
  } catch {}
};

const getLocalUnits = (): Unit[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_UNITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalUnit = (unit: Unit): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalUnits();
    const idx = list.findIndex(u => u.id === unit.id);
    if (idx >= 0) {
      list[idx] = unit;
    } else {
      list.push(unit);
    }
    localStorage.setItem(LOCAL_UNITS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('saveLocalUnit error:', e);
  }
};

const removeLocalUnit = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalUnits().filter(u => u.id !== id);
    localStorage.setItem(LOCAL_UNITS_KEY, JSON.stringify(list));
  } catch {}
};

const getLocalTopics = (): Topic[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_TOPICS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalTopic = (topic: Topic): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalTopics();
    const idx = list.findIndex(t => t.id === topic.id);
    if (idx >= 0) {
      list[idx] = topic;
    } else {
      list.push(topic);
    }
    localStorage.setItem(LOCAL_TOPICS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('saveLocalTopic error:', e);
  }
};

const removeLocalTopic = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalTopics().filter(t => t.id !== id);
    localStorage.setItem(LOCAL_TOPICS_KEY, JSON.stringify(list));
  } catch {}
};

const getLocalQuestions = (): Question[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalQuestion = (question: Question): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalQuestions();
    const idx = list.findIndex(q => q.id === question.id);
    if (idx >= 0) {
      list[idx] = question;
    } else {
      list.push(question);
    }
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('saveLocalQuestion error:', e);
  }
};

const removeLocalQuestion = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalQuestions().filter(q => q.id !== id);
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(list));
  } catch {}
};

// Standart başlangıç dersleri (UUID ve standart formatta)
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'turkce', title: 'Türkçe', totalUnits: 12, iconName: 'book-outline' },
  { id: 'matematik', title: 'Matematik', totalUnits: 14, iconName: 'calculator-outline' },
  { id: 'tarih', title: 'Tarih', totalUnits: 16, iconName: 'landmark-outline' },
  { id: 'cografya', title: 'Coğrafya', totalUnits: 10, iconName: 'earth-outline' },
  { id: 'vatandaslik', title: 'Vatandaşlık', totalUnits: 8, iconName: 'shield-outline' },
  { id: 'guncel', title: 'Güncel Bilgiler', totalUnits: 6, iconName: 'newspaper-outline' },
];

export const api = {
  // ==========================================
  // ÖĞRENCİ SERVİSLERİ
  // ==========================================

  async getSubjects(): Promise<Subject[]> {
    let cloudSubjects: Subject[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('subjects').select('*').order('title');
        if (!error && data && data.length > 0) {
          cloudSubjects = data.map((d) => ({
            id: d.id,
            title: d.title,
            iconName: d.icon_name,
            totalUnits: d.total_units || 10,
          }));
        }
      } catch (e) {
        console.warn('getSubjects error:', e);
      }
    }

    // Yerel kayıtlı derslerle birleştir
    const localSubjects = getLocalSubjects();
    const combined = [...cloudSubjects];

    for (const ls of localSubjects) {
      if (!combined.some(c => c.id === ls.id || c.title.toLowerCase() === ls.title.toLowerCase())) {
        combined.push(ls);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    return DEFAULT_SUBJECTS;
  },

  async getUnits(subjectId: string): Promise<Unit[]> {
    let cloudUnits: Unit[] = [];

    // Supabase yalnızca geçerli bir UUID ise sorgulanır (400 Bad Request hatasını önler)
    if (isSupabaseConfigured() && isUuid(subjectId)) {
      try {
        const { data, error } = await supabase
          .from('units')
          .select('*')
          .eq('subject_id', subjectId)
          .order('unit_number', { ascending: true });

        if (!error && data && data.length > 0) {
          cloudUnits = data.map((d) => ({
            id: d.id,
            subjectId: d.subject_id,
            title: d.title,
            unitNumber: d.unit_number,
            isLocked: d.is_locked ?? true,
            isCompleted: d.is_completed ?? false,
          }));
        }
      } catch (e) {
        console.warn('getUnits error:', e);
      }
    }

    // Yerel kayıtlı ünitelerle birleştir
    const localUnits = getLocalUnits().filter(u => u.subjectId === subjectId);
    const combined = [...cloudUnits];

    for (const lu of localUnits) {
      if (!combined.some(c => c.id === lu.id)) {
        combined.push(lu);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    const lowerSub = subjectId.toLowerCase();
    if (lowerSub.includes('tarih') || subjectId === '11111111-1111-4111-8111-111111111111') {
      return [
        { id: '1', subjectId, title: 'İslamiyet Öncesi Türk Tarihi', unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: '2', subjectId, title: 'İlk Türk-İslam Devletleri', unitNumber: 2, topicCount: 3, isLocked: false, isCompleted: false },
        { id: '3', subjectId, title: 'Anadolu Selçukluları', unitNumber: 3, topicCount: 3, isLocked: false, isCompleted: false },
        { id: '4', subjectId, title: 'Osmanlı Tarihi', unitNumber: 4, topicCount: 4, isLocked: false, isCompleted: false },
        { id: '5', subjectId, title: 'Türkiye Cumhuriyeti Tarihi', unitNumber: 5, topicCount: 3, isLocked: false, isCompleted: false },
        { id: '6', subjectId, title: 'Çağdaş Türk ve Dünya Tarihi', unitNumber: 6, topicCount: 3, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('turkce')) {
      return [
        { id: 'turkce-anlam', subjectId, title: 'Anlam Bilgisi', unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'turkce-dilbilgisi', subjectId, title: 'Dil Bilgisi', unitNumber: 2, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'turkce-yazim', subjectId, title: 'Yazım ve Noktalama', unitNumber: 3, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'turkce-mantik', subjectId, title: 'Sözel Mantık', unitNumber: 4, topicCount: 2, isLocked: false, isCompleted: false },
        // Geriye dönük uyumluluk için eski ID'ler
        { id: 'sozcukte-anlam', subjectId, title: 'Sözcükte Anlam', unitNumber: 5, topicCount: 3, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('matematik')) {
      return [
        { id: 'mat-sayilar', subjectId, title: 'Temel Matematik & Sayılar', unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'mat-cebir', subjectId, title: 'Cebirsel İfadeler ve Denklemler', unitNumber: 2, topicCount: 3, isLocked: false, isCompleted: false },
        { id: 'mat-problemler', subjectId, title: 'Problemler', unitNumber: 3, topicCount: 5, isLocked: false, isCompleted: false },
        { id: 'mat-geometri', subjectId, title: 'Geometri & Sayısal Mantık', unitNumber: 4, topicCount: 3, isLocked: false, isCompleted: false },
        // Geriye dönük uyumluluk
        { id: 'temel-kavramlar', subjectId, title: 'Temel Kavramlar', unitNumber: 5, topicCount: 2, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('cografya') || subjectId === '22222222-2222-4222-8222-222222222222') {
      return [
        { id: 'cog-fiziki', subjectId, title: "Türkiye'nin Fiziki Coğrafyası", unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'cog-beseri', subjectId, title: "Türkiye'nin Beşeri Coğrafyası", unitNumber: 2, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'cog-ekonomik', subjectId, title: "Türkiye'nin Ekonomik Coğrafyası", unitNumber: 3, topicCount: 3, isLocked: false, isCompleted: false },
        // Geriye dönük uyumluluk
        { id: 'cografi-konum', subjectId, title: "Türkiye'nin Coğrafi Konumu", unitNumber: 4, topicCount: 2, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('vatandaslik') || subjectId === '33333333-3333-4333-8333-333333333333') {
      return [
        { id: 'vat-temelhukuk', subjectId, title: 'Temel Hukuk Bilgisi', unitNumber: 1, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'vat-anayasa', subjectId, title: 'Anayasa Hukuku & 1982 Anayasası', unitNumber: 2, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'vat-organlar', subjectId, title: 'Yasama, Yürütme, Yargı', unitNumber: 3, topicCount: 3, isLocked: false, isCompleted: false },
        { id: 'vat-idare', subjectId, title: 'İdare Hukuku', unitNumber: 4, topicCount: 2, isLocked: false, isCompleted: false },
        // Geriye dönük uyumluluk
        { id: 'temel-hukuk', subjectId, title: 'Temel Hukuk Kavramları', unitNumber: 5, topicCount: 2, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('guncel')) {
      return [
        { id: 'gun-kuruluslar', subjectId, title: 'Uluslararası Kuruluşlar ve Gelişmeler', unitNumber: 1, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'gun-olaylar', subjectId, title: '2025-2026 Türkiye ve Dünya Gündemi', unitNumber: 2, topicCount: 2, isLocked: false, isCompleted: false },
        // Geriye dönük uyumluluk
        { id: 'guncel-olaylar-1', subjectId, title: '2025 Uluslararası Olaylar ve Ödüller', unitNumber: 3, topicCount: 1, isLocked: false, isCompleted: false },
      ];
    }

    return [
      { id: `${subjectId}-unit-1`, subjectId, title: '1. Ünite', unitNumber: 1, topicCount: 2, isLocked: false, isCompleted: false },
    ];
  },

  async getTopics(unitId: string): Promise<Topic[]> {
    let cloudTopics: Topic[] = [];

    if (isSupabaseConfigured() && isUuid(unitId)) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('unit_id', unitId)
          .order('topic_number', { ascending: true });

        if (!error && data && data.length > 0) {
          cloudTopics = data.map((d) => ({
            id: d.id,
            unitId: d.unit_id,
            title: d.title,
            topicNumber: d.topic_number,
            questionCount: 20,
            isLocked: d.is_locked ?? false,
            isCompleted: d.is_completed ?? false,
          }));
        }
      } catch (e) {
        console.warn('getTopics error:', e);
      }
    }

    const localTopics = getLocalTopics().filter(t => t.unitId === unitId);
    const combined = [...cloudTopics];

    for (const lt of localTopics) {
      if (!combined.some(c => c.id === lt.id)) {
        combined.push(lt);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    // Standart müfredat konu haritası
    const DEFAULT_TOPICS_MAP: Record<string, Topic[]> = {
      // Tarih 01. Ünite (İslamiyet Öncesi Türk Tarihi)
      '1': [
        { id: 'tarih-1-1', unitId: '1', title: 'Orta Asya Kültür Merkezleri ve Türk Göçleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-1-2', unitId: '1', title: 'İlk Türk Devletleri (Hunlar, Göktürkler, Uygurlar)', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-1-3', unitId: '1', title: 'Diğer Türk Devletleri ve Boyları', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-1-4', unitId: '1', title: 'İlk Türk Devletlerinde Kültür ve Medeniyet', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 02. Ünite (İlk Türk-İslam Devletleri)
      '2': [
        { id: 'tarih-2-1', unitId: '2', title: 'Türklerin İslamiyeti Kabulü ve İlk Devletler', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-2-2', unitId: '2', title: 'Büyük Selçuklu Devleti ve Siyasi Tarih', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-2-3', unitId: '2', title: 'İlk Türk-İslam Devletlerinde Kültür ve Medeniyet', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 03. Ünite (Anadolu Selçukluları)
      '3': [
        { id: 'tarih-3-1', unitId: '3', title: '1. ve 2. Dönem Anadolu Türk Beylikleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-3-2', unitId: '3', title: 'Türkiye Selçuklu Devleti', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-3-3', unitId: '3', title: 'Anadolu Selçuklularında Kültür ve Medeniyet', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 04. Ünite (Osmanlı Tarihi)
      '4': [
        { id: 'tarih-4-1', unitId: '4', title: 'Osmanlı Devleti Kuruluş Dönemi (1299-1453)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-4-2', unitId: '4', title: 'Osmanlı Devleti Yükselme Dönemi (1453-1579)', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-4-3', unitId: '4', title: 'Duraklama ve Gerileme Dönemi (17-18. yy)', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-4-4', unitId: '4', title: 'Dağılma Dönemi ve 19. Yüzyıl Islahatları', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 05. Ünite (Türkiye Cumhuriyeti Tarihi)
      '5': [
        { id: 'tarih-5-1', unitId: '5', title: 'Kurtuluş Savaşı Hazırlık Dönemi (Kongreler)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-5-2', unitId: '5', title: 'Kurtuluş Savaşı Muharebeler ve Antlaşmalar', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-5-3', unitId: '5', title: 'Atatürk İlkeleri ve İnkılapları', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 06. Ünite (Çağdaş Türk ve Dünya Tarihi)
      '6': [
        { id: 'tarih-6-1', unitId: '6', title: 'II. Dünya Savaşı ve Sonrası Gelişmeler', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-6-2', unitId: '6', title: 'Soğuk Savaş ve Yumuşama (Detant) Dönemi', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-6-3', unitId: '6', title: 'Küreselleşen Dünya ve Türk Dış Politikası', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Türkçe
      'turkce-anlam': [
        { id: 'turkce-1-1', unitId: 'turkce-anlam', title: 'Sözcükte Anlam ve Anlam İlişkileri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-2', unitId: 'turkce-anlam', title: 'Cümlede Anlam ve Anlatım Özellikleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-3', unitId: 'turkce-anlam', title: 'Paragrafta Ana Düşünce ve Yardımcı Düşünceler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-4', unitId: 'turkce-anlam', title: 'Paragrafta Yapı ve Anlatım Biçimleri', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'sozcukte-anlam': [
        { id: 'turkce-1-1', unitId: 'sozcukte-anlam', title: 'Gerçek, Yan, Mecaz ve Terim Anlam', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-2', unitId: 'sozcukte-anlam', title: 'Eş, Zıt ve Eş Sesli Sözcükler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-3', unitId: 'sozcukte-anlam', title: 'Deyimler, Atasözleri ve İkilemeler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'turkce-dilbilgisi': [
        { id: 'turkce-2-1', unitId: 'turkce-dilbilgisi', title: 'Ses Bilgisi', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-2-2', unitId: 'turkce-dilbilgisi', title: 'Sözcükte Yapı ve Ekler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-2-3', unitId: 'turkce-dilbilgisi', title: 'Sözcük Türleri (İsim, Sıfat, Zamir, Zarf)', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-2-4', unitId: 'turkce-dilbilgisi', title: 'Cümlenin Ögeleri ve Cümle Türleri', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'turkce-yazim': [
        { id: 'turkce-3-1', unitId: 'turkce-yazim', title: 'Yazım Kuralları', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-3-2', unitId: 'turkce-yazim', title: 'Noktalama İşaretleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'turkce-mantik': [
        { id: 'turkce-4-1', unitId: 'turkce-mantik', title: 'Sıralama ve Tablo Yorumlama', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-4-2', unitId: 'turkce-mantik', title: 'Eşleştirme ve Şifreleme Problemleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Matematik
      'mat-sayilar': [
        { id: 'mat-1-1', unitId: 'mat-sayilar', title: 'Sayı Kümeleri ve Temel Kavramlar', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-2', unitId: 'mat-sayilar', title: 'Basamak Kavramı ve Sayı Çözümleme', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-3', unitId: 'mat-sayilar', title: 'Bölme, Bölünebilme ve EBOB-EKOK', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-4', unitId: 'mat-sayilar', title: 'Rasyonel Sayılar ve Ondalık Sayılar', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'temel-kavramlar': [
        { id: 'mat-1-1', unitId: 'temel-kavramlar', title: 'Sayı Kümeleri, Tek-Çift ve Pozitif-Negatif Sayılar', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-2', unitId: 'temel-kavramlar', title: 'Ardışık Sayılar ve Asal Sayılar', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'mat-cebir': [
        { id: 'mat-2-1', unitId: 'mat-cebir', title: 'Çarpanlara Ayırma ve Sadeleştirme', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-2-2', unitId: 'mat-cebir', title: 'Oran - Orantı', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-2-3', unitId: 'mat-cebir', title: 'Birinci Dereceden Denklemler ve Eşitsizlikler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'mat-problemler': [
        { id: 'mat-3-1', unitId: 'mat-problemler', title: 'Sayı ve Kesir Problemleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-2', unitId: 'mat-problemler', title: 'Yaş Problemleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-3', unitId: 'mat-problemler', title: 'Yüzde, Kâr-Zarar ve Faiz Problemleri', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-4', unitId: 'mat-problemler', title: 'Hız ve Hareket Problemleri', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-5', unitId: 'mat-problemler', title: 'İşçi ve Havuz Problemleri', topicNumber: 5, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'mat-geometri': [
        { id: 'mat-4-1', unitId: 'mat-geometri', title: 'Açılar ve Üçgenler', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-4-2', unitId: 'mat-geometri', title: 'Dörtgenler ve Çokgenler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-4-3', unitId: 'mat-geometri', title: 'Sayısal Mantık ve Akıl Yürütme', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Coğrafya
      'cog-fiziki': [
        { id: 'cog-1-1', unitId: 'cog-fiziki', title: 'Türkiye’nin Coğrafi Konumu ve Etkileri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-2', unitId: 'cog-fiziki', title: 'Türkiye’nin Yer Şekilleri (Dağlar, Platolar, Ovalar)', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-3', unitId: 'cog-fiziki', title: 'Türkiye’nin Su Varlığı (Akarsular, Göller, Denizler)', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-4', unitId: 'cog-fiziki', title: 'Türkiye’nin İklimi ve Bitki Örtüsü', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'cografi-konum': [
        { id: 'cog-1-1', unitId: 'cografi-konum', title: 'Matematiksel ve Özel Konumun Sonuçları', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-2', unitId: 'cografi-konum', title: 'Türkiye Saat Dilimi ve Güneş Işınları', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'cog-beseri': [
        { id: 'cog-2-1', unitId: 'cog-beseri', title: 'Türkiye’de Nüfusun Dağılışı ve Özellikleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-2-2', unitId: 'cog-beseri', title: 'Türkiye’de Göçler ve Yerleşme Tipleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'cog-ekonomik': [
        { id: 'cog-3-1', unitId: 'cog-ekonomik', title: 'Tarım ve Hayvancılık', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-3-2', unitId: 'cog-ekonomik', title: 'Madenler ve Enerji Kaynakları', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-3-3', unitId: 'cog-ekonomik', title: 'Sanayi, Ticaret ve Ulaşım', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Vatandaşlık
      'vat-temelhukuk': [
        { id: 'vat-1-1', unitId: 'vat-temelhukuk', title: 'Hukukun Kaynakları ve Hukuk Dalları', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-1-2', unitId: 'vat-temelhukuk', title: 'Hak Kavramı, Ehliyetler ve Hısımlık', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'temel-hukuk': [
        { id: 'vat-1-1', unitId: 'temel-hukuk', title: 'Hukuk Kuralları, Yaptırımlar ve Hukuk Dalları', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-1-2', unitId: 'temel-hukuk', title: 'Hak Kavramı, Ehliyetler ve Hısımlık', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'vat-anayasa': [
        { id: 'vat-2-1', unitId: 'vat-anayasa', title: 'Türk Anayasa Tarihi (1876-1982)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-2-2', unitId: 'vat-anayasa', title: '1982 Anayasası Temel İlkeleri ve Haklar', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'vat-organlar': [
        { id: 'vat-3-1', unitId: 'vat-organlar', title: 'TBMM ve Yasama Yetkisi', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-3-2', unitId: 'vat-organlar', title: 'Cumhurbaşkanı ve Yürütme Organı', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-3-3', unitId: 'vat-organlar', title: 'Yargı Organı ve Yüksek Mahkemeler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'vat-idare': [
        { id: 'vat-4-1', unitId: 'vat-idare', title: 'İdare Hukukunun Temel İlkeleri ve Teşkilat', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-4-2', unitId: 'vat-idare', title: 'Kamu Görevlileri ve İdari İşlemler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Güncel Bilgiler
      'gun-kuruluslar': [
        { id: 'gun-1-1', unitId: 'gun-kuruluslar', title: 'Uluslararası Örgütler (BM, NATO, AB vb.)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'gun-olaylar': [
        { id: 'gun-2-1', unitId: 'gun-olaylar', title: '2025-2026 Türkiye ve Dünya Gündemi, Ödüller', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
      ],
    };

    if (DEFAULT_TOPICS_MAP[unitId]) {
      return DEFAULT_TOPICS_MAP[unitId];
    }

    return [
      { id: `${unitId}-topic-1`, unitId, title: '1. Konu Testi', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
      { id: `${unitId}-topic-2`, unitId, title: '2. Konu Testi', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
    ];
  },

  async getQuestions(id: string): Promise<Question[]> {
    let cloudQuestions: Question[] = [];

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .or(`topic_id.eq.${id},unit_id.eq.${id}`)
          .order('question_number', { ascending: true });

        if (!error && data && data.length > 0) {
          cloudQuestions = data.map((row: any) => ({
            id: row.id,
            topicId: row.topic_id || row.unit_id,
            unitId: row.unit_id,
            questionNumber: row.question_number,
            questionText: row.question_text,
            options: Array.isArray(row.options)
              ? row.options
              : typeof row.options === 'string'
              ? JSON.parse(row.options)
              : [],
            correctOption: row.correct_option as OptionId,
            explanation: row.explanation || '',
          }));
        }
      } catch (e) {
        console.warn('getQuestions error:', e);
      }
    }

    // Yerel sorularla birleştir
    const localQ = getLocalQuestions().filter(q => q.topicId === id || q.unitId === id);
    const combined = [...cloudQuestions];

    for (const lq of localQ) {
      if (!combined.some(c => c.id === lq.id)) {
        combined.push(lq);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    // Her konu için standart 20 soruluk eksiksiz KPSS test paketi üret
    return SAMPLE_20_QUESTIONS.map((q, idx) => ({
      id: `${id}-q-${idx + 1}`,
      topicId: id,
      unitId: id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
    }));
  },

  async recordWrongAnswer(questionId: string, unitId: string, selectedOption: OptionId, correctOption: OptionId): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const now = new Date().toISOString();
      const { data: existing } = await supabase
        .from('error_pool')
        .select('id, wrong_count')
        .eq('user_id', 'web_student_user')
        .eq('question_id', questionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('error_pool')
          .update({
            wrong_count: (existing.wrong_count || 1) + 1,
            selected_option: selectedOption,
            is_resolved: false,
            last_attempt_at: now,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('error_pool').insert({
          user_id: 'web_student_user',
          question_id: questionId,
          unit_id: unitId,
          selected_option: selectedOption,
          correct_option: correctOption,
          wrong_count: 1,
          is_resolved: false,
          last_attempt_at: now,
          created_at: now,
        });
      }
    } catch (e) {
      console.warn('recordWrongAnswer error:', e);
    }
  },

  async markQuestionResolved(questionId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase
        .from('error_pool')
        .update({ is_resolved: true, last_attempt_at: new Date().toISOString() })
        .eq('user_id', 'web_student_user')
        .eq('question_id', questionId);
    } catch (e) {
      console.warn('markQuestionResolved error:', e);
    }
  },

  // ==========================================
  // ADMİN PANELİ SERVİSLERİ (CRUD & BULUT/YEREL HİBRİT)
  // ==========================================

  /**
   * Ders ekler. Supabase'e eklemeyi dener; RLS kuralı engellerse
   * yerel hafızaya kaydederek yöneticinin akışını asla kilitlemez.
   */
  async adminCreateSubject(title: string, id?: string): Promise<{ success: boolean; isLocal?: boolean; error?: string; data?: any }> {
    const newId = (id && isUuid(id)) ? id : generateUuid();
    const newSubject: Subject = {
      id: newId,
      title: title.trim(),
      totalUnits: 0,
    };

    let cloudSaved = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured()) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = {
          title: title.trim(),
          total_units: 0,
        };
        if (id && isUuid(id)) {
          payload.id = id;
        }

        const { data, error } = await client.from('subjects').insert(payload).select();
        if (!error && data && data.length > 0) {
          cloudSaved = true;
          newSubject.id = data[0].id;
          console.log('✅ [Supabase BAŞARILI] Ders buluta kaydedildi:', data[0]);
        } else if (error) {
          cloudError = error.message;
          console.warn('⚠️ [Supabase RLS/Kural Uyarısı] Bulut engelledi, yerel hafızaya aktarılıyor:', error);
        }
      } catch (err: any) {
        cloudError = err?.message;
        console.warn('⚠️ [Supabase İstisna]:', err);
      }
    }

    // Her durumda yerel depolamaya kaydet
    saveLocalSubject(newSubject);

    return {
      success: true,
      isLocal: !cloudSaved,
      error: cloudError,
      data: newSubject,
    };
  },

  async adminDeleteSubject(id: string): Promise<{ success: boolean; error?: string }> {
    removeLocalSubject(id);

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const client = getAdminClient();
        await client.from('subjects').delete().eq('id', id);
      } catch (err: any) {
        console.warn('adminDeleteSubject cloud delete error:', err);
      }
    }

    return { success: true };
  },

  async adminCreateUnit(subjectId: string, title: string, unitNumber: number, id?: string): Promise<{ success: boolean; isLocal?: boolean; error?: string; data?: any }> {
    const newId = (id && isUuid(id)) ? id : generateUuid();
    const newUnit: Unit = {
      id: newId,
      subjectId,
      title: title.trim(),
      unitNumber,
      isLocked: unitNumber !== 1,
      isCompleted: false,
    };

    let cloudSaved = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured()) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = {
          subject_id: subjectId,
          title: title.trim(),
          unit_number: unitNumber,
          is_locked: unitNumber !== 1,
          is_completed: false,
        };
        if (id && isUuid(id)) {
          payload.id = id;
        }

        const { data, error } = await client.from('units').insert(payload).select();
        if (!error && data && data.length > 0) {
          cloudSaved = true;
          newUnit.id = data[0].id;
          console.log('✅ [Supabase BAŞARILI] Ünite buluta kaydedildi:', data[0]);
        } else if (error) {
          cloudError = error.message;
          console.warn('⚠️ [Supabase RLS/Kural Uyarısı] Ünite bulut engeline takıldı, yerel kaydediliyor:', error);
        }
      } catch (err: any) {
        cloudError = err?.message;
      }
    }

    saveLocalUnit(newUnit);

    return {
      success: true,
      isLocal: !cloudSaved,
      error: cloudError,
      data: newUnit,
    };
  },

  async adminDeleteUnit(id: string): Promise<{ success: boolean; error?: string }> {
    removeLocalUnit(id);

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const client = getAdminClient();
        await client.from('units').delete().eq('id', id);
      } catch (err) {
        console.warn('adminDeleteUnit cloud error:', err);
      }
    }

    return { success: true };
  },

  async adminCreateTopic(unitId: string, title: string, topicNumber: number, id?: string): Promise<{ success: boolean; isLocal?: boolean; error?: string; data?: any }> {
    const newId = (id && isUuid(id)) ? id : generateUuid();
    const newTopic: Topic = {
      id: newId,
      unitId,
      title: title.trim(),
      topicNumber,
      questionCount: 20,
      isLocked: false,
      isCompleted: false,
    };

    let cloudSaved = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured()) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = {
          unit_id: unitId,
          title: title.trim(),
          topic_number: topicNumber,
          is_locked: false,
          is_completed: false,
        };
        if (id && isUuid(id)) {
          payload.id = id;
        }

        const { data, error } = await client.from('topics').insert(payload).select();
        if (!error && data && data.length > 0) {
          cloudSaved = true;
          newTopic.id = data[0].id;
        } else if (error) {
          cloudError = error.message;
        }
      } catch (err: any) {
        cloudError = err?.message;
      }
    }

    saveLocalTopic(newTopic);

    return {
      success: true,
      isLocal: !cloudSaved,
      error: cloudError,
      data: newTopic,
    };
  },

  async adminDeleteTopic(id: string): Promise<{ success: boolean; error?: string }> {
    removeLocalTopic(id);

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const client = getAdminClient();
        await client.from('topics').delete().eq('id', id);
      } catch (err) {
        console.warn('adminDeleteTopic cloud error:', err);
      }
    }

    return { success: true };
  },

  async adminCreateQuestion(question: Question): Promise<{ success: boolean; isLocal?: boolean; error?: string; data?: any }> {
    const qWithId: Question = {
      ...question,
      id: (question.id && isUuid(question.id)) ? question.id : generateUuid(),
    };

    let cloudSaved = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured()) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = {
          unit_id: question.unitId,
          question_number: question.questionNumber,
          question_text: question.questionText,
          options: question.options,
          correct_option: question.correctOption,
          explanation: question.explanation,
        };
        if (question.id && isUuid(question.id)) {
          payload.id = question.id;
        }

        const { data, error } = await client.from('questions').insert(payload).select();
        if (!error && data && data.length > 0) {
          cloudSaved = true;
          qWithId.id = data[0].id;
        } else if (error) {
          cloudError = error.message;
        }
      } catch (err: any) {
        cloudError = err?.message;
      }
    }

    saveLocalQuestion(qWithId);

    return {
      success: true,
      isLocal: !cloudSaved,
      error: cloudError,
      data: qWithId,
    };
  },

  async adminUpdateQuestion(question: Question): Promise<{ success: boolean; isLocal?: boolean; error?: string }> {
    saveLocalQuestion(question);
    let cloudError: string | undefined;
    let cloudUpdated = false;

    if (isSupabaseConfigured() && isUuid(question.id)) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = {
          question_text: question.questionText,
          options: question.options,
          correct_option: question.correctOption,
          explanation: question.explanation,
        };
        const { error } = await client.from('questions').update(payload).eq('id', question.id);
        if (!error) {
          cloudUpdated = true;
        } else {
          cloudError = error.message;
        }
      } catch (err: any) {
        cloudError = err?.message;
      }
    }

    return { success: true, isLocal: !cloudUpdated, error: cloudError };
  },

  async adminUpdateTopic(id: string, title: string, topicNumber?: number): Promise<{ success: boolean; isLocal?: boolean; error?: string }> {
    const list = getLocalTopics();
    const existing = list.find(t => t.id === id);
    if (existing) {
      existing.title = title.trim();
      if (topicNumber !== undefined) existing.topicNumber = topicNumber;
      saveLocalTopic(existing);
    }

    let cloudUpdated = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = { title: title.trim() };
        if (topicNumber !== undefined) payload.topic_number = topicNumber;
        const { error } = await client.from('topics').update(payload).eq('id', id);
        if (!error) cloudUpdated = true;
        else cloudError = error.message;
      } catch (err: any) {
        cloudError = err?.message;
      }
    }

    return { success: true, isLocal: !cloudUpdated, error: cloudError };
  },

  async adminUpdateUnit(id: string, title: string, unitNumber?: number): Promise<{ success: boolean; isLocal?: boolean; error?: string }> {
    const list = getLocalUnits();
    const existing = list.find(u => u.id === id);
    if (existing) {
      existing.title = title.trim();
      if (unitNumber !== undefined) existing.unitNumber = unitNumber;
      saveLocalUnit(existing);
    }

    let cloudUpdated = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = { title: title.trim() };
        if (unitNumber !== undefined) payload.unit_number = unitNumber;
        const { error } = await client.from('units').update(payload).eq('id', id);
        if (!error) cloudUpdated = true;
        else cloudError = error.message;
      } catch (err: any) {
        cloudError = err?.message;
      }
    }

    return { success: true, isLocal: !cloudUpdated, error: cloudError };
  },

  async adminUpdateSubject(id: string, title: string, iconName?: string): Promise<{ success: boolean; isLocal?: boolean; error?: string }> {
    const list = getLocalSubjects();
    const existing = list.find(s => s.id === id);
    if (existing) {
      existing.title = title.trim();
      if (iconName) existing.iconName = iconName;
      saveLocalSubject(existing);
    }

    let cloudUpdated = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const client = getAdminClient();
        const payload: Record<string, any> = { title: title.trim() };
        if (iconName) payload.icon_name = iconName;
        const { error } = await client.from('subjects').update(payload).eq('id', id);
        if (!error) cloudUpdated = true;
        else cloudError = error.message;
      } catch (err: any) {
        cloudError = err?.message;
      }
    }

    return { success: true, isLocal: !cloudUpdated, error: cloudError };
  },

  async adminDeleteQuestion(id: string): Promise<{ success: boolean; error?: string }> {
    removeLocalQuestion(id);

    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const client = getAdminClient();
        await client.from('questions').delete().eq('id', id);
      } catch (err) {
        console.warn('adminDeleteQuestion cloud error:', err);
      }
    }

    return { success: true };
  },

  /**
   * 20 Soruluk Soru Paketini Üniteye Toplu Olarak Yükler.
   */
  /**
   * 20 Soruluk Soru Paketini Konu veya Üniteye Toplu Olarak Yükler.
   */
  async adminUpload20QuestionPackage(targetId: string, questions: Question[], isTopic = true): Promise<{ success: boolean; count: number; isLocal?: boolean; error?: string }> {
    let cloudSaved = false;
    let cloudError: string | undefined;

    if (isSupabaseConfigured()) {
      try {
        const client = getAdminClient();
        if (isTopic) {
          await client.from('questions').delete().eq('topic_id', targetId);
        } else {
          await client.from('questions').delete().eq('unit_id', targetId);
        }

        const rows = questions.map((q, idx) => {
          const row: Record<string, any> = {
            topic_id: isTopic ? targetId : (q.topicId || targetId),
            unit_id: !isTopic ? targetId : (q.unitId || targetId),
            question_number: idx + 1,
            question_text: q.questionText,
            options: q.options,
            correct_option: q.correctOption,
            explanation: q.explanation || '',
          };
          if (q.id && isUuid(q.id)) {
            row.id = q.id;
          }
          return row;
        });

        const { error } = await client.from('questions').insert(rows);
        if (!error) {
          cloudSaved = true;
        } else {
          cloudError = error.message;
        }
      } catch (e: any) {
        cloudError = e.message;
      }
    }

    // Yerel depolamaya da kaydet
    for (const q of questions) {
      saveLocalQuestion({
        ...q,
        id: q.id || generateUuid(),
        topicId: isTopic ? targetId : (q.topicId || targetId),
        unitId: !isTopic ? targetId : (q.unitId || targetId),
      });
    }

    return {
      success: true,
      count: questions.length,
      isLocal: !cloudSaved,
      error: cloudError,
    };
  },

  async adminGetErrorPoolStats(): Promise<{ unresolvedCount: number; resolvedCount: number; list: any[] }> {
    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('error_pool')
          .select('*, questions(question_text)')
          .order('wrong_count', { ascending: false });

        if (data) {
          const unresolved = data.filter((d) => !d.is_resolved).length;
          const resolved = data.filter((d) => d.is_resolved).length;
          return { unresolvedCount: unresolved, resolvedCount: resolved, list: data };
        }
      } catch (e) {
        console.warn('adminGetErrorPoolStats error:', e);
      }
    }
    return { unresolvedCount: 0, resolvedCount: 0, list: [] };
  },

  /**
   * Müfredatın taslak halini (Dersler, Üniteler, Alt Konular) tek tıkla canlıya yayınlar ve kaydeder.
   */
  async adminPublishCurriculum(
    subjects: Subject[],
    units: Unit[],
    topics: Topic[]
  ): Promise<{ success: boolean; error?: string }> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(subjects));
        localStorage.setItem(LOCAL_UNITS_KEY, JSON.stringify(units));
        localStorage.setItem(LOCAL_TOPICS_KEY, JSON.stringify(topics));
        window.dispatchEvent(new Event('kpss_curriculum_published'));
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const client = getAdminClient();
        // Supabase bulk upsert can be triggered here if configured
      } catch (err: any) {
        console.warn('adminPublishCurriculum cloud warning:', err);
      }
    }

    return { success: true };
  },
};

export default api;

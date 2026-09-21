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

// Standart ba┼şlang─▒├ğ dersleri (UUID ve standart formatta)
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'turkce', title: 'T├╝rk├ğe', totalUnits: 12, iconName: 'book-outline' },
  { id: 'matematik', title: 'Matematik', totalUnits: 14, iconName: 'calculator-outline' },
  { id: 'tarih', title: 'Tarih', totalUnits: 16, iconName: 'landmark-outline' },
  { id: 'cografya', title: 'Co─şrafya', totalUnits: 10, iconName: 'earth-outline' },
  { id: 'vatandaslik', title: 'Vatanda┼şl─▒k', totalUnits: 8, iconName: 'shield-outline' },
  { id: 'guncel', title: 'G├╝ncel Bilgiler', totalUnits: 6, iconName: 'newspaper-outline' },
];

export const api = {
  // ==========================================
  // ├û─ŞRENC─░ SERV─░SLER─░
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

    // Yerel kay─▒tl─▒ derslerle birle┼ştir
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

    // Supabase yaln─▒zca ge├ğerli bir UUID ise sorgulan─▒r (400 Bad Request hatas─▒n─▒ ├Ânler)
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

    // Yerel kay─▒tl─▒ ├╝nitelerle birle┼ştir
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
        { id: '1', subjectId, title: '─░slamiyet ├ûncesi T├╝rk Tarihi', unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: '2', subjectId, title: '─░lk T├╝rk-─░slam Devletleri', unitNumber: 2, topicCount: 3, isLocked: false, isCompleted: false },
        { id: '3', subjectId, title: 'Anadolu Sel├ğuklular─▒', unitNumber: 3, topicCount: 3, isLocked: false, isCompleted: false },
        { id: '4', subjectId, title: 'Osmanl─▒ Tarihi', unitNumber: 4, topicCount: 4, isLocked: false, isCompleted: false },
        { id: '5', subjectId, title: 'T├╝rkiye Cumhuriyeti Tarihi', unitNumber: 5, topicCount: 3, isLocked: false, isCompleted: false },
        { id: '6', subjectId, title: '├ça─şda┼ş T├╝rk ve D├╝nya Tarihi', unitNumber: 6, topicCount: 3, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('turkce')) {
      return [
        { id: 'turkce-anlam', subjectId, title: 'Anlam Bilgisi', unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'turkce-dilbilgisi', subjectId, title: 'Dil Bilgisi', unitNumber: 2, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'turkce-yazim', subjectId, title: 'Yaz─▒m ve Noktalama', unitNumber: 3, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'turkce-mantik', subjectId, title: 'S├Âzel Mant─▒k', unitNumber: 4, topicCount: 2, isLocked: false, isCompleted: false },
        // Geriye d├Ân├╝k uyumluluk i├ğin eski ID'ler
        { id: 'sozcukte-anlam', subjectId, title: 'S├Âzc├╝kte Anlam', unitNumber: 5, topicCount: 3, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('matematik')) {
      return [
        { id: 'mat-sayilar', subjectId, title: 'Temel Matematik & Say─▒lar', unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'mat-cebir', subjectId, title: 'Cebirsel ─░fadeler ve Denklemler', unitNumber: 2, topicCount: 3, isLocked: false, isCompleted: false },
        { id: 'mat-problemler', subjectId, title: 'Problemler', unitNumber: 3, topicCount: 5, isLocked: false, isCompleted: false },
        { id: 'mat-geometri', subjectId, title: 'Geometri & Say─▒sal Mant─▒k', unitNumber: 4, topicCount: 3, isLocked: false, isCompleted: false },
        // Geriye d├Ân├╝k uyumluluk
        { id: 'temel-kavramlar', subjectId, title: 'Temel Kavramlar', unitNumber: 5, topicCount: 2, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('cografya') || subjectId === '22222222-2222-4222-8222-222222222222') {
      return [
        { id: 'cog-fiziki', subjectId, title: "T├╝rkiye'nin Fiziki Co─şrafyas─▒", unitNumber: 1, topicCount: 4, isLocked: false, isCompleted: false },
        { id: 'cog-beseri', subjectId, title: "T├╝rkiye'nin Be┼şeri Co─şrafyas─▒", unitNumber: 2, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'cog-ekonomik', subjectId, title: "T├╝rkiye'nin Ekonomik Co─şrafyas─▒", unitNumber: 3, topicCount: 3, isLocked: false, isCompleted: false },
        // Geriye d├Ân├╝k uyumluluk
        { id: 'cografi-konum', subjectId, title: "T├╝rkiye'nin Co─şrafi Konumu", unitNumber: 4, topicCount: 2, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('vatandaslik') || subjectId === '33333333-3333-4333-8333-333333333333') {
      return [
        { id: 'vat-temelhukuk', subjectId, title: 'Temel Hukuk Bilgisi', unitNumber: 1, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'vat-anayasa', subjectId, title: 'Anayasa Hukuku & 1982 Anayasas─▒', unitNumber: 2, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'vat-organlar', subjectId, title: 'Yasama, Y├╝r├╝tme, Yarg─▒', unitNumber: 3, topicCount: 3, isLocked: false, isCompleted: false },
        { id: 'vat-idare', subjectId, title: '─░dare Hukuku', unitNumber: 4, topicCount: 2, isLocked: false, isCompleted: false },
        // Geriye d├Ân├╝k uyumluluk
        { id: 'temel-hukuk', subjectId, title: 'Temel Hukuk Kavramlar─▒', unitNumber: 5, topicCount: 2, isLocked: false, isCompleted: false },
      ];
    }

    if (lowerSub.includes('guncel')) {
      return [
        { id: 'gun-kuruluslar', subjectId, title: 'Uluslararas─▒ Kurulu┼şlar ve Geli┼şmeler', unitNumber: 1, topicCount: 2, isLocked: false, isCompleted: false },
        { id: 'gun-olaylar', subjectId, title: '2025-2026 T├╝rkiye ve D├╝nya G├╝ndemi', unitNumber: 2, topicCount: 2, isLocked: false, isCompleted: false },
        // Geriye d├Ân├╝k uyumluluk
        { id: 'guncel-olaylar-1', subjectId, title: '2025 Uluslararas─▒ Olaylar ve ├ûd├╝ller', unitNumber: 3, topicCount: 1, isLocked: false, isCompleted: false },
      ];
    }

    return [
      { id: `${subjectId}-unit-1`, subjectId, title: '1. ├£nite', unitNumber: 1, topicCount: 2, isLocked: false, isCompleted: false },
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

    // Standart m├╝fredat konu haritas─▒
    const DEFAULT_TOPICS_MAP: Record<string, Topic[]> = {
      // Tarih 01. ├£nite (─░slamiyet ├ûncesi T├╝rk Tarihi)
      '1': [
        { id: 'tarih-1-1', unitId: '1', title: 'Orta Asya K├╝lt├╝r Merkezleri ve T├╝rk G├Â├ğleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-1-2', unitId: '1', title: '─░lk T├╝rk Devletleri (Hunlar, G├Âkt├╝rkler, Uygurlar)', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-1-3', unitId: '1', title: 'Di─şer T├╝rk Devletleri ve Boylar─▒', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-1-4', unitId: '1', title: '─░lk T├╝rk Devletlerinde K├╝lt├╝r ve Medeniyet', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 02. ├£nite (─░lk T├╝rk-─░slam Devletleri)
      '2': [
        { id: 'tarih-2-1', unitId: '2', title: 'T├╝rklerin ─░slamiyeti Kabul├╝ ve ─░lk Devletler', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-2-2', unitId: '2', title: 'B├╝y├╝k Sel├ğuklu Devleti ve Siyasi Tarih', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-2-3', unitId: '2', title: '─░lk T├╝rk-─░slam Devletlerinde K├╝lt├╝r ve Medeniyet', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 03. ├£nite (Anadolu Sel├ğuklular─▒)
      '3': [
        { id: 'tarih-3-1', unitId: '3', title: '1. ve 2. D├Ânem Anadolu T├╝rk Beylikleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-3-2', unitId: '3', title: 'T├╝rkiye Sel├ğuklu Devleti', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-3-3', unitId: '3', title: 'Anadolu Sel├ğuklular─▒nda K├╝lt├╝r ve Medeniyet', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 04. ├£nite (Osmanl─▒ Tarihi)
      '4': [
        { id: 'tarih-4-1', unitId: '4', title: 'Osmanl─▒ Devleti Kurulu┼ş D├Ânemi (1299-1453)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-4-2', unitId: '4', title: 'Osmanl─▒ Devleti Y├╝kselme D├Ânemi (1453-1579)', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-4-3', unitId: '4', title: 'Duraklama ve Gerileme D├Ânemi (17-18. yy)', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-4-4', unitId: '4', title: 'Da─ş─▒lma D├Ânemi ve 19. Y├╝zy─▒l Islahatlar─▒', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 05. ├£nite (T├╝rkiye Cumhuriyeti Tarihi)
      '5': [
        { id: 'tarih-5-1', unitId: '5', title: 'Kurtulu┼ş Sava┼ş─▒ Haz─▒rl─▒k D├Ânemi (Kongreler)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-5-2', unitId: '5', title: 'Kurtulu┼ş Sava┼ş─▒ Muharebeler ve Antla┼şmalar', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-5-3', unitId: '5', title: 'Atat├╝rk ─░lkeleri ve ─░nk─▒laplar─▒', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Tarih 06. ├£nite (├ça─şda┼ş T├╝rk ve D├╝nya Tarihi)
      '6': [
        { id: 'tarih-6-1', unitId: '6', title: 'II. D├╝nya Sava┼ş─▒ ve Sonras─▒ Geli┼şmeler', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-6-2', unitId: '6', title: 'So─şuk Sava┼ş ve Yumu┼şama (Detant) D├Ânemi', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'tarih-6-3', unitId: '6', title: 'K├╝reselle┼şen D├╝nya ve T├╝rk D─▒┼ş Politikas─▒', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // T├╝rk├ğe
      'turkce-anlam': [
        { id: 'turkce-1-1', unitId: 'turkce-anlam', title: 'S├Âzc├╝kte Anlam ve Anlam ─░li┼şkileri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-2', unitId: 'turkce-anlam', title: 'C├╝mlede Anlam ve Anlat─▒m ├ûzellikleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-3', unitId: 'turkce-anlam', title: 'Paragrafta Ana D├╝┼ş├╝nce ve Yard─▒mc─▒ D├╝┼ş├╝nceler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-4', unitId: 'turkce-anlam', title: 'Paragrafta Yap─▒ ve Anlat─▒m Bi├ğimleri', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'sozcukte-anlam': [
        { id: 'turkce-1-1', unitId: 'sozcukte-anlam', title: 'Ger├ğek, Yan, Mecaz ve Terim Anlam', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-2', unitId: 'sozcukte-anlam', title: 'E┼ş, Z─▒t ve E┼ş Sesli S├Âzc├╝kler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-1-3', unitId: 'sozcukte-anlam', title: 'Deyimler, Atas├Âzleri ve ─░kilemeler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'turkce-dilbilgisi': [
        { id: 'turkce-2-1', unitId: 'turkce-dilbilgisi', title: 'Ses Bilgisi', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-2-2', unitId: 'turkce-dilbilgisi', title: 'S├Âzc├╝kte Yap─▒ ve Ekler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-2-3', unitId: 'turkce-dilbilgisi', title: 'S├Âzc├╝k T├╝rleri (─░sim, S─▒fat, Zamir, Zarf)', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-2-4', unitId: 'turkce-dilbilgisi', title: 'C├╝mlenin ├ûgeleri ve C├╝mle T├╝rleri', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'turkce-yazim': [
        { id: 'turkce-3-1', unitId: 'turkce-yazim', title: 'Yaz─▒m Kurallar─▒', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-3-2', unitId: 'turkce-yazim', title: 'Noktalama ─░┼şaretleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'turkce-mantik': [
        { id: 'turkce-4-1', unitId: 'turkce-mantik', title: 'S─▒ralama ve Tablo Yorumlama', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'turkce-4-2', unitId: 'turkce-mantik', title: 'E┼şle┼ştirme ve ┼Şifreleme Problemleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Matematik
      'mat-sayilar': [
        { id: 'mat-1-1', unitId: 'mat-sayilar', title: 'Say─▒ K├╝meleri ve Temel Kavramlar', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-2', unitId: 'mat-sayilar', title: 'Basamak Kavram─▒ ve Say─▒ ├ç├Âz├╝mleme', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-3', unitId: 'mat-sayilar', title: 'B├Âlme, B├Âl├╝nebilme ve EBOB-EKOK', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-4', unitId: 'mat-sayilar', title: 'Rasyonel Say─▒lar ve Ondal─▒k Say─▒lar', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'temel-kavramlar': [
        { id: 'mat-1-1', unitId: 'temel-kavramlar', title: 'Say─▒ K├╝meleri, Tek-├çift ve Pozitif-Negatif Say─▒lar', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-1-2', unitId: 'temel-kavramlar', title: 'Ard─▒┼ş─▒k Say─▒lar ve Asal Say─▒lar', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'mat-cebir': [
        { id: 'mat-2-1', unitId: 'mat-cebir', title: '├çarpanlara Ay─▒rma ve Sadele┼ştirme', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-2-2', unitId: 'mat-cebir', title: 'Oran - Orant─▒', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-2-3', unitId: 'mat-cebir', title: 'Birinci Dereceden Denklemler ve E┼şitsizlikler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'mat-problemler': [
        { id: 'mat-3-1', unitId: 'mat-problemler', title: 'Say─▒ ve Kesir Problemleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-2', unitId: 'mat-problemler', title: 'Ya┼ş Problemleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-3', unitId: 'mat-problemler', title: 'Y├╝zde, K├ór-Zarar ve Faiz Problemleri', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-4', unitId: 'mat-problemler', title: 'H─▒z ve Hareket Problemleri', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-3-5', unitId: 'mat-problemler', title: '─░┼ş├ği ve Havuz Problemleri', topicNumber: 5, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'mat-geometri': [
        { id: 'mat-4-1', unitId: 'mat-geometri', title: 'A├ğ─▒lar ve ├£├ğgenler', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-4-2', unitId: 'mat-geometri', title: 'D├Ârtgenler ve ├çokgenler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'mat-4-3', unitId: 'mat-geometri', title: 'Say─▒sal Mant─▒k ve Ak─▒l Y├╝r├╝tme', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Co─şrafya
      'cog-fiziki': [
        { id: 'cog-1-1', unitId: 'cog-fiziki', title: 'T├╝rkiyeÔÇÖnin Co─şrafi Konumu ve Etkileri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-2', unitId: 'cog-fiziki', title: 'T├╝rkiyeÔÇÖnin Yer ┼Şekilleri (Da─şlar, Platolar, Ovalar)', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-3', unitId: 'cog-fiziki', title: 'T├╝rkiyeÔÇÖnin Su Varl─▒─ş─▒ (Akarsular, G├Âller, Denizler)', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-4', unitId: 'cog-fiziki', title: 'T├╝rkiyeÔÇÖnin ─░klimi ve Bitki ├ûrt├╝s├╝', topicNumber: 4, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'cografi-konum': [
        { id: 'cog-1-1', unitId: 'cografi-konum', title: 'Matematiksel ve ├ûzel Konumun Sonu├ğlar─▒', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-1-2', unitId: 'cografi-konum', title: 'T├╝rkiye Saat Dilimi ve G├╝ne┼ş I┼ş─▒nlar─▒', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'cog-beseri': [
        { id: 'cog-2-1', unitId: 'cog-beseri', title: 'T├╝rkiyeÔÇÖde N├╝fusun Da─ş─▒l─▒┼ş─▒ ve ├ûzellikleri', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-2-2', unitId: 'cog-beseri', title: 'T├╝rkiyeÔÇÖde G├Â├ğler ve Yerle┼şme Tipleri', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'cog-ekonomik': [
        { id: 'cog-3-1', unitId: 'cog-ekonomik', title: 'Tar─▒m ve Hayvanc─▒l─▒k', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-3-2', unitId: 'cog-ekonomik', title: 'Madenler ve Enerji Kaynaklar─▒', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'cog-3-3', unitId: 'cog-ekonomik', title: 'Sanayi, Ticaret ve Ula┼ş─▒m', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // Vatanda┼şl─▒k
      'vat-temelhukuk': [
        { id: 'vat-1-1', unitId: 'vat-temelhukuk', title: 'Hukukun Kaynaklar─▒ ve Hukuk Dallar─▒', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-1-2', unitId: 'vat-temelhukuk', title: 'Hak Kavram─▒, Ehliyetler ve H─▒s─▒ml─▒k', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'temel-hukuk': [
        { id: 'vat-1-1', unitId: 'temel-hukuk', title: 'Hukuk Kurallar─▒, Yapt─▒r─▒mlar ve Hukuk Dallar─▒', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-1-2', unitId: 'temel-hukuk', title: 'Hak Kavram─▒, Ehliyetler ve H─▒s─▒ml─▒k', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'vat-anayasa': [
        { id: 'vat-2-1', unitId: 'vat-anayasa', title: 'T├╝rk Anayasa Tarihi (1876-1982)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-2-2', unitId: 'vat-anayasa', title: '1982 Anayasas─▒ Temel ─░lkeleri ve Haklar', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'vat-organlar': [
        { id: 'vat-3-1', unitId: 'vat-organlar', title: 'TBMM ve Yasama Yetkisi', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-3-2', unitId: 'vat-organlar', title: 'Cumhurba┼şkan─▒ ve Y├╝r├╝tme Organ─▒', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-3-3', unitId: 'vat-organlar', title: 'Yarg─▒ Organ─▒ ve Y├╝ksek Mahkemeler', topicNumber: 3, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'vat-idare': [
        { id: 'vat-4-1', unitId: 'vat-idare', title: '─░dare Hukukunun Temel ─░lkeleri ve Te┼şkilat', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
        { id: 'vat-4-2', unitId: 'vat-idare', title: 'Kamu G├Ârevlileri ve ─░dari ─░┼şlemler', topicNumber: 2, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      // G├╝ncel Bilgiler
      'gun-kuruluslar': [
        { id: 'gun-1-1', unitId: 'gun-kuruluslar', title: 'Uluslararas─▒ ├ûrg├╝tler (BM, NATO, AB vb.)', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
      ],
      'gun-olaylar': [
        { id: 'gun-2-1', unitId: 'gun-olaylar', title: '2025-2026 T├╝rkiye ve D├╝nya G├╝ndemi, ├ûd├╝ller', topicNumber: 1, questionCount: 20, isLocked: false, isCompleted: false },
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

    // Yerel sorularla birle┼ştir
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

    // Her konu i├ğin standart 20 soruluk eksiksiz KPSS test paketi ├╝ret
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
  // ADM─░N PANEL─░ SERV─░SLER─░ (CRUD & BULUT/YEREL H─░BR─░T)
  // ==========================================

  /**
   * Ders ekler. Supabase'e eklemeyi dener; RLS kural─▒ engellerse
   * yerel haf─▒zaya kaydederek y├Âneticinin ak─▒┼ş─▒n─▒ asla kilitlemez.
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
          console.log('Ô£à [Supabase BA┼ŞARILI] Ders buluta kaydedildi:', data[0]);
        } else if (error) {
          cloudError = error.message;
          console.warn('ÔÜá´©Å [Supabase RLS/Kural Uyar─▒s─▒] Bulut engelledi, yerel haf─▒zaya aktar─▒l─▒yor:', error);
        }
      } catch (err: any) {
        cloudError = err?.message;
        console.warn('ÔÜá´©Å [Supabase ─░stisna]:', err);
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
          console.log('Ô£à [Supabase BA┼ŞARILI] ├£nite buluta kaydedildi:', data[0]);
        } else if (error) {
          cloudError = error.message;
          console.warn('ÔÜá´©Å [Supabase RLS/Kural Uyar─▒s─▒] ├£nite bulut engeline tak─▒ld─▒, yerel kaydediliyor:', error);
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
   * 20 Soruluk Soru Paketini ├£niteye Toplu Olarak Y├╝kler.
   */
  /**
   * 20 Soruluk Soru Paketini Konu veya ├£niteye Toplu Olarak Y├╝kler.
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
};

export default api;

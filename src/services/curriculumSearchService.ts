import { Subject, Unit, Topic } from '../types';
import { api } from './api';

export type SearchItemType = 'subject' | 'unit' | 'topic' | 'category';

export interface CurriculumSearchItem {
  id: string;
  type: SearchItemType;
  typeLabel: 'Ders' | 'Ünite' | 'Alt Konu' | 'Kategori';
  title: string;
  subtitle: string;
  breadcrumb: string;
  badgeBg: string;
  badgeColor: string;
  subject?: Subject;
  unit?: Unit;
  topic?: Topic;
  categoryKey?: 'deneme' | 'mistakes' | 'radar' | 'calendar' | 'settings';
  keywords: string[];
}

export function normalizeTurkish(text: string): string {
  if (!text) return '';
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

class CurriculumSearchService {
  private cachedItems: CurriculumSearchItem[] | null = null;
  private isIndexing: boolean = false;
  private indexPromise: Promise<CurriculumSearchItem[]> | null = null;

  public clearCache(): void {
    this.cachedItems = null;
  }

  public async getIndex(forceRefresh = false): Promise<CurriculumSearchItem[]> {
    if (this.cachedItems && !forceRefresh) {
      return this.cachedItems;
    }
    if (this.isIndexing && this.indexPromise) {
      return this.indexPromise;
    }

    this.isIndexing = true;
    this.indexPromise = this.buildIndex();
    try {
      this.cachedItems = await this.indexPromise;
    } finally {
      this.isIndexing = false;
      this.indexPromise = null;
    }
    return this.cachedItems || [];
  }

  private async buildIndex(): Promise<CurriculumSearchItem[]> {
    const items: CurriculumSearchItem[] = [];

    // 1. KATEGORİLER VE ÖZEL MODÜLLER
    items.push({
      id: 'cat-deneme',
      type: 'category',
      typeLabel: 'Kategori',
      title: 'KPSS Deneme Sınavı (20 Soru)',
      subtitle: 'Rastgele konulardan 20 soru & canlı süre tutma',
      breadcrumb: 'Deneme Modülü',
      badgeBg: '#FEF3C7',
      badgeColor: '#D97706',
      categoryKey: 'deneme',
      keywords: ['deneme', 'deneme modu', 'deneme sinavi', 'kpss deneme', 'test', 'sure', 'kronometre', '20 soru', 'sureli test'],
    });

    items.push({
      id: 'cat-mistakes',
      type: 'category',
      typeLabel: 'Kategori',
      title: 'Yanlışlarım (Hata Havuzu)',
      subtitle: 'Deneme ve testlerde yanlış çözülen sorular',
      breadcrumb: 'Özel Soru Bankası',
      badgeBg: '#FEE2E2',
      badgeColor: '#DC2626',
      categoryKey: 'mistakes',
      keywords: ['yanlis', 'yanlislarim', 'hatalar', 'hatalarim', 'hata havuzu', 'tekrar', 'yanlis sorular'],
    });

    items.push({
      id: 'cat-radar',
      type: 'category',
      typeLabel: 'Kategori',
      title: 'Yeterlilik Radarı',
      subtitle: 'Ders ve konu bazlı akademik yeterlilik analizi',
      breadcrumb: 'Analitik Raporu',
      badgeBg: '#E0E7FF',
      badgeColor: '#4338CA',
      categoryKey: 'radar',
      keywords: ['radar', 'yeterlilik', 'kazanim', 'konu analizi', 'performans', 'grafik', 'analitik'],
    });

    items.push({
      id: 'cat-calendar',
      type: 'category',
      typeLabel: 'Kategori',
      title: 'Çalışma Takvimi',
      subtitle: 'Günlük soru hedefleri ve haftalık çalışma planı',
      breadcrumb: 'Çalışma Planı',
      badgeBg: '#F3E8FF',
      badgeColor: '#7E22CE',
      categoryKey: 'calendar',
      keywords: ['takvim', 'calisma', 'hedef', 'gunluk hedef', 'plan', 'soru takibi'],
    });

    items.push({
      id: 'cat-settings',
      type: 'category',
      typeLabel: 'Kategori',
      title: 'KPSS Sınavı ve Profil Ayarları',
      subtitle: 'Lisans, Ön Lisans, Ortaöğretim ve hedef kadro',
      breadcrumb: 'Kullanıcı Ayarları',
      badgeBg: '#F1F5F9',
      badgeColor: '#475569',
      categoryKey: 'settings',
      keywords: ['ayarlar', 'profil', 'hedef', 'kadro', 'lisans', 'on lisans', 'ortaogretim', 'ekpss', 'sifre', 'tema'],
    });

    // 2. MÜFREDAT HİYERARŞİSİ (DERSLER -> ÜNİTELER -> ALT KONULAR)
    try {
      const subjects = await api.getSubjects();

      for (const sub of subjects) {
        items.push({
          id: `sub-${sub.id}`,
          type: 'subject',
          typeLabel: 'Ders',
          title: sub.title,
          subtitle: `${sub.totalUnits || 0} Ünite • KPSS Dersi`,
          breadcrumb: sub.title,
          badgeBg: '#DBEAFE',
          badgeColor: '#1D4ED8',
          subject: sub,
          keywords: [sub.title, 'ders', 'kpss ' + sub.title],
        });

        try {
          const units = await api.getUnits(sub.id);

          for (const unit of units) {
            items.push({
              id: `unit-${unit.id}`,
              type: 'unit',
              typeLabel: 'Ünite',
              title: unit.title,
              subtitle: `${sub.title} • ${unit.topicCount || 0} Konu`,
              breadcrumb: `${sub.title} › ${unit.title}`,
              badgeBg: '#F3E8FF',
              badgeColor: '#7E22CE',
              subject: sub,
              unit: unit,
              keywords: [unit.title, sub.title, 'unite', `${sub.title} ${unit.title}`],
            });

            try {
              const topics = await api.getTopics(unit.id);

              for (const topic of topics) {
                items.push({
                  id: `topic-${topic.id}`,
                  type: 'topic',
                  typeLabel: 'Alt Konu',
                  title: topic.title,
                  subtitle: `${sub.title} › ${unit.title}`,
                  breadcrumb: `${sub.title} › ${unit.title} › ${topic.title}`,
                  badgeBg: '#DCFCE7',
                  badgeColor: '#15803D',
                  subject: sub,
                  unit: unit,
                  topic: topic,
                  keywords: [
                    topic.title,
                    unit.title,
                    sub.title,
                    'konu',
                    'kazanim',
                    'alt konu',
                    `${unit.title} ${topic.title}`,
                  ],
                });
              }
            } catch (topicErr) {
              console.warn('curriculumSearchService topic fetch error:', topicErr);
            }
          }
        } catch (unitErr) {
          console.warn('curriculumSearchService unit fetch error:', unitErr);
        }
      }
    } catch (subErr) {
      console.warn('curriculumSearchService subject fetch error:', subErr);
    }

    return items;
  }

  public async search(query: string): Promise<CurriculumSearchItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const normQuery = normalizeTurkish(trimmed);
    const queryWords = normQuery.split(/\s+/).filter(Boolean);
    const items = await this.getIndex();

    const scoredItems: { item: CurriculumSearchItem; score: number }[] = [];

    for (const item of items) {
      const normTitle = normalizeTurkish(item.title);
      const normBreadcrumb = normalizeTurkish(item.breadcrumb);
      const normKeywords = item.keywords.map((k) => normalizeTurkish(k)).join(' ');

      let score = 0;

      // Tam başlık eşleşmesi
      if (normTitle === normQuery) {
        score += 250;
      } else if (normTitle.startsWith(normQuery)) {
        score += 150;
      } else if (normTitle.includes(normQuery)) {
        score += 90;
      }

      // Kelime bazlı eşleşmeler
      let matchedWordCount = 0;
      for (const w of queryWords) {
        if (normTitle.includes(w)) {
          score += 35;
          matchedWordCount++;
        } else if (normBreadcrumb.includes(w)) {
          score += 20;
          matchedWordCount++;
        } else if (normKeywords.includes(w)) {
          score += 15;
          matchedWordCount++;
        }
      }

      if (matchedWordCount === queryWords.length && queryWords.length > 1) {
        score += 60;
      }

      // Tip öncelikleri
      if (score > 0) {
        if (item.type === 'category') score += 10;
        if (item.type === 'subject') score += 8;
        if (item.type === 'unit') score += 4;
        scoredItems.push({ item, score });
      }
    }

    scoredItems.sort((a, b) => b.score - a.score);
    return scoredItems.slice(0, 8).map((s) => s.item);
  }
}

export const curriculumSearchService = new CurriculumSearchService();

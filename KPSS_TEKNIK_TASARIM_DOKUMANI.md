# KPSS PLATFORMU — TEKNİK VE ALGORİTMİK TASARIM DOKÜMANI (TDD)
**Proje Adı:** KPSS Web / Sınav Hazırlık Platformu
**Geliştirme Platformu:** Google Antigravity IDE
**Canlı Dağıtım (Deployment):** Vercel SPA (Single Page Application)
**Hedef Kitle:** Claude, ChatGPT ve LLM Tabanlı Otonom Kodlama Ajanları için %100 Kod Tabanı ve Mimari Kavrama Dokümanı

---

## 1. GENEL MİMARİ VE TEKNOLOJİ YIĞINI

### 1.1. Mimari Yaklaşım
Proje, **Offline-First (Önce Çevrimdışı) Hibrit Mimari** ile inşa edilmiştir. Bulut veri sağlayıcısı olarak **Supabase (PostgreSQL + Auth + Storage)** kullanılırken, ağ kesintilerinde veya veritabanı boş olduğunda uygulama hiçbir şekilde çökmez; **LocalStorage + Statik Tohum Paket Verisi** katmanına zarif bir şekilde geri çekilir (Graceful Fallback).

```
+-----------------------------------------------------------------------+
|                             KULLANICI ARAYÜZÜ                         |
|      (React 19 SPA + Lucide React + CSS Değişkenleri Tema Motoru)     |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                        SERVİS VE İŞ MANTIK KATMANI                    |
|  - authService            - mockExamService      - themeService       |
|  - subscriptionService    - spacedRepetition     - userProfileService |
|  - curriculumSearch       - studentProgress      - networkService     |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                       HİBRİT VERİ ERİŞİM KATMANI                      |
|                           (src/services/api.ts)                       |
+-----------------------------------------------------------------------+
                 |                                      |
         [Ağ Var & UUID Geçerli]              [Ağ Yok / Fallback]
                 |                                      |
                 v                                      v
+-----------------------------------+  +--------------------------------+
|        SUPABASE BULUT DB          |  |       LOCALSTORAGE & DATA      |
|    (PostgreSQL 15 + RLS + Auth)   |  |   (samplePackage.ts / Cache)   |
+-----------------------------------+  +--------------------------------+
```

### 1.2. Teknoloji Yığını ve Paket Bağımlılıkları (package.json Detayı)
- **Çalışma Zamanı & Derleyici:** Node.js, Vite 6.0.7, TypeScript 5.7.2
- **Kullanıcı Arayüzü Kütüphanesi:** React 19.0.0, React DOM 19.0.0
- **İkon Paketi:** Lucide React 1.16.0
- **Veritabanı & Kimlik Doğrulama:** @supabase/supabase-js 2.49.1
- **Tipografi:** Google Fonts 'Plus Jakarta Sans', Merriweather, Poppins
- **Stil Yaklaşımı:** Dynamic CSS Custom Properties (CSS Değişkenleri ile sıfır harici CSS framework yükü)

### 1.3. Dizin ve Dosya Hiyerarşisi
```
d:/kpss/
├── public/                     # Statik dosyalar
├── src/
│   ├── components/             # Yeniden kullanılabilir arayüz bileşenleri
│   │   ├── AuthModal.tsx             # Giriş / Kayıt / Şifremi Unuttum çoklu modalı
│   │   ├── PricingPaywallModal.tsx   # PRO VIP üyelik ve kart simülasyonu modalı
│   │   ├── CompetencyRadarCard.tsx   # SVG tabanlı dinamik ders yetkinlik radarı
│   │   ├── DetailedTopicAnalysisCard.tsx # Konu bazlı zayıflık/güçlülük analiz kartı
│   │   ├── SkeletonLoader.tsx        # Shimmer efektli yükleme iskeletleri
│   │   ├── StudentAnalyticsCards.tsx # Hız, soru, hedef metrik kartları
│   │   ├── StudentSettingsView.tsx   # Ayarlar, tema, bildirim ve hesap çıkışı
│   │   └── StudyCalendarCard.tsx     # Çalışma takvimi ve günlük hedef ısı haritası
│   ├── data/
│   │   └── samplePackage.ts          # 20 soruluk KPSS GY-GK tohum soru seti
│   ├── pages/
│   │   ├── AdminPanel.tsx            # Müfredat ve soru bankası yönetim paneli (CRUD)
│   │   └── StudentQuiz.tsx           # Ana öğrenci uygulaması (~6000 satır çekirdek orkestratör)
│   ├── services/                     # İş mantığı ve veri erişim servisleri
│   │   ├── api.ts                    # Supabase CRUD + LocalStorage hibrit veri adaptörü
│   │   ├── authService.ts            # Supabase Auth + yerel oturum yönetim servisi
│   │   ├── curriculumSearchService.ts# Ters dizinli (inverted index) arama motoru
│   │   ├── mockExamService.ts        # Çok branşlı deneme sınavı & yanlışlarım bankası
│   │   ├── networkService.ts         # navigator.onLine durum kancası (useOnlineStatus)
│   │   ├── spacedRepetitionService.ts# Leitner 5-kutu aralıklı tekrar algoritması
│   │   ├── studentProgressService.ts # Günlük soru, başarı yüzdesi, hız istatistikleri
│   │   ├── subscriptionService.ts    # PRO abonelik ve paywall durum yöneticisi
│   │   ├── supabase.ts               # Supabase JS Client başlatıcı ve ortam değişkenleri
│   │   ├── themeService.ts           # CSS değişkenleri enjektörü ve tema önayarları
│   │   └── userProfileService.ts     # Kullanıcı profil bilgileri saklama servisi
│   ├── types.ts                      # Tüm platform TypeScript arayüz ve tipleri
│   ├── App.tsx                       # Kök yönlendirici (Admin / Öğrenci görünüm seçici)
│   └── main.tsx                      # Vite React 19 kök giriş noktası
├── index.html                        # Ana HTML şablonu (Plus Jakarta Sans font tanımlı)
├── package.json                      # Bağımlılık manifestosu
├── tsconfig.json                     # TypeScript yapılandırması
└── vite.config.ts                    # Vite yapılandırması
```

---

## 2. VERİTABANI VE VERİ MODELLERİ (DATA SCHEMAS)

### 2.1. TypeScript Çekirdek Arayüzleri (src/types.ts)
```typescript
export type OptionId = 'A' | 'B' | 'C' | 'D' | 'E';

export interface QuestionOption {
  id: OptionId;
  text: string;
}

export interface Subject {
  id: string;              // UUID veya 'turkce', 'tarih' vb.
  title: string;           // Örn: 'Türkçe', 'Tarih', 'Matematik'
  iconName?: string;
  totalUnits: number;
}

export interface Unit {
  id: string;              // UUID
  subjectId: string;       // Foreign Key -> Subject.id
  title: string;           // Örn: 'Sözcükte Anlam', 'İlk Türk Devletleri'
  unitNumber: number;
  topicCount?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
}

export interface Topic {
  id: string;              // UUID
  unitId: string;          // Foreign Key -> Unit.id
  subjectId?: string;      // Foreign Key -> Subject.id
  title: string;
  topicNumber: number;
  questionCount?: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  bankTitle?: string;
  bankDescription?: string;
  bankType?: string;
}

export interface QuestionBank {
  id: string;              // UUID
  topicId: string;         // Foreign Key -> Topic.id
  unitId?: string;
  title: string;           // Örn: 'Kazanım Kavrama Testi 1'
  description?: string;
  bankType?: string;       // 'standard' | 'mistakes' | 'mock'
  targetQuestionCount?: number;
  questionCount?: number;
  isLocked?: boolean;
  orderNumber?: number;
  createdAt?: string;
}

export interface Question {
  id: string;              // UUID
  bankId?: string;         // Foreign Key -> QuestionBank.id
  topicId?: string;        // Foreign Key -> Topic.id
  unitId?: string;         // Foreign Key -> Unit.id
  questionNumber: number;
  questionText: string;
  options: QuestionOption[]; // [ { id: 'A', text: '...' }, ... ]
  correctOption: OptionId; // 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string;     // Çözüm ve açıklama metni
  difficulty?: 'Kolay' | 'Orta' | 'Zor';
  year?: string;           // Örn: '2023 KPSS Çıkmış'
  tags?: string[];
  subjectTitle?: string;
  topicTitle?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOption: OptionId;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface UnitResult {
  unitId: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  totalTimeSeconds: number;
}
```

### 2.2. PostgreSQL / Supabase İlişkisel Şeması
```sql
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    icon_name TEXT,
    total_units INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    unit_number INTEGER NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    topic_number INTEGER NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    bank_type TEXT DEFAULT 'standard',
    target_question_count INTEGER DEFAULT 20,
    question_count INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    order_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option CHAR(1) NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'Orta',
    year TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE error_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    wrong_option CHAR(1) NOT NULL,
    correct_option CHAR(1) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3. LocalStorage Anahtarları ve Saklama Rolleri
- `kpss_auth_session_v1`: Kullanıcı kimlik oturumu
- `kpss_user_subscription_v1`: Abonelik durumu (free / pro_monthly / pro_annual)
- `kpss_spaced_repetition_cards_v1`: Leitner 5-kutu hafıza kartları
- `kpss_mistakes_question_bank_v1`: 'Yanlışlarım' otomatik soru bankası
- `kpss_active_theme_config_v1`: Aktif görsel tema yapılandırması
- `kpss_student_notifications`: Bildirim çanı uyarıları
- `kpss_student_progress_v2`: Günlük çalışma kayıtları ve radar yetkinlik puanları

---

## 3. ÇEKİRDEK ALGORİTMALAR VE İŞ MANTIĞI

### 3.1. Aralıklı Tekrar (Leitner 5-Box Spaced Repetition) Algoritması
Unutma eğrisini engellemek üzere tasarlanmıştır:
- **Kutu 1:** 1 Gün (Yeni veya yanlış yapılanlar)
- **Kutu 2:** 3 Gün (Pekiştirme)
- **Kutu 3:** 7 Gün (Orta bellek)
- **Kutu 4:** 14 Gün (Güçlü bellek)
- **Kutu 5:** 30 Gün (Kalıcı hafıza)

**Geçiş Kuralı:**
- Soru doğru çözülürse bir üst kutuya yükselir (`Math.min(5, boxLevel + 1)`).
- Soru yanlış çözülürse ceza olarak doğrudan **1. Kutuya** düşer ve ertesi gün tekrar listesine eklenir.

### 3.2. Çok Branşlı Deneme Sınavı Oluşturucu (Stratified Sampling)
- **quick_20 (Mini Deneme):** 20 soru / 25 dakika. Her dersten dengeli örneklem.
- **gy_gk_full_120 (Tam GY-GK):** 120 soru / 130 dakika. ÖSYM KPSS standardı (30 Türkçe, 30 Matematik, 27 Tarih, 18 Coğrafya, 9 Vatandaşlık, 6 Güncel Bilgiler).
- **gy_branch_60 (Genel Yetenek Branşı):** 60 soru / 65 dakika. Türkçe ve Matematik.
- **gk_branch_60 (Genel Kültür Branşı):** 60 soru / 65 dakika. Tarih, Coğrafya, Vatandaşlık, Güncel.

### 3.3. Hiyerarşik Ters Dizinli Arama Motoru
Tüm ders, ünite, konu ve modülleri tek bir dizinde birleştirir. Türkçe karakter duyarlılığını ortadan kaldırır. Skorlama hiyerarşisi:
1. Tam Başlık Eşleşmesi: 100 Puan
2. Ön Ek (Prefix) Eşleşmesi: 75 Puan
3. İçerik / Açıklama Eşleşmesi: 50 Puan
4. Üst Ekmek Kırıntısı (Breadcrumb) Eşleşmesi: 25 Puan

---

## 4. FONKSİYONLAR VE SERVİS KATMANI

1. **api.ts:**
   - `getSubjects()`, `getUnits()`, `getTopics()`, `getQuestionBanks()`, `getQuestions()`
   - `recordWrongAnswer()`, `markQuestionResolved()`
   - `isUuid()` kontrolü ile geçersiz ID'lerin Supabase'e gönderilerek 400 Bad Request üretmesi engellenir.

2. **authService.ts:**
   - `login()`, `register()`, `resetPassword()`, `logout()`, `getCurrentUser()`, `isUserLoggedIn()`.
   - `kpss_auth_changed` olayını yayınlar.

3. **subscriptionService.ts:**
   - `getSubscription()`, `upgradeToPro()`, `cancelSubscription()`.
   - `kpss_subscription_changed` olayını yayınlar.

4. **themeService.ts:**
   - `setActiveTheme()`, `applyTheme()`, `getActiveTheme()`.
   - CSS değişkenlerini (`--kpss-bg`, `--kpss-card-bg`, `--kpss-text` vb.) çalışma anında DOM'a enjekte eder.

---

## 5. KULLANICI AKIŞI VE SAYFA DURUM MAKİNESİ (STATE MACHINE)

### 5.1. Navigasyon State'leri (`activeTab`)
- `home`: Ana pano, radar grafiği, günlük hedef halkası, son sınavlar.
- `subjects`: Müfredat gezintisi (Ders -> Ünite -> Konu -> Soru Bankası).
- `errors`: Hata havuzu ve Leitner 5-Kutu sistemi.
- `profile`: Çalışma takvimi ve başarı analiz karnesi.
- `settings`: Görsel tema, font ve hesap ayarları.

### 5.2. Quiz State'leri (`viewState`)
- `subjects`: Listeleme ve gezinme modu.
- `quiz`: Soru çözme ve zamanlayıcı ekranı.
- `feedback`: Cevap verildikten sonra anında doğru/yanlış/çözüm kartı.
- `summary`: Test bittiğinde başarı karnesi ve net analizi.

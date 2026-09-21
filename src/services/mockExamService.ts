import { Question, OptionId, QuestionBank } from '../types';

export interface SubjectQuestionCount {
  subject: string;
  correct: number;
  total: number;
}

export interface MockExamResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  percentage: number;
  timeSpentSeconds: number;
  timeLimitSeconds: number; // 0 if unlimited
  averageTimePerQuestion: number;
  subjectBreakdown: SubjectQuestionCount[];
}

// Zengin KPSS Soru Havuzu (Farklı Konulardan)
export const KPSS_MOCK_QUESTIONS_POOL: (Omit<Question, 'id' | 'questionNumber'> & { subjectTitle: string; topicTitle: string })[] = [
  // ==========================================
  // TÜRKÇE (Sözcükte Anlam, Cümlede Anlam, Paragraf, Dilbilgisi, Yazım)
  // ==========================================
  {
    subjectTitle: 'Türkçe',
    topicTitle: 'Sözcükte Anlam',
    questionText: 'Aşağıdaki cümlelerin hangisinde "ağır" sözcüğü mecaz anlamda kullanılmıştır?',
    options: [
      { id: 'A', text: 'Kamyondaki ağır yükler boşaltıldı.' },
      { id: 'B', text: 'Toplantıda yöneticinin çok ağır sözleri herkesi üzdü.' },
      { id: 'C', text: 'Bu masa iki kişinin taşıyamayacağı kadar ağır.' },
      { id: 'D', text: 'Ağır adımlarla merdivenlerden yukarı çıktı.' },
      { id: 'E', text: 'Çantanın ağır olduğunu fark edince yere bıraktı.' },
    ],
    correctOption: 'B',
    explanation: '"Ağır sözler" ifadesinde sözcük, fiziksel ağırlık anlamından uzaklaşarak "kırıcı, dokunaklı, incitici" anlamında mecaz olarak kullanılmıştır.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Türkçe',
    topicTitle: 'Cümlede Anlam',
    questionText: 'Aşağıdaki cümlelerin hangisinde bir "koşula bağlılık" söz konusudur?',
    options: [
      { id: 'A', text: 'Düzenli çalışmadığı için sınavda başarılı olamadı.' },
      { id: 'B', text: 'Hedeflerine ulaşmak amacıyla gece gündüz gayret ediyor.' },
      { id: 'C', text: 'Ödevlerini zamanında bitirirsen hafta sonu sinemaya gidebiliriz.' },
      { id: 'D', text: 'Hava karardığı halde çocuklar sokakta oynamayı sürdürdü.' },
      { id: 'E', text: 'Kitap okumayı bir alışkanlık değil, yaşam tarzı olarak görürdü.' },
    ],
    correctOption: 'C',
    explanation: 'Sinemaya gitme eylemi, ödevlerin zamanında bitirilmesi şartına (-se/-sa) bağlanmıştır.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Türkçe',
    topicTitle: 'Paragrafta Anlam',
    questionText: 'Bir yazarın özgünlüğü, başkalarının geçtiği yollardan yürümemesinde değil; aynı yollardan geçerken farklı çiçekleri görebilmesindedir.\n\nBu cümlede asıl anlatılmak istenen aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', text: 'Yazar her zaman hiç işlenmemiş sıra dışı konular bulmalıdır.' },
      { id: 'B', text: 'Özgünlük, bilinen konulara kendine has farklı bir bakış açısıyla yaklaşabilmektir.' },
      { id: 'C', text: 'Geçmişin edebî birikiminden faydalanmayanlar kalıcı olamazlar.' },
      { id: 'D', text: 'Sanatçının başarısı kullandığı dilin sadeliğine bağlıdır.' },
      { id: 'E', text: 'Yazarlık yeteneği doğuştan gelen ve sonradan geliştirilemeyen bir güçtür.' },
    ],
    correctOption: 'B',
    explanation: '"Aynı yollardan geçerken farklı çiçekleri görebilmek", bilinen konuları özgün ve öznel bir bakış açısıyla yorumlamayı ifade eder.',
    difficulty: 'Orta',
  },
  {
    subjectTitle: 'Türkçe',
    topicTitle: 'Yazım Kuralları',
    questionText: 'Aşağıdaki cümlelerin hangisinde yazım yanlışı yapılmıştır?',
    options: [
      { id: 'A', text: 'TBMM\'nin açılışının 100. yıl dönümü coşkuyla kutlandı.' },
      { id: 'B', text: 'Bu hafta sonu Türk Dil Kurumu Başkanlığı\'na gideceğiz.' },
      { id: 'C', text: 'Romanı bir solukta okudum, öyleki zamanın nasıl geçtiğini anlamadım.' },
      { id: 'D', text: 'Mademki gelmeyecektin, neden bize haber vermedin?' },
      { id: 'E', text: 'Sivas Kongresi 4 Eylül 1919\'da toplanmıştır.' },
    ],
    correctOption: 'C',
    explanation: '"Öyle ki" sözcüğündeki "-ki" bağlaçtır ve ayrı yazılmalıdır. "Öyleki" yazımı yanlıştır. "Mademki" sözcüğü ise kalıplaşmış olduğu için bitişik yazılır (SOMBAHÇEMİ kuralı).',
    difficulty: 'Orta',
  },
  {
    subjectTitle: 'Türkçe',
    topicTitle: 'Noktalama İşaretleri',
    questionText: 'Genç adam ( ) heyecanla yerinden fırladı ( ) "Sonunda başardık ( )" diye haykırdı ( )\n\nBu cümlede yay ayraçla gösterilen yerlere sırasıyla hangi noktalama işaretleri getirilmelidir?',
    options: [
      { id: 'A', text: '( , ) ( : ) ( ! ) ( . )' },
      { id: 'B', text: '( ; ) ( , ) ( . ) ( . )' },
      { id: 'C', text: '( , ) ( , ) ( ! ) ( . )' },
      { id: 'D', text: '( , ) ( : ) ( . ) ( ! )' },
      { id: 'E', text: '( ; ) ( : ) ( ! ) ( ... )' },
    ],
    correctOption: 'A',
    explanation: 'Özneden sonra virgül (,), alıntı sözden önce iki nokta (:), ünlem bildiren sözün sonuna ünlem (!), cümlenin sonuna nokta (.) konur.',
    difficulty: 'Orta',
  },

  // ==========================================
  // MATEMATİK (Temel Kavramlar, Bölünebilme, Problemler, Mantık)
  // ==========================================
  {
    subjectTitle: 'Matematik',
    topicTitle: 'Temel Kavramlar',
    questionText: 'a, b ve c birbirinden farklı pozitif tam sayılardır.\n2a + 3b + c = 48 olduğuna göre, c\'nin alabileceği EN BÜYÜK değer kaçtır?',
    options: [
      { id: 'A', text: '41' },
      { id: 'B', text: '40' },
      { id: 'C', text: '39' },
      { id: 'D', text: '38' },
      { id: 'E', text: '35' },
    ],
    correctOption: 'B',
    explanation: 'c\'nin en büyük olması için a ve b\'ye en küçük pozitif tam sayılar verilmelidir. Birbirinden farklı oldukları için katsayısı büyük olan b\'ye 1, a\'ya 2 verirsek: 2(2) + 3(1) + c = 48 => 4 + 3 + c = 48 => 7 + c = 48 => c = 41 olur. Fakat sayılar birbirinden farklı olmalıdır: a=2, b=1, c=41 (hepsi farklı). Ancak b=2, a=1 denersek 2(1)+3(2)+c=48 => 8+c=48 => c=40. c=41 durumunda 2a+3b=7 için a=2, b=1 olduğunda a=2, b=1, c=41 sağlar.',
    difficulty: 'Orta',
  },
  {
    subjectTitle: 'Matematik',
    topicTitle: 'Rasyonel Sayılar',
    questionText: '(1 - 1/3) . (1 - 1/4) . (1 - 1/5) ... (1 - 1/20) işleminin sonucu kaçtır?',
    options: [
      { id: 'A', text: '1/10' },
      { id: 'B', text: '1/20' },
      { id: 'C', text: '2/19' },
      { id: 'D', text: '1/15' },
      { id: 'E', text: '3/20' },
    ],
    correctOption: 'A',
    explanation: '(2/3) * (3/4) * (4/5) * ... * (19/20) çarpımında pay ve paydadaki çapraz sayılar sadeleşir. Geriye payda 2, paydada 20 kalır: 2/20 = 1/10.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Matematik',
    topicTitle: 'Yaş Problemleri',
    questionText: 'Bir babanın yaşı, iki çocuğunun yaşları farkının 6 katıdır. 8 yıl sonra babanın yaşı, çocukların yaşları farkının 8 katı olacağına göre babanın bugünkü yaşı kaçtır?',
    options: [
      { id: 'A', text: '24' },
      { id: 'B', text: '30' },
      { id: 'C', text: '36' },
      { id: 'D', text: '42' },
      { id: 'E', text: '48' },
    ],
    correctOption: 'A',
    explanation: 'Çocukların yaşları farkı (x) yıllar geçse de değişmez. Babanın bugünkü yaşı B = 6x. 8 yıl sonra B + 8 = 8x. 6x + 8 = 8x => 2x = 8 => x = 4. Babanın bugünkü yaşı 6 * 4 = 24\'tür.',
    difficulty: 'Orta',
  },
  {
    subjectTitle: 'Matematik',
    topicTitle: 'Yüzde & Kâr-Zarar Problemleri',
    questionText: 'Bir satıcı bir ürünü etiket fiyatı üzerinden %20 indirimle satarsa %20 kâr elde etmektedir. Buna göre satıcının maliyet üzerinden belirlediği ilk etiket fiyatı yüzde kaç kârlıdır?',
    options: [
      { id: 'A', text: '%35' },
      { id: 'B', text: '%40' },
      { id: 'C', text: '%50' },
      { id: 'D', text: '%60' },
      { id: 'E', text: '%75' },
    ],
    correctOption: 'C',
    explanation: 'Maliyet 100 TL olsun. %20 karlı satış fiyatı 120 TL\'dir. Etiket fiyatına E dersek, E * 0.80 = 120 => E = 120 / 0.80 = 150 TL. Maliyet 100 iken etiket 150 belirlendiğine göre ilk etiket %50 kârla konulmuştur.',
    difficulty: 'Zor',
  },
  {
    subjectTitle: 'Matematik',
    topicTitle: 'Hız ve Hareket Problemleri',
    questionText: 'A ve B şehirleri arasındaki mesafe 420 km\'dir. Hızları saatte 60 km ve 80 km olan iki araç aynı anda birbirlerine doğru hareket ederlerse kaç saat sonra karşılaşırlar?',
    options: [
      { id: 'A', text: '2.5' },
      { id: 'B', text: '3' },
      { id: 'C', text: '3.5' },
      { id: 'D', text: '4' },
      { id: 'E', text: '4.5' },
    ],
    correctOption: 'B',
    explanation: 'Birbirlerine doğru hareket eden araçların hızları toplanır: Vtoplam = 60 + 80 = 140 km/sa. Karşılaşma süresi t = Yol / Vtoplam = 420 / 140 = 3 saat.',
    difficulty: 'Kolay',
  },

  // ==========================================
  // TARİH (İslamiyet Öncesi, Selçuklu, Osmanlı, İnkılap Tarihi, Çağdaş)
  // ==========================================
  {
    subjectTitle: 'Tarih',
    topicTitle: 'İslamiyet Öncesi Türk Tarihi',
    questionText: 'Uygurların Maniheizm inancını benimsemelerinin Türk kültür ve yaşam tarzı üzerindeki EN BELİRGİN sonucu aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', text: 'Askerî yeteneklerinin güçlenmesi' },
      { id: 'B', text: 'Yerleşik hayata geçilmesi ve kalıcı mimarinin gelişmesi' },
      { id: 'C', text: 'Çin ile savaşların tamamen sona ermesi' },
      { id: 'D', text: 'Devletin ikili teşkilatla yönetilmeye başlanması' },
      { id: 'E', text: 'Onlu sistemin orduya uyarlanması' },
    ],
    correctOption: 'B',
    explanation: 'Maniheizm dininin et yemeyi ve canlı öldürmeyi yasaklaması nedeniyle Uygurlar tarıma yönelmiş, tapınaklar, evler ve kütüphaneler inşa ederek yerleşik hayata geçen ilk Türk devleti olmuştur.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Tarih',
    topicTitle: 'İlk Türk-İslam Devletleri',
    questionText: 'İlk Türk-İslam devletlerinde hükümdarın egemenlik sembolleri arasında aşağıdakilerden hangisi YER ALMAZ?',
    options: [
      { id: 'A', text: 'Hutbe okutmak' },
      { id: 'B', text: 'Sikke (Para) bastırmak' },
      { id: 'C', text: 'Hilat giymek ve Çetr taşımak' },
      { id: 'D', text: 'Kurultayda toy düzenlemek' },
      { id: 'E', text: 'Tuğra çekmek' },
    ],
    correctOption: 'D',
    explanation: 'Hutbe, sikke, hilat, menşur, çetr ve nevbet Türk-İslam hükümdarlık sembolleridir. Toy düzenlemek İslamiyet öncesi döneme ait bir gelenektir, İslamî bir egemenlik sembolü değildir.',
    difficulty: 'Orta',
  },
  {
    subjectTitle: 'Tarih',
    topicTitle: 'Osmanlı Kültür ve Medeniyeti',
    questionText: 'Osmanlı Devleti\'nde Divan-ı Hümayun\'da "İlmiye" sınıfını temsil eden ve adalet, eğitim ve vakıf işlerinden sorumlu olan görevliler aşağıdakilerden hangisinde birlikte verilmiştir?',
    options: [
      { id: 'A', text: 'Sadrazam - Vezir' },
      { id: 'B', text: 'Kazasker - Şeyhülislam' },
      { id: 'C', text: 'Defterdar - Nişancı' },
      { id: 'D', text: 'Kaptan-ı Derya - Yeniçeri Ağası' },
      { id: 'E', text: 'Reisülküttab - Kethüda' },
    ],
    correctOption: 'B',
    explanation: 'İlmiye sınıfı ulema sınıfıdır; din, hukuk ve eğitimle ilgilenir. Divan\'daki temsilcileri Kazasker (kadı ve müderris atamaları) ile Şeyhülislam\'dır (fetva makamı).',
    difficulty: 'Orta',
  },
  {
    subjectTitle: 'Tarih',
    topicTitle: 'Kurtuluş Savaşı Hazırlık Dönemi',
    questionText: '"Milletin bağımsızlığını, yine milletin azim ve kararı kurtaracaktır." kararı ilk kez nerede alınmış ve Kurtuluş Savaşı\'nın amacı, gerekçesi ve yöntemi belirlenmiştir?',
    options: [
      { id: 'A', text: 'Havza Genelgesi' },
      { id: 'B', text: 'Amasya Genelgesi' },
      { id: 'C', text: 'Erzurum Kongresi' },
      { id: 'D', text: 'Sivas Kongresi' },
      { id: 'E', text: 'Misak-ı Millî' },
    ],
    correctOption: 'B',
    explanation: '22 Haziran 1919 tarihli Amasya Genelgesi, Millî Mücadele\'nin ihtilal bildirgesi niteliğinde olup gerekçe, amaç ve yöntemini ilk kez belirlemiştir.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Tarih',
    topicTitle: 'Atatürk İlkeleri ve İnkılapları',
    questionText: 'Cumhuriyet döneminde gerçekleştirilen;\nI. Saltanatın kaldırılması\nII. Medeni Kanun\'un kabulü\nIII. Kadınlara seçme ve seçilme hakkı verilmesi\n\ninkılaplarından hangileri doğrudan "Cumhuriyetçilik" ilkesiyle ilişkilidir?',
    options: [
      { id: 'A', text: 'Yalnız I' },
      { id: 'B', text: 'Yalnız II' },
      { id: 'C', text: 'I ve III' },
      { id: 'D', text: 'II ve III' },
      { id: 'E', text: 'I, II ve III' },
    ],
    correctOption: 'C',
    explanation: 'Milli egemenlik ve siyasi yönetime katılım doğrudan cumhuriyetçilikle ilgilidir. Saltanatın kaldırılması ve kadınlara siyasi hakların verilmesi cumhuriyetçiliktir. Medeni Kanun ise toplumsal ve hukuki alanda eşitlik getirdiği için halkçılık ve laiklik ile doğrudan ilgilidir.',
    difficulty: 'Orta',
  },

  // ==========================================
  // COĞRAFYA (Fiziki, Beşeri, Ekonomik)
  // ==========================================
  {
    subjectTitle: 'Coğrafya',
    topicTitle: 'Türkiye\'nin Fiziki Coğrafyası',
    questionText: 'Türkiye\'de dağların genellikle doğu-batı doğrultusunda uzanması aşağıdakilerden hangisi üzerinde ETKİLİ DEĞİLDİR?',
    options: [
      { id: 'A', text: 'Karadeniz ve Akdeniz kıyılarında boyuna kıyı tipinin görülmesi' },
      { id: 'B', text: 'Ege Bölgesi\'nde denizel etkinin iç kesimlere kadar sokulabilmesi' },
      { id: 'C', text: 'Kuzey ve güney kıyılarımızda ulaşımın geçitlerle sağlanması' },
      { id: 'D', text: 'Türkiye\'de batıdan doğuya doğru yükseltinin artması' },
      { id: 'E', text: 'İç kesimlerde karasal iklim koşullarının hâkim olması' },
    ],
    correctOption: 'D',
    explanation: 'Batıdan doğuya doğru yükseltinin artması, Alp-Himalaya orojenezinde Anadolu levhasının toptan yükselmesi (epirojenez) ile ilgilidir; dağların uzanış yönüyle doğrudan ilişkili değildir.',
    difficulty: 'Orta',
  },
  {
    subjectTitle: 'Coğrafya',
    topicTitle: 'Türkiye\'nin Yer Şekilleri',
    questionText: 'Aşağıdaki ovalardan hangisi bir "Delta Ovası" değildir?',
    options: [
      { id: 'A', text: 'Çukurova (Seyhan-Ceyhan)' },
      { id: 'B', text: 'Bafra Ovası (Kızılırmak)' },
      { id: 'C', text: 'Çarşamba Ovası (Yeşilırmak)' },
      { id: 'D', text: 'Silifke Ovası (Göksu)' },
      { id: 'E', text: 'Konya Ovası' },
    ],
    correctOption: 'E',
    explanation: 'Konya Ovası, eski bir göl tabanı olan tektonik kökenli bir ovadır. Diğer seçenekler akarsuların deniz kıyısında oluşturduğu alüvyal delta ovalarıdır.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Coğrafya',
    topicTitle: 'Türkiye\'nin İklimi ve Bitki Örtüsü',
    questionText: 'Türkiye\'de Akdeniz iklim bölgesinde kızılçam ormanlarının tahrip edilmesiyle ortaya çıkan bodur çalı topluluğuna ne ad verilir?',
    options: [
      { id: 'A', text: 'Bozkır' },
      { id: 'B', text: 'Maki' },
      { id: 'C', text: 'Garig' },
      { id: 'D', text: 'Psödömaki' },
      { id: 'E', text: 'Tayga' },
    ],
    correctOption: 'B',
    explanation: 'Kızılçam ormanlarının tahrip edilmesiyle maki, makilerin de tahrip edilmesiyle garig (frigana) oluşur.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Coğrafya',
    topicTitle: 'Ekonomik Coğrafya (Madenler)',
    questionText: 'Dünya rezervlerinin yaklaşık %72\'sine Türkiye\'nin sahip olduğu, Balıkesir (Susurluk, Bigadiç), Kütahya (Emet) ve Eskişehir (Kırka)\'de çıkarılan stratejik maden hangisidir?',
    options: [
      { id: 'A', text: 'Krom' },
      { id: 'B', text: 'Boksit' },
      { id: 'C', text: 'Bor' },
      { id: 'D', text: 'Bakır' },
      { id: 'E', text: 'Demir' },
    ],
    correctOption: 'C',
    explanation: 'Türkiye dünya bor rezervlerinin yaklaşık dörtte üçüne sahiptir. En önemli yataklar Kütahya Emet, Balıkesir Bigadiç ve Eskişehir Kırka\'dadır.',
    difficulty: 'Kolay',
  },

  // ==========================================
  // VATANDAŞLIK (Temel Hukuk, Anayasa, İdare)
  // ==========================================
  {
    subjectTitle: 'Vatandaşlık',
    topicTitle: 'Temel Hukuk Kavramları',
    questionText: 'Hukuk kurallarının diğer sosyal düzen kurallarından (din, ahlak, görgü) ayrılan EN TEMEL farkı aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', text: 'Toplumsal barışı hedeflemesi' },
      { id: 'B', text: 'Maddi yaptırımlı (devlet gücüne dayalı) olması' },
      { id: 'C', text: 'Zamanla değişebilir olması' },
      { id: 'D', text: 'Yazılı kurallardan oluşması' },
      { id: 'E', text: 'İnsan davranışlarını düzenlemesi' },
    ],
    correctOption: 'B',
    explanation: 'Din ve ahlak kuralları manevi yaptırımlı iken, hukuk kuralları devlet gücüyle desteklenmiş "maddi yaptırımlı" (ceza, cebri icra, tazminat vb.) kurallardır.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Vatandaşlık',
    topicTitle: '1982 Anayasası Esasları',
    questionText: '1982 Anayasası\'na göre Türkiye Büyük Millet Meclisi (TBMM) kaç milletvekilinden oluşur?',
    options: [
      { id: 'A', text: '450' },
      { id: 'B', text: '500' },
      { id: 'C', text: '550' },
      { id: 'D', text: '600' },
      { id: 'E', text: '650' },
    ],
    correctOption: 'D',
    explanation: '2017 anayasa değişikliği ile TBMM üye tamsayısı 550\'den 600 milletvekiline çıkarılmıştır.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Vatandaşlık',
    topicTitle: 'Yasama ve Yürütme',
    questionText: '1982 Anayasası\'na göre Cumhurbaşkanı adaylığı için aşağıdakilerden hangisi ZORUNLU DEĞİLDİR?',
    options: [
      { id: 'A', text: 'Kırk yaşını doldurmuş olmak' },
      { id: 'B', text: 'Yükseköğrenim mezunu olmak' },
      { id: 'C', text: 'Milletvekili seçilme yeterliliğine sahip olmak' },
      { id: 'D', text: 'Hukuk fakültesi mezunu olmak' },
      { id: 'E', text: 'Türk vatandaşı olmak' },
    ],
    correctOption: 'D',
    explanation: 'Cumhurbaşkanı seçilmek için kırk yaşını doldurmuş, yükseköğrenim yapmış ve milletvekili seçilme yeterliliğine sahip Türk vatandaşı olmak gerekir. Belirli bir bölümden (hukuk gibi) mezun olma şartı yoktur.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Vatandaşlık',
    topicTitle: 'İdare Hukuku',
    questionText: 'Aşağıdakilerden hangisi Türkiye\'de "Mahalli İdareler" (Yerel Yönetimler) arasında YER ALMAZ?',
    options: [
      { id: 'A', text: 'İl Özel İdaresi' },
      { id: 'B', text: 'Belediye' },
      { id: 'C', text: 'Büyükşehir Belediyesi' },
      { id: 'D', text: 'Köy' },
      { id: 'E', text: 'Kaymakamlık' },
    ],
    correctOption: 'E',
    explanation: 'Anayasa\'ya göre mahalli idareler; il özel idaresi, belediye ve köydür. Kaymakamlık ise merkezi idarenin taşra teşkilatında (ilçe) yer alır.',
    difficulty: 'Orta',
  },

  // ==========================================
  // GÜNCEL BİLGİLER / GENEL KÜLTÜR
  // ==========================================
  {
    subjectTitle: 'Güncel Bilgiler',
    topicTitle: 'Uluslararası Kuruluşlar & Genel Kültür',
    questionText: 'Birleşmiş Milletler Eğitim, Bilim ve Kültür Örgütü (UNESCO) merkezi hangi şehirde bulunmaktadır?',
    options: [
      { id: 'A', text: 'Cenevre' },
      { id: 'B', text: 'New York' },
      { id: 'C', text: 'Paris' },
      { id: 'D', text: 'Viyana' },
      { id: 'E', text: 'Brüksel' },
    ],
    correctOption: 'C',
    explanation: 'UNESCO\'nun genel merkezi Fransa\'nın başkenti Paris\'te yer almaktadır.',
    difficulty: 'Kolay',
  },
  {
    subjectTitle: 'Güncel Bilgiler',
    topicTitle: 'Kültür & Sanat',
    questionText: 'İstiklal Marşı\'mızın yazarı Mehmet Âkif Ersoy, şiirlerini topladığı ünlü "Safahat" adlı eserine aşağıdaki şiirlerden hangisini DÂHİL ETMEMİŞTİR?',
    options: [
      { id: 'A', text: 'Çanakkale Şehitlerine' },
      { id: 'B', text: 'Bülbül' },
      { id: 'C', text: 'İstiklal Marşı' },
      { id: 'D', text: 'Süleymaniye Kürsüsünde' },
      { id: 'E', text: 'Asım' },
    ],
    correctOption: 'C',
    explanation: 'Mehmet Âkif Ersoy, "İstiklal Marşı benim değil, milletimindir" diyerek İstiklal Marşı\'nı Safahat kitabına almamıştır.',
    difficulty: 'Kolay',
  },
];

/**
 * 20 soruluk karma deneme sınavı üretir.
 * Farklı derslerden ve konulardan dengeli dağıtımla sorular seçer.
 * Yerel hafızada adminin eklediği sorular varsa onları da dahil eder.
 */
export function generateRandomMockExam(targetCount: number = 20): Question[] {
  // 1. Havuzdaki soruları kopyala
  const pool = [...KPSS_MOCK_QUESTIONS_POOL];

  // 2. Varsa yerel hafızadaki soruları da havuza ekle
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('kpss_local_custom_questions');
      if (raw) {
        const localCustomQuestions: Question[] = JSON.parse(raw);
        for (const lq of localCustomQuestions) {
          pool.push({
            questionText: lq.questionText,
            options: lq.options,
            correctOption: lq.correctOption,
            explanation: lq.explanation,
            difficulty: lq.difficulty || 'Orta',
            subjectTitle: 'Özel Alan',
            topicTitle: 'Müfredat Sorusu',
          });
        }
      }
    } catch (e) {
      console.warn('Local questions merge error:', e);
    }
  }

  // 3. Konulara / Derslere göre grupla
  const groupedBySubject: Record<string, typeof pool> = {};
  pool.forEach((item) => {
    const sub = item.subjectTitle || 'Genel';
    if (!groupedBySubject[sub]) groupedBySubject[sub] = [];
    groupedBySubject[sub].push(item);
  });

  // 4. Her ders grubunu kendi içinde karıştır
  Object.keys(groupedBySubject).forEach((sub) => {
    groupedBySubject[sub].sort(() => Math.random() - 0.5);
  });

  // 5. Dengeli dağıtımla soruları çek (Örn: 4 Türkçe, 4 Matematik, 4 Tarih, 4 Coğrafya, 4 Vatandaşlık/Güncel)
  const selected: (typeof pool[0])[] = [];
  const subjects = Object.keys(groupedBySubject);

  let loopSafety = 0;
  while (selected.length < targetCount && loopSafety < 100) {
    loopSafety++;
    for (const sub of subjects) {
      if (selected.length >= targetCount) break;
      const subList = groupedBySubject[sub];
      if (subList && subList.length > 0) {
        const nextQ = subList.shift();
        if (nextQ && !selected.some((s) => s.questionText === nextQ.questionText)) {
          selected.push(nextQ);
        }
      }
    }
    // Eğer tüm gruplar tükendiyse ama henüz targetCount dolmadıysa kalan havuzdan rastgele tamamla
    const allRemaining = Object.values(groupedBySubject).flat();
    if (allRemaining.length === 0) break;
  }

  // Eğer hala dolmadıysa havuzdan rastgele tamamla
  if (selected.length < targetCount) {
    const remainingInPool = pool.filter((p) => !selected.some((s) => s.questionText === p.questionText));
    remainingInPool.sort(() => Math.random() - 0.5);
    while (selected.length < targetCount && remainingInPool.length > 0) {
      selected.push(remainingInPool.pop()!);
    }
  }

  // 6. Soruları formatlayıp 1..20 olarak numaralandır
  return selected.slice(0, targetCount).map((q, idx) => ({
    id: `deneme-q-${Date.now()}-${idx + 1}`,
    questionNumber: idx + 1,
    questionText: q.questionText,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation,
    difficulty: q.difficulty,
    subjectTitle: q.subjectTitle,
    topicTitle: q.topicTitle,
  }));
}

// ============================================================================
// 'YANLIŞLARIM' ÖZEL SORU BANKASI YÖNETİMİ & OTOMATİK KAYIT FONKSİYONLARI
// ============================================================================
export const MISTAKES_BANK_ID = 'yanlislarim-soru-bankasi';
export const MISTAKES_TOPIC_ID = 'yanlislarim-topic';
export const MISTAKES_UNIT_ID = 'yanlislarim-unit';

const LOCAL_QUESTIONS_KEY = 'kpss_local_custom_questions';
const LOCAL_QUESTION_BANKS_KEY = 'kpss_local_custom_question_banks';

/**
 * 'Yanlışlarım' isimli soru bankasını getirir veya yoksa otomatik oluşturur.
 */
export function getOrCreateMistakesBank(): QuestionBank {
  if (typeof window === 'undefined') {
    return {
      id: MISTAKES_BANK_ID,
      topicId: MISTAKES_TOPIC_ID,
      unitId: MISTAKES_UNIT_ID,
      title: 'Yanlışlarım',
      description: 'Deneme sınavlarında yanlış yapılan sorulardan otomatik oluşturulan özel soru bankası',
      bankType: 'Özel Hata Havuzu Testi',
      targetQuestionCount: 20,
      questionCount: 0,
      orderNumber: 999,
      isLocked: false,
    };
  }

  try {
    const rawBanks = localStorage.getItem(LOCAL_QUESTION_BANKS_KEY);
    const banks: QuestionBank[] = rawBanks ? JSON.parse(rawBanks) : [];
    let bank = banks.find((b) => b.id === MISTAKES_BANK_ID || b.title === 'Yanlışlarım');

    const currentQuestions = getMistakesBankQuestions();

    if (!bank) {
      bank = {
        id: MISTAKES_BANK_ID,
        topicId: MISTAKES_TOPIC_ID,
        unitId: MISTAKES_UNIT_ID,
        title: 'Yanlışlarım',
        description: 'Deneme sınavlarında yanlış yapılan sorulardan otomatik oluşturulan özel soru bankası',
        bankType: 'Özel Hata Havuzu Testi',
        targetQuestionCount: 20,
        questionCount: currentQuestions.length,
        orderNumber: 999,
        isLocked: false,
        createdAt: new Date().toISOString(),
      };
      banks.push(bank);
      localStorage.setItem(LOCAL_QUESTION_BANKS_KEY, JSON.stringify(banks));
    } else if (bank.questionCount !== currentQuestions.length) {
      bank.questionCount = currentQuestions.length;
      localStorage.setItem(LOCAL_QUESTION_BANKS_KEY, JSON.stringify(banks));
    }

    return bank;
  } catch (e) {
    console.error('getOrCreateMistakesBank error:', e);
    return {
      id: MISTAKES_BANK_ID,
      topicId: MISTAKES_TOPIC_ID,
      unitId: MISTAKES_UNIT_ID,
      title: 'Yanlışlarım',
      description: 'Deneme sınavlarında yanlış yapılan sorulardan otomatik oluşturulan özel soru bankası',
      bankType: 'Özel Hata Havuzu Testi',
      targetQuestionCount: 20,
      questionCount: 0,
      orderNumber: 999,
      isLocked: false,
    };
  }
}

/**
 * 'Yanlışlarım' soru bankasındaki kayıtlı tüm soruları getirir.
 */
export function getMistakesBankQuestions(): Question[] {
  if (typeof window === 'undefined') return [];
  try {
    const rawQ = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    if (!rawQ) return [];
    const allQuestions: Question[] = JSON.parse(rawQ);
    return allQuestions.filter(
      (q) => q.bankId === MISTAKES_BANK_ID || q.topicId === MISTAKES_TOPIC_ID
    );
  } catch (e) {
    console.error('getMistakesBankQuestions error:', e);
    return [];
  }
}

/**
 * Deneme Modu'nda yanlış yapılan tek bir soruyu otomatik olarak
 * 'Yanlışlarım' isimli özel soru bankasına kaydeder.
 * (Aynı sorunun tekrar eklenmesini önlemek için metin bazlı tekillik kontrolü yapar.)
 */
export function saveWrongQuestionToMistakesBank(question: Question): {
  success: boolean;
  isNew: boolean;
  totalCount: number;
  bank: QuestionBank;
} {
  const bank = getOrCreateMistakesBank();
  if (typeof window === 'undefined') {
    return { success: false, isNew: false, totalCount: 0, bank };
  }

  try {
    const rawQ = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    const allQuestions: Question[] = rawQ ? JSON.parse(rawQ) : [];

    // Mevcut 'Yanlışlarım' soruları
    const existingMistakes = allQuestions.filter(
      (q) => q.bankId === MISTAKES_BANK_ID || q.topicId === MISTAKES_TOPIC_ID
    );

    // Aynı soru metnine sahip soru zaten var mı?
    const normalizedNewText = question.questionText.trim().toLowerCase();
    const alreadyExists = existingMistakes.some(
      (q) => q.questionText.trim().toLowerCase() === normalizedNewText
    );

    let isNew = false;
    if (!alreadyExists) {
      const newQuestionNumber = existingMistakes.length + 1;
      const questionToSave: Question = {
        ...question,
        id: `mistake-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        bankId: MISTAKES_BANK_ID,
        topicId: MISTAKES_TOPIC_ID,
        unitId: MISTAKES_UNIT_ID,
        questionNumber: newQuestionNumber,
        subjectTitle: question.subjectTitle || 'KPSS Genel Deneme',
        topicTitle: question.topicTitle || 'Yanlış Çözülen Soru',
        tags: ['deneme-yanlisi', ...(question.tags || [])],
      };

      allQuestions.push(questionToSave);
      localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(allQuestions));
      isNew = true;
    }

    // Toplam sayıyı güncelle
    const updatedCount = allQuestions.filter(
      (q) => q.bankId === MISTAKES_BANK_ID || q.topicId === MISTAKES_TOPIC_ID
    ).length;

    // Soru bankası bilgisini güncelle
    const rawBanks = localStorage.getItem(LOCAL_QUESTION_BANKS_KEY);
    if (rawBanks) {
      const banks: QuestionBank[] = JSON.parse(rawBanks);
      const bIdx = banks.findIndex((b) => b.id === MISTAKES_BANK_ID || b.title === 'Yanlışlarım');
      if (bIdx >= 0) {
        banks[bIdx].questionCount = updatedCount;
        localStorage.setItem(LOCAL_QUESTION_BANKS_KEY, JSON.stringify(banks));
        bank.questionCount = updatedCount;
      }
    }

    // Arayüz bildirim olayı tetikle
    window.dispatchEvent(
      new CustomEvent('kpss_mistakes_bank_updated', {
        detail: { bankId: MISTAKES_BANK_ID, totalCount: updatedCount, isNew },
      })
    );

    return { success: true, isNew, totalCount: updatedCount, bank };
  } catch (e) {
    console.error('saveWrongQuestionToMistakesBank error:', e);
    return { success: false, isNew: false, totalCount: 0, bank };
  }
}

/**
 * Deneme Modu'nda yanlış yapılan birden çok soruyu topluca 'Yanlışlarım'
 * özel soru bankasına kaydeder.
 */
export function saveWrongQuestionsToMistakesBank(questions: Question[]): {
  success: boolean;
  addedCount: number;
  totalCount: number;
  bank: QuestionBank;
} {
  let addedCount = 0;
  let lastBank = getOrCreateMistakesBank();

  for (const q of questions) {
    const res = saveWrongQuestionToMistakesBank(q);
    if (res.isNew) {
      addedCount++;
    }
    lastBank = res.bank;
  }

  return {
    success: true,
    addedCount,
    totalCount: lastBank.questionCount || getMistakesBankQuestions().length,
    bank: lastBank,
  };
}

/**
 * Deneme Modu'nda yanlış yapılan soruları otomatik olarak 'Yanlışlarım' isimli
 * özel bir soru bankasına kaydedilmesini sağlayan merkezi fonksiyon.
 * Sınavdaki tüm soruları ve kullanıcının cevaplarını analiz ederek yanlışları
 * ayıklar ve 'Yanlışlarım' soru bankasına aktarır.
 */
export function recordDenemeMistakesToMistakesBank(
  questions: Question[],
  userAnswers: Record<string, { isCorrect?: boolean; selectedOption?: string }>
): {
  success: boolean;
  wrongCount: number;
  addedCount: number;
  totalCount: number;
  bank: QuestionBank;
} {
  const wrongQuestions = questions.filter(
    (q) => userAnswers[q.id] && !userAnswers[q.id].isCorrect
  );

  const res = saveWrongQuestionsToMistakesBank(wrongQuestions);
  return {
    success: res.success,
    wrongCount: wrongQuestions.length,
    addedCount: res.addedCount,
    totalCount: res.totalCount,
    bank: res.bank,
  };
}

/**
 * 'Yanlışlarım' soru bankasından belirli bir soruyu (örneğin doğru çözüldüğünde) kaldırır.
 */
export function removeQuestionFromMistakesBank(questionId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawQ = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    if (!rawQ) return false;
    const allQuestions: Question[] = JSON.parse(rawQ);
    const updated = allQuestions.filter((q) => q.id !== questionId);
    localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(updated));

    const remaining = updated.filter(
      (q) => q.bankId === MISTAKES_BANK_ID || q.topicId === MISTAKES_TOPIC_ID
    );
    const rawBanks = localStorage.getItem(LOCAL_QUESTION_BANKS_KEY);
    if (rawBanks) {
      const banks: QuestionBank[] = JSON.parse(rawBanks);
      const bIdx = banks.findIndex((b) => b.id === MISTAKES_BANK_ID || b.title === 'Yanlışlarım');
      if (bIdx >= 0) {
        banks[bIdx].questionCount = remaining.length;
        localStorage.setItem(LOCAL_QUESTION_BANKS_KEY, JSON.stringify(banks));
      }
    }

    window.dispatchEvent(
      new CustomEvent('kpss_mistakes_bank_updated', {
        detail: { bankId: MISTAKES_BANK_ID, totalCount: remaining.length },
      })
    );

    return true;
  } catch (e) {
    console.error('removeQuestionFromMistakesBank error:', e);
    return false;
  }
}

/**
 * 'Yanlışlarım' soru bankasını sıfırlar (temizler).
 */
export function clearMistakesBank(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawQ = localStorage.getItem(LOCAL_QUESTIONS_KEY);
    if (rawQ) {
      const allQuestions: Question[] = JSON.parse(rawQ);
      const filtered = allQuestions.filter(
        (q) => q.bankId !== MISTAKES_BANK_ID && q.topicId !== MISTAKES_TOPIC_ID
      );
      localStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(filtered));
    }

    const rawBanks = localStorage.getItem(LOCAL_QUESTION_BANKS_KEY);
    if (rawBanks) {
      const banks: QuestionBank[] = JSON.parse(rawBanks);
      const bIdx = banks.findIndex((b) => b.id === MISTAKES_BANK_ID || b.title === 'Yanlışlarım');
      if (bIdx >= 0) {
        banks[bIdx].questionCount = 0;
        localStorage.setItem(LOCAL_QUESTION_BANKS_KEY, JSON.stringify(banks));
      }
    }

    window.dispatchEvent(
      new CustomEvent('kpss_mistakes_bank_updated', {
        detail: { bankId: MISTAKES_BANK_ID, totalCount: 0 },
      })
    );

    return true;
  } catch (e) {
    console.error('clearMistakesBank error:', e);
    return false;
  }
}



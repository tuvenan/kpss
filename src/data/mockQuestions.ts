import { Question, Subject, Unit, Topic } from '@/types';

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'turkce',
    title: 'Türkçe',
    iconName: 'book-outline',
    totalUnits: 10,
  },
  {
    id: 'matematik',
    title: 'Matematik',
    iconName: 'calculator-outline',
    totalUnits: 10,
  },
  {
    id: 'tarih',
    title: 'Tarih',
    iconName: 'book-outline',
    totalUnits: 12,
  },
  {
    id: 'cografya',
    title: 'Coğrafya',
    iconName: 'earth-outline',
    totalUnits: 8,
  },
  {
    id: 'vatandaslik',
    title: 'Vatandaşlık',
    iconName: 'shield-outline',
    totalUnits: 6,
  },
];

export const MOCK_UNITS: Unit[] = [
  {
    id: 'ilk-turk-devletleri',
    subjectId: 'tarih',
    title: 'İslamiyet Öncesi Türk Tarihi',
    unitNumber: 1,
    topicCount: 4,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'ilk-musluman-turk-devletleri',
    subjectId: 'tarih',
    title: 'İlk Türk-İslam Devletleri',
    unitNumber: 2,
    topicCount: 3,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'turkiye-tarihi',
    subjectId: 'tarih',
    title: 'Anadolu Selçukluları ve Beylikler',
    unitNumber: 3,
    topicCount: 3,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'osmanli-kurulus',
    subjectId: 'tarih',
    title: 'Osmanlı Tarihi',
    unitNumber: 4,
    topicCount: 4,
    isLocked: false,
    isCompleted: false,
  },
  // Coğrafya Üniteleri
  {
    id: 'turkiyenin-cografi-konumu',
    subjectId: 'cografya',
    title: "Türkiye'nin Fiziki Coğrafyası",
    unitNumber: 1,
    topicCount: 4,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'turkiyenin-yersekilleri',
    subjectId: 'cografya',
    title: "Türkiye'nin Beşeri Coğrafyası",
    unitNumber: 2,
    topicCount: 2,
    isLocked: false,
    isCompleted: false,
  },
  // Vatandaşlık Üniteleri
  {
    id: 'temel-hukuk-kavramlari',
    subjectId: 'vatandaslik',
    title: 'Temel Hukuk Bilgisi',
    unitNumber: 1,
    topicCount: 2,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'anayasa-hukuku-genel-esaslar',
    subjectId: 'vatandaslik',
    title: 'Anayasa Hukuku ve 1982 Anayasası',
    unitNumber: 2,
    topicCount: 2,
    isLocked: false,
    isCompleted: false,
  },
];

export const MOCK_TOPICS: Topic[] = [
  // Tarih: 1. Ünite (İslamiyet Öncesi Türk Tarihi)
  {
    id: 'topic-tarih-1',
    unitId: 'ilk-turk-devletleri',
    subjectId: 'tarih',
    title: 'Orta Asya Kültür Merkezleri ve Türk Göçleri',
    topicNumber: 1,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'topic-tarih-2',
    unitId: 'ilk-turk-devletleri',
    subjectId: 'tarih',
    title: 'İlk Türk Devletleri (Hunlar, Göktürkler, Uygurlar)',
    topicNumber: 2,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'topic-tarih-3',
    unitId: 'ilk-turk-devletleri',
    subjectId: 'tarih',
    title: 'Diğer Türk Devletleri ve Boyları',
    topicNumber: 3,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'topic-tarih-4',
    unitId: 'ilk-turk-devletleri',
    subjectId: 'tarih',
    title: 'İlk Türk Devletlerinde Kültür ve Medeniyet',
    topicNumber: 4,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  // Tarih: 2. Ünite (İlk Türk-İslam Devletleri)
  {
    id: 'topic-tarih-2-1',
    unitId: 'ilk-musluman-turk-devletleri',
    subjectId: 'tarih',
    title: 'Türklerin İslamiyeti Kabulü ve İlk Devletler',
    topicNumber: 1,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'topic-tarih-2-2',
    unitId: 'ilk-musluman-turk-devletleri',
    subjectId: 'tarih',
    title: 'Büyük Selçuklu Devleti ve Siyasi Tarih',
    topicNumber: 2,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  // Coğrafya
  {
    id: 'topic-cog-1',
    unitId: 'turkiyenin-cografi-konumu',
    subjectId: 'cografya',
    title: "Türkiye'nin Coğrafi Konumu ve Sonuçları",
    topicNumber: 1,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'topic-cog-2',
    unitId: 'turkiyenin-cografi-konumu',
    subjectId: 'cografya',
    title: "Türkiye'nin Yer Şekilleri ve Su Varlığı",
    topicNumber: 2,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  // Vatandaşlık
  {
    id: 'topic-vat-1',
    unitId: 'temel-hukuk-kavramlari',
    subjectId: 'vatandaslik',
    title: 'Hukukun Temel Kavramları ve Yaptırımlar',
    topicNumber: 1,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
  {
    id: 'topic-vat-2',
    unitId: 'temel-hukuk-kavramlari',
    subjectId: 'vatandaslik',
    title: 'Haklar, Ehliyetler ve Hısımlık',
    topicNumber: 2,
    questionCount: 20,
    isLocked: false,
    isCompleted: false,
  },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 1,
    questionText:
      'İlk Türk devletlerinde hükümdara yönetme yetkisinin Gök Tanrı tarafından verildiğine inanılan anlayışa ne ad verilirdi?',
    options: [
      { id: 'A', text: 'Töre' },
      { id: 'B', text: 'Kut' },
      { id: 'C', text: 'Yarlığ' },
      { id: 'D', text: 'Toy' },
      { id: 'E', text: 'Kurultay' },
    ],
    correctOption: 'B',
    explanation:
      'Gök Tanrı tarafından kağana verildiğine inanılan siyasi ve egemenlik gücüne "Kut" denir. Kut anlayışı, kan yoluyla hanedanın tüm erkek üyelerine geçtiği kabul edildiği için taht kavgalarına ve devletlerin kısa sürede bölünmesine zemin hazırlamıştır.',
  },
  {
    id: 'q-2',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 2,
    questionText:
      'İslamiyet öncesi Türk devletlerinde devlet işlerinin görüşülüp karara bağlandığı meclise ne ad verilirdi?',
    options: [
      { id: 'A', text: 'Kurultay (Toy / Kengeş)' },
      { id: 'B', text: 'Ayukı' },
      { id: 'C', text: 'Buyruk' },
      { id: 'D', text: 'Tudun' },
      { id: 'E', text: 'Bitikçi' },
    ],
    correctOption: 'A',
    explanation:
      'İlk Türk devletlerinde siyasi, askerî, ekonomik ve hukuki meselelerin görüşüldüğü danışma ve karar meclisine Kurultay, Toy veya Kengeş adı verilirdi. Meclis üyelerine ise "Toygun" denilirdi.',
  },
  {
    id: 'q-3',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 3,
    questionText:
      'Eski Türklerde devlet teşkilatlanmasında görülen "İkili Teşkilat" sistemiyle ilgili olarak aşağıdakilerden hangisi yanlıştır?',
    options: [
      { id: 'A', text: 'Devlet Doğu ve Batı olmak üzere iki idari kanada ayrılmıştır.' },
      { id: 'B', text: 'Kutsal sayılan doğu kanadını asıl hükümdar (Kağan) yönetmiştir.' },
      { id: 'C', text: 'Batı kanadını kağanın kardeşi veya hanedan üyesi "Yabgu" unvanıyla yönetmiştir.' },
      { id: 'D', text: 'Yabgu, iç işlerinde serbest fakat dış politikada doğrudan doğudaki kağana bağlıdır.' },
      { id: 'E', text: 'Bu sistem merkezi otoriteyi mutlak surette güçlendirmiş ve taht kavgalarını tamamen önlemiştir.' },
    ],
    correctOption: 'E',
    explanation:
      'İkili teşkilat sistemi geniş coğrafyalarda devleti yönetmeyi kolaylaştırsa da federatif bir yapı oluşturduğu için zamanla batı kanadının bağımsızlık mücadelesine ve taht kavgalarına yol açmış, merkezi otoritenin zayıflamasına neden olmuştur.',
  },
  {
    id: 'q-4',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 4,
    questionText:
      'Türk tarihinde ilk kez düzenli ordu teşkilatını (onlu sistem) kuran ve MÖ 209 yılı Türk Kara Kuvvetlerinin kuruluş tarihi olarak kabul edilen hükümdar kimdir?',
    options: [
      { id: 'A', text: 'Teoman' },
      { id: 'B', text: 'Mete Han' },
      { id: 'C', text: 'Bumin Kağan' },
      { id: 'D', text: 'Kutluk Kağan' },
      { id: 'E', text: 'Mukan Kağan' },
    ],
    correctOption: 'B',
    explanation:
      'Asya Hun Devleti hükümdarı Mete Han, Türk ordu sistemini onluk, yüzlük, binlik ve tümen birliklerine bölerek onlu sistemi kurmuştur. Bu askeri disiplin dünya ordularına model olmuştur.',
  },
  {
    id: 'q-5',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 5,
    questionText:
      'Avrupa Hun Devleti’nin en parlak dönemini yaşatan, Bizans’ı vergiye bağlayan ve Batı dünyasında "Tanrı’nın Kırbacı", Nibelungen Destanı’nda ise "Etzel" olarak anılan hükümdar aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', text: 'Balamir' },
      { id: 'B', text: 'Uldız' },
      { id: 'C', text: 'Rua' },
      { id: 'D', text: 'Attila' },
      { id: 'E', text: 'Dengizik' },
    ],
    correctOption: 'D',
    explanation:
      'Attila, Avrupa Hun Devleti’nin en kudretli lideridir. Margos ve Anatolios antlaşmalarıyla Doğu Roma’yı (Bizans) vergiye bağlamış, Batı Roma üzerine Galya ve İtalya seferlerini düzenlemiştir.',
  },
  {
    id: 'q-6',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 6,
    questionText:
      'Türk adıyla kurulan ilk Türk devleti aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', text: 'Asya Hun Devleti' },
      { id: 'B', text: 'I. Göktürk Devleti' },
      { id: 'C', text: 'Uygur Devleti' },
      { id: 'D', text: 'Avar Devleti' },
      { id: 'E', text: 'Hazar Kağanlığı' },
    ],
    correctOption: 'B',
    explanation:
      'Bumin Kağan önderliğinde 552 yılında Ötüken merkezli kurulan I. Göktürk Devleti, tarihte "Türk" adını resmî bir devlet adı olarak kullanan ilk devlettir.',
  },
  {
    id: 'q-7',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 7,
    questionText:
      'II. Göktürk (Kutluk) Devleti’nin kurucusu olan ve dağınık Türk boylarını bir araya toplayıp derlediği için "İlteriş" unvanını alan kağan kimdir?',
    options: [
      { id: 'A', text: 'Kutluk Kağan' },
      { id: 'B', text: 'Kapgan Kağan' },
      { id: 'C', text: 'Bilge Kağan' },
      { id: 'D', text: 'Kültigin' },
      { id: 'E', text: 'Tonyukuk' },
    ],
    correctOption: 'A',
    explanation:
      'Çin esaretine karşı bağımsızlık mücadelesini başlatan Kutluk Kağan, devleti yeniden toparladığı için "ili/devleti derleyen, toparlayan" anlamına gelen "İlteriş" unvanını almıştır.',
  },
  {
    id: 'q-8',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 8,
    questionText:
      'Türk tarihinin ve edebiyatının ilk yazılı Türkçe belgeleri kabul edilen Orhun Abideleri hangi hükümdar ve devlet adamları adına dikilmiştir?',
    options: [
      { id: 'A', text: 'Mete Han - Teoman - Kiok' },
      { id: 'B', text: 'Bumin Kağan - İstemi Yabgu - Mukan Kağan' },
      { id: 'C', text: 'Vezir Tonyukuk - Kültigin - Bilge Kağan' },
      { id: 'D', text: 'Kutluk Bilge Kül Kağan - Bögü Kağan - Moyen-Çur' },
      { id: 'E', text: 'Attila - Balamir - Uldız' },
    ],
    correctOption: 'C',
    explanation:
      'Orhun Abideleri (Göktürk Yazıtları), II. Göktürk Devleti döneminde Vezir Tonyukuk (720), Kültigin (732) ve Bilge Kağan (735) adına dikilmiştir. Yazıtlar Yolluğ Tigin tarafından taşa kazınmış, 1893 yılında Danimarkalı dilbilimci Vilhelm Thomsen tarafından çözülmüştür.',
  },
  {
    id: 'q-9',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 9,
    questionText:
      'Maniheizm ve Budizm dinlerini kabul ederek Türk tarihinde ilk defa yerleşik hayata geçen, saray, tapınak ve kütüphaneler inşa eden Türk devleti hangisidir?',
    options: [
      { id: 'A', text: 'Hunlar' },
      { id: 'B', text: 'Göktürkler' },
      { id: 'C', text: 'Uygurlar' },
      { id: 'D', text: 'Hazarlar' },
      { id: 'E', text: 'Türgişler' },
    ],
    correctOption: 'C',
    explanation:
      'Bögü Kağan döneminde Maniheizm dinini resmî din olarak benimseyen Uygurlar, et yemeyi ve savaşmayı yasaklayan bu inancın etkisiyle göçebe bozkır kültüründen yerleşik hayata geçmiş; tarım, kalıcı mimari ve matbaacılıkta büyük ilerleme kaydetmiştir.',
  },
  {
    id: 'q-10',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 10,
    questionText:
      'Tarihte Musevilik dinini benimseyen tek Türk devleti olan, ordusunda paralı askerler bulunduran ve egemen olduğu sahada sağladığı huzur ortamı "Pax Chazarica" olarak adlandırılan devlet hangisidir?',
    options: [
      { id: 'A', text: 'Hazarlar' },
      { id: 'B', text: 'Peçenekler' },
      { id: 'C', text: 'Avarlar' },
      { id: 'D', text: 'Kıpçaklar' },
      { id: 'E', text: 'İtil Bulgarları' },
    ],
    correctOption: 'A',
    explanation:
      'Hazarlar, yönetici zümresi Museviliği kabul eden ilk ve tek Türk devletidir. Ticaret yollarını denetleyerek zenginleşmiş, hoşgörülü yönetimleriyle farklı dinlerden insanların bir arada yaşadığı "Hazar Barış Çağı"nı kurmuşlardır.',
  },
  {
    id: 'q-11',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 11,
    questionText:
      'Hem Orta Asya’da hem de Orta Avrupa’da devlet kuran, Sasanilerle ittifak kurarak İstanbul’u iki kez kuşatan ilk Türk devleti aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', text: 'Hunlar' },
      { id: 'B', text: 'Avarlar' },
      { id: 'C', text: 'Bulgarlar' },
      { id: 'D', text: 'Macarlar' },
      { id: 'E', text: 'Peçenekler' },
    ],
    correctOption: 'B',
    explanation:
      'Avarlar (Juan-Juan), Bayan Kağan döneminde Avrupa’ya göç ederek güçlü bir imparatorluk kurmuş ve 619 ile 626 yıllarında İstanbul’u kuşatan ilk Türk devleti olmuştur. Ayrıca Avrupa’ya üzengi kullanımını tanıtmışlardır.',
  },
  {
    id: 'q-12',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 12,
    questionText:
      'Tarihte bağımsız bir devlet kuramayıp boy teşkilatı halinde yaşayan, Bizans ordusunda ücretli askerlik yaparken 1071 Malazgirt Savaşı’nda Büyük Selçukluların tarafına geçen Türk topluluğu hangisidir?',
    options: [
      { id: 'A', text: 'Peçenekler' },
      { id: 'B', text: 'Kıpçaklar' },
      { id: 'C', text: 'Karluklar' },
      { id: 'D', text: 'Türgişler' },
      { id: 'E', text: 'Kırgızlar' },
    ],
    correctOption: 'A',
    explanation:
      'Peçenekler, Karadeniz’in kuzeyinde ve Balkanlar’da boy halinde varlık göstermiş, devlet teşkilatı kuramamıştır. Bizans ordusunda paralı askerlik yaparken 1071 Malazgirt Savaşı’nda Alp Arslan’ın ordusuna geçerek savaşın kazanılmasında kilit rol oynamışlardır.',
  },
  {
    id: 'q-13',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 13,
    questionText:
      'Almış Han döneminde İslamiyet’i resmen kabul eden ve Doğu Avrupa’da İslamiyet’i benimseyen ilk Türk devleti aşağıdakilerden hangisidir?',
    options: [
      { id: 'A', text: 'Karahanlılar' },
      { id: 'B', text: 'Gazneliler' },
      { id: 'C', text: 'İtil (Volga) Bulgarları' },
      { id: 'D', text: 'Tuna Bulgarları' },
      { id: 'E', text: 'Ak Hunlar' },
    ],
    correctOption: 'C',
    explanation:
      'İtil (Volga) Bulgarları, Almış Han zamanında (922) Abbasilerden elçi heyeti isteyerek İslamiyet’i resmen kabul etmiş ve Doğu Avrupa’da İslamiyeti benimseyen ilk Türk devleti olmuştur. Bu elçilik heyetinde ünlü seyyah İbn Fadlan da yer almıştır.',
  },
  {
    id: 'q-14',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 14,
    questionText:
      'Dede Korkut Hikâyeleri ile Rusların İgor Destanı’na konu olan ve hazırladıkları "Codex Cumanicus" adlı iki ciltlik sözlükle tanınan Türk kavmi hangisidir?',
    options: [
      { id: 'A', text: 'Kıpçaklar (Kumanlar)' },
      { id: 'B', text: 'Oğuzlar' },
      { id: 'C', text: 'Karluklar' },
      { id: 'D', text: 'Kırgızlar' },
      { id: 'E', text: 'Hazarlar' },
    ],
    correctOption: 'A',
    explanation:
      'Kıpçaklar (Kumanlar), sarışın ve mavi gözlü bozkır süvarileri olarak bilinir. Oğuzlarla yaptıkları mücadeleler Dede Korkut Hikâyelerine, Ruslarla mücadeleleri ise İgor Destanına yansımıştır. İtalyan ve Alman tüccarlar için hazırlanan Codex Cumanicus sözlüğü Kıpçak Türkçesinin en değerli eseridir.',
  },
  {
    id: 'q-15',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 15,
    questionText:
      '751 Talas Savaşı’nda Çinlilere karşı Müslüman Arapların tarafında yer alarak İslam ordusunun zafer kazanmasını sağlayan ve İslamiyet’i kabul eden ilk Türk boyu hangisidir?',
    options: [
      { id: 'A', text: 'Karluklar' },
      { id: 'B', text: 'Yağmalar' },
      { id: 'C', text: 'Çiğiller' },
      { id: 'D', text: 'Tuhsiler' },
      { id: 'E', text: 'Basmıllar' },
    ],
    correctOption: 'A',
    explanation:
      'Karluklar, 751 Talas Savaşı’nda Abbasilerin yanında yer alarak Orta Asya’nın Çin hakimiyetine girmesini engellemiş ve boy halinde İslamiyet’i kabul eden ilk Türk boyu olmuştur. Ayrıca ilk Türk-İslam devleti olan Karahanlılar’ın kuruluşunda da temel unsur olmuşlardır.',
  },
  {
    id: 'q-16',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 16,
    questionText:
      'İslamiyet öncesi Türk toplumunda sosyal yapıyı oluşturan temel basamakların küçükten büyüğe doğru sıralanışı aşağıdakilerden hangisinde doğru verilmiştir?',
    options: [
      { id: 'A', text: 'Oguş (Aile) - Urug (Sülale) - Boy (Kabile) - Bodun (Millet) - İl (Devlet)' },
      { id: 'B', text: 'Urug - Oguş - Bodun - Boy - İl' },
      { id: 'C', text: 'Oguş - Boy - Urug - İl - Bodun' },
      { id: 'D', text: 'İl - Bodun - Boy - Urug - Oguş' },
      { id: 'E', text: 'Oguş - Urug - İl - Boy - Bodun' },
    ],
    correctOption: 'A',
    explanation:
      'Eski Türk toplum yapısında hiyerarşik sıralama: Oguş (Aile) birleşerek Urug’u (Aileler birliği / sülale), Uruglar birleşerek Boy’u (Kabile), Boylar birleşerek Bodun’u (Millet), Bodunlar da siyasi örgütlenme olan İl’i (Devlet) meydana getirirdi.',
  },
  {
    id: 'q-17',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 17,
    questionText:
      'İlk Türk devletlerinde yazısız hukuk kurallarına "Töre" adı verilirdi. Törenin değişmez ve evrensel kabul edilen ilkeleri arasında aşağıdakilerden hangisi yer almaz?',
    options: [
      { id: 'A', text: 'Könilik (Adalet)' },
      { id: 'B', text: 'Uzluk (Faydalılık / İyilik)' },
      { id: 'C', text: 'Tüzlük (Eşitlik)' },
      { id: 'D', text: 'Kişilik (İnsanlık)' },
      { id: 'E', text: 'Mutlakıyet (Kağanın keyfi yetkisi)' },
    ],
    correctOption: 'E',
    explanation:
      'Töre, Türk devlet felsefesinin temeli olup Kağan dahi töre hükümlerine uymak zorundaydı. Törenin dört değişmez temel ilkesi şunlardır: Könilik (adalet), Uzluk (iyilik/yararlılık), Tüzlük (eşitlik) ve Kişilik/İnsaniyet (insanlık). Kağanın törenin üstünde mutlak ya da keyfi bir otoritesi bulunamazdı.',
  },
  {
    id: 'q-18',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 18,
    questionText:
      'İslamiyet öncesi Türk inanç sisteminde cenaze törenine "Yuğ", mezara "Kurgan" ve cennete ise ne ad verilirdi?',
    options: [
      { id: 'A', text: 'Tamu' },
      { id: 'B', text: 'Uçmağ' },
      { id: 'C', text: 'Balbal' },
      { id: 'D', text: 'Kült' },
      { id: 'E', text: 'Ongun' },
    ],
    correctOption: 'B',
    explanation:
      'Gök Tanrı inancında ahiret inancı mevcuttu. Cenaze törenine "Yuğ", ölülerin eşyalarıyla gömüldüğü mezarlara "Kurgan", mezar taşı niteliğindeki heykellere "Balbal", cennete "Uçmağ", cehenneme ise "Tamu" adı verilirdi.',
  },
  {
    id: 'q-19',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 19,
    questionText:
      'Altay Dağları eteklerinde bulunan ve günümüzde Ermitaj Müzesi’nde sergilenen dünyanın bilinen en eski düğümlü halısı "Pazırık Halısı" hangi Türk topluluğuna aittir?',
    options: [
      { id: 'A', text: 'Hunlar' },
      { id: 'B', text: 'Göktürkler' },
      { id: 'C', text: 'Uygurlar' },
      { id: 'D', text: 'İskitler (Sakalar)' },
      { id: 'E', text: 'Karluklar' },
    ],
    correctOption: 'A',
    explanation:
      'Pazırık Kurganı’nda keşfedilen ve MÖ 5-4. yüzyıllara tarihlenen Pazırık Halısı Asya Hunlarına aittir. Türklerin ileri düzeyde dokumacılık ve koyun yününü işleme teknolojisine sahip olduğunu gösteren somut bir kanıttır.',
  },
  {
    id: 'q-20',
    unitId: 'ilk-turk-devletleri',
    questionNumber: 20,
    questionText:
      'Aşağıdakilerden hangisi İslamiyet öncesi Türk devletlerinde hükümdarlık alametleri (sembolleri) arasında yer almaz?',
    options: [
      { id: 'A', text: 'Otağ (Hükümdar çadırı)' },
      { id: 'B', text: 'Kotuz / Sorguç (Başlık süsü)' },
      { id: 'C', text: 'Nevbet (Davul)' },
      { id: 'D', text: 'Tuğ (Sancak)' },
      { id: 'E', text: 'Hutbe okutmak' },
    ],
    correctOption: 'E',
    explanation:
      'Otağ, Kotuz, Nevbet, Tuğ, Örgin (taht), Kama (bıçak), Kemer (kur) ve Yay İslamiyet öncesi Türk hükümdarlık alametleridir. Ancak "Hutbe okutmak" ve "Para üzerine halifenin adını yazdırmak" İslamiyet’in kabulünden sonra Türk-İslam devletlerinde ortaya çıkan hükümdarlık sembolleridir.',
  },
];

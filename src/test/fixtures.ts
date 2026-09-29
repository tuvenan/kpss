import { Question } from '../types';

export const sampleQuestions: Question[] = [
  {
    id: 'q1',
    questionNumber: 1,
    questionText: 'Türkiye Selçuklu Devleti kurucusu kimdir?',
    subjectTitle: 'Tarih',
    unitId: 'unit-selcuklu',
    topicId: 'topic-selcuklu-1',
    options: [
      { id: 'A', text: 'Kutalmışoğlu Süleyman Şah' },
      { id: 'B', text: 'Alparslan' },
      { id: 'C', text: 'Tuğrul Bey' },
      { id: 'D', text: 'Osman Bey' },
    ],
    correctOption: 'A',
    explanation: 'Devletin kurucusu Kutalmışoğlu Süleyman Şah’tır.',
  },
  {
    id: 'q2',
    questionNumber: 2,
    questionText: 'Aşağıdakilerden hangisi bir eylemsi (fiilimsi) değildir?',
    subjectTitle: 'Türkçe',
    unitId: 'unit-dilbilgisi',
    topicId: 'topic-fiilimsi',
    options: [
      { id: 'A', text: 'Koşarak' },
      { id: 'B', text: 'Gelen' },
      { id: 'C', text: 'Okumak' },
      { id: 'D', text: 'Geldi' },
    ],
    correctOption: 'D',
    explanation: 'Geldi çekimli fiildir.',
  },
  {
    id: 'q3',
    questionNumber: 3,
    questionText: 'Türkiye’nin en yüksek dağı hangisidir?',
    subjectTitle: 'Coğrafya',
    unitId: 'unit-fiziki',
    topicId: 'topic-daglar',
    options: [
      { id: 'A', text: 'Erciyes Dağı' },
      { id: 'B', text: 'Ağrı Dağı' },
      { id: 'C', text: 'Kaçkar Dağı' },
      { id: 'D', text: 'Süphan Dağı' },
    ],
    correctOption: 'B',
    explanation: 'Türkiye’nin en yüksek zirvesi 5137 metre ile Ağrı Dağı’dır.',
  },
];

import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Subject, Unit, Topic, QuestionBank, Question } from '../../../types';
import { StudentTabType, StudentViewState } from '../types';

export interface UseCurriculumNavigationProps {
  setQuestions: (qList: Question[]) => void;
}

export const useCurriculumNavigation = ({ setQuestions }: UseCurriculumNavigationProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicBanks, setTopicBanks] = useState<QuestionBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);
  const [unpublishedModalInfo, setUnpublishedModalInfo] = useState<{
    topicTitle: string;
    questionCount: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<StudentTabType>('home');
  const [viewState, setViewState] = useState<StudentViewState>('subjects');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const list = await api.getSubjects();
      setSubjects(list);
    } catch (e) {
      console.warn('Dersler yüklenemedi:', e);
    }
  };

  const handleSelectSubject = async (sub: Subject) => {
    setSelectedSubject(sub);
    const unitList = await api.getUnits(sub.id);
    setUnits(unitList);
    setViewState('units');
  };

  const handleSelectUnit = async (unit: Unit) => {
    if (unit.isLocked) return;
    setSelectedUnit(unit);
    const topicList = await api.getTopics(unit.id);
    setTopics(topicList);
    setViewState('topics');
  };

  const handleSelectTopic = async (topic: Topic) => {
    if (topic.isLocked) return;
    try {
      localStorage.setItem(
        'kpss_last_activity_v1',
        JSON.stringify({
          type: 'topic',
          title: `${selectedSubject?.title || 'KPSS'} — ${topic.title}`,
          subtitle: `${selectedUnit?.title || 'Ünite'} Konu Testi`,
          subjectTitle: selectedSubject?.title,
          topicTitle: topic.title,
          topicId: topic.id,
          questionCount: topic.questionCount || 20,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {}

    setSelectedTopic(topic);
    setIsLoadingBanks(true);
    try {
      const banks = await api.getQuestionBanks(topic.id, selectedUnit?.id);
      setTopicBanks(banks);
      if (banks.length > 0) {
        setSelectedBank(banks[0]);
        const qList = await api.getQuestions(topic.id, banks[0].id);
        setQuestions(qList);
      } else {
        setSelectedBank(null);
        const qList = await api.getQuestions(topic.id);
        setQuestions(qList);
      }
    } catch {
      setTopicBanks([]);
      setSelectedBank(null);
      setQuestions([]);
    } finally {
      setIsLoadingBanks(false);
    }
    setViewState('unit-detail');
  };

  const handleSelectBank = async (bank: QuestionBank) => {
    setSelectedBank(bank);
    if (selectedTopic) {
      try {
        const qList = await api.getQuestions(selectedTopic.id, bank.id);
        setQuestions(qList);
      } catch {
        setQuestions([]);
      }
    }
  };

  return {
    subjects,
    setSubjects,
    selectedSubject,
    setSelectedSubject,
    units,
    setUnits,
    selectedUnit,
    setSelectedUnit,
    topics,
    setTopics,
    selectedTopic,
    setSelectedTopic,
    topicBanks,
    setTopicBanks,
    selectedBank,
    setSelectedBank,
    isLoadingBanks,
    unpublishedModalInfo,
    setUnpublishedModalInfo,
    activeTab,
    setActiveTab,
    viewState,
    setViewState,
    loadSubjects,
    handleSelectSubject,
    handleSelectUnit,
    handleSelectTopic,
    handleSelectBank,
  };
};

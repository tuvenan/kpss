import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Subject, Unit, Topic, Question } from '../../../types';

export const useAdminCurriculum = (
  isAuthenticated: boolean,
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form input states
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Editing modal states
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Load functions
  const loadAllSubjects = async () => {
    setIsLoading(true);
    try {
      const list = await api.getSubjects();
      setSubjects(list);
      if (list.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(list[0].id);
      }
    } catch (e) {
      notify('Dersler yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnitsForSubject = async (subId: string) => {
    setIsLoading(true);
    try {
      const list = await api.getUnits(subId);
      setUnits(list);
      if (list.length > 0) {
        setSelectedUnitId(list[0].id);
      } else {
        setSelectedUnitId('');
        setTopics([]);
        setSelectedTopicId('');
        setQuestions([]);
      }
    } catch (e) {
      notify('Üniteler yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopicsForUnit = async (uId: string) => {
    setIsLoading(true);
    try {
      const list = await api.getTopics(uId);
      setTopics(list);
      if (list.length > 0) {
        setSelectedTopicId(list[0].id);
      } else {
        setSelectedTopicId('');
      }
    } catch (e) {
      notify('Konular yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestionsForTarget = async (targetId: string) => {
    setIsLoading(true);
    try {
      const list = await api.getQuestions(targetId);
      setQuestions(list);
    } catch (e) {
      notify('Sorular yüklenirken hata oluştu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      loadAllSubjects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedSubjectId) {
      loadUnitsForSubject(selectedSubjectId);
    } else {
      setUnits([]);
      setSelectedUnitId('');
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedUnitId) {
      loadTopicsForUnit(selectedUnitId);
    } else {
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    if (selectedTopicId) {
      loadQuestionsForTarget(selectedTopicId);
    } else if (selectedUnitId) {
      loadQuestionsForTarget(selectedUnitId);
    } else {
      setQuestions([]);
    }
  }, [selectedTopicId, selectedUnitId]);

  // Subject CRUD
  const handleCreateSubject = async () => {
    const title = newSubjectTitle.trim();
    if (!title) return;
    try {
      await api.adminCreateSubject(title);
      setNewSubjectTitle('');
      await loadAllSubjects();
      notify(`"${title}" dersi başarıyla eklendi!`);
    } catch (err) {
      notify('Ders eklenirken bir hata oluştu', 'error');
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject || !editingSubject.title.trim()) return;
    try {
      await api.adminUpdateSubject(editingSubject.id, editingSubject.title.trim());
      setEditingSubject(null);
      await loadAllSubjects();
      notify('Ders bilgisi güncellendi.');
    } catch (e) {
      notify('Ders güncellenemedi', 'error');
    }
  };

  const handleDeleteSubject = async (id: string, title: string) => {
    if (!confirm(`"${title}" dersini ve buna bağlı tüm alt içerikleri silmek istediğinize emin misiniz?`)) return;
    try {
      await api.adminDeleteSubject(id);
      if (selectedSubjectId === id) setSelectedSubjectId('');
      await loadAllSubjects();
      notify(`"${title}" dersi silindi.`);
    } catch (e) {
      notify('Ders silinirken hata oluştu', 'error');
    }
  };

  // Unit CRUD
  const handleCreateUnit = async () => {
    const title = newUnitTitle.trim();
    if (!title || !selectedSubjectId) {
      notify('Lütfen ünite başlığı giriniz.', 'error');
      return;
    }
    try {
      const unitNumber = units.length + 1;
      await api.adminCreateUnit(selectedSubjectId, title, unitNumber);
      setNewUnitTitle('');
      await loadUnitsForSubject(selectedSubjectId);
      notify(`"${title}" ünitesi başarıyla eklendi.`);
    } catch (e) {
      notify('Ünite eklenemedi', 'error');
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit || !editingUnit.title.trim()) return;
    try {
      await api.adminUpdateUnit(editingUnit.id, editingUnit.title.trim(), editingUnit.unitNumber);
      setEditingUnit(null);
      await loadUnitsForSubject(selectedSubjectId);
      notify('Ünite bilgisi güncellendi.');
    } catch (e) {
      notify('Ünite güncellenemedi', 'error');
    }
  };

  const handleDeleteUnit = async (id: string, title: string) => {
    if (!confirm(`"${title}" ünitesini silmek istediğinize emin misiniz?`)) return;
    try {
      await api.adminDeleteUnit(id);
      if (selectedUnitId === id) setSelectedUnitId('');
      await loadUnitsForSubject(selectedSubjectId);
      notify(`"${title}" ünitesi silindi.`);
    } catch (e) {
      notify('Ünite silinemedi', 'error');
    }
  };

  // Topic CRUD
  const handleCreateTopic = async () => {
    const title = newTopicTitle.trim();
    if (!title || !selectedUnitId) {
      notify('Lütfen konu başlığı giriniz.', 'error');
      return;
    }
    try {
      const topicNumber = topics.length + 1;
      await api.adminCreateTopic(selectedUnitId, title, topicNumber);
      setNewTopicTitle('');
      await loadTopicsForUnit(selectedUnitId);
      notify(`"${title}" konusu başarıyla eklendi.`);
    } catch (e) {
      notify('Konu eklenemedi', 'error');
    }
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic || !editingTopic.title.trim()) return;
    try {
      await api.adminUpdateTopic(editingTopic.id, editingTopic.title.trim(), editingTopic.topicNumber);
      setEditingTopic(null);
      await loadTopicsForUnit(selectedUnitId);
      notify('Konu bilgisi güncellendi.');
    } catch (e) {
      notify('Konu güncellenemedi', 'error');
    }
  };

  const handleDeleteTopic = async (id: string, title: string) => {
    if (!confirm(`"${title}" konusunu silmek istediğinize emin misiniz?`)) return;
    try {
      await api.adminDeleteTopic(id);
      if (selectedTopicId === id) setSelectedTopicId('');
      await loadTopicsForUnit(selectedUnitId);
      notify(`"${title}" konusu silindi.`);
    } catch (e) {
      notify('Konu silinemedi', 'error');
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentUnit = units.find((u) => u.id === selectedUnitId);
  const currentTopic = topics.find((t) => t.id === selectedTopicId);

  return {
    subjects,
    setSubjects,
    selectedSubjectId,
    setSelectedSubjectId,
    units,
    setUnits,
    selectedUnitId,
    setSelectedUnitId,
    topics,
    setTopics,
    selectedTopicId,
    setSelectedTopicId,
    questions,
    setQuestions,
    isLoading,
    newSubjectTitle,
    setNewSubjectTitle,
    newUnitTitle,
    setNewUnitTitle,
    newTopicTitle,
    setNewTopicTitle,
    editingSubject,
    setEditingSubject,
    editingUnit,
    setEditingUnit,
    editingTopic,
    setEditingTopic,
    loadAllSubjects,
    loadUnitsForSubject,
    loadTopicsForUnit,
    loadQuestionsForTarget,
    handleCreateSubject,
    handleUpdateSubject,
    handleDeleteSubject,
    handleCreateUnit,
    handleUpdateUnit,
    handleDeleteUnit,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    currentSubject,
    currentUnit,
    currentTopic,
  };
};

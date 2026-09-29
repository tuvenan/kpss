import { useState } from 'react';
import { api } from '../../../services/api';
import { Question, OptionId } from '../../../types';

export interface QuestionFormData {
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correctOption: OptionId;
  explanation: string;
}

const initialFormData: QuestionFormData = {
  text: '',
  options: {
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
  },
  correctOption: 'A',
  explanation: '',
};

export const useQuestionEditor = (
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
) => {
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(initialFormData);

  const openNewQuestionModal = () => {
    setEditingQuestionId(null);
    setFormData(initialFormData);
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestionId(q.id);
    const getOpt = (id: OptionId) => q.options.find((o) => o.id === id)?.text || '';
    setFormData({
      text: q.questionText,
      options: {
        A: getOpt('A'),
        B: getOpt('B'),
        C: getOpt('C'),
        D: getOpt('D'),
        E: getOpt('E'),
      },
      correctOption: q.correctOption,
      explanation: q.explanation || '',
    });
    setShowQuestionModal(true);
  };

  const updateFormField = <K extends keyof QuestionFormData>(field: K, value: QuestionFormData[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateOptionText = (optionId: OptionId, text: string) => {
    setFormData((prev) => ({
      ...prev,
      options: {
        ...prev.options,
        [optionId]: text,
      },
    }));
  };

  const handleSaveQuestion = async (
    e: React.FormEvent,
    selectedUnitId: string,
    selectedTopicId: string,
    questions: Question[],
    onReload: (targetId: string) => Promise<void>
  ) => {
    e.preventDefault();
    const targetId = selectedTopicId || selectedUnitId;
    if (!targetId) {
      notify('Lütfen soru eklenecek bir ünite veya konu seçiniz.', 'error');
      return;
    }
    if (!formData.text.trim()) {
      notify('Lütfen soru metnini yazınız.', 'error');
      return;
    }
    if (
      !formData.options.A.trim() ||
      !formData.options.B.trim() ||
      !formData.options.C.trim() ||
      !formData.options.D.trim() ||
      !formData.options.E.trim()
    ) {
      notify('Lütfen 5 seçeneğin (A, B, C, D, E) tamamını doldurunuz.', 'error');
      return;
    }

    const questionData: Question = {
      id: editingQuestionId || `${targetId}-q${questions.length + 1}`,
      unitId: selectedUnitId,
      topicId: selectedTopicId || undefined,
      questionNumber: editingQuestionId
        ? questions.find((q) => q.id === editingQuestionId)?.questionNumber || 1
        : questions.length + 1,
      questionText: formData.text.trim(),
      options: [
        { id: 'A', text: formData.options.A.trim() },
        { id: 'B', text: formData.options.B.trim() },
        { id: 'C', text: formData.options.C.trim() },
        { id: 'D', text: formData.options.D.trim() },
        { id: 'E', text: formData.options.E.trim() },
      ],
      correctOption: formData.correctOption,
      explanation: formData.explanation.trim(),
    };

    try {
      if (editingQuestionId) {
        await api.adminUpdateQuestion(questionData);
        notify('Soru başarıyla güncellendi.');
      } else {
        await api.adminCreateQuestion(questionData);
        notify('Yeni soru başarıyla eklendi.');
      }
      setShowQuestionModal(false);
      await onReload(targetId);
    } catch (err) {
      notify('Soru kaydedilirken bir hata oluştu', 'error');
    }
  };

  const handleDeleteQuestion = async (
    id: string,
    targetId: string,
    onReload: (targetId: string) => Promise<void>
  ) => {
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.adminDeleteQuestion(id);
      await onReload(targetId);
      notify('Soru başarıyla silindi.');
    } catch (e) {
      notify('Soru silinemedi', 'error');
    }
  };

  const handleDeleteAllQuestions = async (
    questions: Question[],
    targetId: string,
    onReload: (targetId: string) => Promise<void>
  ) => {
    if (!confirm('Bu konudaki/ünitedeki TÜM sorular silinecektir! Emin misiniz?')) return;
    try {
      for (const q of questions) {
        await api.adminDeleteQuestion(q.id);
      }
      await onReload(targetId);
      notify('Tüm sorular temizlendi.');
    } catch (e) {
      notify('Sorular silinirken hata oluştu', 'error');
    }
  };

  return {
    showQuestionModal,
    setShowQuestionModal,
    editingQuestionId,
    formData,
    openNewQuestionModal,
    openEditQuestionModal,
    updateFormField,
    updateOptionText,
    handleSaveQuestion,
    handleDeleteQuestion,
    handleDeleteAllQuestions,
  };
};

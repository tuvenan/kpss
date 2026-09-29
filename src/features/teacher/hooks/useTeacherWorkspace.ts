import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  teacherService,
  TeacherClass,
  ClassStudent,
  TeacherAssignment,
  TeacherQuestionSet,
  TeacherOverviewMetrics,
} from '../../../services/teacherService';
import { TeacherTabType, TeacherNotification } from '../types';

export const useTeacherWorkspace = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTabType>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<TeacherNotification | null>(null);

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [questionSets, setQuestionSets] = useState<TeacherQuestionSet[]>([]);
  const [metrics, setMetrics] = useState<TeacherOverviewMetrics>({
    totalClasses: 0,
    activeStudentsCount: 0,
    pendingAssignmentsCount: 0,
    recentSubmissions: [],
    lowPerformanceAlerts: [],
  });

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [
        fetchedClasses,
        fetchedStudents,
        fetchedAssignments,
        fetchedSets,
        fetchedMetrics,
      ] = await Promise.all([
        teacherService.getMyClasses(user.id),
        teacherService.getAllMyStudents(user.id),
        teacherService.getAllMyAssignments(user.id),
        teacherService.getTeacherQuestionSets(user.id),
        teacherService.getTeacherOverviewMetrics(user.id),
      ]);

      setClasses(fetchedClasses);
      setStudents(fetchedStudents);
      setAssignments(fetchedAssignments);
      setQuestionSets(fetchedSets);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.warn('Teacher workspace load error:', err);
      notify('Veriler yüklenirken bir hata oluştu.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sınıf İşlemleri
  const handleCreateClass = async (name: string, description: string) => {
    if (!user?.id) return { success: false, error: 'Oturum bulunamadı.' };
    const res = await teacherService.createClass(user.id, name, description);
    if (res.success && res.data) {
      notify(`"${name}" sınıfı oluşturuldu. Davet kodu hazır!`, 'success');
      await loadData();
      return { success: true };
    }
    notify(res.error || 'Sınıf oluşturulamadı.', 'error');
    return { success: false, error: res.error };
  };

  const handleUpdateClass = async (classId: string, name: string, description: string) => {
    if (!user?.id) return false;
    const res = await teacherService.updateClass(classId, user.id, name, description);
    if (res.success) {
      notify('Sınıf bilgileri güncellendi.', 'success');
      await loadData();
      return true;
    }
    notify(res.error || 'Güncelleme başarısız.', 'error');
    return false;
  };

  const handleArchiveClass = async (classId: string) => {
    if (!user?.id) return false;
    if (!window.confirm('Bu sınıfı arşivlemek istediğinize emin misiniz?')) return false;
    const res = await teacherService.archiveClass(classId, user.id);
    if (res.success) {
      notify('Sınıf arşivlendi.', 'info');
      await loadData();
      return true;
    }
    notify(res.error || 'Arşivleme başarısız.', 'error');
    return false;
  };

  const handleRegenerateCode = async (classId: string) => {
    if (!user?.id) return null;
    const res = await teacherService.regenerateInviteCode(classId, user.id);
    if (res.success && res.newCode) {
      notify(`Yeni davet kodu üretildi: ${res.newCode}`, 'success');
      await loadData();
      return res.newCode;
    }
    notify(res.error || 'Kod yenilenemedi.', 'error');
    return null;
  };

  const handleRevokeCode = async (classId: string) => {
    if (!user?.id) return false;
    if (!window.confirm('Bu davet kodunu iptal etmek istediğinize emin misiniz?')) return false;
    const res = await teacherService.revokeInviteCode(classId, user.id);
    if (res.success) {
      notify('Davet kodu süresi dolduruldu / iptal edildi.', 'info');
      await loadData();
      return true;
    }
    notify(res.error || 'İptal edilemedi.', 'error');
    return false;
  };

  // Ödev İşlemleri
  const handleCreateAssignment = async (params: {
    classId: string;
    title: string;
    description: string;
    assignmentType: 'quiz' | 'mock_exam' | 'study_plan';
    dueDays: number;
    targetStudentIds: string[];
    status: 'draft' | 'published';
  }) => {
    if (!user?.id) return { success: false, error: 'Oturum bulunamadı.' };
    const res = await teacherService.createAssignment(
      user.id,
      params.classId,
      params.title,
      params.description,
      params.assignmentType,
      {},
      params.dueDays,
      params.targetStudentIds,
      params.status
    );
    if (res.success) {
      notify('Ödev başarıyla atandı.', 'success');
      await loadData();
      return { success: true };
    }
    notify(res.error || 'Ödev atanamadı.', 'error');
    return { success: false, error: res.error };
  };

  const handleUpdateAssignmentStatus = async (
    assignmentId: string,
    status: 'draft' | 'published' | 'archived'
  ) => {
    if (!user?.id) return false;
    const res = await teacherService.updateAssignmentStatus(assignmentId, user.id, status);
    if (res.success) {
      notify(`Ödev durumu güncellendi: ${status}`, 'success');
      await loadData();
      return true;
    }
    notify(res.error || 'Durum güncellenemedi.', 'error');
    return false;
  };

  // Soru Seti İşlemleri
  const handleCreateQuestionSet = async (params: {
    title: string;
    description: string;
    classId: string | null;
    questions: any[];
  }) => {
    if (!user?.id) return { success: false, error: 'Oturum bulunamadı.' };
    const res = await teacherService.createTeacherQuestionSet(
      user.id,
      params.title,
      params.description,
      params.classId,
      '',
      params.questions
    );
    if (res.success) {
      notify('Özel soru seti kaydedildi.', 'success');
      await loadData();
      return { success: true };
    }
    notify(res.error || 'Soru seti kaydedilemedi.', 'error');
    return { success: false, error: res.error };
  };

  const handleDeleteQuestionSet = async (setId: string) => {
    if (!user?.id) return false;
    if (!window.confirm('Bu soru setini silmek istediğinize emin misiniz?')) return false;
    const res = await teacherService.deleteTeacherQuestionSet(setId, user.id);
    if (res.success) {
      notify('Soru seti silindi.', 'info');
      await loadData();
      return true;
    }
    notify(res.error || 'Soru seti silinemedi.', 'error');
    return false;
  };

  return {
    activeTab,
    setActiveTab,
    isLoading,
    notification,
    classes,
    students,
    assignments,
    questionSets,
    metrics,
    refresh: loadData,
    handleCreateClass,
    handleUpdateClass,
    handleArchiveClass,
    handleRegenerateCode,
    handleRevokeCode,
    handleCreateAssignment,
    handleUpdateAssignmentStatus,
    handleCreateQuestionSet,
    handleDeleteQuestionSet,
  };
};

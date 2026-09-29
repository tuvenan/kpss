import { useState, useCallback } from 'react';
import { StorageBreakdown } from '../types';

export const ADMIN_PASS_KEY = 'kpss_admin_custom_password_v1';

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export const getStorageBreakdown = (): StorageBreakdown => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      totalBytes: 0,
      totalFormatted: '0 B',
      keyCount: 0,
      curriculumBytes: 0,
      curriculumFormatted: '0 B',
      themeBytes: 0,
      themeFormatted: '0 B',
      studentBytes: 0,
      studentFormatted: '0 B',
      otherBytes: 0,
      otherFormatted: '0 B',
    };
  }

  let totalBytes = 0;
  let curriculumBytes = 0;
  let themeBytes = 0;
  let studentBytes = 0;
  let otherBytes = 0;
  const keyCount = localStorage.length;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const value = localStorage.getItem(key) || '';
    const itemBytes = (key.length + value.length) * 2;
    totalBytes += itemBytes;

    if (
      key.startsWith('kpss_local_custom') ||
      key.includes('curriculum') ||
      key.includes('question')
    ) {
      curriculumBytes += itemBytes;
    } else if (key.includes('theme')) {
      themeBytes += itemBytes;
    } else if (
      key.includes('student') ||
      key.includes('profile') ||
      key.includes('progress') ||
      key.includes('activity')
    ) {
      studentBytes += itemBytes;
    } else {
      otherBytes += itemBytes;
    }
  }

  return {
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    keyCount,
    curriculumBytes,
    curriculumFormatted: formatBytes(curriculumBytes),
    themeBytes,
    themeFormatted: formatBytes(themeBytes),
    studentBytes,
    studentFormatted: formatBytes(studentBytes),
    otherBytes,
    otherFormatted: formatBytes(otherBytes),
  };
};

export const useStorageManagement = (notify: (msg: string, type?: 'success' | 'error' | 'info') => void) => {
  const [storageInfo, setStorageInfo] = useState<StorageBreakdown>(() => getStorageBreakdown());
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);

  const updateStorageInfo = useCallback(() => {
    setStorageInfo(getStorageBreakdown());
  }, []);

  const handleClearBrowserCache = async () => {
    setIsClearingCache(true);
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      const adminAuth = sessionStorage.getItem('kpss_admin_auth');
      sessionStorage.clear();
      if (adminAuth) sessionStorage.setItem('kpss_admin_auth', adminAuth);

      updateStorageInfo();
      notify('Tarayıcı ve geçici önbellek başarıyla temizlendi!', 'success');
    } catch (err: any) {
      notify('Önbellek temizlenirken hata: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearCurriculumCache = async (onReload?: () => Promise<void>) => {
    if (!confirm('Yerel müfredat ve soru önbelleği temizlenecek. Soru verileri veritabanından / varsayılanlardan baştan yüklenecektir. Devam edilsin mi?')) return;
    setIsClearingCache(true);
    try {
      localStorage.removeItem('kpss_local_custom_subjects');
      localStorage.removeItem('kpss_local_custom_units');
      localStorage.removeItem('kpss_local_custom_topics');
      localStorage.removeItem('kpss_local_custom_questions');
      localStorage.removeItem('kpss_local_custom_question_banks');
      localStorage.removeItem('kpss_curriculum_last_published');

      if (onReload) {
        await onReload();
      }
      updateStorageInfo();
      notify('Müfredat ve soru önbelleği temizlendi, veriler yeniden yüklendi.', 'success');
    } catch (err: any) {
      notify('Müfredat önbelleği temizlenirken hata: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearStudentDataCache = async () => {
    if (!confirm('Öğrenci deneme geçmişi, çözülen soru istatistikleri ve haftalık aktivite önbelleği silinecek. Emin misiniz?')) return;
    setIsClearingCache(true);
    try {
      localStorage.removeItem('kpss_real_student_progress_v1');
      localStorage.removeItem('kpss_weekly_activity');
      localStorage.removeItem('kpss_user_progress');

      updateStorageInfo();
      notify('Öğrenci test ve ilerleme önbelleği başarıyla temizlendi.', 'success');
    } catch (err: any) {
      notify('Öğrenci verileri temizlenirken hata: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleClearAllStorage = async () => {
    if (!confirm('DİKKAT: Bu işlem tarayıcıdaki tüm önbellekleri, yerel depolamayı ve geçici verileri tamamen sıfırlayacaktır.\n\n(Yönetici şifreniz ve Supabase ayarlarınız korunacaktır).\n\nDevam etmek istiyor musunuz?')) return;
    setIsClearingCache(true);
    try {
      const savedAdminPass = localStorage.getItem(ADMIN_PASS_KEY);
      const savedSecret = localStorage.getItem('kpss_supabase_secret_key');

      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      sessionStorage.clear();
      localStorage.clear();

      if (savedAdminPass) localStorage.setItem(ADMIN_PASS_KEY, savedAdminPass);
      if (savedSecret) localStorage.setItem('kpss_supabase_secret_key', savedSecret);
      sessionStorage.setItem('kpss_admin_auth', 'true');

      updateStorageInfo();
      notify('Tüm sistem önbelleği ve yerel depolama başarıyla temizlendi! Sayfa yenileniyor...', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      notify('Sıfırlama hatası: ' + (err?.message || 'Bilinmeyen hata'), 'error');
      setIsClearingCache(false);
    }
  };

  return {
    storageInfo,
    isClearingCache,
    updateStorageInfo,
    handleClearBrowserCache,
    handleClearCurriculumCache,
    handleClearStudentDataCache,
    handleClearAllStorage,
  };
};

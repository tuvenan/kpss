import React, { useState, useEffect, useMemo } from 'react';
import { userProfileService, UserProfile, ALL_BADGES, DEFAULT_PROFILE } from '../services/userProfileService';
import { studentProgressService } from '../services/studentProgressService';
import {
  Users,
  UserCheck,
  Award,
  Trash2,
  Edit3,
  Plus,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Target,
  Clock,
  Sparkles,
  Shield,
  Save,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  TrendingUp,
  X,
  Check,
} from 'lucide-react';

interface AdvancedStudentManagerProps {
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdvancedStudentManager: React.FC<AdvancedStudentManagerProps> = ({ onNotify }) => {
  // ----------------------------------------------------
  // DURUMLAR (STATE)
  // ----------------------------------------------------
  const [profile, setProfile] = useState<UserProfile>(userProfileService.getProfile());
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>(userProfileService.getAllProfiles());
  const [overallStats, setOverallStats] = useState(studentProgressService.getOverallStats());

  // Düzenleme Modalı
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(profile);

  // Yeni Öğrenci Ekleme Modalı
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState<UserProfile>({
    ...DEFAULT_PROFILE,
    name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    photoUrl: '',
    earnedBadgeIds: ['first-quiz'],
  });

  // Konu Bazlı Performans Verileri
  const topicRecords = useMemo(() => {
    return studentProgressService.getTopicAnalysisList();
  }, [profile]);

  // Ders Bazlı Özet İstatistikler (Türkçe, Matematik, Tarih, Coğrafya, Vatandaşlık)
  const subjectBreakdown = useMemo(() => {
    const subjects = ['Türkçe', 'Tarih', 'Matematik', 'Coğrafya', 'Vatandaşlık'];
    return subjects.map((subName) => {
      const records = topicRecords.filter((r) => r.subjectTitle.toLowerCase() === subName.toLowerCase());
      const solved = records.reduce((acc, r) => acc + r.solvedCount, 0);
      const correct = records.reduce((acc, r) => acc + r.correctCount, 0);
      const wrong = records.reduce((acc, r) => acc + r.wrongCount, 0);
      const net = Math.max(0, parseFloat((correct - wrong / 4).toFixed(2)));
      const percentage = solved > 0 ? Math.round((correct / solved) * 100) : 0;

      return {
        subject: subName,
        solved,
        correct,
        wrong,
        net,
        percentage,
      };
    });
  }, [topicRecords]);

  // Net Sayısı Hesabı (Standart KPSS Net = Doğru - Yanlış / 4)
  const netScore = useMemo(() => {
    const calculated = overallStats.totalCorrect - overallStats.totalWrong / 4;
    return Math.max(0, parseFloat(calculated.toFixed(2)));
  }, [overallStats]);

  // Sayfa Güncelleme Dinleyicisi
  useEffect(() => {
    const handleUpdate = () => {
      setProfile(userProfileService.getProfile());
      setAllProfiles(userProfileService.getAllProfiles());
      setOverallStats(studentProgressService.getOverallStats());
    };
    window.addEventListener('kpss_profile_updated', handleUpdate);
    return () => window.removeEventListener('kpss_profile_updated', handleUpdate);
  }, []);

  // ----------------------------------------------------
  // İŞLEM FONKSİYONLARI
  // ----------------------------------------------------
  const handleSwitchProfile = (username: string) => {
    userProfileService.switchProfile(username);
    setProfile(userProfileService.getProfile());
    onNotify(`Aktif öğrenci "${username}" olarak değiştirildi.`);
  };

  const handleOpenEditModal = () => {
    setEditForm({ ...profile });
    setShowEditModal(true);
  };

  const handleSaveProfileChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.username.trim()) {
      alert('Lütfen ad soyad ve kullanıcı adı alanlarını doldurunuz.');
      return;
    }
    userProfileService.createProfile(editForm);
    setProfile(editForm);
    setShowEditModal(false);
    onNotify('Öğrenci profili başarıyla güncellendi.');
  };

  const handleCreateNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim() || !newStudentForm.username.trim()) {
      alert('Lütfen en az ad soyad ve kullanıcı adı alanlarını doldurunuz.');
      return;
    }
    userProfileService.createProfile(newStudentForm);
    setShowNewStudentModal(false);
    setProfile(newStudentForm);
    onNotify(`Yeni öğrenci profili "${newStudentForm.name}" başarıyla oluşturuldu.`);
  };

  const handleDeleteProfile = (username: string) => {
    if (allProfiles.length <= 1) {
      alert('Sistemde en az bir öğrenci profili bulunmalıdır.');
      return;
    }
    if (!confirm(`"${username}" adlı öğrenci profilini silmek istediğinize emin misiniz?`)) return;
    userProfileService.deleteProfile(username);
    onNotify(`"${username}" profili silindi.`);
  };

  // Rozet Aç / Kapa (Toggle Badge)
  const handleToggleBadge = (badgeId: string) => {
    userProfileService.toggleBadge(badgeId);
    setProfile(userProfileService.getProfile());
    onNotify('Öğrenci rozet durumu güncellendi.');
  };

  // Simülasyon Verisi Enjekte Et
  const handleInjectSimulation = (type: 'light' | 'moderate' | 'intensive') => {
    userProfileService.injectSimulationProgress(type);
    setOverallStats(studentProgressService.getOverallStats());
    onNotify(
      `Öğrenciye ${
        type === 'light' ? 'Hafif (160 soru)' : type === 'moderate' ? 'Orta (400 soru)' : 'Yoğun (800 soru)'
      } simülasyon test verisi yüklendi!`
    );
  };

  // İlerleme Verilerini Sıfırla
  const handleResetProgress = () => {
    if (!confirm('Öğrencinin tüm soru çözüm kayıtları ve başarı istatistikleri sıfırlanacaktır. Onaylıyor musunuz?')) {
      return;
    }
    userProfileService.resetProgressData();
    setOverallStats(studentProgressService.getOverallStats());
    onNotify('Öğrenci soru çözüm geçmişi başarıyla sıfırlandı.');
  };

  // Öğrenci Verilerini JSON Olarak Dışa Aktar (Yedek)
  const handleExportBackup = () => {
    const backupData = {
      profile,
      progress: studentProgressService.getStoredProgress(),
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kpss_ogrenci_yedek_${profile.username}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onNotify('Öğrenci yedek dosyası JSON formatında indirildi.');
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. ÜST ÖĞRENCİ PROFİL SEÇİCİ & HIZLI KART */}
      <div style={styles.mainCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={styles.avatarBox}>
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '28px' }}>🎓</span>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={styles.studentName}>{profile.name}</h2>
                <span style={styles.usernameBadge}>@{profile.username}</span>
                <span style={styles.activePill}>Aktif Öğrenci</span>
              </div>
              <div style={styles.studentMetaRow}>
                <span>🎯 {profile.examType}</span>
                <span>•</span>
                <span>🏆 Hedef Puan: <b>{profile.targetScore}</b></span>
                <span>•</span>
                <span>📅 Günlük Hedef: <b>{profile.dailyGoal} Soru</b></span>
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleOpenEditModal} style={styles.btnSecondary}>
              <Edit3 size={15} style={{ marginRight: '6px' }} />
              Profili Düzenle
            </button>

            <button onClick={() => setShowNewStudentModal(true)} style={styles.btnPrimary}>
              <Plus size={15} style={{ marginRight: '6px' }} />
              + Yeni Öğrenci Ekle
            </button>
          </div>
        </div>

        {/* Çoklu Profil Listesi & Geçiş */}
        {allProfiles.length > 1 && (
          <div style={styles.profileSwitchBar}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Kayıtlı Öğrenciler:</span>
            {allProfiles.map((p) => {
              const isActive = p.username === profile.username;
              return (
                <div
                  key={p.username}
                  onClick={() => handleSwitchProfile(p.username)}
                  style={{
                    ...styles.profileSwitchChip,
                    backgroundColor: isActive ? '#0F172A' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#334155',
                  }}
                >
                  <span>{p.name}</span>
                  {!isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(p.username);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#94A3B8' }}
                      title="Profili Sil"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. ÖĞRENCİ BAŞARI & NET METRİKLERİ */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: '#EEF2FF' }}>
            <BarChart3 size={22} color="#4F46E5" />
          </div>
          <div>
            <div style={styles.statLabel}>Toplam Çözülen Soru</div>
            <div style={styles.statValue}>{overallStats.totalSolved}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: '#ECFDF5' }}>
            <CheckCircle size={22} color="#16A34A" />
          </div>
          <div>
            <div style={styles.statLabel}>Doğru Cevap</div>
            <div style={{ ...styles.statValue, color: '#16A34A' }}>{overallStats.totalCorrect}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: '#FEF2F2' }}>
            <AlertCircle size={22} color="#DC2626" />
          </div>
          <div>
            <div style={styles.statLabel}>Yanlış Cevap</div>
            <div style={{ ...styles.statValue, color: '#DC2626' }}>{overallStats.totalWrong}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: '#FEF3C7' }}>
            <TrendingUp size={22} color="#D97706" />
          </div>
          <div>
            <div style={styles.statLabel}>KPSS Net (Doğru - Y/4)</div>
            <div style={{ ...styles.statValue, color: '#D97706' }}>{netScore} Net</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconBox, backgroundColor: '#F3E8FF' }}>
            <Target size={22} color="#9333EA" />
          </div>
          <div>
            <div style={styles.statLabel}>Başarı Oranı</div>
            <div style={{ ...styles.statValue, color: '#9333EA' }}>%{overallStats.percentage}</div>
          </div>
        </div>
      </div>

      {/* 3. DERS BAZLI BAŞARI TABLOSU VE ROZET YÖNETİMİ */}
      <div style={styles.twoColGrid}>
        {/* Sol Kolon: Ders Bazlı Net & Performans Tablosu */}
        <div style={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={styles.sectionTitle}>Ders Bazlı Net & Başarı Dağılımı</h3>
              <p style={styles.sectionSub}>Öğrencinin KPSS derslerindeki çözülen soru ve net dökümü.</p>
            </div>
          </div>

          <table style={styles.dataTable}>
            <thead>
              <tr>
                <th style={styles.tableTh}>Ders</th>
                <th style={styles.tableTh}>Çözülen</th>
                <th style={styles.tableTh}>Doğru / Yanlış</th>
                <th style={styles.tableTh}>Net</th>
                <th style={styles.tableTh}>Başarı</th>
              </tr>
            </thead>
            <tbody>
              {subjectBreakdown.map((item) => (
                <tr key={item.subject} style={styles.tableTr}>
                  <td style={{ ...styles.tableTd, fontWeight: 600, color: '#0F172A' }}>{item.subject}</td>
                  <td style={styles.tableTd}>{item.solved} soru</td>
                  <td style={styles.tableTd}>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>{item.correct} D</span>
                    {' / '}
                    <span style={{ color: '#DC2626', fontWeight: 600 }}>{item.wrong} Y</span>
                  </td>
                  <td style={{ ...styles.tableTd, fontWeight: 700, color: '#4F46E5' }}>{item.net}</td>
                  <td style={styles.tableTd}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={styles.progressBarTrack}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${item.percentage}%`,
                            backgroundColor: item.percentage >= 70 ? '#10B981' : item.percentage >= 50 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>%{item.percentage}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sağ Kolon: Yönetici Rozet Yönetim Paneli */}
        <div style={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={styles.sectionTitle}>Öğrenci Rozetleri (Yönetici Kontrolü)</h3>
              <p style={styles.sectionSub}>Öğrencinin kazandığı rozetleri açın veya kapatın.</p>
            </div>
            <span style={styles.badgeCountBadge}>
              {profile.earnedBadgeIds.length} / {ALL_BADGES.length} Kazanıldı
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {ALL_BADGES.map((badge) => {
              const isEarned = profile.earnedBadgeIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  onClick={() => handleToggleBadge(badge.id)}
                  style={{
                    ...styles.badgeRowCard,
                    backgroundColor: isEarned ? '#EEF2FF' : '#F8FAFC',
                    borderColor: isEarned ? '#C7D2FE' : '#E2E8F0',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{badge.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isEarned ? '#3730A3' : '#475569' }}>
                      {badge.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{badge.description}</div>
                  </div>

                  <button
                    type="button"
                    style={{
                      ...styles.badgeToggleBtn,
                      backgroundColor: isEarned ? '#10B981' : '#E2E8F0',
                      color: isEarned ? '#FFFFFF' : '#64748B',
                    }}
                  >
                    {isEarned ? 'Kazanıldı ✓' : 'Kilitli 🔒'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. YÖNETİCİ TEST SİMÜLASYONU & SIFIRLAMA ARAÇLARI */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>Gelişmiş Test Simülasyonu & Veri Kontrolleri</h3>
        <p style={styles.sectionSub}>
          Öğrenci sayfalarındaki grafikleri ve analizleri test etmek için hazır aktivite verisi yükleyebilir veya temizleyebilirsiniz.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button onClick={() => handleInjectSimulation('light')} style={styles.btnSecondary}>
            <Sparkles size={15} color="#16A34A" style={{ marginRight: '6px' }} />
            Hafif Aktivite Yükle (~160 Soru)
          </button>

          <button onClick={() => handleInjectSimulation('moderate')} style={styles.btnSecondary}>
            <Sparkles size={15} color="#D97706" style={{ marginRight: '6px' }} />
            Orta Düzey Aktivite Yükle (~400 Soru)
          </button>

          <button onClick={() => handleInjectSimulation('intensive')} style={styles.btnSecondary}>
            <Sparkles size={15} color="#7C3AED" style={{ marginRight: '6px' }} />
            Yoğun Aktivite Yükle (~800 Soru)
          </button>

          <button onClick={handleExportBackup} style={styles.btnSecondary}>
            <Download size={15} style={{ marginRight: '6px' }} />
            Öğrenci Verisini Yedekle (JSON)
          </button>

          <button onClick={handleResetProgress} style={styles.btnDanger}>
            <Trash2 size={15} style={{ marginRight: '6px' }} />
            İlerleme Verilerini Sıfırla
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ÖĞRENCİ PROFİL DÜZENLEME */}
      {/* ============================================================== */}
      {showEditModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Öğrenci Profilini Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfileChanges} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={styles.twoColGrid}>
                <div>
                  <label style={styles.fieldLabel}>Ad Soyad:</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={styles.textInput}
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Kullanıcı Adı (@):</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    style={styles.textInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.twoColGrid}>
                <div>
                  <label style={styles.fieldLabel}>E-Posta:</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={styles.textInput}
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Telefon:</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <div style={styles.twoColGrid}>
                <div>
                  <label style={styles.fieldLabel}>Sınav Türü:</label>
                  <select
                    value={editForm.examType}
                    onChange={(e) => setEditForm({ ...editForm, examType: e.target.value })}
                    style={styles.dropdown}
                  >
                    <option value="KPSS Lisans (GY-GK)">KPSS Lisans (GY-GK)</option>
                    <option value="KPSS Ön Lisans">KPSS Ön Lisans</option>
                    <option value="KPSS Ortaöğretim">KPSS Ortaöğretim</option>
                    <option value="KPSS Eğitim Bilimleri">KPSS Eğitim Bilimleri</option>
                    <option value="KPSS Alan Bilgisi (A Grubu)">KPSS Alan Bilgisi (A Grubu)</option>
                  </select>
                </div>

                <div>
                  <label style={styles.fieldLabel}>Hedef Puan:</label>
                  <input
                    type="number"
                    value={editForm.targetScore}
                    onChange={(e) => setEditForm({ ...editForm, targetScore: parseInt(e.target.value) || 70 })}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Günlük Soru Hedefi:</label>
                <input
                  type="number"
                  value={editForm.dailyGoal}
                  onChange={(e) => setEditForm({ ...editForm, dailyGoal: parseInt(e.target.value) || 50 })}
                  style={styles.textInput}
                />
              </div>

              <div>
                <label style={styles.fieldLabel}>Biyografi & Motivasyon Notu:</label>
                <textarea
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.modalActionsRow}>
                <button type="button" onClick={() => setShowEditModal(false)} style={styles.btnSecondary}>
                  Vazgeç
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Kaydet ve Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: YENİ ÖĞRENCİ PROFİLİ EKLE */}
      {/* ============================================================== */}
      {showNewStudentModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Yeni Öğrenci Profili Ekle</h3>
              <button onClick={() => setShowNewStudentModal(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={styles.twoColGrid}>
                <div>
                  <label style={styles.fieldLabel}>Ad Soyad:</label>
                  <input
                    type="text"
                    placeholder="Örn: Ayşe Yılmaz"
                    value={newStudentForm.name}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    style={styles.textInput}
                    required
                  />
                </div>

                <div>
                  <label style={styles.fieldLabel}>Kullanıcı Adı (@):</label>
                  <input
                    type="text"
                    placeholder="Örn: ayseyilmaz"
                    value={newStudentForm.username}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, username: e.target.value })}
                    style={styles.textInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.twoColGrid}>
                <div>
                  <label style={styles.fieldLabel}>Sınav Türü:</label>
                  <select
                    value={newStudentForm.examType}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, examType: e.target.value })}
                    style={styles.dropdown}
                  >
                    <option value="KPSS Lisans (GY-GK)">KPSS Lisans (GY-GK)</option>
                    <option value="KPSS Ön Lisans">KPSS Ön Lisans</option>
                    <option value="KPSS Ortaöğretim">KPSS Ortaöğretim</option>
                    <option value="KPSS Alan Bilgisi (A Grubu)">KPSS Alan Bilgisi (A Grubu)</option>
                  </select>
                </div>

                <div>
                  <label style={styles.fieldLabel}>Hedef Puan:</label>
                  <input
                    type="number"
                    value={newStudentForm.targetScore}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, targetScore: parseInt(e.target.value) || 85 })}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <div>
                <label style={styles.fieldLabel}>Günlük Soru Hedefi:</label>
                <input
                  type="number"
                  value={newStudentForm.dailyGoal}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, dailyGoal: parseInt(e.target.value) || 60 })}
                  style={styles.textInput}
                />
              </div>

              <div style={styles.modalActionsRow}>
                <button type="button" onClick={() => setShowNewStudentModal(false)} style={styles.btnSecondary}>
                  Vazgeç
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// STİL TANIMLARI
// ----------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  avatarBox: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#EEF2FF',
    border: '2px solid #C7D2FE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  studentName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  usernameBadge: {
    fontSize: '13px',
    color: '#64748B',
  },
  activePill: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  studentMetaRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontSize: '12px',
    color: '#64748B',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  profileSwitchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: '1px solid #F1F5F9',
    flexWrap: 'wrap',
  },
  profileSwitchChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  statIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 500,
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0F172A',
    marginTop: '2px',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '18px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 4px 0',
  },
  sectionSub: {
    fontSize: '12px',
    color: '#64748B',
    margin: 0,
  },
  badgeCountBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  badgeRowCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  badgeToggleBtn: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    marginTop: '8px',
  },
  tableTh: {
    textAlign: 'left',
    padding: '10px 10px',
    borderBottom: '2px solid #E2E8F0',
    color: '#64748B',
    fontWeight: 600,
    fontSize: '12px',
  },
  tableTr: {
    borderBottom: '1px solid #F1F5F9',
  },
  tableTd: {
    padding: '10px 10px',
    color: '#1E293B',
  },
  progressBarTrack: {
    width: '70px',
    height: '6px',
    backgroundColor: '#F1F5F9',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '4px',
    display: 'block',
  },
  textInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  dropdown: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    outline: 'none',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    color: '#334155',
    border: '1px solid #CBD5E1',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '540px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#64748B',
  },
  modalActionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #F1F5F9',
  },
};

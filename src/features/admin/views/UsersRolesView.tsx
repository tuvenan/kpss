import React, { useState, useEffect } from 'react';
import { rbacService, UserProfileWithRoles } from '../../../services/rbacService';
import { UserRole } from '../../../types/auth';
import { Users, Shield, UserCheck, UserX, Plus, Trash2, Search, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface UsersRolesViewProps {
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  member: 'Üye',
  teacher: 'Öğretmen',
  editor: 'Editör',
  super_admin: 'Süper Admin',
};

const AVAILABLE_ROLES: UserRole[] = ['member', 'teacher', 'editor', 'super_admin'];

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({ notify }) => {
  const [users, setUsers] = useState<UserProfileWithRoles[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfileWithRoles | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<UserRole>('teacher');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await rbacService.getAllUsersWithRoles();
      setUsers(data);
      if (selectedUser) {
        const updated = data.find((u) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err: any) {
      notify('Kullanıcı listesi yüklenemedi: ' + (err?.message || 'Bilinmeyen hata'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAssignRole = async (userId: string, role: UserRole) => {
    setActionLoading(true);
    const res = await rbacService.assignRole(userId, role);
    setActionLoading(false);
    if (res.success) {
      notify(`"${ROLE_LABELS[role]}" rolü başarıyla tanımlandı.`, 'success');
      loadUsers();
    } else {
      notify(res.error || 'Rol atanamadı.', 'error');
    }
  };

  const handleRemoveRole = async (userId: string, role: UserRole) => {
    if (!confirm(`Kullanıcıdan "${ROLE_LABELS[role]}" rolünü kaldırmak istediğinize emin misiniz?`)) return;
    setActionLoading(true);
    const res = await rbacService.removeRole(userId, role);
    setActionLoading(false);
    if (res.success) {
      notify(`"${ROLE_LABELS[role]}" rolü kaldırıldı.`, 'success');
      loadUsers();
    } else {
      notify(res.error || 'Rol kaldırılamadı.', 'error');
    }
  };

  const handleSuspendToggle = async (user: UserProfileWithRoles) => {
    setActionLoading(true);
    if (user.is_suspended) {
      const res = await rbacService.reactivateUser(user.id);
      setActionLoading(false);
      if (res.success) {
        notify('Kullanıcı hesabı yeniden etkinleştirildi.', 'success');
        loadUsers();
      } else {
        notify(res.error || 'İşlem başarısız.', 'error');
      }
    } else {
      const reason = prompt('Hesabı askıya alma nedeni giriniz (İsteğe bağlı):') || 'Yönetici tarafından askıya alındı';
      const res = await rbacService.suspendUser(user.id, reason);
      setActionLoading(false);
      if (res.success) {
        notify('Kullanıcı hesabı askıya alındı.', 'success');
        loadUsers();
      } else {
        notify(res.error || 'İşlem başarısız.', 'error');
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.full_name || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const roleMatch = u.roles.some((r) => ROLE_LABELS[r].toLowerCase().includes(q) || r.toLowerCase().includes(q));
    return nameMatch || emailMatch || roleMatch;
  });

  return (
    <div style={{ fontFamily: "var(--kpss-font, 'Plus Jakarta Sans', sans-serif)" }}>
      {/* Üst Başlık & Arama */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
            }}
          >
            <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="İsim, e-posta veya role göre ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--kpss-border, #E2E8F0)',
                backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                fontSize: '13px',
                color: 'var(--kpss-text, #0F172A)',
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '8px',
              color: 'var(--kpss-text, #0F172A)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#64748B' }}>
          Toplam <strong>{users.length}</strong> kayıtlı kullanıcı
        </div>
      </div>

      {/* Kullanıcı Tablosu ve Detay Paneli */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 360px' : '1fr', gap: '20px' }}>
        {/* Tablo */}
        <div
          style={{
            backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
            border: '1px solid var(--kpss-border, #E2E8F0)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)', borderBottom: '1px solid var(--kpss-border, #E2E8F0)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Kullanıcı</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>E-posta</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Tanımlı Roller</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Durum</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                    {loading ? 'Kullanıcılar yükleniyor...' : 'Kullanıcı bulunamadı.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      style={{
                        borderBottom: '1px solid var(--kpss-border, #E2E8F0)',
                        backgroundColor: isSelected ? 'var(--kpss-subtle-bg, #F1F5F9)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                              border: '1px solid var(--kpss-border, #E2E8F0)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.full_name || 'İsimsiz'}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>@{u.username || 'kullanici'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{u.email || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: r === 'super_admin' ? '#111111' : 'var(--kpss-subtle-bg, #F1F5F9)',
                                color: r === 'super_admin' ? '#FFFFFF' : 'var(--kpss-text, #0F172A)',
                                border: '1px solid var(--kpss-border, #E2E8F0)',
                              }}
                            >
                              {ROLE_LABELS[r] || r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.is_suspended ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#FEE2E2',
                              color: '#991B1B',
                            }}
                          >
                            Askıya Alındı
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#DCFCE7',
                              color: '#166534',
                            }}
                          >
                            Aktif
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(u);
                          }}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                            border: '1px solid var(--kpss-border, #E2E8F0)',
                            borderRadius: '6px',
                            color: 'var(--kpss-text, #0F172A)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Yönet
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Seçili Kullanıcı Yönetim Kartı */}
        {selectedUser && (
          <div
            style={{
              backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
              border: '1px solid var(--kpss-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '20px',
              height: 'fit-content',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px' }}>
                  {selectedUser.full_name || 'İsimsiz Kullanıcı'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{selectedUser.email || '-'}</div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--kpss-border, #E2E8F0)', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#64748B' }}>
                MEVCUT ROLLER
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedUser.roles.map((r) => (
                  <div
                    key={r}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--kpss-subtle-bg, #F1F5F9)',
                      border: '1px solid var(--kpss-border, #E2E8F0)',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{ROLE_LABELS[r]}</span>
                    {/* Üye rolü varsayılandır, silinemez. Diğer roller silinebilir */}
                    {r !== 'member' && (
                      <button
                        onClick={() => handleRemoveRole(selectedUser.id, r)}
                        disabled={actionLoading}
                        title="Rolü Kaldır"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Yeni Rol Ata */}
            <div style={{ borderTop: '1px solid var(--kpss-border, #E2E8F0)', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#64748B' }}>
                YENİ ROL TANIMLA
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={roleToAssign}
                  onChange={(e) => setRoleToAssign(e.target.value as UserRole)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--kpss-border, #E2E8F0)',
                    backgroundColor: 'var(--kpss-card-bg, #FFFFFF)',
                    fontSize: '13px',
                    color: 'var(--kpss-text, #0F172A)',
                    outline: 'none',
                  }}
                >
                  {AVAILABLE_ROLES.filter((r) => !selectedUser.roles.includes(r)).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignRole(selectedUser.id, roleToAssign)}
                  disabled={actionLoading || selectedUser.roles.includes(roleToAssign)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  Ata
                </button>
              </div>
            </div>

            {/* Hesap Durumu / Askıya Alma */}
            <div style={{ borderTop: '1px solid var(--kpss-border, #E2E8F0)', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#64748B' }}>
                HESAP İŞLEMLERİ
              </div>
              <button
                onClick={() => handleSuspendToggle(selectedUser)}
                disabled={actionLoading}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--kpss-border, #E2E8F0)',
                  backgroundColor: selectedUser.is_suspended ? '#DCFCE7' : '#FEE2E2',
                  color: selectedUser.is_suspended ? '#166534' : '#991B1B',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {selectedUser.is_suspended ? <UserCheck size={15} /> : <UserX size={15} />}
                {selectedUser.is_suspended ? 'Hesabı Yeniden Etkinleştir' : 'Hesabı Askıya Al'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

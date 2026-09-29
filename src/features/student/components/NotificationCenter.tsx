import React from 'react';
import { Bell } from 'lucide-react';
import { StudentNotificationItem } from '../types';
import { styles } from '../../../pages/StudentQuiz.styles';

interface NotificationCenterProps {
  notifications: StudentNotificationItem[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (val: boolean | ((prev: boolean) => boolean)) => void;
  onNotificationClick: (notif: StudentNotificationItem) => void;
  onMarkAllRead: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  onNotificationClick,
  onMarkAllRead,
}) => {
  return (
    <div style={{ position: 'relative' }}>
      <button
        style={styles.headerIconBtn}
        title="Bildirimler"
        onClick={() => setShowNotifications((n) => !n)}
      >
        <Bell size={18} color={showNotifications ? 'var(--kpss-primary, #4F46E5)' : 'var(--kpss-text, #333)'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '16px', height: '16px', borderRadius: '50%',
            backgroundColor: '#EF4444', color: '#fff',
            fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Bildirim Paneli */}
      {showNotifications && (
        <>
          {/* Overlay - dışarı tıklayınca kapat */}
          <div
            onClick={() => setShowNotifications(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          />
          <div style={{
            position: 'fixed', top: '62px', right: '8px',
            width: '320px', maxWidth: 'calc(100vw - 16px)', backgroundColor: 'var(--kpss-card-bg, #fff)',
            borderRadius: '14px', border: '1px solid var(--kpss-border, #E5E7EB)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--kpss-border, #F3F4F6)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--kpss-subtle-bg, #F9FAFB)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--kpss-text, #0F172A)' }}>Bildirimler</span>
                {unreadCount > 0 && (
                  <span style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '9999px',
                  }}>
                    {unreadCount} yeni
                  </span>
                )}
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--kpss-primary, #4F46E5)',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 6px',
                    borderRadius: '6px',
                  }}
                >
                  Tümünü Okundu Say
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>Tümü okundu ✓</span>
              )}
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="notification-item"
                  onClick={() => onNotificationClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: n.unread ? 'var(--kpss-subtle-bg, #F8FAFC)' : 'var(--kpss-card-bg, #FFFFFF)',
                    borderBottom: '1px solid var(--kpss-border, #F1F5F9)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{
                    fontSize: '20px',
                    lineHeight: 1,
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {n.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      marginBottom: '3px',
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: n.unread ? 700 : 600,
                        color: n.unread ? 'var(--kpss-text, #0F172A)' : 'var(--kpss-text-muted, #94A3B8)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {n.title}
                      </span>
                      {n.badgeText && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--kpss-primary, #6366F1)',
                          backgroundColor: 'var(--kpss-subtle-bg, #EEF2FF)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}>
                          {n.badgeText}
                        </span>
                      )}
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: 'var(--kpss-text-muted, #64748B)',
                      lineHeight: '16px',
                      marginBottom: '4px',
                    }}>
                      {n.sub}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--kpss-text-muted, #94A3B8)' }}>{n.time}</span>
                      <span style={{ fontSize: '11px', color: 'var(--kpss-primary, #4F46E5)', fontWeight: 600 }}>Görüntüle →</span>
                    </div>
                  </div>

                  {n.unread && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6',
                      flexShrink: 0,
                      marginTop: '6px',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import { useState } from 'react';
import { StudentNotificationItem, INITIAL_STUDENT_NOTIFICATIONS, StudentTabType, StudentViewState } from '../types';

export const useNotifications = (
  onNavigateTab: (tab: StudentTabType) => void,
  onSetViewState: (viewState: StudentViewState) => void,
  onOpenDenemeSetup: () => void
) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('kpss_student_notifications');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_STUDENT_NOTIFICATIONS;
  });

  const saveNotifications = (newList: StudentNotificationItem[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem('kpss_student_notifications', JSON.stringify(newList));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = (notif: StudentNotificationItem) => {
    const updated = notifications.map((n) =>
      n.id === notif.id ? { ...n, unread: false } : n
    );
    saveNotifications(updated);
    setShowNotifications(false);

    switch (notif.actionType) {
      case 'calendar':
        onNavigateTab('profile');
        onSetViewState('subjects');
        break;
      case 'radar':
        onNavigateTab('home');
        onSetViewState('subjects');
        break;
      case 'errors':
        onNavigateTab('errors');
        onSetViewState('subjects');
        break;
      case 'deneme':
        onOpenDenemeSetup();
        break;
      default:
        onNavigateTab('home');
        onSetViewState('subjects');
        break;
    }
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    saveNotifications(updated);
  };

  return {
    notifications,
    unreadCount,
    showNotifications,
    setShowNotifications,
    handleNotificationClick,
    handleMarkAllNotificationsRead,
  };
};

import React from 'react';
import { AdminPanelPage } from '../features/admin/AdminPanelPage';
import { AdminPanelProps, StorageBreakdown } from '../features/admin/types';

export type { StorageBreakdown };

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateStudent }) => {
  return <AdminPanelPage onNavigateStudent={onNavigateStudent} />;
};

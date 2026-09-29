import React from 'react';
import { AdvancedThemeEditor } from '../../../components/AdvancedThemeEditor';

interface ThemeEditorViewProps {
  onNotify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ThemeEditorView: React.FC<ThemeEditorViewProps> = ({ onNotify }) => {
  return <AdvancedThemeEditor onNotify={onNotify} />;
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { themeService } from './services/themeService';

// Başlangıçta aktif temayı uygula
themeService.applyTheme(themeService.getActiveTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

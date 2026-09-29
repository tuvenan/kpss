import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AdminPanelPage } from '../AdminPanelPage';
import { setRuntimeConfigOverride } from '../../../config/runtimeConfig';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock api
vi.mock('../../../services/api', () => ({
  api: {
    getSubjects: vi.fn().mockResolvedValue([]),
    getUnits: vi.fn().mockResolvedValue([]),
    getTopics: vi.fn().mockResolvedValue([]),
    adminGetQuestionsByTopic: vi.fn().mockResolvedValue([]),
    adminGetQuestionsByUnit: vi.fn().mockResolvedValue([]),
    adminGetErrorPoolStats: vi.fn().mockResolvedValue({ totalErrors: 0, mostFailedQuestions: [] }),
    adminGetSystemStorageStats: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../services/supabase', () => ({
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

describe('AdminPanelPage Erişim ve Yetkilendirme Testleri', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setRuntimeConfigOverride(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    setRuntimeConfigOverride(null);
  });

  it('Production modunda super_admin kullanıcısı engellenmeden doğrudan admin paneline erişir', async () => {
    // Production simülasyonu: demo modu kapalı, allowClientAdminDemo=false
    setRuntimeConfigOverride({
      isDevelopment: false,
      isProduction: true,
      isDemoModeEnabled: false,
      allowClientAdminDemo: false,
      allowLocalAuthFallback: false,
      allowLocalSubscriptionDemo: false,
    });

    mockUseAuth.mockReturnValue({
      isSuperAdmin: true,
      signIn: vi.fn(),
      signInWithUsername: vi.fn(),
      signOut: vi.fn(),
    });

    render(<AdminPanelPage onNavigateStudent={vi.fn()} />);

    // Admin Sidebar & Dashboard başlığı görünür olmalı
    await waitFor(() => {
      expect(screen.getByText('KPSS Panel')).toBeInTheDocument();
      expect(screen.getByText('Genel Bakış')).toBeInTheDocument();
    });

    // "Yönetici Erişimi Kısıtlandı" ekranı KESİNLİKLE gösterilmemelidir
    expect(screen.queryByText('Yönetici Erişimi Kısıtlandı')).not.toBeInTheDocument();
  });

  it('Production modunda oturumu olmayan veya super_admin olmayan kullanıcıya kısıtlama ekranı ve Giriş Yap düğmesi gösterilir', () => {
    setRuntimeConfigOverride({
      isDevelopment: false,
      isProduction: true,
      isDemoModeEnabled: false,
      allowClientAdminDemo: false,
      allowLocalAuthFallback: false,
      allowLocalSubscriptionDemo: false,
    });

    mockUseAuth.mockReturnValue({
      isSuperAdmin: false,
      signIn: vi.fn(),
      signInWithUsername: vi.fn(),
      signOut: vi.fn(),
    });

    render(<AdminPanelPage onNavigateStudent={vi.fn()} />);

    expect(screen.getByText('Yönetici Erişimi Kısıtlandı')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /öğrenci paneli/i })).toBeInTheDocument();
  });

  it('Demo modunda (geliştirme ortamı) oturumsuz kullanıcıya AdminLogin formu gösterilir', () => {
    setRuntimeConfigOverride({
      isDevelopment: true,
      isProduction: false,
      isDemoModeEnabled: true,
      allowClientAdminDemo: true,
      allowLocalAuthFallback: true,
      allowLocalSubscriptionDemo: true,
    });

    mockUseAuth.mockReturnValue({
      isSuperAdmin: false,
      signIn: vi.fn(),
      signInWithUsername: vi.fn(),
      signOut: vi.fn(),
    });

    render(<AdminPanelPage onNavigateStudent={vi.fn()} />);

    expect(screen.getByText('KPSS YÖNETİCİ GİRİŞİ')).toBeInTheDocument();
  });
});

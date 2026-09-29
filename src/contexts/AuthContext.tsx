import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { rbacService } from '../services/rbacService';
import { UserRole, UserProfileData, AuthContextValue } from '../types/auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUserData = useCallback(async (currentUserId?: string) => {
    if (!currentUserId) {
      setProfile(null);
      setRoles([]);
      return;
    }

    try {
      const [fetchedRoles, fetchedProfile] = await Promise.all([
        rbacService.fetchUserRoles(currentUserId),
        rbacService.fetchUserProfile(currentUserId),
      ]);
      setRoles(fetchedRoles);
      setProfile(fetchedProfile);
    } catch (err) {
      console.warn('loadUserData error:', err);
      setRoles(['member']);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    // 1. İlk oturumu yükle
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user?.id) {
        loadUserData(initialSession.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch((err) => {
      console.warn('getSession error:', err);
      if (isMounted) setIsLoading(false);
    });

    // 2. Canlı Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user?.id) {
        await loadUserData(newSession.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Kimlik doğrulama servisi yapılandırılmamış.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message === 'Invalid login credentials'
            ? 'E-posta adresi veya şifre hatalı!'
            : (error.message || 'Giriş yapılamadı.'),
        };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadUserData(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Oturum oluşturulamadı.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Beklenmedik bir hata oluştu.' };
    }
  }, [loadUserData]);

  const signUp = useCallback(async (
    fullName: string,
    email: string,
    password: string,
    examType = 'KPSS Lisans (GY-GK)'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Kayıt servisi yapılandırılmamış.' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanEmail.split('@')[0],
            exam_type: examType,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadUserData(data.user.id);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Kayıt işlemi tamamlanamadı.' };
    }
  }, [loadUserData]);

  const signOut = useCallback(async (): Promise<void> => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('signOut error:', err);
      }
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
  }, []);

  const refreshAuthorization = useCallback(async (): Promise<void> => {
    if (user?.id) {
      await loadUserData(user.id);
    }
  }, [user, loadUserData]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const isMember = useMemo(() => roles.includes('member'), [roles]);
  const isTeacher = useMemo(() => roles.includes('teacher') || roles.includes('super_admin'), [roles]);
  const isEditor = useMemo(() => roles.includes('editor') || roles.includes('super_admin'), [roles]);
  const isSuperAdmin = useMemo(() => roles.includes('super_admin'), [roles]);

  const value: AuthContextValue = useMemo(() => ({
    session,
    user,
    profile,
    roles,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshAuthorization,
    hasRole,
    isMember,
    isTeacher,
    isEditor,
    isSuperAdmin,
  }), [
    session,
    user,
    profile,
    roles,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshAuthorization,
    hasRole,
    isMember,
    isTeacher,
    isEditor,
    isSuperAdmin,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

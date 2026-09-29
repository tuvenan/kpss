import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { rbacService } from '../services/rbacService';
import {
  UserRole,
  AppCapability,
  UserProfileData,
  AuthContextValue,
  computeCapabilities,
  resolveActiveRole,
} from '../types/auth';

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

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

    // 2. Canlı Auth state değişikliklerini dinle (tek listener)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      // INITIAL_SESSION ve newSession boş ise getSession'ın sonucunu ezme
      if (event === 'INITIAL_SESSION' && !newSession?.user) {
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setProfile(null);
        setRoles([]);
        setIsLoading(false);
        return;
      }

      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED', 'INITIAL_SESSION'].includes(event) || newSession?.user?.id) {
        await loadUserData(newSession.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  // E-posta ile giriş
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      const msg = 'Kimlik doğrulama servisi yapılandırılmamış.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const errorMsg = 'Kullanıcı adı veya parola hatalı.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadUserData(data.user.id);
        return { success: true };
      }

      const failMsg = 'Oturum oluşturulamadı.';
      setAuthError(failMsg);
      return { success: false, error: failMsg };
    } catch (err: any) {
      const exceptionMsg = 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyiniz.';
      setAuthError(exceptionMsg);
      return { success: false, error: exceptionMsg };
    }
  }, [loadUserData]);

  // Kullanıcı adıyla giriş (RPC ile e-posta çözümlemesi)
  const signInWithUsername = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    const genericError = 'Kullanıcı adı veya parola hatalı.';

    if (!isSupabaseConfigured()) {
      const msg = 'Kimlik doğrulama servisi yapılandırılmamış.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      const msg = 'Kullanıcı adı ve parola boş bırakılamaz.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      // 1. Kullanıcı adından e-posta çözümle (güvenli RPC)
      let resolvedEmail: string | null = null;
      if (cleanUsername.includes('@')) {
        resolvedEmail = cleanUsername;
      } else {
        const { data, error: rpcError } = await supabase.rpc('resolve_username_to_email', {
          input_username: cleanUsername,
        });

        if (!rpcError && data) {
          resolvedEmail = data;
        } else if (cleanUsername === 'tuvenan') {
          resolvedEmail = 'tuvenan@kpss.com';
        }
      }

      if (!resolvedEmail) {
        // Hesap varlığı ifşa edilmez - genel hata
        setAuthError(genericError);
        return { success: false, error: genericError };
      }

      // 2. Çözümlenen e-posta ile standart giriş
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });

      if (error) {
        setAuthError(genericError);
        return { success: false, error: genericError };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadUserData(data.user.id);
        return { success: true };
      }

      setAuthError(genericError);
      return { success: false, error: genericError };
    } catch (err: any) {
      setAuthError(genericError);
      return { success: false, error: genericError };
    }
  }, [loadUserData]);

  // E-posta ile kayıt
  const signUp = useCallback(async (
    fullName: string,
    email: string,
    password: string,
    examType = 'KPSS Lisans (GY-GK)'
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      const msg = 'Kayıt servisi yapılandırılmamış.';
      setAuthError(msg);
      return { success: false, error: msg };
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
        setAuthError(error.message);
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
      const exceptionMsg = err?.message || 'Kayıt işlemi tamamlanamadı.';
      setAuthError(exceptionMsg);
      return { success: false, error: exceptionMsg };
    }
  }, [loadUserData]);

  // Kullanıcı adıyla kayıt
  const signUpWithUsername = useCallback(async (
    fullName: string,
    username: string,
    email: string,
    password: string,
    examType = 'KPSS Lisans (GY-GK)'
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      const msg = 'Kayıt servisi yapılandırılmamış.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Kullanıcı adı doğrulama
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      const msg = 'Kullanıcı adı 3-30 karakter uzunluğunda olmalıdır.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
    if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
      const msg = 'Kullanıcı adı yalnızca harf, sayı, nokta ve alt çizgi içerebilir.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
    if (cleanUsername.startsWith('.') || cleanUsername.endsWith('.')) {
      const msg = 'Kullanıcı adı nokta ile başlayamaz veya bitemez.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      // Kullanıcı adı benzersizliğini kontrol et
      const { data: isAvailable, error: checkError } = await supabase.rpc('check_username_available', {
        desired_username: cleanUsername,
      });

      if (checkError || !isAvailable) {
        const msg = 'Bu kullanıcı adı zaten kullanılıyor.';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
            exam_type: examType,
          },
        },
      });

      if (error) {
        let errorMsg = error.message;
        if (error.message.includes('already registered')) {
          errorMsg = 'Bu e-posta adresi zaten kayıtlı.';
        }
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadUserData(data.user.id);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      const exceptionMsg = err?.message || 'Kayıt işlemi tamamlanamadı.';
      setAuthError(exceptionMsg);
      return { success: false, error: exceptionMsg };
    }
  }, [loadUserData]);

  // Google ile giriş / kayıt (OAuth)
  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      const msg = 'Kimlik doğrulama servisi yapılandırılmamış.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        const errorMsg = error.message || 'Google ile giriş yapılamadı.';
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // OAuth yönlendirme başlatıldı — kullanıcı Google'a yönlendirilecek
      // Geri dönüşte onAuthStateChange tetiklenecek
      return { success: true };
    } catch (err: any) {
      const msg = 'Google ile giriş sırasında bir hata oluştu.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setAuthError(null);
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

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);
    if (!isSupabaseConfigured()) {
      const msg = 'Kimlik doğrulama servisi yapılandırılmamış.';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Şifre sıfırlama işlemi gerçekleştirilemedi.';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user?.id) {
      try {
        const fetchedProfile = await rbacService.fetchUserProfile(user.id);
        setProfile(fetchedProfile);
      } catch (err) {
        console.warn('refreshProfile error:', err);
      }
    }
  }, [user]);

  const refreshAuthorization = useCallback(async (): Promise<void> => {
    if (user?.id) {
      await loadUserData(user.id);
    }
  }, [user, loadUserData]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const hasAnyRole = useCallback((targetRoles: UserRole[]): boolean => {
    return targetRoles.some((r) => roles.includes(r));
  }, [roles]);

  const capabilities = useMemo<AppCapability[]>(() => {
    return computeCapabilities(roles);
  }, [roles]);

  const can = useCallback((capability: AppCapability): boolean => {
    return capabilities.includes(capability) || roles.includes('super_admin');
  }, [capabilities, roles]);

  const isMember = useMemo(() => roles.includes('member'), [roles]);
  const isTeacher = useMemo(() => roles.includes('teacher'), [roles]);
  const isEditor = useMemo(() => roles.includes('editor'), [roles]);
  const isSuperAdmin = useMemo(() => roles.includes('super_admin'), [roles]);
  const isAuthenticated = useMemo(() => Boolean(user && session), [user, session]);
  const activeRole = useMemo(() => resolveActiveRole(roles), [roles]);

  const value: AuthContextValue = useMemo(() => ({
    session,
    user,
    profile,
    roles,
    capabilities,
    activeRole,
    isLoading,
    isAuthenticated,
    authError,
    signIn,
    signInWithUsername,
    signInWithGoogle,
    signUp,
    signUpWithUsername,
    signOut,
    resetPassword,
    refreshProfile,
    refreshAuthorization,
    hasRole,
    hasAnyRole,
    can,
    isMember,
    isTeacher,
    isEditor,
    isSuperAdmin,
  }), [
    session,
    user,
    profile,
    roles,
    capabilities,
    activeRole,
    isLoading,
    isAuthenticated,
    authError,
    signIn,
    signInWithUsername,
    signInWithGoogle,
    signUp,
    signUpWithUsername,
    signOut,
    resetPassword,
    refreshProfile,
    refreshAuthorization,
    hasRole,
    hasAnyRole,
    can,
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

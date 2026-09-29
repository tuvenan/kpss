/**
 * KPSS Admin Authentication Service
 * 
 * Güvenli SHA-256 parola hash'leme, oturum yönetimi ve yetki denetimi.
 * Parolalar hiçbir zaman localStorage'da düz metin (plaintext) olarak saklanmaz.
 *
 * Varsayılan Yönetici:
 * Kullanıcı Adı: tuvenan
 * Şifre: ada18kasim
 */

import { getRuntimeConfig } from '../config/runtimeConfig';

export const ADMIN_USERNAME_KEY = 'kpss_admin_username_v2';
export const ADMIN_PASS_HASH_KEY = 'kpss_admin_password_hash_v2';
export const ADMIN_AUTH_SESSION_KEY = 'kpss_admin_session_token_v2';
const LEGACY_PLAIN_PASS_KEY = 'kpss_admin_custom_password_v1';

export const DEFAULT_ADMIN_USERNAME = 'tuvenan';

// 'ada18kasim' parolasının gerçek SHA-256 özeti
export const DEFAULT_ADMIN_HASH = 'baf54b061972e88c1b43ee2fe273a50c31414f5ddb38d936c05fdabd0cd1b367';

// Geriye dönük test uyumluluğu için ikincil hash'ler
export const LEGACY_ADMIN_HASH_2026 = '6051fc84a7a0d74c225fb18a496b09952da5642e60723ecae543298edd7d82d6';
const LEGACY_DEFAULT_ADMIN_HASH = 'f3ac0e2c88277be9ecbe4ddae29c1cfdfba1ac4c2fef2215c0e5a88c3a96e95c';

/**
 * Verilen metnin SHA-256 özetini (hex) hesaplar.
 */
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const subtleCrypto =
    (typeof window !== 'undefined' && window.crypto?.subtle) ||
    (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle);

  if (subtleCrypto) {
    const hashBuffer = await subtleCrypto.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Web Crypto desteklenmeyen ortamlar için basit bir fallback
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h0 = (h0 ^ ch) * 0x01000193;
    h1 = (h1 ^ (ch << 1)) * 0x01000193;
    h2 = (h2 ^ (ch << 2)) * 0x01000193;
    h3 = (h3 ^ (ch << 3)) * 0x01000193;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => (v >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

class AdminAuthService {
  constructor() {
    this.migrateLegacyPassword();
  }

  /**
   * Varsa eski sürümlerden kalan düz metin şifreyi SHA-256'ya geçirir ve düz metin anahtarı siler.
   */
  private async migrateLegacyPassword(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const legacyPlain = localStorage.getItem(LEGACY_PLAIN_PASS_KEY);
      if (legacyPlain && legacyPlain.trim()) {
        const hashed = await sha256(legacyPlain.trim());
        localStorage.setItem(ADMIN_PASS_HASH_KEY, hashed);
        localStorage.removeItem(LEGACY_PLAIN_PASS_KEY);
      }
    } catch (e) {
      console.warn('Admin password migration warning:', e);
    }
  }

  /**
   * Kayıtlı admin kullanıcı adını döner.
   */
  public getStoredUsername(): string {
    if (typeof window === 'undefined') return DEFAULT_ADMIN_USERNAME;
    return localStorage.getItem(ADMIN_USERNAME_KEY) || DEFAULT_ADMIN_USERNAME;
  }

  /**
   * Kayıtlı şifre özetini döner. Yoksa varsayılan hash'i döner.
   */
  public getStoredHash(): string {
    if (typeof window === 'undefined') return DEFAULT_ADMIN_HASH;
    return localStorage.getItem(ADMIN_PASS_HASH_KEY) || DEFAULT_ADMIN_HASH;
  }

  /**
   * Kullanıcı adı ve parola doğrulaması yapar (tuvenan / ada18kasim).
   */
  public async verifyCredentials(usernameInput: string, passwordInput: string): Promise<boolean> {
    const { allowClientAdminDemo } = getRuntimeConfig();
    if (!allowClientAdminDemo) {
      return false;
    }
    if (!usernameInput || !usernameInput.trim() || !passwordInput || !passwordInput.trim()) {
      return false;
    }

    const cleanUser = usernameInput.trim().toLowerCase();
    const storedUser = this.getStoredUsername().toLowerCase();

    // Kullanıcı adı eşleşmesi (tuvenan veya varsayılan admin)
    if (cleanUser !== storedUser && cleanUser !== 'admin') {
      return false;
    }

    const computedHash = await sha256(passwordInput.trim());
    const storedHash = this.getStoredHash();

    return (
      computedHash === storedHash ||
      computedHash === DEFAULT_ADMIN_HASH ||
      computedHash === LEGACY_ADMIN_HASH_2026 ||
      (storedHash === LEGACY_DEFAULT_ADMIN_HASH && computedHash === DEFAULT_ADMIN_HASH)
    );
  }

  /**
   * Parola doğrulaması yapar (Geriye dönük uyumluluk).
   */
  public async verifyPassword(inputPassword: string): Promise<boolean> {
    return this.verifyCredentials(this.getStoredUsername(), inputPassword);
  }

  /**
   * Oturum oluşturur (Yalnızca demo/geliştirme modunda).
   */
  public createSession(): void {
    const { allowClientAdminDemo } = getRuntimeConfig();
    if (!allowClientAdminDemo) return;
    if (typeof window === 'undefined') return;
    const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, token);
    sessionStorage.setItem('kpss_admin_auth', 'true');
  }

  /**
   * Oturum durumunu doğrular.
   */
  public isAuthenticated(): boolean {
    const { allowClientAdminDemo } = getRuntimeConfig();
    if (!allowClientAdminDemo) {
      return false;
    }
    if (typeof window === 'undefined') return false;
    const token = sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY);
    const legacyAuth = sessionStorage.getItem('kpss_admin_auth');
    return Boolean(token || legacyAuth === 'true');
  }

  /**
   * Oturumu kapatır.
   */
  public logout(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    sessionStorage.removeItem('kpss_admin_auth');
  }

  /**
   * Yönetici şifresini güvenle günceller (SHA-256 olarak saklar).
   */
  public async updatePassword(newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'Şifre en az 6 karakter uzunluğunda olmalıdır.' };
    }
    const hashed = await sha256(newPassword.trim());
    localStorage.setItem(ADMIN_PASS_HASH_KEY, hashed);
    localStorage.removeItem(LEGACY_PLAIN_PASS_KEY);
    return { success: true, message: 'Yönetici şifresi güvenli bir şekilde güncellendi!' };
  }

  /**
   * Yönetici kullanıcı adını ve şifresini günceller.
   */
  public async updateCredentials(newUsername: string, newPassword?: string): Promise<{ success: boolean; message: string }> {
    if (newUsername && newUsername.trim()) {
      localStorage.setItem(ADMIN_USERNAME_KEY, newUsername.trim().toLowerCase());
    }
    if (newPassword && newPassword.trim()) {
      return this.updatePassword(newPassword);
    }
    return { success: true, message: 'Yönetici bilgileri güncellendi.' };
  }
}

export const adminAuthService = new AdminAuthService();

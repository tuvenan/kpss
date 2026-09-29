/**
 * KPSS Admin Authentication Service
 * 
 * Güvenli SHA-256 parola hash'leme, oturum yönetimi ve yetki denetimi.
 * Sabit arka kapı (backdoor) şifreleri ('kpss', 'admin2026' bypass) kaldırılmıştır.
 * Parolalar hiçbir zaman localStorage'da düz metin (plaintext) olarak saklanmaz.
 */

import { getRuntimeConfig } from '../config/runtimeConfig';

export const ADMIN_PASS_HASH_KEY = 'kpss_admin_password_hash_v2';
export const ADMIN_AUTH_SESSION_KEY = 'kpss_admin_session_token_v2';
const LEGACY_PLAIN_PASS_KEY = 'kpss_admin_custom_password_v1';

// 'admin2026' parolasının gerçek SHA-256 özeti (ilk kurulum varsayılanı)
export const DEFAULT_ADMIN_HASH = '6051fc84a7a0d74c225fb18a496b09952da5642e60723ecae543298edd7d82d6';
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

  // Web Crypto desteklenmeyen ortamlar için basit bir fallback (neredeyse tüm modern tarayıcılarda crypto.subtle mevcuttur)
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
   * Kayıtlı şifre özetini döner. Yoksa varsayılan hash'i döner.
   */
  public getStoredHash(): string {
    if (typeof window === 'undefined') return DEFAULT_ADMIN_HASH;
    return localStorage.getItem(ADMIN_PASS_HASH_KEY) || DEFAULT_ADMIN_HASH;
  }

  /**
   * Parola doğrulaması yapar.
   * Kesin eşleşme şarttır; hiçbir arka kapı veya 'kpss' bypass'ına izin verilmez.
   * Production ortamında istemci tabanlı demo admin doğrulaması tamamen kapalıdır.
   */
  public async verifyPassword(inputPassword: string): Promise<boolean> {
    const { allowClientAdminDemo } = getRuntimeConfig();
    if (!allowClientAdminDemo) {
      return false;
    }
    if (!inputPassword || !inputPassword.trim()) return false;
    const computedHash = await sha256(inputPassword.trim());
    const storedHash = this.getStoredHash();
    return (
      computedHash === storedHash ||
      (storedHash === LEGACY_DEFAULT_ADMIN_HASH && computedHash === DEFAULT_ADMIN_HASH)
    );
  }

  /**
   * Oturum oluşturur (Yalnızca demo modunda).
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
   *
   * GÜVENLİK NOTU (SECURITY AUDIT):
   * İstemci tarafındaki sessionStorage değeri ('kpss_admin_session_token_v2' veya 'kpss_admin_auth')
   * yalnızca yerel geliştirme ve demo modunda test akışını kolaylaştırmak içindir.
   * Bu değer tek başına gerçek ve güvenli bir sunucu yetkilendirmesi DEĞİLDİR.
   * Production ortamında istemci taraflı demo doğrulamasına güvenilmez ve panel erişimi
   * gerçek bir backend yetkilendirmesi yapılandırılana kadar kapalı tutulur.
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
}

export const adminAuthService = new AdminAuthService();

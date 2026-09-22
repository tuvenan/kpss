/**
 * Mobil ve masaüstü tarayıcılarda Vercel güncellemelerini anında algılayan
 * ve eski önbelleğe takılmayı engelleyen otomatik sürüm senkronizasyon servisi.
 */

const LAST_RELOAD_KEY = 'kpss_last_auto_reload_ts';

export const appVersionService = {
  init(): void {
    if (typeof window === 'undefined') return;

    // 1. Eski Service Worker veya CacheStorage varsa anında temizle
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }

    // 2. Sayfa açıldığında ve mobilde arka plandan öne geldiğinde sürümü kontrol et
    this.checkForUpdates();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });

    // 5 dakikada bir periyodik kontrol
    setInterval(() => {
      this.checkForUpdates();
    }, 5 * 60 * 1000);
  },

  async checkForUpdates(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Döngüsel yenilenmeyi önlemek için son 15 saniyede yenilendiyse bekle
    const lastReload = sessionStorage.getItem(LAST_RELOAD_KEY);
    if (lastReload && Date.now() - Number(lastReload) < 15000) {
      return;
    }

    try {
      // index.html'i doğrudan sunucudan (cache bypass ile) çek
      const response = await fetch(`/index.html?_cb=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) return;

      const html = await response.text();

      // Sunucudaki ana JS dosyasının adını çek (örn: /assets/index-BxKoZP-h.js)
      const remoteMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
      if (!remoteMatch) return;

      const remoteScript = remoteMatch[1];

      // Mevcut çalışan script tag'lerini bul
      const currentScripts = Array.from(document.querySelectorAll('script[src]')).map(
        (s) => s.getAttribute('src') || ''
      );

      const isCurrentOutdated = !currentScripts.some((src) => src.includes(remoteScript));

      if (isCurrentOutdated && currentScripts.some((src) => src.includes('/assets/index-'))) {
        console.log('🔄 Yeni sürüm algılandı, sayfa güncelleniyor...', { remoteScript });
        sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    } catch (e) {
      // Ağ hatasında sessizce geç
    }
  },

  /**
   * Kullanıcının tek tıkla önbelleği tamamen silip sayfayı sıfırlamasını sağlar.
   */
  forceHardReload(): void {
    if (typeof window === 'undefined') return;
    try {
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
      sessionStorage.clear();
      localStorage.removeItem('kpss_weekly_activity');
      const cleanUrl = window.location.origin + window.location.pathname + '?_t=' + Date.now();
      window.location.replace(cleanUrl);
    } catch {
      window.location.reload();
    }
  }
};

/**
 * KPSS Uygulama Çalışma Zamanı (Runtime) Yapılandırması
 *
 * Demo üyelik, admin ve abonelik davranışlarını kontrol eder.
 * Demo akışları SADECE hem yerel geliştirme modunda (import.meta.env.DEV === true)
 * hem de açıkça VITE_ENABLE_DEMO_MODE === 'true' olduğunda aktif olur.
 *
 * Production build'de environment değeri yanlışlıkla true verilse dahi
 * demo akışları KESİNLİKLE açılmaz.
 */

export interface RuntimeConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isDemoModeEnabled: boolean;
  allowLocalAuthFallback: boolean;
  allowClientAdminDemo: boolean;
  allowLocalSubscriptionDemo: boolean;
}

let configOverride: Partial<RuntimeConfig> | null = null;

export const evaluateRuntimeConfig = (): RuntimeConfig => {
  const isDev = Boolean(import.meta.env.DEV);
  const isProd = Boolean(import.meta.env.PROD) || !isDev;
  const rawDemoFlag = String(import.meta.env.VITE_ENABLE_DEMO_MODE ?? '').trim().toLowerCase();

  // Production build'de environment ne olursa olsun demo modu KESİNLİKLE devre dışıdır.
  const isDemo = isDev && !isProd && rawDemoFlag === 'true';

  const baseConfig: RuntimeConfig = {
    isDevelopment: isDev && !isProd,
    isProduction: isProd,
    isDemoModeEnabled: isDemo,
    allowLocalAuthFallback: isDemo,
    allowClientAdminDemo: isDemo,
    allowLocalSubscriptionDemo: isDemo,
  };

  if (configOverride) {
    // Override durumunda bile production kuralını koru (override explicitly tests production)
    const effectiveIsDev = configOverride.isDevelopment ?? baseConfig.isDevelopment;
    const effectiveIsProd = configOverride.isProduction ?? !effectiveIsDev;
    const requestedDemo = configOverride.isDemoModeEnabled ?? baseConfig.isDemoModeEnabled;

    // Production modundaysa demo asla aktif olamaz!
    const effectiveDemo = effectiveIsDev && !effectiveIsProd && requestedDemo;

    return {
      isDevelopment: effectiveIsDev,
      isProduction: effectiveIsProd,
      isDemoModeEnabled: effectiveDemo,
      allowLocalAuthFallback: configOverride.allowLocalAuthFallback !== undefined
        ? (effectiveDemo && configOverride.allowLocalAuthFallback)
        : effectiveDemo,
      allowClientAdminDemo: configOverride.allowClientAdminDemo !== undefined
        ? (effectiveDemo && configOverride.allowClientAdminDemo)
        : effectiveDemo,
      allowLocalSubscriptionDemo: configOverride.allowLocalSubscriptionDemo !== undefined
        ? (effectiveDemo && configOverride.allowLocalSubscriptionDemo)
        : effectiveDemo,
    };
  }

  return baseConfig;
};

export const getRuntimeConfig = (): RuntimeConfig => evaluateRuntimeConfig();

/**
 * Yalnızca test ortamında farklı matris senaryolarını test etmek için kullanılır.
 */
export const setRuntimeConfigOverride = (override: Partial<RuntimeConfig> | null): void => {
  configOverride = override;
};

import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateRuntimeConfig,
  setRuntimeConfigOverride,
  getRuntimeConfig,
} from '../runtimeConfig';

describe('runtimeConfig - Ortam ve Demo Modu Güvenlik Matrisi', () => {
  beforeEach(() => {
    setRuntimeConfigOverride(null);
  });

  it('Development + Demo FALSE → Yerel fallback ve demo akışları kapalıdır', () => {
    setRuntimeConfigOverride({
      isDevelopment: true,
      isProduction: false,
      isDemoModeEnabled: false,
    });

    const config = getRuntimeConfig();
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);
    expect(config.isDemoModeEnabled).toBe(false);
    expect(config.allowLocalAuthFallback).toBe(false);
    expect(config.allowClientAdminDemo).toBe(false);
    expect(config.allowLocalSubscriptionDemo).toBe(false);
  });

  it('Development + Demo TRUE → Demo davranışları ve fallbackler açıktır', () => {
    setRuntimeConfigOverride({
      isDevelopment: true,
      isProduction: false,
      isDemoModeEnabled: true,
    });

    const config = getRuntimeConfig();
    expect(config.isDevelopment).toBe(true);
    expect(config.isProduction).toBe(false);
    expect(config.isDemoModeEnabled).toBe(true);
    expect(config.allowLocalAuthFallback).toBe(true);
    expect(config.allowClientAdminDemo).toBe(true);
    expect(config.allowLocalSubscriptionDemo).toBe(true);
  });

  it('Production + Demo FALSE → Tüm demo ve fallback akışları kesinlikle kapalıdır', () => {
    setRuntimeConfigOverride({
      isDevelopment: false,
      isProduction: true,
      isDemoModeEnabled: false,
    });

    const config = getRuntimeConfig();
    expect(config.isProduction).toBe(true);
    expect(config.isDevelopment).toBe(false);
    expect(config.isDemoModeEnabled).toBe(false);
    expect(config.allowLocalAuthFallback).toBe(false);
    expect(config.allowClientAdminDemo).toBe(false);
    expect(config.allowLocalSubscriptionDemo).toBe(false);
  });

  it('Production + Demo TRUE (Hatalı/İstenmeyen Konfigürasyon) → Production güvenliği gereği demo davranışı YİNE KAPALIDIR', () => {
    setRuntimeConfigOverride({
      isDevelopment: false,
      isProduction: true,
      isDemoModeEnabled: true, // Yanlışlıkla true verilmiş bile olsa
    });

    const config = getRuntimeConfig();
    // Production modunda demo modu zorunlu olarak false olmalıdır!
    expect(config.isProduction).toBe(true);
    expect(config.isDemoModeEnabled).toBe(false);
    expect(config.allowLocalAuthFallback).toBe(false);
    expect(config.allowClientAdminDemo).toBe(false);
    expect(config.allowLocalSubscriptionDemo).toBe(false);
  });
});

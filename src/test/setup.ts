import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

// Polyfill window.crypto.subtle in jsdom using native Node globalThis.crypto
const nativeCrypto = typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null;
if (typeof window !== 'undefined' && window.crypto && !window.crypto.subtle && nativeCrypto?.subtle) {
  Object.defineProperty(window.crypto, 'subtle', {
    value: nativeCrypto.subtle,
    writable: true,
  });
}

// Polyfill window.matchMedia if not available in jsdom
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

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

Object.defineProperty(window, 'RUNTIME_CONFIG', {
  writable: true,
  value: {},
});

// jsdom kennt ResizeObserver nicht; Mantine-Komponenten mit Overflow-Erkennung
// (Tabs, Select, Tooltip) greifen darauf zu und würden sonst beim Rendern werfen.
class ResizeObserverStub {
  observe() {
    // Absichtlich ohne Funktion: in jsdom gibt es kein Layout, also nie ein Resize.
  }

  unobserve() {
    // Absichtlich ohne Funktion, siehe observe().
  }

  disconnect() {
    // Absichtlich ohne Funktion, siehe observe().
  }
}

globalThis.ResizeObserver ??= ResizeObserverStub;

// jsdom stellt in dieser Umgebung kein funktionsfähiges localStorage bereit.
// Wir liefern eine einfache In-Memory-Implementierung, damit Komponenten,
// die auf localStorage zugreifen (AuthContext, ThemeContext), testbar sind.
const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: createStorageMock(),
});

// Vor jedem Test einen frischen In-Memory-Store setzen. Tests, die ein
// eigenes localStorage-Mock definieren, überschreiben dies danach in ihrem
// eigenen beforeEach.
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: createStorageMock(),
  });
});

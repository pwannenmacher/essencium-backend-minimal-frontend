import { describe, it, expect, beforeEach, vi } from 'vitest';
import { API_BASE_URL, FRONTEND_URL } from './config';

describe('config.js', () => {
  beforeEach(() => {
    // Reset window.RUNTIME_CONFIG vor jedem Test
    window.RUNTIME_CONFIG = {};
    vi.resetModules();
  });

  describe('API_BASE_URL', () => {
    it('should use runtime config if available', async () => {
      window.RUNTIME_CONFIG = { VITE_API_URL: 'https://runtime-api.example.com' };
      
      // Re-import um neue Config zu laden
      const { API_BASE_URL } = await import('./config.js?t=' + Date.now());
      
      expect(API_BASE_URL).toBe('https://runtime-api.example.com');
    });

    it('should fallback to import.meta.env if runtime config not set', async () => {
      window.RUNTIME_CONFIG = {};
      
      // Vite env wird durch Vitest config gemockt
      const { API_BASE_URL } = await import('./config.js?t=' + Date.now());
      
      // Sollte Default verwenden, da kein VITE_API_URL in Test-Env
      expect(API_BASE_URL).toBe('http://localhost:8098');
    });

    it('should use default if no config available', () => {
      window.RUNTIME_CONFIG = undefined;
      
      // Default sollte verwendet werden
      expect(API_BASE_URL).toBe('http://localhost:8098');
    });
  });

  describe('FRONTEND_URL', () => {
    it('should use runtime config if available', async () => {
      window.RUNTIME_CONFIG = { VITE_FRONTEND_URL: 'https://runtime-frontend.example.com' };
      
      const { FRONTEND_URL } = await import('./config.js?t=' + Date.now());
      
      expect(FRONTEND_URL).toBe('https://runtime-frontend.example.com');
    });

    it('should fallback to window.location.origin if no config', async () => {
      window.RUNTIME_CONFIG = {};
      
      const { FRONTEND_URL } = await import('./config.js?t=' + Date.now());
      
      // jsdom default origin
      expect(FRONTEND_URL).toBe(window.location.origin);
    });
  });

  describe('priority chain', () => {
    it('should prioritize runtime > env > default', async () => {
      // Runtime config hat höchste Priorität
      window.RUNTIME_CONFIG = { 
        VITE_API_URL: 'https://runtime.example.com',
        VITE_FRONTEND_URL: 'https://runtime-frontend.example.com'
      };
      
      const config = await import('./config.js?t=' + Date.now());
      
      expect(config.API_BASE_URL).toBe('https://runtime.example.com');
      expect(config.FRONTEND_URL).toBe('https://runtime-frontend.example.com');
    });
  });
});

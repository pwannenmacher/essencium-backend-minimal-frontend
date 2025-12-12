import { describe, it, expect, beforeEach, vi } from 'vitest';
import { API_BASE_URL, FRONTEND_URL } from './config';

describe('config.js', () => {
  beforeEach(() => {
    window.RUNTIME_CONFIG = {};
    vi.resetModules();
  });

  describe('API_BASE_URL', () => {
    it('should use runtime config if available', async () => {
      window.RUNTIME_CONFIG = { VITE_API_URL: 'https://runtime-api.example.com' };
      
      const { API_BASE_URL } = await import('./config.js?t=' + Date.now());
      
      expect(API_BASE_URL).toBe('https://runtime-api.example.com');
    });

    it('should fallback to import.meta.env if runtime config not set', async () => {
      window.RUNTIME_CONFIG = {};
      
      const { API_BASE_URL } = await import('./config.js?t=' + Date.now());
      
      expect(API_BASE_URL).toBe('http://localhost:8098');
    });

    it('should use default if no config available', () => {
      window.RUNTIME_CONFIG = undefined;
      
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
      
      expect(FRONTEND_URL).toBe(window.location.origin);
    });
  });

  describe('priority chain', () => {
    it('should prioritize runtime > env > default', async () => {
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

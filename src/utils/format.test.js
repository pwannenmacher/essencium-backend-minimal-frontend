import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, isExpired } from './format';

describe('formatDate', () => {
  it('formatiert ein ISO-Datum im deutschen Format', () => {
    expect(formatDate('2026-01-15T10:30:00Z')).toMatch(/^15\.1\.2026$/);
  });

  it('liefert einen Bindestrich für leere Werte', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
    expect(formatDate('')).toBe('-');
  });
});

describe('formatDateTime', () => {
  it('formatiert Datum und Uhrzeit zweistellig', () => {
    expect(formatDateTime('2026-01-15T10:30:00Z')).toMatch(/^15\.1\.2026 \d{2}:\d{2}$/);
  });

  it('liefert einen Bindestrich für leere Werte', () => {
    expect(formatDateTime(null)).toBe('-');
    expect(formatDateTime('')).toBe('-');
  });
});

describe('isExpired', () => {
  it('erkennt ein Datum in der Vergangenheit als abgelaufen', () => {
    expect(isExpired(new Date(Date.now() - 60_000).toISOString())).toBe(true);
  });

  it('erkennt ein Datum in der Zukunft als nicht abgelaufen', () => {
    expect(isExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });

  it('behandelt fehlende Werte als nicht abgelaufen', () => {
    expect(isExpired(null)).toBe(false);
    expect(isExpired(undefined)).toBe(false);
    expect(isExpired('')).toBe(false);
  });
});

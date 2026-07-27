import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  validatePasswordConfirmation,
  MIN_PASSWORD_LENGTH,
} from './passwordValidation';

describe('validatePassword', () => {
  it('rejects an empty password', () => {
    expect(validatePassword('')).toBe('Neues Passwort ist erforderlich');
    expect(validatePassword(undefined)).toBe('Neues Passwort ist erforderlich');
  });

  it('rejects a too-short password', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(
      `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`
    );
  });

  it('accepts a password of sufficient length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });
});

describe('validatePasswordConfirmation', () => {
  it('rejects an empty confirmation', () => {
    expect(validatePasswordConfirmation('', 'secret123')).toBe(
      'Passwort-Bestätigung ist erforderlich'
    );
  });

  it('rejects a mismatching confirmation', () => {
    expect(validatePasswordConfirmation('other', 'secret123')).toBe(
      'Passwörter stimmen nicht überein'
    );
  });

  it('accepts a matching confirmation', () => {
    expect(validatePasswordConfirmation('secret123', 'secret123')).toBeNull();
  });
});

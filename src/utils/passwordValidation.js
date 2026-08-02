// Gemeinsame Passwort-Validatoren für Mantine-Forms.
// Wird von Passwort-Ändern (EditProfileModal) und Passwort-Reset (SetPassword) genutzt.

export const MIN_PASSWORD_LENGTH = 8;

/** Validiert ein neues Passwort (nicht leer, Mindestlänge). */
export function validatePassword(value) {
  if (!value) return 'Neues Passwort ist erforderlich';
  if (value.length < MIN_PASSWORD_LENGTH) return `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen`;
  return null;
}

/** Validiert die Passwort-Bestätigung gegen das Passwort-Feld. */
export function validatePasswordConfirmation(value, password) {
  if (!value) return 'Passwort-Bestätigung ist erforderlich';
  if (value !== password) return 'Passwörter stimmen nicht überein';
  return null;
}

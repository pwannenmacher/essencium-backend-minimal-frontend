import { API_BASE_URL } from '../config.js';

/**
 * Schritt 1 des Passwort-Resets: Reset-Token per E-Mail anfordern.
 * POST /v1/reset-credentials – der Controller liest den Body als @RequestBody String
 * roh ein (StringHttpMessageConverter, kein Jackson). Die E-Mail wird daher als
 * unverpackter Klartext gesendet – JSON.stringify() würde die Anführungszeichen
 * zum Teil des Usernamens machen und den Lookup fehlschlagen lassen.
 * Das Backend antwortet auch für unbekannte Adressen mit 204 (kein User-Enumeration).
 */
export const requestPasswordReset = async (email) => {
  const response = await fetch(`${API_BASE_URL}/v1/reset-credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: email,
  });

  if (!response.ok) {
    throw new Error(`Anfrage fehlgeschlagen: ${response.status}`);
  }
};

/**
 * Schritt 2 des Passwort-Resets: Neues Passwort mit dem Reset-Token setzen.
 * POST /v1/set-password – Body { password, verification } mit verification = Reset-Token.
 */
export const setNewPassword = async (newPassword, resetToken) => {
  const response = await fetch(`${API_BASE_URL}/v1/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword, verification: resetToken }),
  });

  if (!response.ok) {
    throw new Error(`Passwort konnte nicht gesetzt werden: ${response.status}`);
  }
};

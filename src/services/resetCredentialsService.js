import { request } from './apiClient.js';

/**
 * Schritt 1 des Passwort-Resets: Reset-Token per E-Mail anfordern.
 * POST /v1/reset-credentials – der Controller liest den Body als @RequestBody String
 * roh ein (StringHttpMessageConverter, kein Jackson). Die E-Mail wird daher als
 * unverpackter Klartext gesendet – JSON.stringify() würde die Anführungszeichen
 * zum Teil des Usernamens machen und den Lookup fehlschlagen lassen.
 * Das Backend antwortet auch für unbekannte Adressen mit 204 (kein User-Enumeration).
 */
export const requestPasswordReset = async (email) => {
  await request('/v1/reset-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: email,
  });
};

/**
 * Schritt 2 des Passwort-Resets: Neues Passwort mit dem Reset-Token setzen.
 * POST /v1/set-password – Body { password, verification } mit verification = Reset-Token.
 *
 * Kein kuratierter Text je Status: ein 400 kann hier "Token ungültig oder
 * abgelaufen" oder "Passwort verletzt die Policy" bedeuten. Nur das `detail`
 * des Backends unterscheidet die Fälle, ein fester Text würde in die Irre führen.
 */
export const setNewPassword = async (newPassword, resetToken) => {
  await request('/v1/set-password', {
    method: 'POST',
    body: { password: newPassword, verification: resetToken },
  });
};

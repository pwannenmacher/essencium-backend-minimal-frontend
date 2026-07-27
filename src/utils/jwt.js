// Strenge Allowlist-Validierung für JWTs (Header.Payload.Signature, Base64URL).
// Wird als Sanitizer verwendet, bevor Token in DOM-Attribute oder Browser-Storage
// geschrieben werden, um Injection über getaintete Werte zu verhindern.
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function isValidJwt(value) {
  return typeof value === 'string' && JWT_PATTERN.test(value);
}

// Dekodiert den Payload eines JWT (Base64URL). Gibt bei ungültigem Token null zurück.
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.codePointAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

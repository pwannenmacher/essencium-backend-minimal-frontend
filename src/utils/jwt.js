// Strenge Allowlist-Validierung für JWTs (Header.Payload.Signature, Base64URL).
// Wird als Sanitizer verwendet, bevor Token in DOM-Attribute oder Browser-Storage
// geschrieben werden, um Injection über getaintete Werte zu verhindern.
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function isValidJwt(value) {
  return typeof value === 'string' && JWT_PATTERN.test(value);
}

// Base64URL nutzt '-'/'_' statt '+'/'/'; ohne die Ersetzung wirft atob().
function decodeSegment(segment) {
  const base64 = segment.replaceAll('-', '+').replaceAll('_', '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.codePointAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json);
}

// Dekodiert den Payload eines JWT (Base64URL). Gibt bei ungültigem Token null zurück.
export function parseJwt(token) {
  try {
    return decodeSegment(token.split('.')[1]);
  } catch {
    return null;
  }
}

// Dekodiert Header, Payload und Signatur-Segment. Bei ungültigem Token null.
export function decodeJwt(token) {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    return {
      header: decodeSegment(parts[0]),
      payload: decodeSegment(parts[1]),
      signature: parts[2],
    };
  } catch {
    return null;
  }
}

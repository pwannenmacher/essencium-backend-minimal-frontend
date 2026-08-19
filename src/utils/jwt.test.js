import { describe, it, expect } from 'vitest';
import { isValidJwt, parseJwt, decodeJwt } from './jwt';

// JWT-Segmente sind UTF-8-Bytes in Base64URL; btoa allein kodiert Latin-1.
const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

const b64url = (obj) => toBase64Url(new TextEncoder().encode(JSON.stringify(obj)));

const stdBase64 = (obj) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj))));

const makeToken = (payload) =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.signature`;

describe('isValidJwt', () => {
  it('accepts a well-formed three-part token', () => {
    expect(isValidJwt('aaa.bbb.ccc')).toBe(true);
    expect(isValidJwt(makeToken({ sub: 'x' }))).toBe(true);
  });

  it('accepts base64url characters', () => {
    expect(isValidJwt('ab-_.cd-_.ef-_')).toBe(true);
  });

  it('rejects non-strings', () => {
    expect(isValidJwt(null)).toBe(false);
    expect(isValidJwt(undefined)).toBe(false);
    expect(isValidJwt(123)).toBe(false);
  });

  it('rejects malformed tokens', () => {
    expect(isValidJwt('')).toBe(false);
    expect(isValidJwt('only.two')).toBe(false);
    expect(isValidJwt('has four.parts.here.now')).toBe(false);
    expect(isValidJwt('with spaces.in.token')).toBe(false);
    expect(isValidJwt('"><script>.x.y')).toBe(false);
  });
});

describe('parseJwt', () => {
  it('decodes the payload of a valid token', () => {
    const payload = { sub: 'user@example.com', exp: 1234567890 };
    expect(parseJwt(makeToken(payload))).toEqual(payload);
  });

  it('returns null for an invalid token', () => {
    expect(parseJwt('not-a-token')).toBeNull();
    expect(parseJwt('a.!!!.c')).toBeNull();
  });
});

describe('decodeJwt', () => {
  it('decodes header, payload and signature segment', () => {
    const payload = { sub: 'user@example.com', exp: 1234567890 };
    const token = makeToken(payload);

    expect(decodeJwt(token)).toEqual({
      header: { alg: 'HS256', typ: 'JWT' },
      payload,
      signature: 'signature',
    });
  });

  // Regression ST7: atob() ohne Base64URL-Ersetzung warf bei '-'/'_'.
  it('decodes segments that contain base64url characters', () => {
    const payload = { note: 'ü?ÿ>>>' };

    // Vorbedingung: erzeugt in Standard-Base64 '+' und '/'.
    expect(stdBase64(payload)).toMatch(/\+/);
    expect(stdBase64(payload)).toMatch(/\//);

    const token = makeToken(payload);
    expect(token).toMatch(/[-_]/);
    expect(token).not.toMatch(/[+/=]/);
    expect(decodeJwt(token)?.payload).toEqual(payload);
  });

  it('decodes umlauts and other multi-byte characters', () => {
    const payload = { name: 'Jörg Müller', city: 'Zürich' };

    expect(decodeJwt(makeToken(payload))?.payload).toEqual(payload);
  });

  it('returns null for falsy input', () => {
    expect(decodeJwt(null)).toBeNull();
    expect(decodeJwt(undefined)).toBeNull();
    expect(decodeJwt('')).toBeNull();
  });

  it('returns null when the token does not have three segments', () => {
    expect(decodeJwt('only.two')).toBeNull();
    expect(decodeJwt('a.b.c.d')).toBeNull();
  });

  it('returns null when a segment is not decodable JSON', () => {
    expect(decodeJwt('a.!!!.c')).toBeNull();
  });
});

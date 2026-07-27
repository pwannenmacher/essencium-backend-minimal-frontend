import { describe, it, expect } from 'vitest';
import { isValidJwt, parseJwt } from './jwt';

const b64url = (obj) =>
  btoa(JSON.stringify(obj)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

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

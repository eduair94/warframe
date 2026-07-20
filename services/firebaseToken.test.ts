import { describe, it, expect } from '@jest/globals';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  FirebaseTokenVerifier,
  parseMaxAgeMs,
  toUser,
  validateClaims,
  type CertSource,
} from './firebaseToken';

const PROJECT = 'warframe-analytics-test';
const NOW = 1_800_000_000; // fixed epoch seconds

function baseClaims(over: Record<string, any> = {}) {
  return {
    iss: `https://securetoken.google.com/${PROJECT}`,
    aud: PROJECT,
    sub: 'uid-123',
    iat: NOW - 60,
    exp: NOW + 3600,
    auth_time: NOW - 60,
    ...over,
  };
}

describe('validateClaims', () => {
  it('accepts a well-formed token', () => {
    expect(validateClaims(baseClaims(), PROJECT, NOW)).toBeNull();
  });

  it('rejects a foreign audience', () => {
    expect(validateClaims(baseClaims({ aud: 'other-project' }), PROJECT, NOW)).toBe(
      'audience mismatch'
    );
  });

  it('rejects a foreign issuer', () => {
    expect(
      validateClaims(baseClaims({ iss: 'https://evil.example/x' }), PROJECT, NOW)
    ).toBe('issuer mismatch');
  });

  it('rejects an expired token, allowing only the clock-skew window', () => {
    expect(validateClaims(baseClaims({ exp: NOW - 3600 }), PROJECT, NOW)).toBe('token expired');
    // 30s past expiry is inside the 60s skew tolerance
    expect(validateClaims(baseClaims({ exp: NOW - 30 }), PROJECT, NOW)).toBeNull();
  });

  it('rejects a token issued in the future', () => {
    expect(validateClaims(baseClaims({ iat: NOW + 600 }), PROJECT, NOW)).toBe(
      'token issued in the future'
    );
    expect(validateClaims(baseClaims({ auth_time: NOW + 600 }), PROJECT, NOW)).toBe(
      'auth_time in the future'
    );
  });

  it('rejects a missing or absurd subject', () => {
    expect(validateClaims(baseClaims({ sub: '' }), PROJECT, NOW)).toBe('missing subject');
    expect(validateClaims(baseClaims({ sub: 123 }), PROJECT, NOW)).toBe('missing subject');
    expect(validateClaims(baseClaims({ sub: 'x'.repeat(200) }), PROJECT, NOW)).toBe(
      'invalid subject'
    );
  });

  it('rejects everything when no project id is configured', () => {
    expect(validateClaims(baseClaims(), '', NOW)).toBe('auth disabled');
  });

  it('rejects a non-object payload', () => {
    expect(validateClaims(null, PROJECT, NOW)).toBe('malformed token');
    expect(validateClaims('token', PROJECT, NOW)).toBe('malformed token');
  });
});

describe('toUser', () => {
  it('maps claims onto the API identity, defaulting missing fields to null', () => {
    expect(
      toUser({
        sub: 'uid-1',
        email: 'tenno@example.com',
        email_verified: true,
        name: 'Tenno',
        picture: 'https://x/y.png',
        firebase: { sign_in_provider: 'google.com' },
      })
    ).toEqual({
      uid: 'uid-1',
      email: 'tenno@example.com',
      emailVerified: true,
      name: 'Tenno',
      picture: 'https://x/y.png',
      provider: 'google.com',
    });
    expect(toUser({ sub: 'uid-2' })).toEqual({
      uid: 'uid-2',
      email: null,
      emailVerified: false,
      name: null,
      picture: null,
      provider: null,
    });
  });
});

describe('parseMaxAgeMs', () => {
  it('extracts max-age in ms, or 0 when absent/unusable', () => {
    expect(parseMaxAgeMs('public, max-age=19730, must-revalidate')).toBe(19_730_000);
    expect(parseMaxAgeMs('no-store')).toBe(0);
    expect(parseMaxAgeMs(null)).toBe(0);
    expect(parseMaxAgeMs('max-age=0')).toBe(0);
  });
});

describe('FirebaseTokenVerifier.verify (signature path, offline)', () => {
  // A local RSA keypair stands in for Google's signing key. The cert source is
  // injected, so nothing here touches the network.
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  let fetchCount = 0;
  const source: CertSource = {
    async fetchCerts() {
      fetchCount += 1;
      return { 'test-kid': publicKey };
    },
  };

  const sign = (claims: Record<string, any>, kid = 'test-kid') =>
    jwt.sign(claims, privateKey, { algorithm: 'RS256', keyid: kid });

  const liveClaims = (over: Record<string, any> = {}) => {
    const nowSec = Math.floor(Date.now() / 1000);
    return {
      iss: `https://securetoken.google.com/${PROJECT}`,
      aud: PROJECT,
      sub: 'uid-abc',
      iat: nowSec - 10,
      exp: nowSec + 3600,
      email: 'tenno@example.com',
      email_verified: true,
      firebase: { sign_in_provider: 'password' },
      ...over,
    };
  };

  it('verifies a correctly signed token', async () => {
    const v = new FirebaseTokenVerifier(PROJECT, source);
    const user = await v.verify(sign(liveClaims()));
    expect(user).toMatchObject({ uid: 'uid-abc', email: 'tenno@example.com', provider: 'password' });
  });

  it('caches the certificate set between verifications', async () => {
    fetchCount = 0;
    const v = new FirebaseTokenVerifier(PROJECT, source);
    await v.verify(sign(liveClaims()));
    await v.verify(sign(liveClaims()));
    expect(fetchCount).toBe(1);
  });

  it('rejects a token signed by a different key', async () => {
    const other = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const forged = jwt.sign(liveClaims(), other.privateKey, {
      algorithm: 'RS256',
      keyid: 'test-kid',
    });
    const v = new FirebaseTokenVerifier(PROJECT, source);
    await expect(v.verify(forged)).rejects.toThrow('invalid token');
  });

  it('rejects an unsigned (alg: none) token', async () => {
    const none = jwt.sign(liveClaims(), '', { algorithm: 'none' as any });
    const v = new FirebaseTokenVerifier(PROJECT, source);
    await expect(v.verify(none)).rejects.toThrow('unsupported algorithm');
  });

  it('rejects an unknown key id after one forced refresh', async () => {
    const v = new FirebaseTokenVerifier(PROJECT, source);
    await expect(v.verify(sign(liveClaims(), 'nope-kid'))).rejects.toThrow('unknown key id');
  });

  it('rejects a token for another project', async () => {
    const v = new FirebaseTokenVerifier(PROJECT, source);
    await expect(v.verify(sign(liveClaims({ aud: 'someone-else' })))).rejects.toThrow(
      'invalid token'
    );
  });

  it('rejects an expired token', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const v = new FirebaseTokenVerifier(PROJECT, source);
    await expect(
      v.verify(sign(liveClaims({ iat: nowSec - 7200, exp: nowSec - 3600 })))
    ).rejects.toThrow('token expired');
  });

  it('rejects garbage before doing any work', async () => {
    const v = new FirebaseTokenVerifier(PROJECT, source);
    await expect(v.verify('')).rejects.toThrow('malformed token');
    await expect(v.verify('not.a.jwt')).rejects.toThrow('malformed token');
    await expect(v.verify(null as any)).rejects.toThrow('malformed token');
  });

  it('is disabled without a project id', async () => {
    const v = new FirebaseTokenVerifier('', source);
    expect(v.isEnabled()).toBe(false);
    await expect(v.verify(sign(liveClaims()))).rejects.toThrow('auth disabled');
  });
});

'use strict';
const assert = require('node:assert/strict');
const { generateKeyPairSync, createSign, sign: nodeSign, webcrypto } =
  require('node:crypto');

(async () => {
  const { SupabaseCombatAuthenticator } =
    await import('../src/server-supabase-auth.mjs');
  const projectUrl = 'https://example.supabase.co';
  const issuer = projectUrl + '/auth/v1';
  let now = 1800000000000;
  const accountId = '11111111-2222-4333-8444-555555555555';
  const standard = () => ({
    iss: issuer, aud: 'authenticated', role: 'authenticated',
    sub: accountId, iat: Math.floor(now / 1000) - 5,
    exp: Math.floor(now / 1000) + 3600
  });
  const { publicKey: rsaPub, privateKey: rsaPrivate } =
    generateKeyPairSync('rsa', { modulusLength: 2048 });
  const { publicKey: ecPub, privateKey: ecPrivate } =
    generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const rsaJwk = { ...rsaPub.export({ format: 'jwk' }),
    kid: 'rsa-1', alg: 'RS256', use: 'sig' };
  const ecJwk = { ...ecPub.export({ format: 'jwk' }),
    kid: 'ec-2', alg: 'ES256', use: 'sig' };
  const b64 = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const token = (alg, claims = standard(), keyId, signingKey) => {
    const header = { typ: 'JWT', alg, ...(keyId ? { kid: keyId } : {}) };
    const prefix = b64(header) + '.' + b64(claims);
    let signature;
    if (alg === 'RS256') {
      signature = createSign('RSA-SHA256').update(prefix).end().sign(signingKey);
    } else if (alg === 'ES256') {
      signature = nodeSign('sha256', Buffer.from(prefix), {
        key: signingKey, dsaEncoding: 'ieee-p1363'
      });
    } else {
      signature = Buffer.from('not-validated-locally');
    }
    return prefix + '.' + signature.toString('base64url');
  };
  const rsa = claims => token('RS256', claims, 'rsa-1', rsaPrivate);
  const ec = claims => token('ES256', claims, 'ec-2', ecPrivate);
  const hs = claims => token('HS256', claims);

  const requests = [];
  let jwks = [rsaJwk, ecJwk];
  let acceptedLegacyToken = null;
  const fetchFn = async (url, options) => {
    requests.push({ url, options });
    if (url === issuer + '/.well-known/jwks.json')
      return { ok: true, json: async () => ({ keys: jwks }) };
    if (url === issuer + '/user')
      return { ok: options.headers.apikey === 'public-key' &&
        options.headers.Authorization === 'Bearer ' + acceptedLegacyToken,
        json: async () => ({ id: accountId }) };
    throw Error('Unexpected identity network request: ' + url);
  };
  const auth = new SupabaseCombatAuthenticator({
    projectUrl, publishableKey: 'public-key', fetchFn,
    cryptoApi: webcrypto, clock: () => now
  });
  assert.deepEqual(await auth.verifyBearer('Bearer ' + rsa()),
    { ok: true, accountId }, 'signed RSA Supabase account is accepted');
  assert.deepEqual(await auth.verifyBearer('Bearer ' + ec()),
    { ok: true, accountId }, 'signed P256 Supabase account is accepted');
  assert.equal(requests.filter(x => x.url.endsWith('jwks.json')).length, 1,
    'JWK discovery is short-term cached across requests');
  assert.deepEqual(await auth.verifyBearer('Basic ' + rsa()),
    { ok: false, reason: 'unauthorized' });
  assert.deepEqual(await auth.verifyBearer(null),
    { ok: false, reason: 'unauthorized' });
  assert.deepEqual(await auth.verifyBearer('Bearer not-a-jwt'),
    { ok: false, reason: 'unauthorized' });

  const tampered = rsa().split('.');
  tampered[1] = b64({ ...standard(), sub: '99999999-2222-4333-8444-555555555555' });
  assert.equal((await auth.verifyAccessToken(tampered.join('.'))).ok, false,
    'changing JWT subject without signing cannot impersonate another player');
  assert.equal((await auth.verifyAccessToken(rsa({
    ...standard(), iss: 'https://attacker.supabase.co/auth/v1'
  }))).ok, false, 'wrong issuer blocked');
  assert.equal((await auth.verifyAccessToken(rsa({
    ...standard(), role: 'service_role'
  }))).ok, false, 'service keys cannot join combat as users');
  assert.equal((await auth.verifyAccessToken(rsa({
    ...standard(), aud: 'anon'
  }))).ok, false, 'anonymous role blocked');
  assert.equal((await auth.verifyAccessToken(rsa({
    ...standard(), exp: Math.floor(now / 1000) - 120
  }))).ok, false, 'expired access token blocked');
  assert.equal((await auth.verifyAccessToken(rsa({
    ...standard(), nbf: Math.floor(now / 1000) + 600
  }))).ok, false, 'future-not-before token blocked');
  assert.equal((await auth.verifyAccessToken(rsa({
    ...standard(), iat: Math.floor(now / 1000) + 600
  }))).ok, false, 'future issuance blocked');
  const wrongKid = token('RS256', standard(), 'attacker-kid', rsaPrivate);
  assert.equal((await auth.verifyAccessToken(wrongKid)).ok, false,
    'unknown verification keys cannot bypass JWKS');
  const { privateKey: unrelatedRsa } =
    generateKeyPairSync('rsa', { modulusLength: 2048 });
  const wrongSig = token('RS256', standard(), 'rsa-1', unrelatedRsa);
  assert.equal((await auth.verifyAccessToken(wrongSig)).ok, false,
    'invalid signature is always denied');

  const validHs = hs(standard());
  acceptedLegacyToken = validHs;
  assert.deepEqual(await auth.verifyAccessToken(validHs),
    { ok: true, accountId },
    'legacy HS256 only works after remote Supabase user verification');
  const forgedHs = hs({ ...standard(), sub: '99999999-2222-4333-8444-555555555555' });
  assert.equal((await auth.verifyAccessToken(forgedHs)).ok, false,
    'unverified HS256 payload cannot become a combat identity');
  assert.equal(requests.filter(x => x.url === issuer + '/user').length, 2,
    'legacy tokens are checked remotely every time');
  const noLegacy = new SupabaseCombatAuthenticator({
    projectUrl, fetchFn, cryptoApi: webcrypto, clock: () => now
  });
  assert.equal((await noLegacy.verifyAccessToken(validHs)).ok, false,
    'no remote user verification means no legacy login');

  // A network failure must deny access rather than accepting decoded tokens.
  const offline = new SupabaseCombatAuthenticator({
    projectUrl, fetchFn: async () => { throw Error('network offline'); },
    cryptoApi: webcrypto, clock: () => now
  });
  assert.equal((await offline.verifyAccessToken(rsa())).ok, false);
  assert.equal((await offline.verifyAccessToken(validHs)).ok, false);

  // Every five minutes retrieve fresh public keys. Rotated keys must be
  // honored and old ones cannot be assumed valid forever.
  now += 301000;
  jwks = [ecJwk];
  assert.equal((await auth.verifyAccessToken(rsa())).ok, false,
    'revoked RSA key must be rejected after JWKS refresh');
  assert.deepEqual(await auth.verifyAccessToken(ec()),
    { ok: true, accountId });
  assert.equal(requests.filter(x => x.url.endsWith('jwks.json')).length, 2);

  console.log('PASS: signed Supabase RSA/ES256, verified HS256 fallback, issuer/audience/role, expiry, forged tokens, fail-closed network and key rotation');
})().catch(err => { console.error(err); process.exitCode = 1; });

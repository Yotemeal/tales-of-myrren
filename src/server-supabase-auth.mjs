// SERVER-ONLY Supabase Auth verifier for future shared boss combat.
// Public player_saves are intentionally NOT a source of trusted combat stats.
// Accept only Supabase-authenticated users. Never trust a decoded JWT without
// verifying its signature (JWKS) or asking the Supabase Auth server (HS256).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const B64URL = /^[A-Za-z0-9_-]+$/;
const allowedAlgorithms = new Set(['RS256', 'ES256', 'HS256']);
const denied = Object.freeze({ ok: false, reason: 'unauthorized' });
const encode = new TextEncoder();
const decode = new TextDecoder('utf-8', { fatal: true });
const safeJson = data => {
  const value = JSON.parse(data);
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError('Expected signed JSON object');
  return value;
};
const fromB64Url = data => {
  if (typeof data !== 'string' || data.length > 9000 || !B64URL.test(data))
    throw new TypeError('Invalid token encoding');
  const string = atob(data.replace(/-/g, '+').replace(/_/g, '/') +
    '='.repeat((4 - data.length % 4) % 4));
  return Uint8Array.from(string, c => c.charCodeAt(0));
};
const readToken = token => {
  if (typeof token !== 'string' || token.length < 32 || token.length > 12000)
    throw new TypeError('Invalid access token length');
  const parts = token.split('.');
  if (parts.length !== 3) throw new TypeError('Invalid JWT segments');
  const [head, claims, signature] = parts;
  const header = safeJson(decode.decode(fromB64Url(head)));
  const payload = safeJson(decode.decode(fromB64Url(claims)));
  if (!allowedAlgorithms.has(header.alg) ||
      (header.alg !== 'HS256' && (typeof header.kid !== 'string' ||
        header.kid.length < 1 || header.kid.length > 128)))
    throw new TypeError('Unsupported signing algorithm');
  return {
    header, payload,
    data: encode.encode(head + '.' + claims),
    signature: fromB64Url(signature)
  };
};

function claimsValid(claims, issuer, nowMs) {
  if (!UUID.test(claims.sub || '') ||
      claims.iss !== issuer ||
      !(claims.aud === 'authenticated' ||
        (Array.isArray(claims.aud) && claims.aud.includes('authenticated'))) ||
      claims.role !== 'authenticated' ||
      !Number.isSafeInteger(claims.exp) ||
      !Number.isSafeInteger(claims.iat) ||
      claims.exp <= nowMs / 1000 - 30 ||
      claims.iat > nowMs / 1000 + 30 ||
      (claims.nbf !== undefined &&
        (!Number.isSafeInteger(claims.nbf) ||
          claims.nbf > nowMs / 1000 + 30)))
    return false;
  return true;
}

export class SupabaseCombatAuthenticator {
  constructor({ projectUrl, publishableKey = '', fetchFn = fetch,
    cryptoApi = crypto, clock = Date.now }) {
    if (typeof projectUrl !== 'string' ||
        !/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(projectUrl) ||
        (typeof publishableKey !== 'string' || publishableKey.length > 256) ||
        typeof fetchFn !== 'function' ||
        !cryptoApi?.subtle || typeof clock !== 'function')
      throw new TypeError('Invalid trusted Supabase Auth configuration');
    this.issuer = projectUrl + '/auth/v1';
    this.fetchFn = fetchFn;
    this.crypto = cryptoApi;
    this.clock = clock;
    this.publishableKey = publishableKey;
    this.cachedKeys = [];
    this.keysExpireAt = 0;
  }

  async keys() {
    const now = this.clock();
    if (now < this.keysExpireAt) return this.cachedKeys;
    const result = await this.fetchFn(
      this.issuer + '/.well-known/jwks.json',
      { method: 'GET', signal: AbortSignal.timeout(8000) });
    if (!result?.ok) throw new Error('Auth key discovery failed');
    const body = await result.json();
    if (!body || !Array.isArray(body.keys) || body.keys.length > 20)
      throw new TypeError('Invalid Auth key set');
    const accepted = body.keys.filter(key =>
      key && typeof key.kid === 'string' &&
      key.kid.length <= 128 && key.kid.length > 0 &&
      (key.kty === 'RSA' || key.kty === 'EC') &&
      (!key.use || key.use === 'sig') &&
      (!key.key_ops || (Array.isArray(key.key_ops) &&
        key.key_ops.includes('verify'))));
    this.cachedKeys = accepted;
    // Cache less than Supabase's documented 10-minute edge JWKS TTL.
    this.keysExpireAt = now + 5 * 60 * 1000;
    return accepted;
  }

  async verifyAsymmetric(token) {
    const { header, data, signature } = token;
    const keys = await this.keys();
    const key = keys.find(key => key.kid === header.kid &&
      (!key.alg || key.alg === header.alg) &&
      (header.alg === 'RS256' && key.kty === 'RSA' ||
       header.alg === 'ES256' && key.kty === 'EC' && key.crv === 'P-256'));
    if (!key) return false; // Never use JWT-supplied remote JWKS URLs.
    const algorithm = header.alg === 'RS256' ?
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } :
      { name: 'ECDSA', namedCurve: 'P-256' };
    const publicKey = await this.crypto.subtle.importKey(
      'jwk', key, algorithm, false, ['verify']);
    return this.crypto.subtle.verify(
      header.alg === 'RS256' ? algorithm :
        { name: 'ECDSA', hash: 'SHA-256' },
      publicKey, signature, data);
  }

  async verifyLegacy(token, rawToken) {
    // Supabase's legacy HS256 tokens cannot be checked using public JWKS.
    // Ask the real Auth service on every request. Never put the JWT secret
    // into a Worker, client bundle, or a repository.
    if (!this.publishableKey) return false;
    const res = await this.fetchFn(this.issuer + '/user', {
      method: 'GET',
      headers: {
        apikey: this.publishableKey,
        Authorization: 'Bearer ' + rawToken
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!res?.ok) return false;
    const body = await res.json();
    return UUID.test(body?.id || '') && body.id === token.payload.sub;
  }

  async verifyAccessToken(rawToken) {
    try {
      const token = readToken(rawToken);
      if (!claimsValid(token.payload, this.issuer, this.clock()))
        return denied;
      const verified = token.header.alg === 'HS256' ?
        await this.verifyLegacy(token, rawToken) :
        await this.verifyAsymmetric(token);
      return verified ?
        { ok: true, accountId: token.payload.sub } : denied;
    } catch {
      // Network outages, revoked/rotated keys and forged JWTs must all fail
      // closed; never leak access tokens or crypto error details to clients.
      return denied;
    }
  }

  async verifyBearer(authorization) {
    if (typeof authorization !== 'string' ||
        !/^Bearer [A-Za-z0-9._-]+$/.test(authorization))
      return denied;
    return this.verifyAccessToken(authorization.slice(7));
  }
}

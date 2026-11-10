// SERVER-ONLY authenticated command boundary for a future Cloudflare route.
// All identity comes from the verified Supabase bearer token; room configuration,
// combat stats, damage and loot are never accepted from request JSON.
// This module is NOT imported by the production Worker yet.
const denied = reason => ({ ok: false, reason });
const MAX_BODY_BYTES = 512;
const shapes = Object.freeze({
  join: [],
  snapshot: [],
  attack: [],
  move: ['dx', 'dy'],
  updates: ['afterSequence']
});
const plainObject = obj => obj !== null && typeof obj === 'object' &&
  !Array.isArray(obj) &&
  (Object.getPrototypeOf(obj) === Object.prototype ||
    Object.getPrototypeOf(obj) === null);
const exactKeys = (obj, expected) => {
  const keys = Object.keys(obj);
  return keys.length === expected.length &&
    expected.every(key => Object.hasOwn(obj, key)) &&
    keys.every(key => expected.includes(key));
};

export function createBossCommandGateway({ authenticator, createTrustedRoom }) {
  if (!authenticator || typeof authenticator.verifyBearer !== 'function' ||
      typeof createTrustedRoom !== 'function')
    throw new TypeError('Verified login and server-owned room are required');
  return async ({ authorization, command }) => {
    if (!plainObject(command) || typeof command.type !== 'string' ||
        !Object.hasOwn(shapes, command.type) ||
        !exactKeys(command, ['type', ...shapes[command.type]]))
      return denied('invalid-command');
    if (command.type === 'move' &&
        (![command.dx, command.dy].every(Number.isFinite) ||
          [command.dx, command.dy].some(v => Math.abs(v) > 1)))
      return denied('invalid-command');
    if (command.type === 'updates' &&
        (!Number.isSafeInteger(command.afterSequence) ||
          command.afterSequence < 0))
      return denied('invalid-command');
    let authorized;
    try { authorized = await authenticator.verifyBearer(authorization); }
    catch { return denied('unauthorized'); }
    if (!authorized?.ok ||
        typeof authorized.accountId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorized.accountId))
      return denied('unauthorized');
    try {
      // createTrustedRoom is the private backend boundary: the returned
      // sessionKey must be valid only for the verified accountId. The
      // room's character resolver MUST load server-managed stats, NEVER
      // Supabase player_saves.save_data (which clients can edit).
      const context = await createTrustedRoom(authorized.accountId);
      if (!context || typeof context.sessionKey !== 'string' ||
          !context.sessionKey || typeof context.room !== 'object')
        throw Error('Trusted room unavailable');
      const { room, sessionKey } = context;
      let result;
      switch (command.type) {
        case 'join':
          result = await room.join(sessionKey); break;
        case 'snapshot':
          result = await room.snapshot(sessionKey); break;
        case 'move':
          result = await room.move(sessionKey, {
            dx: command.dx, dy: command.dy
          }); break;
        case 'attack':
          result = await room.attack(sessionKey); break;
        case 'updates':
          result = await room.updates(sessionKey, command.afterSequence);
          break;
        default: return denied('invalid-command');
      }
      if (!result || typeof result !== 'object')
        throw Error('Invalid private room response');
      return result;
    } catch {
      // No raw storage errors, tokens, stack traces, private reward ledgers,
      // or room configuration are ever included in HTTP responses.
      return denied('unavailable');
    }
  };
}

async function parseSmallJson(request) {
  const hint = request.headers.get('content-length');
  if (hint != null && (!/^\d+$/.test(hint) ||
      Number(hint) > MAX_BODY_BYTES))
    throw new RangeError('Invalid request body length');
  const stream = request.body;
  if (!stream) throw new TypeError('Expected JSON request body');
  const reader = stream.getReader();
  const parts = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError('Request body exceeds 512 bytes');
    }
    parts.push(value);
  }
  const combined = new Uint8Array(bytes);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(combined));
}

export function createBossHttpCommandHandler(dependencies) {
  const dispatch = createBossCommandGateway(dependencies);
  return async request => {
    const url = new URL(request.url);
    const respond = (body, code) => new Response(JSON.stringify(body), {
      status: code,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff'
      }
    });
    // This internal adapter has no CORS exposure or public registration.
    // A future Worker must opt into an authenticated /api/... route explicitly.
    if (url.pathname !== '/internal/boss/command')
      return respond(denied('not-found'), 404);
    if (request.method !== 'POST')
      return respond(denied('method-not-allowed'), 405);
    if (!/^application\/json(?:\s*;|$)/i.test(
      request.headers.get('content-type') || ''))
      return respond(denied('invalid-command'), 415);
    let command;
    try { command = await parseSmallJson(request); }
    catch { return respond(denied('invalid-command'), 400); }
    const result = await dispatch({
      authorization: request.headers.get('authorization'),
      command
    });
    const status = result.ok ? 200 :
      result.reason === 'unauthorized' ? 401 :
      result.reason === 'invalid-command' ? 400 :
      result.reason === 'unavailable' ? 503 : 200;
    return respond(result, status);
  };
}

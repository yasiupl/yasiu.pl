// HTTP for the actor @blog@yasiu.pl: HTTP signatures (draft-cavage-http-signatures, as Mastodon
// uses them), signed requests to other servers, and the cache of remote actors.
import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import AP from './blog-actor.json';

export const BLOG = AP;
export const AS_PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';
export const AS_TYPE = 'application/activity+json';
const ACCEPT = 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"';
const USER_AGENT = 'yasiu.pl blog (+https://yasiu.pl/blog/)';
// Other servers send the Date header with a small clock difference. Mastodon accepts 12 hours.
const MAX_CLOCK_SKEW = 12 * 3600 * 1000;
// A remote actor stays in the cache for one day. A failed signature check loads it again.
const ACTOR_TTL = 24 * 3600 * 1000;

let privateKey;
function blogKey() {
  if (!privateKey) {
    const pem = fromEnv('BLOG_PRIVATE_KEY');
    if (!pem) throw createError({ statusCode: 503, statusMessage: 'BLOG_PRIVATE_KEY has no value' });
    privateKey = createPrivateKey(pem);
  }
  return privateKey;
}

// The public key of the backend, to compare with src/activitypub/blog.pub.pem.
export const blogPublicKey = () => createPublicKey(blogKey()).export({ type: 'spki', format: 'pem' });

// The backend sends requests only to public HTTPS servers. Without this check, a document from
// another server could make the backend send requests into the local networks of blade12.
function privateAddress(address) {
  if (address.includes(':')) {
    const a = address.toLowerCase();
    return a === '::1' || a === '::' || a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe80') ||
      (a.startsWith('::ffff:') && privateAddress(a.slice(7)));
  }
  const [x, y] = address.split('.').map(Number);
  return x === 0 || x === 10 || x === 127 || (x === 100 && y >= 64 && y <= 127) || (x === 169 && y === 254) ||
    (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || x >= 224;
}

export async function publicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`not a URL: ${value}`);
  }
  if (url.protocol !== 'https:') throw new Error(`not HTTPS: ${value}`);
  if (process.env.AP_ALLOW_PRIVATE === 'true') return url; // Only for local tests.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => privateAddress(a.address))) {
    throw new Error(`not a public host: ${url.hostname}`);
  }
  return url;
}

const digestOf = (body) => `SHA-256=${createHash('sha256').update(body).digest('base64')}`;

// Signs a request with the key of the actor. The headers that the signature covers: the method and
// the path, Host and Date, and Digest for a request with a body.
function signedHeaders(method, url, body) {
  const headers = { host: url.host, date: new Date().toUTCString() };
  if (body !== undefined) headers.digest = digestOf(body);
  const names = ['(request-target)', ...Object.keys(headers)];
  const text = names.map((n) => (n === '(request-target)'
    ? `(request-target): ${method.toLowerCase()} ${url.pathname}${url.search}`
    : `${n}: ${headers[n]}`)).join('\n');
  const signature = sign('sha256', Buffer.from(text), blogKey()).toString('base64');
  return {
    ...headers,
    signature: `keyId="${BLOG.key}",algorithm="rsa-sha256",headers="${names.join(' ')}",signature="${signature}"`
  };
}

// A signed GET. Servers in "secure mode" (authorized fetch) answer only signed requests.
export async function apGet(value) {
  const url = await publicUrl(value);
  const response = await fetch(url, {
    headers: { ...signedHeaders('GET', url), accept: ACCEPT, 'user-agent': USER_AGENT },
    redirect: 'manual',
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw Object.assign(new Error(`GET ${url}: ${response.status}`), { status: response.status });
  return response.json();
}

// A signed POST of an activity to an inbox. Returns the status code.
export async function apPost(inbox, activity) {
  const url = await publicUrl(inbox);
  const body = typeof activity === 'string' ? activity : JSON.stringify(activity);
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...signedHeaders('POST', url, body), 'content-type': AS_TYPE, 'user-agent': USER_AGENT },
    body,
    redirect: 'manual',
    signal: AbortSignal.timeout(15000)
  });
  return response.status;
}

const idOf = (value) => (typeof value === 'string' ? value : value && value.id) || null;
export { idOf };

// A remote actor from the cache, or from its server. "fresh" ignores the cache.
export async function remoteActor(id, { fresh = false } = {}) {
  const db = apDb();
  const row = db.prepare('SELECT json, fetched_at FROM actors WHERE id = ?').get(id);
  if (row && !fresh && Date.now() - row.fetched_at < ACTOR_TTL) return JSON.parse(row.json);
  try {
    const actor = await apGet(id);
    if (idOf(actor) !== id || !actor.inbox) throw new Error(`${id}: not an actor`);
    db.prepare('INSERT INTO actors (id, json, fetched_at) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET json = excluded.json, fetched_at = excluded.fetched_at')
      .run(id, JSON.stringify(actor), Date.now());
    return actor;
  } catch (error) {
    if (row) return JSON.parse(row.json); // The last known version, if the server is down.
    throw error;
  }
}

// The public key of a key id (https://example.org/users/a#main-key) and its owner.
async function keyOf(keyId, fresh) {
  const owner = keyId.split('#')[0];
  let doc = await remoteActor(owner, { fresh }).catch(() => null);
  if (!doc) {
    // The key id is a separate document with an owner (for example GoToSocial: /users/a/main-key).
    const key = await apGet(keyId);
    doc = await remoteActor(idOf(key.owner), { fresh });
  }
  const keys = [].concat(doc.publicKey || []);
  const key = keys.find((k) => k.id === keyId) || (keys.length === 1 && keyId.startsWith(doc.id) ? keys[0] : null);
  if (!key || !key.publicKeyPem) throw new Error(`no key ${keyId}`);
  return { pem: key.publicKeyPem, owner: doc.id };
}

function parseSignature(header) {
  const params = {};
  for (const [, name, value] of header.matchAll(/(\w+)="([^"]*)"/g)) params[name] = value;
  return params;
}

// Checks the HTTP signature of a request to the inbox. Returns the id of the actor that signed it.
export async function verifyRequest(event, body) {
  const header = getRequestHeader(event, 'signature');
  if (!header) throw createError({ statusCode: 401, statusMessage: 'No signature' });
  const sig = parseSignature(header);
  const names = (sig.headers || 'date').toLowerCase().split(/\s+/);
  if (!names.includes('(request-target)') || !names.includes('digest') || !(names.includes('date') || names.includes('(created)'))) {
    throw createError({ statusCode: 401, statusMessage: 'The signature must cover (request-target), digest and date' });
  }
  const digest = getRequestHeader(event, 'digest') || '';
  if (!digest.split(',').map((d) => d.trim()).includes(digestOf(body))) {
    throw createError({ statusCode: 401, statusMessage: 'Wrong digest' });
  }
  const date = Date.parse(getRequestHeader(event, 'date') || '') || Number(sig.created) * 1000;
  if (!date || Math.abs(Date.now() - date) > MAX_CLOCK_SKEW) {
    throw createError({ statusCode: 401, statusMessage: 'Date too far from now' });
  }
  const url = getRequestURL(event);
  const text = names.map((n) => {
    if (n === '(request-target)') return `(request-target): ${event.method.toLowerCase()} ${url.pathname}${url.search}`;
    if (n === '(created)') return `(created): ${sig.created}`;
    if (n === '(expires)') return `(expires): ${sig.expires}`;
    return `${n}: ${getRequestHeader(event, n) ?? ''}`;
  }).join('\n');
  const signature = Buffer.from(sig.signature || '', 'base64');
  for (const fresh of [false, true]) {
    const key = await keyOf(sig.keyId, fresh).catch(() => null);
    if (key && verify('sha256', Buffer.from(text), key.pem, signature)) return key.owner;
  }
  throw createError({ statusCode: 401, statusMessage: 'Wrong signature' });
}

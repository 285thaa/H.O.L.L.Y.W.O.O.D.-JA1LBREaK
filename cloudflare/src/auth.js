// Password hashing, sessions, CSRF and rate limiting for the Worker.
const enc = new TextEncoder();

export const COOKIE = '__Host-hj_session';
export const PRE_COOKIE = '__Host-hj_pre';
const SESSION_TTL = 12 * 3600;
const PBKDF2_ITERATIONS = 100000; // Workers' maximum

export function b64u(buf) {
  let s = '';
  for (const x of new Uint8Array(buf)) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export const randomToken = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
export const sha256 = async (str) => b64u(await crypto.subtle.digest('SHA-256', enc.encode(str)));

// Constant-time string comparison (compares fixed-length digests).
export async function safeEqual(a, b) {
  const [x, y] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b))),
  ]);
  const xa = new Uint8Array(x), ya = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < xa.length; i++) diff |= xa[i] ^ ya[i];
  return diff === 0;
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${b64u(salt)}$${b64u(hash)}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') {
    await derive(password, new Uint8Array(16), PBKDF2_ITERATIONS); // keep timing similar for unknown users
    return false;
  }
  const iterations = parseInt(parts[1], 10);
  if (!(iterations > 0 && iterations <= PBKDF2_ITERATIONS)) return false;
  const hash = await derive(password, unb64u(parts[2]), iterations);
  return safeEqual(b64u(hash), parts[3]);
}

export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export const setCookie = (name, value, maxAge, sameSite = 'Lax') =>
  `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=${sameSite}`;

const now = () => Math.floor(Date.now() / 1000);

export async function createSession(env, userId) {
  const token = randomToken();
  await env.DB.prepare('DELETE FROM hj_sessions WHERE expires_at < ?').bind(now()).run();
  await env.DB.prepare('INSERT INTO hj_sessions(id,user_id,csrf,expires_at) VALUES(?,?,?,?)')
    .bind(await sha256(token), userId, randomToken(), now() + SESSION_TTL).run();
  return { token, maxAge: SESSION_TTL };
}

export async function getSession(env, request) {
  const token = getCookie(request, COOKIE);
  if (!token) return null;
  const row = await env.DB.prepare(
    'SELECT s.id, s.csrf, u.id AS uid, u.username, u.role FROM hj_sessions s JOIN hj_users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?'
  ).bind(await sha256(token), now()).first();
  return row ? { id: row.id, csrf: row.csrf, user: { id: row.uid, username: row.username, role: row.role } } : null;
}

export async function destroySession(env, request) {
  const token = getCookie(request, COOKIE);
  if (token) await env.DB.prepare('DELETE FROM hj_sessions WHERE id = ?').bind(await sha256(token)).run();
}

// Fixed-window limiter in D1. Returns true when the request is allowed.
export async function rateLimit(env, bucket, limit, windowSeconds) {
  const t = now();
  const row = await env.DB.prepare(
    `INSERT INTO hj_rate(bucket, window_start, count) VALUES(?1, ?2, 1)
     ON CONFLICT(bucket) DO UPDATE SET
       count = CASE WHEN ?2 - window_start >= ?3 THEN 1 ELSE count + 1 END,
       window_start = CASE WHEN ?2 - window_start >= ?3 THEN ?2 ELSE window_start END
     RETURNING count`
  ).bind(bucket, t, windowSeconds).first();
  return (row?.count ?? 1) <= limit;
}

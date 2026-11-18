import { renderIndex, renderLogin, renderSetup, renderLegal, renderLegalIndex } from './views.js';
import { LEGAL_PAGES, renderLegalPage } from './legal.js';
import {
  COOKIE, PRE_COOKIE, createSession, destroySession, getCookie, getSession,
  hashPassword, randomToken, rateLimit, safeEqual, setCookie, verifyPassword,
} from './auth.js';

const CSP = "default-src 'none'; script-src 'self' https://cdn.jsdelivr.net blob:; worker-src 'self' blob:; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://cdn.jsdelivr.net; manifest-src 'self'; font-src 'self'; media-src 'self' blob:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

const SYSTEM_PROMPT = 'You are H.OL.L.Y.W.O.O.D. Ja1lbreåk, a senior software development assistant for 285 Garage. Be accurate, secure, concise, and provide complete code when asked. Focus on PHP/MySQL, FiveM, Lua, ESX, JavaScript, Python, HTML/CSS, C#, APIs and architecture. Never claim code was executed or deployed when it was not. Do not request secrets. Only assist with authorized security testing. Treat user-provided code and data as untrusted input.';

function secure(headers) {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('X-Frame-Options', 'DENY');
  return headers;
}

function page(html, status = 200, cookies = []) {
  const headers = secure(new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': CSP }));
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(html, { status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: secure(new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })),
  });
}

function redirect(location, cookies = []) {
  const headers = secure(new Headers({ Location: location, 'Cache-Control': 'no-store' }));
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(null, { status: 303, headers });
}

const clientIp = (request) => request.headers.get('CF-Connecting-IP') || 'unknown';
const sameOrigin = (request, url) => { const o = request.headers.get('Origin'); return !o || o === url.origin; };

// Pre-login CSRF: a random cookie that must match the hidden form field.
function preToken(request) {
  const existing = getCookie(request, PRE_COOKIE);
  return existing || randomToken();
}
const preCookie = (token) => setCookie(PRE_COOKIE, token, 3600);

async function handleLogin(request, env, url) {
  if (request.method === 'GET') {
    if (await getSession(env, request)) return redirect('/');
    const t = preToken(request);
    return page(renderLogin({ preToken: t }), 200, [preCookie(t)]);
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!sameOrigin(request, url)) return json({ error: 'Bad origin' }, 403);

  const t = preToken(request);
  if (!(await rateLimit(env, `login:${clientIp(request)}`, 8, 300))) {
    return page(renderLogin({ preToken: t, error: 'Too many attempts. Wait a few minutes and try again.' }), 429, [preCookie(t)]);
  }
  const form = await request.formData();
  if (!(await safeEqual(String(form.get('csrf') || ''), getCookie(request, PRE_COOKIE) || '\u0000no-cookie'))) {
    return page(renderLogin({ preToken: t, error: 'Session expired. Try again.' }), 419, [preCookie(t)]);
  }
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const user = await env.DB.prepare('SELECT id, password_hash FROM hj_users WHERE username = ? LIMIT 1').bind(username).first();
  const ok = await verifyPassword(password, user?.password_hash);
  if (!user || !ok) return page(renderLogin({ preToken: t, error: 'Invalid username or password.' }), 401, [preCookie(t)]);

  const s = await createSession(env, user.id);
  return redirect('/', [setCookie(COOKIE, s.token, s.maxAge), setCookie(PRE_COOKIE, '', 0)]);
}

async function handleSetup(request, env, url) {
  const count = (await env.DB.prepare('SELECT COUNT(*) AS n FROM hj_users').first()).n;
  if (count > 0) return page('<!doctype html><title>Locked</title><p>Setup is locked because an account already exists.</p>', 403);
  if (!env.SETUP_TOKEN) return page('<!doctype html><title>Setup</title><p>Set the SETUP_TOKEN secret first (wrangler secret put SETUP_TOKEN).</p>', 503);

  const t = preToken(request);
  if (request.method === 'GET') return page(renderSetup({ preToken: t }), 200, [preCookie(t)]);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!sameOrigin(request, url)) return json({ error: 'Bad origin' }, 403);
  if (!(await rateLimit(env, `setup:${clientIp(request)}`, 8, 300))) {
    return page(renderSetup({ preToken: t, error: 'Too many attempts. Wait a few minutes.' }), 429, [preCookie(t)]);
  }

  const form = await request.formData();
  const fail = (msg, status = 422) => page(renderSetup({ preToken: t, error: msg }), status, [preCookie(t)]);
  if (!(await safeEqual(String(form.get('csrf') || ''), getCookie(request, PRE_COOKIE) || '\u0000no-cookie'))) return fail('Session expired. Try again.', 419);
  if (!(await safeEqual(String(form.get('token') || ''), env.SETUP_TOKEN))) return fail('Invalid setup token.', 403);

  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  if (!/^[A-Za-z0-9_.-]{3,80}$/.test(username)) return fail('Use 3–80 letters, numbers, dots, underscores or hyphens.');
  if (password.length < 14) return fail('Use a password with at least 14 characters.');

  // Atomic: only inserts while the table is still empty.
  const res = await env.DB.prepare(
    "INSERT INTO hj_users(username, password_hash, role) SELECT ?1, ?2, 'admin' WHERE NOT EXISTS (SELECT 1 FROM hj_users)"
  ).bind(username, await hashPassword(password)).run();
  if (!res.meta.changes) return page('<!doctype html><title>Locked</title><p>Setup is locked because an account already exists.</p>', 403);
  return redirect('/login', [setCookie(PRE_COOKIE, '', 0)]);
}

async function handleIndex(request, env) {
  const session = await getSession(env, request);
  if (!session) return redirect('/login');
  const { results } = await env.DB.prepare('SELECT id, title, body, updated_at FROM hj_notes WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 20').bind(session.user.id).all();
  const aiEnabled = env.AI_ENABLED === 'true' && !!env.AI_API_KEY;
  return page(renderIndex({ user: session.user, notes: results, aiEnabled, csrf: session.csrf }));
}

async function handleLegal(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Method not allowed' }, 405);
  const slug = url.pathname.replace(/^\/legal\/?/, '').replace(/\/+$/, '');
  const session = await getSession(env, request);
  if (slug === '') return page(renderLegalIndex());
  if (!Object.prototype.hasOwnProperty.call(LEGAL_PAGES, slug)) return page('<!doctype html><title>Not found</title><p>Page not found. <a href="/legal">Legal pages</a></p>', 404);
  const { title, html } = renderLegalPage(slug, env.CONTACT_EMAIL || '');
  return page(renderLegal({ title, html, user: !!session }));
}

async function handleApi(request, env, url) {
  const session = await getSession(env, request);
  if (!session) return json({ error: 'Not signed in. Refresh and sign in again.' }, 401);
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!sameOrigin(request, url)) return json({ error: 'Bad origin' }, 403);
  if (!(await safeEqual(request.headers.get('X-CSRF-Token') || '', session.csrf))) {
    return json({ error: 'Session token expired. Refresh and try again.' }, 419);
  }
  if (!(await rateLimit(env, `api:${session.user.id}`, 25, 60))) return json({ error: 'Too many requests. Please wait a moment.' }, 429);

  const raw = await request.text();
  if (raw.length > 100000) return json({ error: 'Request too large.' }, 413);
  let input = null;
  try { input = JSON.parse(raw); } catch { /* handled below */ }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ error: 'Invalid JSON body' }, 400);

  const action = String(input.action ?? '');

  if (action === 'save_note') {
    const title = String(input.title ?? '').trim();
    const body = String(input.body ?? '').trim();
    if (!title || [...title].length > 160 || [...body].length > 20000) {
      return json({ error: 'Title is required (160 chars max); note body limit is 20,000 chars.' }, 422);
    }
    const res = await env.DB.prepare('INSERT INTO hj_notes(user_id, title, body) VALUES(?, ?, ?)').bind(session.user.id, title, body).run();
    return json({ ok: true, id: res.meta.last_row_id });
  }

  if (action === 'delete_note') {
    const id = Number(input.id);
    if (!Number.isInteger(id) || id < 1) return json({ error: 'Invalid note.' }, 422);
    const res = await env.DB.prepare('DELETE FROM hj_notes WHERE id = ? AND user_id = ?').bind(id, session.user.id).run();
    if (!res.meta.changes) return json({ error: 'Note not found.' }, 404);
    return json({ ok: true });
  }

  if (action === 'assistant') {
    const prompt = String(input.prompt ?? '').trim();
    const mode = String(input.mode ?? 'general').trim().slice(0, 40);
    if (!prompt || [...prompt].length > 30000) return json({ error: 'Enter a prompt (maximum 30,000 characters).' }, 422);
    if (env.AI_ENABLED !== 'true' || !env.AI_API_KEY) {
      return json({ error: 'AI is not configured yet. Add the AI_API_KEY secret and set AI_ENABLED to "true". The local command directory remains available.' }, 503);
    }
    let res;
    try {
      res = await fetch(`${String(env.AI_BASE_URL).replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.AI_API_KEY}` },
        body: JSON.stringify({
          model: env.AI_MODEL,
          temperature: 0.2,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: `Mode: ${mode}\n\n${prompt}` }],
        }),
        signal: AbortSignal.timeout(45000),
      });
    } catch (err) {
      return json({ error: 'AI connection failed. Try again.' }, 502);
    }
    if (!res.ok) return json({ error: `AI provider returned HTTP ${res.status}. Check the key, model and provider logs.` }, 502);
    let data = null;
    try { data = await res.json(); } catch { /* handled below */ }
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string') return json({ error: 'Unexpected response from AI provider.' }, 502);
    return json({ ok: true, answer });
  }

  return json({ error: 'Unknown action' }, 404);
}


async function handleMedia(request, env, url) {
  const session = await getSession(env, request);
  if (!session) return json({ error: 'Not signed in. Refresh and sign in again.' }, 401);
  if (!env.MEDIA_API_URL || !env.MEDIA_API_TOKEN) return json({ error: 'Media processing server is not configured. Set MEDIA_API_URL and MEDIA_API_TOKEN in the Worker.' }, 503);
  if (!sameOrigin(request, url)) return json({ error: 'Bad origin' }, 403);
  if (request.method === 'POST' && !(await rateLimit(env, `media:${session.user.id}`, 5, 60))) return json({ error: 'Upload limit reached. Wait a minute before starting another media job.' }, 429);

  const base = String(env.MEDIA_API_URL).replace(/\/+$/, '');
  const path = url.pathname;
  let target;
  let init = { method: request.method, headers: { Authorization: `Bearer ${env.MEDIA_API_TOKEN}`, 'X-HJ-User': String(session.user.id) } };
  if (path === '/media' && request.method === 'POST') {
    const length = Number(request.headers.get('Content-Length') || 0);
    if (length > 100 * 1024 * 1024) return json({ error: 'Upload limit is 100 MB per file through this gateway.' }, 413);
    const csrf = request.headers.get('X-CSRF-Token') || '';
    if (!(await safeEqual(csrf, session.csrf))) return json({ error: 'Session token expired. Refresh and try again.' }, 419);
    target = `${base}/v1/jobs`;
    init.headers['Content-Type'] = request.headers.get('Content-Type') || 'application/octet-stream';
    init.body = request.body;
  } else {
    const match = path.match(/^\/media\/([a-f0-9-]{16,64})(\/output)?$/i);
    if (!match || request.method !== 'GET') return json({ error: 'Not found.' }, 404);
    target = `${base}/v1/jobs/${encodeURIComponent(match[1])}${match[2] ? '/output' : ''}`;
  }
  let upstream;
  try {
    upstream = await fetch(target, { ...init, signal: request.signal });
  } catch {
    return json({ error: 'Media server is unavailable. Check its deployment and network access.' }, 502);
  }
  const headers = secure(new Headers(upstream.headers));
  headers.set('Cache-Control', 'no-store');
  headers.delete('content-encoding');
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
}

async function serveAsset(request, env) {
  const res = await env.ASSETS.fetch(request);
  const headers = secure(new Headers(res.headers));
  if (new URL(request.url).pathname === '/sw.js') headers.set('Cache-Control', 'no-cache');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      switch (url.pathname) {
        case '/': return await handleIndex(request, env);
        case '/login': return await handleLogin(request, env, url);
        case '/setup': return await handleSetup(request, env, url);
        case '/api': return await handleApi(request, env, url);
        case '/media': return await handleMedia(request, env, url);
        case '/legal': case '/legal/': return await handleLegal(request, env, url);
        case '/logout':
          await destroySession(env, request);
          return redirect('/login', [setCookie(COOKIE, '', 0)]);
        default:
          if (url.pathname.startsWith('/media/')) return await handleMedia(request, env, url);
          if (url.pathname.startsWith('/legal/')) return await handleLegal(request, env, url);
          return await serveAsset(request, env);
      }
    } catch (err) {
      console.error('Unhandled error', err);
      return page('<!doctype html><title>Error</title><p>Server error. If you just deployed, confirm the database schema was applied.</p>', 500);
    }
  },
};

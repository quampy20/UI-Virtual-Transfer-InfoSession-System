/* Shared auth helpers for the passcode gate.
   Used by middleware.js (Edge runtime), api/login.js and api/state.js (Node runtime),
   so everything here sticks to Web-standard APIs (TextEncoder + crypto.subtle) that
   exist in both. Files under api/_lib are not exposed as serverless functions. */

export const COOKIE_NAME = 'vtis_auth';
const TOKEN_MESSAGE = 'vtis-session-v1';

const enc = new TextEncoder();

/* The auth cookie's value: HMAC-SHA256 of a fixed message, keyed by APP_PASSCODE.
   Stateless — nothing to store server-side — and changing APP_PASSCODE in Vercel
   instantly invalidates every existing cookie. */
export async function expectedToken(passcode) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(passcode), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(TOKEN_MESSAGE));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Constant-time string comparison: hash both sides to equal-length digests first,
   then XOR-compare, so neither content nor length leaks through timing. */
export async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(a))),
    crypto.subtle.digest('SHA-256', enc.encode(String(b)))
  ]);
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

export function getCookie(cookieHeader, name) {
  for (const part of String(cookieHeader || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return '';
}

/* True when the request's cookie header carries a valid auth token. */
export async function isAuthed(cookieHeader, passcode) {
  if (!passcode) return false;
  const token = getCookie(cookieHeader, COOKIE_NAME);
  if (!token) return false;
  return safeEqual(token, await expectedToken(passcode));
}

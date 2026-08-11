/* POST /api/login — trade the team passcode for the auth cookie.
   The passcode lives in the APP_PASSCODE environment variable on Vercel;
   nothing secret is stored in this repo. */

import { COOKIE_NAME, expectedToken, safeEqual } from './_lib/auth.js';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; /* 90 days */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const secret = process.env.APP_PASSCODE || '';
  if (!secret) {
    return res.status(500).json({ error: 'APP_PASSCODE is not configured — set it in the Vercel project settings and redeploy.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const given = body && typeof body.passcode === 'string' ? body.passcode : '';

  if (!(await safeEqual(given, secret))) {
    return res.status(401).json({ error: 'wrong passcode' });
  }

  /* Secure is dropped only for plain-HTTP local testing; on Vercel this is always https. */
  const proto = String(req.headers['x-forwarded-proto'] || 'https');
  const secure = proto.split(',')[0].trim() === 'https' ? ' Secure;' : '';
  const token = await expectedToken(secret);
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`);
  return res.status(200).json({ ok: true });
}

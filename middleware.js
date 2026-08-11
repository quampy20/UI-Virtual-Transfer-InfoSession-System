/* Edge Middleware: the passcode gate for the whole site.
   Every request — the app's HTML included — must carry the auth cookie that
   /api/login sets after the correct team passcode is entered. Without it,
   page loads are sent to the passcode page and API calls get a 401.
   Runs before the CDN cache, so protected content is never served ungated. */

import { isAuthed } from './api/_lib/auth.js';

const PUBLIC_PATHS = new Set(['/login.html', '/api/login', '/favicon.ico', '/robots.txt']);

export default async function middleware(request) {
  const url = new URL(request.url);
  if (PUBLIC_PATHS.has(url.pathname)) return; /* fall through to the origin */

  if (await isAuthed(request.headers.get('cookie'), process.env.APP_PASSCODE)) return;

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
  }
  return Response.redirect(new URL('/login.html', url.origin), 302);
}

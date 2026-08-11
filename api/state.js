/* /api/state — the whole plan, as one row in Neon Postgres.
   GET  → { data, updated_at }   data is null until the first save (first run)
   PUT  → upsert the posted plan; POST is an alias so navigator.sendBeacon can
          flush unsaved progress when the tab closes.
   The middleware already gates this route, but the cookie is verified here too
   so the data never rides on the middleware config staying correct. */

import { neon } from '@neondatabase/serverless';
import { isAuthed } from './_lib/auth.js';

const STATE_ID = 'default';
const MAX_BYTES = 2_000_000; /* far above any realistic plan size */

function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    const err = new Error('No database is connected — add the Neon integration to this Vercel project and redeploy.');
    err.expose = true;
    throw err;
  }
  return neon(url);
}

/* One-time-per-instance table creation, so there is no manual migration step.
   Reset on failure so a transient error doesn't wedge the warm instance. */
let ensured = null;
function ensureTable(sql) {
  if (!ensured) {
    ensured = sql`create table if not exists app_state (
      id         text primary key,
      data       jsonb not null,
      updated_at timestamptz not null default now()
    )`.catch(err => { ensured = null; throw err; });
  }
  return ensured;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!(await isAuthed(req.headers.cookie, process.env.APP_PASSCODE))) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const sql = db();

    if (req.method === 'GET') {
      await ensureTable(sql);
      const rows = await sql`select data, updated_at from app_state where id = ${STATE_ID}`;
      return res.status(200).json(rows.length
        ? { data: rows[0].data, updated_at: rows[0].updated_at }
        : { data: null, updated_at: null });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      let body = req.body;
      /* sendBeacon posts text/plain, which arrives as a raw string */
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
      if (!body || typeof body !== 'object' || !Array.isArray(body.events) || !Array.isArray(body.roster)) {
        return res.status(400).json({ error: 'that does not look like a plan — expected events and roster' });
      }
      const json = JSON.stringify(body);
      if (json.length > MAX_BYTES) return res.status(413).json({ error: 'plan too large' });

      await ensureTable(sql);
      const rows = await sql`
        insert into app_state (id, data) values (${STATE_ID}, ${json}::jsonb)
        on conflict (id) do update set data = ${json}::jsonb, updated_at = now()
        returning updated_at`;
      return res.status(200).json({ ok: true, updated_at: rows[0].updated_at });
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('api/state error:', err);
    return res.status(500).json({ error: err && err.expose ? err.message : 'database error' });
  }
}

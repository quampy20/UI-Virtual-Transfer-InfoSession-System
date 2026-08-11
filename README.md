# UI Virtual Transfer Info Session System

Internal planning hub for the University of Idaho Admissions **Virtual Transfer Information Sessions**.

The whole app is one page (`index.html`), backed by a small API and a Postgres database, hosted on **Vercel**. Open the site from any computer, enter the **team passcode**, and your saved plan loads automatically.

## What it does

- **Dashboard** — upcoming sessions, countdowns, checklist progress, next actions
- **Checklists** — the full setup process per session, with deadlines auto-calculated from each session date
- **Staffing** — fair-rotation suggestions (editable) based on team history, which updates automatically as sessions are held
- **Email Templates** — pre-filled emails for the Registrar's Office, Slate events, prospect outreach, staffing, reminders, and shadow invites
- **Past Sessions** — read-only archive of every completed session, with a notes box per session
- **Process Guide** — the step-by-step reference for how sessions get set up

## Where your data lives

Everything you check, type or change saves automatically to the **team database** (Neon Postgres, connected through Vercel) a moment after each edit — so your progress follows you to any computer once you enter the passcode.

Each browser also keeps an offline cache: if the connection drops, you keep working, a toast tells you you're offline, and your changes sync the next time the site can reach the server.

**Export data** (top-right button) still downloads a JSON file backup any time; **Import** restores one — and the restored plan syncs to the database automatically.

## Access

Every page and API call is passcode-gated (`middleware.js`). The passcode itself is **not** in this repo — it lives in the `APP_PASSCODE` environment variable on Vercel. Entering it once keeps you signed in on that browser for 90 days; changing `APP_PASSCODE` in Vercel signs everyone out immediately.

## How it's put together

| File | Role |
| --- | --- |
| `index.html` | The entire app UI. Loads the plan from `/api/state` on startup and pushes every change back (debounced), with localStorage as the offline cache. |
| `login.html` | The passcode page. |
| `middleware.js` | Vercel Edge Middleware — blocks every request (pages *and* API) without a valid auth cookie. |
| `api/login.js` | Checks the passcode against `APP_PASSCODE` and sets the auth cookie. |
| `api/state.js` | Loads/saves the whole plan as one row of `jsonb` in Neon Postgres. Creates its own table on first use — no manual database setup. |

## Hosting setup (one-time)

1. In [Vercel](https://vercel.com), **Add New → Project** and import this GitHub repo. No build settings needed — deploy as-is.
2. In the project's **Storage** tab, add the **Neon** (Postgres) integration — this provisions the database and sets its connection string automatically.
3. In **Settings → Environment Variables**, add `APP_PASSCODE` = the team passcode (all environments).
4. **Redeploy** once so the functions pick up both variables.

After that, every push to `main` deploys automatically.

> **Note:** if GitHub Pages was previously enabled for this repo, turn it off (Settings → Pages) — that copy has no passcode gate and no database, and would drift from the real site.

## Making changes

Edit, commit, and push to `main` — or ask Claude to make the change. Vercel redeploys the site automatically within a minute or two.

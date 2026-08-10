# UI Virtual Transfer Info Session System

Internal planning hub for the University of Idaho Admissions **Virtual Transfer Information Sessions**.

The entire system is one self-contained file: **`index.html`** — no installs, no server, no dependencies. Open it in any modern browser.

## Using the system

- **Live version (recommended):** enable GitHub Pages on this repo (Settings → Pages → deploy from `main`), then open
  `https://quampy20.github.io/UI-Virtual-Transfer-InfoSession-System/` from any computer. Bookmark it — you'll always have the latest version, on any laptop.
- **Local version:** download `index.html` and double-click it.

## What it does

- **Dashboard** — upcoming sessions, countdowns, checklist progress, next actions
- **Checklists** — the full setup process per session, with deadlines auto-calculated from each session date
- **Staffing** — fair-rotation suggestions (editable) based on team history, which updates automatically as sessions are held
- **Email Templates** — pre-filled emails for the Registrar's Office, Slate events, prospect outreach, staffing, reminders, and shadow invites
- **Past Sessions** — read-only archive of every completed session, with a notes box per session
- **Process Guide** — the step-by-step reference for how sessions get set up

## Where your data lives

Progress (checked items, dates, staffing, notes) saves automatically in the **browser** you're using — it is *not* stored in this repo and does not sync between computers on its own.

To move your data to another laptop: **Export data** (top-right button) on the old machine → **Import** on the new one. Do this once when switching laptops, or any time you want a backup.

## Making changes

The system is a single `index.html`. To change it, edit that file and commit — or ask Claude to make the change and push an update. After a change lands on `main`, the GitHub Pages link picks it up automatically within a minute or two.

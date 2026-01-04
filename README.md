# Book Tracker

Single-user book tracking app built with React, Tailwind, and Supabase. The UI includes a dashboard, a searchable library table with inline actions, and an add/edit flow with Google Books + Open Library lookup.

## Features
- Dashboard metrics (status counts, finished this month/year, average rating, top genres).
- Library table with search, filters, sorting, pagination, and inline actions.
- Quick add + lookup from Google Books and Open Library.
- Supabase auth + RLS-ready data model.
- Auto dark mode (7 PM–7 AM) with optional manual override.

## Local development

```bash
npm install
npm run dev
```

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor. It creates the `books` table, indexes, triggers, and RLS policies.

Create your user in Supabase Auth, then disable public signups if desired.

## Render deployment

**Static Site**
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Notes
- The app expects a single user and enforces `owner_id` in the database.
- Completion dates are managed by database triggers.

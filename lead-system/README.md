# Lead Management System

Lead intake API + a small dashboard to manage them. Built for the IPG assessment.

Stack: Next.js 15 (App Router), Supabase (Postgres + Realtime), Tailwind, shadcn/ui, Zod for payload validation.

## Setup

You'll need Node 20+ and a Supabase project (free tier is fine).

```bash
git clone <repo>
cd lead-system
npm install
cp .env.example .env.local
```

Fill in `.env.local` — you need the Supabase URL, anon key, and service role key (all under Project Settings → API in the Supabase dashboard), plus an `INCOMING_API_TOKEN` which is just any string you want callers to send as the bearer token.

For the database, paste `supabase/migrations/0001_init.sql` into the Supabase SQL editor and run it. Then run `supabase/seed.sql` to get a few agents to assign leads to.

```bash
npm run dev
```

Hit http://localhost:3000 and it'll redirect to `/leads`.

## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/leads/incoming` | Bearer token |
| GET | `/api/leads?q=&status=` | — |
| GET | `/api/leads/[id]` | — |
| PATCH | `/api/leads/[id]` | — |
| POST | `/api/leads/[id]/notes` | — |
| GET | `/api/agents` | — |
| GET | `/api/leads/summary` | — |

Only the intake endpoint is auth'd. The rest are open because the dashboard is assumed to be on an internal network — in production you'd put Supabase Auth (or your own middleware) in front of them.

## Trying the intake endpoint

Happy path:

```bash
curl -X POST http://localhost:3000/api/leads/incoming \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer supersecrettoken123" \
  -d '{
    "leadId": "LD1001",
    "name": "John Tan",
    "phone": "0123456789",
    "email": "john@email.com",
    "source": "Facebook Ads",
    "project": "Residensi Mutiara",
    "budget": 650000,
    "createdAt": "2026-04-20T10:30:00Z"
  }'
```

Returns 201 with the inserted lead. Send the same thing twice and the second one comes back as 409 with `field` telling you whether `external_id`, `phone`, or `email` was the collision. Drop the bearer header and you get 401. Send malformed fields and you get 400 with the Zod error tree.

There's also a PowerShell seeder at `scripts/seed-leads.ps1` that fires 10 fake leads at the running dev server.

## Realtime

Open `/leads` in two tabs (or just one) and post a new lead via curl. The table updates without a refresh — `leads` is in the `supabase_realtime` publication and the page subscribes to `postgres_changes`.

## Docs

- [Flowchart](docs/flowchart.md) — request lifecycle
- [ERD](docs/erd.md) — table relationships

## Architecture

Everything lives in one Next.js app. The App Router route handlers under `app/api/` act as the backend — no separate server. The UI pages sit alongside them and talk to those same endpoints via `fetch`.

Two Supabase clients are in play. The browser gets the anon key and goes through RLS. Server-side route handlers use the service role key, which bypasses RLS — that's intentional so write operations don't get blocked.

Incoming lead flow: external caller POSTs to `/api/leads/incoming` → raw payload logged immediately (so there's always an audit trail) → Zod validates the shape → three sequential DB checks for `external_id`, `phone`, `email` duplicates → lead inserted → Postgres trigger fires and writes a row to `lead_status_history` → Supabase Realtime broadcasts the change → browser receives it and refreshes the table without a page reload.

The whole thing is a monolith because that's appropriate for the scope. If the intake endpoint needed to handle serious volume, it'd make sense to move it to a Supabase Edge Function and keep the rest as-is.

## Assumptions & decisions

A few things worth calling out:

**Separate `external_id` from internal `id`.** The sender's `leadId` could be anything — sequential, predictable, reused across senders. Keeping our own UUID PK means we never expose theirs and we don't break if they reset their counter.

**Log the raw payload first, validate second.** `webhook_logs` gets the row with `status=pending` before Zod runs, so even garbage requests leave a trail. Status flips to `invalid` / `duplicate` / `error` / `ok` based on what happens next. Useful for debugging when a sender claims they sent something and you can't find it.

**Status history via DB trigger, not application code.** `record_status_change()` runs `before update on leads` and writes a row to `lead_status_history` whenever `status` changes. It can't be skipped or forgotten by any code path that updates the lead.

**Dedup on phone OR email OR external_id.** Same person reaching out from two channels (FB lead form + a direct email) is still one lead. The 409 response now tells you which field collided so the caller can decide what to do.

**Service role key stays server-side.** Anon key is what the browser uses (RLS applies), service role is only used in route handlers for writes. Don't ship the service role key to the client.

**No retry on the intake endpoint.** If insert fails we return 500 and log the error — the caller is expected to retry. Adding a queue felt like overkill for the assessment.

## Layout

```
app/
  api/
    leads/
      incoming/route.ts   # the webhook
      route.ts            # list with search/filter
      [id]/route.ts       # detail / patch
      [id]/notes/route.ts
      summary/route.ts    # dashboard numbers
    agents/route.ts
  leads/
    page.tsx              # table + realtime
    [id]/page.tsx         # detail / status / notes / history
components/leads/         # StatusBadge, SummaryStrip
lib/
  schemas/lead.ts         # Zod
  supabase/               # browser + server clients
supabase/
  migrations/0001_init.sql
  seed.sql
docs/
```

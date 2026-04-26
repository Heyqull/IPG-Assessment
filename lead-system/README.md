# Lead Management System

Stack: Next.js 15 (App Router), Supabase (Postgres + Realtime), Tailwind, shadcn/ui, Zod for payload validation.

## Setup

You'll need Node 20+, ive also committed the env as well -- env.local to ease the setup, and theres not really any secret to keep

```bash
git clone <repo>
cd lead-system
npm install
```

I already committed .env.local as well to point to supabase to ease the setup process and theres not really a secret to keep

make sure in /lead-system
```bash
npm run dev
```

Hit http://localhost:3000 and it'll redirect to `/leads`.

## API endpoint lists

| Method | Path | Auth |
|---|---|---|
| POST | `/api/leads/incoming` | Bearer token |
| GET | `/api/leads?q=&status=` | — |
| GET | `/api/leads/[id]` | — |
| PATCH | `/api/leads/[id]` | — |
| POST | `/api/leads/[id]/notes` | — |
| GET | `/api/agents` | — |
| GET | `/api/leads/summary` | — |

Only the intake endpoint is auth'd with Bearer. 

## Trying the intake endpoint

I tested on both bash and postman for the intake POST

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

Returns 201 with the inserted lead. Send the same thing twice and the second one comes back as 409 with `field` telling you whether `external_id`, `phone`, or `email` was the duplicated value. Drop the bearer header and you get 401. Send malformed fields and you get 400 with the Zod error tree.

## Realtime

Open `/leads` in two tabs (or just one) and post a new lead via curl. The table updates without a refresh — `leads` is in the `supabase_realtime` publication and the page subscribes to `postgres_changes`.

## DB SCHEME / ERD

- [Flowchart](docs/flowchart.md) — request lifecycle
- [Flowchart](docs/flowchart.png) — request lifecycle
- [ERD](docs/erd.md) — table relationships
- [ERD](docs/erd.png) — table relationships

## Architecture

Incoming lead flow: external caller POSTs to `/api/leads/incoming` → raw payload logged immediately (so there's always an audit trail) → Zod validates the shape → three sequential DB checks for `external_id`, `phone`, `email` duplicates → lead inserted → Postgres trigger fires and writes a row to `lead_status_history` → Supabase Realtime broadcasts the change → browser receives it and refreshes the table without a page reload.

## Assumptions & decisions

Few reasonings behind the designs:

**Separate `external_id` from internal `id`.** The sender's `leadId` could be anything — sequential, predictable, reused across senders. Uses UUID to never have collision issue in the future, much practical

**Log the raw payload first, validate second.** `webhook_logs` gets the row with `status=pending` before Zod runs, so even garbage requests leave a trail. Status flips to `invalid` / `duplicate` / `error` / `ok` based on what happens next. Useful for debugging when a sender claims they sent something and you can't find it.

**Status history via DB trigger, not application code.** `record_status_change()` runs `before update on leads` and writes a row to `lead_status_history` whenever `status` changes. It can't be skipped or forgotten by any code path that updates the lead.

**Dedup on phone OR email OR external_id.** Same person reaching out from two channels (FB lead form + a direct email) is still one lead. The 409 response now tells you which field collided so the caller can decide what to do.

**Service role key stays server-side.** Anon key is what the browser uses (RLS applies), service role is only used in route handlers for writes. Don't ship the service role key to the client.

**No retry on the intake endpoint.** If insert fails we return 500 and log the error — the caller is expected to retry. Adding a queue felt like overkill for the assessment.

**UI Design decisions** Since this is a property--field management system, the design shall be somewhat modern, simple, and clean since user will be looking at lots of texts and data clean and simple design will be much pleasing to the eye.

For dashboard i also kept the typical important stuff they would usually seek for on a management system and as for leads system, i chose the summary dashboard to display total leads, total records by status, and recent leads with a timestamp, i believe these are some of the things they care about

I also added few animations and hover effects, not much, but just enough so that the page doenst feel dead and too static

Lastly, color pallettes were also not just chosen randomly, i chose a pallete that looked soft, and doesnt give eye constrait since user will be doing alot of reading on the page

## CHECKLIST 
## Assessment Checklist

### 1. Incoming Lead API
- [x] `POST /api/leads/incoming` accepts JSON — `app/api/leads/incoming/route.ts`
- [x] Payload validation + clear response — Zod schema in `lib/schemas/lead.ts`, returns 400 with field errors
- [x] Lead stored + raw payload logged — every request inserts into `webhook_logs` before validation
- [x] Graceful handling of invalid/incomplete data — bad JSON → 400, schema fail → 400, dup → 409, insert fail → 500

### 2. Database (Supabase)
- [x] Lead info → `leads` table
- [x] Assigned agent info → `agents` table + `leads.assigned_agent_id` FK
- [x] Notes → `lead_notes`; status history → `lead_status_history` (auto-populated by `record_status_change()` trigger)
- [x] Raw webhook logs → `webhook_logs` (jsonb payload + status)
- [x] Schema in `supabase/migrations/0001_init.sql`, ERD in `docs/erd.md`

### 3. Lead Management UI
- [x] List leads — `/leads` (`app/leads/page.tsx`)
- [x] View lead details — `/leads/[id]`
- [x] Update lead status — Manage card, status dropdown
- [x] Assign agent — Manage card, agent dropdown
- [x] Add notes — Notes card with textarea

### 4. Documentation
- [x] Flowchart — `docs/flowchart.md`
- [x] DB schema / ERD — `supabase/migrations/0001_init.sql` + `docs/erd.md`
- [x] API endpoint list — README §API
- [x] Setup instructions — README §Setup
- [x] Assumptions / design decisions — README §Assumptions & decisions
- [x] Source code — repo
- [x] README — this file
- [x] Architecture explanation — README §Architecture

### Bonus
- [x] Duplicate detection (phone/email/external_id) — 409 with `field` indicating which collided
- [x] Token validation on intake — `Authorization: Bearer $INCOMING_API_TOKEN`, 401 on miss
- [x] Error handling — every branch logs to `webhook_logs` (status: pending → ok/invalid/duplicate/error)
- [x] Search and filter — `/api/leads?q=&status=`, wired into UI search bar + status dropdown
- [x] Dashboard summary — total + pie by status + recent leads (`SummaryStrip.tsx`)
- [x] Realtime updates — Supabase `postgres_changes` subscription on `/leads`

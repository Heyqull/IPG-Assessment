create extension if not exists "pgcrypto";

create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  phone text,
  email text,
  source text,
  project text,
  budget numeric,
  message text,
  status text not null default 'new',
  assigned_agent_id uuid references agents(id) on delete set null,
  external_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_phone_idx on leads (phone) where phone is not null;
create index leads_email_idx on leads (email) where email is not null;

create table lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  body text not null,
  author text not null default 'system',
  created_at timestamptz not null default now()
);

create table lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text not null default 'system',
  changed_at timestamptz not null default now()
);

create table webhook_logs (
  id uuid primary key default gen_random_uuid(),
  raw_payload jsonb,
  status text not null default 'ok',
  error text,
  lead_id uuid references leads(id) on delete set null,
  received_at timestamptz not null default now()
);

create or replace function record_status_change()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into lead_status_history(lead_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, 'system');
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_status_change
before update on leads
for each row execute function record_status_change();

alter table leads enable row level security;
alter table lead_notes enable row level security;
alter table lead_status_history enable row level security;
alter table webhook_logs enable row level security;
alter table agents enable row level security;

create policy "service role full access leads" on leads using (true) with check (true);
create policy "service role full access notes" on lead_notes using (true) with check (true);
create policy "service role full access history" on lead_status_history using (true) with check (true);
create policy "service role full access logs" on webhook_logs using (true) with check (true);
create policy "service role full access agents" on agents using (true) with check (true);

alter publication supabase_realtime add table leads;

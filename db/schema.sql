-- =====================================================================
--  Governança Comercial · Onda 1 · Schema do banco (Supabase / PostgreSQL)
--  Executar uma única vez no SQL Editor do projeto Supabase.
--  Idempotente: pode ser reexecutado sem duplicar objetos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Clientes e usuários
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  manager_name  text,
  logo_url      text,
  currency      text not null default 'BRL',
  vocabulary    jsonb not null default '{}'::jsonb,
  base_year     integer not null,
  created_at    timestamptz not null default now()
);

-- Todos os usuários de um cliente têm o mesmo acesso (sem níveis).
create table if not exists public.app_users (
  email       text primary key,
  client_id   uuid not null references public.clients(id) on delete cascade,
  name        text,
  created_at  timestamptz not null default now()
);

-- E-mail do usuário autenticado (lido do token de login).
create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- Cliente do usuário autenticado (base de todas as políticas de acesso).
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id
  from public.app_users
  where lower(email) = public.current_user_email()
  limit 1
$$;

-- ---------------------------------------------------------------------
-- 2. Parâmetros (1 linha por cliente) — tudo em percentual (0 a 100)
-- ---------------------------------------------------------------------
create table if not exists public.parameters (
  client_id          uuid primary key references public.clients(id) on delete cascade,
  profiles           jsonb not null,   -- {"Hunter":{"prospect_conversion_pct":20,"win_rate_pct":20,"max_prospects":150,"max_opportunities":35}, ...}
  stage_probability  jsonb not null,   -- {"pipeline":20,"strong":50,"commit":90}
  cycle              jsonb not null,   -- {"m2":20,"m3":60,"m4":20}  (fecha 100)
  apply_floor        boolean not null default true,
  floor_pct          numeric not null default 100 check (floor_pct >= 0),
  materiality_pct    numeric not null default 50 check (materiality_pct >= 0),
  horizon_months     integer not null default 12 check (horizon_months between 1 and 12),
  thresholds         jsonb not null default '{"result":{"green":100,"amber":80},"funnel":{"green":300,"amber":150},"recovery":{"green":100,"amber":70},"prospecting":{"green":100,"amber":80}}'::jsonb,
  weeks_per_month    integer not null default 4,
  default_profile    text not null default 'End-to-End',   -- perfil usado quando o executivo não tem perfil próprio
  updated_at         timestamptz not null default now(),
  constraint cycle_closes_100 check (
    round(((cycle->>'m2')::numeric + (cycle->>'m3')::numeric + (cycle->>'m4')::numeric)::numeric, 4) = 100
    and (cycle->>'m3')::numeric > 0
  )
);

-- ---------------------------------------------------------------------
-- 3. Linhas de negócio e executivos
-- ---------------------------------------------------------------------
create table if not exists public.business_lines (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  code        text not null,
  name        text not null,
  ticket      numeric not null check (ticket > 0),
  sort_order  integer not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now(),
  unique (client_id, code)
);

create table if not exists public.executives (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  code            text not null,
  name            text not null,
  profile         text not null default 'End-to-End',
  start_month     integer not null default 1  check (start_month between 1 and 12),
  end_month       integer not null default 12 check (end_month between 1 and 12),
  annual_target   numeric not null default 0 check (annual_target >= 0),
  quarter_pct     jsonb not null default '[25,25,25,25]'::jsonb,               -- fecha 100 no ano
  month_pct       jsonb not null default '[33.3333,33.3333,33.3334,33.3333,33.3333,33.3334,33.3333,33.3333,33.3334,33.3333,33.3333,33.3334]'::jsonb, -- fecha 100 por trimestre
  total_accounts  integer not null default 0 check (total_accounts >= 0),
  active          boolean not null default true,
  sort_order      integer not null default 0,
  updated_at      timestamptz not null default now(),
  unique (client_id, code),
  constraint vigencia_valida check (start_month <= end_month),
  constraint quarter_pct_4 check (jsonb_typeof(quarter_pct) = 'array' and jsonb_array_length(quarter_pct) = 4),
  constraint month_pct_12  check (jsonb_typeof(month_pct) = 'array' and jsonb_array_length(month_pct) = 12)
);

create table if not exists public.executive_mix (
  client_id     uuid not null references public.clients(id) on delete cascade,
  executive_id  uuid not null references public.executives(id) on delete cascade,
  line_id       uuid not null references public.business_lines(id) on delete cascade,
  pct           numeric not null default 0 check (pct >= 0 and pct <= 100),
  updated_at    timestamptz not null default now(),
  primary key (executive_id, line_id)
);

-- ---------------------------------------------------------------------
-- 4. Lançamentos mensais, compromissos, ações, snapshots, notas
-- ---------------------------------------------------------------------
create table if not exists public.management_entries (
  client_id           uuid not null references public.clients(id) on delete cascade,
  executive_id        uuid not null references public.executives(id) on delete cascade,
  year                integer not null check (year between 2000 and 2100),
  month               integer not null check (month between 1 and 12),
  pipeline            numeric not null default 0 check (pipeline >= 0),
  strong              numeric not null default 0 check (strong >= 0),
  commit              numeric not null default 0 check (commit >= 0),
  won_value           numeric not null default 0 check (won_value >= 0),
  won_qty             integer not null default 0 check (won_qty >= 0),
  lost_value          numeric not null default 0 check (lost_value >= 0),
  lost_qty            integer not null default 0 check (lost_qty >= 0),
  active_accounts     integer not null default 0 check (active_accounts >= 0),
  manager_adjustment  numeric not null default 0,
  adjustment_reason   text,
  last_review         date,
  updated_at          timestamptz not null default now(),
  updated_by          text,
  primary key (executive_id, year, month)
);

create table if not exists public.commitments (
  client_id                uuid not null references public.clients(id) on delete cascade,
  executive_id             uuid not null references public.executives(id) on delete cascade,
  year                     integer not null check (year between 2000 and 2100),
  month                    integer not null check (month between 1 and 12),
  committed_prospects      integer not null default 0 check (committed_prospects >= 0),
  committed_opportunities  integer not null default 0 check (committed_opportunities >= 0),
  actual_prospects         integer not null default 0 check (actual_prospects >= 0),
  actual_opportunities     integer not null default 0 check (actual_opportunities >= 0),
  updated_at               timestamptz not null default now(),
  updated_by               text,
  primary key (executive_id, year, month)
);

create table if not exists public.actions (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  executive_id  uuid not null references public.executives(id) on delete cascade,
  description   text not null default '',
  owner         text not null default '',
  due_date      date,
  priority      text not null default 'Alta'   check (priority in ('Alta','Média','Baixa')),
  status        text not null default 'Aberta' check (status in ('Aberta','Em andamento','Concluída','Bloqueada')),
  origin_year   integer not null,
  origin_month  integer not null check (origin_month between 1 and 12),
  origin_week   integer check (origin_week between 1 and 5),
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  updated_by    text
);

create table if not exists public.snapshots (
  id                       uuid primary key default gen_random_uuid(),
  client_id                uuid not null references public.clients(id) on delete cascade,
  executive_id             uuid not null references public.executives(id) on delete cascade,
  taken_at                 timestamptz not null default now(),
  year                     integer not null,
  month                    integer not null check (month between 1 and 12),
  week                     integer check (week between 1 and 5),
  attainment               numeric,
  forecast                 numeric,
  gap_to_sell              numeric,
  gap_to_cover             numeric,
  open_pipeline            numeric,
  weighted_pipeline        numeric,
  funnel_coverage_pct      numeric,
  committed_prospects      integer,
  committed_opportunities  integer,
  actual_prospects         integer,
  actual_opportunities     integer,
  open_actions             integer,
  taken_by                 text
);

create table if not exists public.meeting_notes (
  client_id     uuid not null references public.clients(id) on delete cascade,
  executive_id  uuid not null references public.executives(id) on delete cascade,
  year          integer not null,
  month         integer not null check (month between 1 and 12),
  text          text not null default '',
  updated_at    timestamptz not null default now(),
  updated_by    text,
  primary key (executive_id, year, month)
);

create table if not exists public.audit_log (
  id          bigserial primary key,
  client_id   uuid not null references public.clients(id) on delete cascade,
  user_email  text,
  entity      text not null,
  entity_id   text,
  field       text,
  previous    jsonb,
  next        jsonb,
  reason      text,
  at          timestamptz not null default now()
);

create index if not exists idx_entries_client_year on public.management_entries (client_id, year);
create index if not exists idx_commitments_client_year on public.commitments (client_id, year);
create index if not exists idx_actions_client_status on public.actions (client_id, status);
create index if not exists idx_snapshots_exec_taken on public.snapshots (executive_id, taken_at desc);
create index if not exists idx_audit_client_at on public.audit_log (client_id, at desc);

-- ---------------------------------------------------------------------
-- 5. updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['parameters','business_lines','executives','executive_mix','management_entries','commitments','actions','meeting_notes']
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t, t);
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 6. Acesso (RLS): usuário autenticado vê e edita só o próprio cliente.
--    Sem níveis — uma única regra para todas as tabelas.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['clients','app_users','parameters','business_lines','executives','executive_mix','management_entries','commitments','actions','snapshots','meeting_notes','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists p_%s_select on public.%I', t, t);
    execute format('drop policy if exists p_%s_insert on public.%I', t, t);
    execute format('drop policy if exists p_%s_update on public.%I', t, t);
    execute format('drop policy if exists p_%s_delete on public.%I', t, t);
  end loop;
end $$;

create policy p_clients_select on public.clients for select to authenticated using (id = public.current_client_id());
create policy p_clients_update on public.clients for update to authenticated using (id = public.current_client_id()) with check (id = public.current_client_id());

create policy p_app_users_select on public.app_users for select to authenticated using (client_id = public.current_client_id());

do $$
declare t text;
begin
  foreach t in array array['parameters','business_lines','executives','executive_mix','management_entries','commitments','actions','snapshots','meeting_notes','audit_log']
  loop
    execute format('create policy p_%s_select on public.%I for select to authenticated using (client_id = public.current_client_id())', t, t);
    execute format('create policy p_%s_insert on public.%I for insert to authenticated with check (client_id = public.current_client_id())', t, t);
    execute format('create policy p_%s_update on public.%I for update to authenticated using (client_id = public.current_client_id()) with check (client_id = public.current_client_id())', t, t);
    execute format('create policy p_%s_delete on public.%I for delete to authenticated using (client_id = public.current_client_id())', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. Carga do workspace em uma chamada
-- ---------------------------------------------------------------------
create or replace function public.load_workspace(p_year integer default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with c as (select * from public.clients where id = public.current_client_id()),
       yr as (select coalesce(p_year, (select base_year from c)) as y)
  select jsonb_build_object(
    'client',      (select to_jsonb(c) from c),
    'user',        (select jsonb_build_object('email', u.email, 'name', u.name) from public.app_users u where lower(u.email) = public.current_user_email()),
    'parameters',  (select to_jsonb(p) from public.parameters p where p.client_id = (select id from c)),
    'lines',       (select coalesce(jsonb_agg(to_jsonb(l) order by l.sort_order, l.code), '[]'::jsonb) from public.business_lines l where l.client_id = (select id from c)),
    'executives',  (select coalesce(jsonb_agg(to_jsonb(e) order by e.sort_order, e.code), '[]'::jsonb) from public.executives e where e.client_id = (select id from c)),
    'mix',         (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from public.executive_mix m where m.client_id = (select id from c)),
    'entries',     (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from public.management_entries x where x.client_id = (select id from c) and x.year between (select y from yr) - 1 and (select y from yr) + 1),
    'commitments', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from public.commitments x where x.client_id = (select id from c) and x.year between (select y from yr) - 1 and (select y from yr) + 1),
    'actions',     (select coalesce(jsonb_agg(to_jsonb(a) order by a.due_date nulls last, a.created_at), '[]'::jsonb) from public.actions a where a.client_id = (select id from c) and (a.status <> 'Concluída' or a.completed_at >= now() - interval '120 days')),
    'snapshots',   (select coalesce(jsonb_agg(to_jsonb(s) order by s.taken_at), '[]'::jsonb) from public.snapshots s where s.client_id = (select id from c) and s.taken_at >= now() - interval '400 days'),
    'notes',       (select coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb) from public.meeting_notes n where n.client_id = (select id from c) and n.year between (select y from yr) - 1 and (select y from yr) + 1),
    'loaded_at',   now()
  )
$$;

grant execute on function public.load_workspace(integer) to authenticated;
grant execute on function public.current_user_email() to anon, authenticated;
grant execute on function public.current_client_id() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Keep-alive (chamado diariamente pelo GitHub Actions, sem login)
-- ---------------------------------------------------------------------
create or replace function public.ping()
returns text
language sql
stable
as $$ select 'ok ' || now()::text $$;

grant execute on function public.ping() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. Permissões básicas de esquema (padrão Supabase)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke all on all tables in schema public from anon;
-- Chave secreta (usada só pelo backup semanal no GitHub Actions): precisa ler todas as tabelas.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------
-- 10. Bucket privado para backups semanais (usado pelo GitHub Actions)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public) values ('backups', 'backups', false) on conflict (id) do nothing;
  end if;
end $$;

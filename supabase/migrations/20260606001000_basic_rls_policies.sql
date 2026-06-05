-- PR #7 Basic RLS Policies
-- Scope: enable RLS and add basic authenticated-user policies only.
-- Intentionally excludes complex roles, triggers, functions, storage buckets, Edge Functions, n8n, and AI integration.

alter table public.suppliers enable row level security;
alter table public.wood_receipts enable row level security;
alter table public.receipt_images enable row level security;
alter table public.ai_analysis enable row level security;
alter table public.audit_logs enable row level security;

create policy suppliers_read_active_authenticated
  on public.suppliers
  for select
  to authenticated
  using (deleted_at is null);

create policy wood_receipts_read_active_authenticated
  on public.wood_receipts
  for select
  to authenticated
  using (deleted_at is null);

create policy receipt_images_read_active_authenticated
  on public.receipt_images
  for select
  to authenticated
  using (deleted_at is null);

create policy ai_analysis_read_active_authenticated
  on public.ai_analysis
  for select
  to authenticated
  using (deleted_at is null);

create policy audit_logs_read_authenticated
  on public.audit_logs
  for select
  to authenticated
  using (true);

create policy wood_receipts_insert_authenticated
  on public.wood_receipts
  for insert
  to authenticated
  with check (true);

create policy receipt_images_insert_authenticated
  on public.receipt_images
  for insert
  to authenticated
  with check (true);

create policy audit_logs_insert_authenticated
  on public.audit_logs
  for insert
  to authenticated
  with check (true);

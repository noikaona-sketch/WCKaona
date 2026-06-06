-- PR #14 n8n Integration
-- Scope: add n8n dispatch tracking fields to prevent duplicate dispatches.
-- Intentionally excludes LINE logic, Google Sheet logic, AI calls, storage policy changes, and complex role systems.

alter table public.wood_receipts
  add column n8n_dispatched_at timestamptz,
  add column n8n_dispatch_status text;

alter table public.wood_receipts
  add constraint wood_receipts_n8n_dispatch_status_allowed
  check (n8n_dispatch_status is null or n8n_dispatch_status in ('dispatching', 'dispatched', 'failed'));

create index wood_receipts_n8n_dispatched_at_idx on public.wood_receipts(n8n_dispatched_at);
create index wood_receipts_n8n_dispatch_status_idx on public.wood_receipts(n8n_dispatch_status);

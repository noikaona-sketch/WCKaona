-- Supabase Foundation Schema (Schema Only)
-- Scope: tables, primary keys, foreign keys, timestamps, and soft deletes.
-- Intentionally excludes RLS, triggers, functions, storage buckets, Edge Functions, n8n, and AI integration.

create extension if not exists pgcrypto;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null unique,
  name text not null,
  phone text,
  address text,
  tax_id text,
  contact_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.wood_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  truck_plate text,
  status text not null default 'draft',
  inbound_weight_kg numeric(12, 2),
  outbound_weight_kg numeric(12, 2),
  net_weight_kg numeric(12, 2),
  moisture_percent numeric(5, 2),
  final_grade text,
  notes text,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint wood_receipts_inbound_weight_non_negative check (inbound_weight_kg is null or inbound_weight_kg >= 0),
  constraint wood_receipts_outbound_weight_non_negative check (outbound_weight_kg is null or outbound_weight_kg >= 0),
  constraint wood_receipts_net_weight_non_negative check (net_weight_kg is null or net_weight_kg >= 0),
  constraint wood_receipts_moisture_percent_range check (moisture_percent is null or (moisture_percent >= 0 and moisture_percent <= 100))
);

create table public.receipt_images (
  id uuid primary key default gen_random_uuid(),
  wood_receipt_id uuid not null references public.wood_receipts(id) on delete restrict,
  image_type text not null,
  file_path text not null,
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint receipt_images_file_size_non_negative check (file_size_bytes is null or file_size_bytes >= 0)
);

create table public.ai_analysis (
  id uuid primary key default gen_random_uuid(),
  wood_receipt_id uuid not null unique references public.wood_receipts(id) on delete restrict,
  model_name text,
  prompt_version text,
  truck_plate text,
  moisture_percent numeric(5, 2),
  estimated_log_count integer,
  estimated_diameter_min_cm numeric(6, 2),
  estimated_diameter_max_cm numeric(6, 2),
  wood_condition text,
  suggested_grade text,
  confidence integer,
  warnings jsonb not null default '[]'::jsonb,
  raw_response jsonb,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint ai_analysis_confidence_range check (confidence is null or (confidence >= 0 and confidence <= 100)),
  constraint ai_analysis_moisture_percent_range check (moisture_percent is null or (moisture_percent >= 0 and moisture_percent <= 100))
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  wood_receipt_id uuid references public.wood_receipts(id) on delete set null,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index suppliers_deleted_at_idx on public.suppliers(deleted_at);
create index wood_receipts_supplier_id_idx on public.wood_receipts(supplier_id);
create index wood_receipts_deleted_at_idx on public.wood_receipts(deleted_at);
create index receipt_images_wood_receipt_id_idx on public.receipt_images(wood_receipt_id);
create index receipt_images_deleted_at_idx on public.receipt_images(deleted_at);
create index ai_analysis_wood_receipt_id_idx on public.ai_analysis(wood_receipt_id);
create index ai_analysis_deleted_at_idx on public.ai_analysis(deleted_at);
create index audit_logs_wood_receipt_id_idx on public.audit_logs(wood_receipt_id);

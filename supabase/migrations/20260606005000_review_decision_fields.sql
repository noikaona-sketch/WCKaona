-- PR #13 Review Decision Persistence
-- Scope: add review decision fields to wood_receipts.
-- Intentionally excludes n8n, LINE, AI calls, storage policy changes, and complex role systems.

alter table public.wood_receipts
  add column review_status text not null default 'pending',
  add column reviewed_grade text,
  add column reviewer_note text,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid;

alter table public.wood_receipts
  add constraint wood_receipts_review_status_allowed
  check (review_status in ('pending', 'approved', 'rejected'));

alter table public.wood_receipts
  add constraint wood_receipts_reviewed_grade_length
  check (reviewed_grade is null or char_length(reviewed_grade) <= 20);

alter table public.wood_receipts
  add constraint wood_receipts_reviewer_note_length
  check (reviewer_note is null or char_length(reviewer_note) <= 300);

alter table public.wood_receipts
  add constraint wood_receipts_reviewed_grade_trimmed
  check (reviewed_grade is null or reviewed_grade = btrim(reviewed_grade));

alter table public.wood_receipts
  add constraint wood_receipts_reviewer_note_trimmed
  check (reviewer_note is null or reviewer_note = btrim(reviewer_note));

create index wood_receipts_review_status_idx on public.wood_receipts(review_status);

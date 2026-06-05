-- PR #9 duplicate receipt_images guard
-- Scope: prevent duplicate active image rows for one receipt and image type.
-- Intentionally excludes RLS, storage policy changes, Edge Functions, n8n, and AI integration.

create unique index receipt_images_wood_receipt_id_image_type_active_uidx
  on public.receipt_images(wood_receipt_id, image_type)
  where deleted_at is null;

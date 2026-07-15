# WCKaona

## Supabase Auth workflow ownership

This repository includes a Supabase migration that makes Supabase Auth the source of truth for workflow ownership:

- `public.profiles` is linked one-to-one to `auth.users` through `profiles.user_id`.
- Profile `role` and `status` are exposed through helper functions for RLS checks.
- Wood workflow actor columns are added when their tables exist and are forced to `auth.uid()` by database triggers.
- Workflow writes reject unauthenticated users and users without an active profile, preventing manual user-name ownership input from being trusted.

Apply migrations with your normal Supabase migration workflow, for example:

```bash
supabase db push
```

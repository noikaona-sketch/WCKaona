# 40 Secret Exposure Checklist

Last updated: 2026-07-15

## Purpose

Use this checklist before deployment to reduce the risk of leaking server-only secrets into browser/client code.

## Server-Only Secrets

These values must never be referenced from client components or browser-reachable code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `N8N_WEBHOOK_URL`

Allowed browser-facing variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Automated Check

Run:

```bash
npm run security:client-env
```

The script scans client entrypoints and shared components for server-only secret env names. It intentionally allows server-only modules and API routes to use server secrets.

## Manual Review

- Server-only helper modules should import `server-only`.
- API routes may use service-role credentials only on the server.
- Client components should call API routes rather than importing server helpers.
- Do not expose raw secret values in logs, UI error messages, or JSON responses.
- Re-run `npm run security:client-env`, `npm run lint`, `npm run typecheck`, and `npm run build` before production cutover.

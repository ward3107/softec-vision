# Softec Vision — Web platform (Next.js + Supabase)

Phase 1 scaffold for the platform rebuild described in
[`docs/platform/technical-spec.md`](../docs/platform/technical-spec.md) and
[`docs/platform/implementation-plan.md`](../docs/platform/implementation-plan.md).

**Stack:** Next.js 15 (App Router, RSC) · TypeScript · Tailwind CSS · next-intl (he/en,
RTL/LTR) · Supabase (client stubs) · Vercel-ready.

## What's in Phase 1
- Design system tokens (Architectural Precision) in Tailwind + CSS variables.
- Locale-prefixed routing (`/he`, `/en`) with `<html lang dir>`, Hebrew default + fallback.
- App shell: header (nav + language switch + quote CTA), footer (legal links), skip link.
- First-pass home page (hero + capabilities).
- Supabase client stubs (browser anon + server service-role) for later phases — not yet wired
  to a project.

Later phases add the database schema, the full catalog + comparison, the CMS, the contact/quote
form, SEO/AEO/GEO, consent-gated analytics, and security hardening (see the plan).

## Develop
```bash
cd web
npm install
cp .env.example .env.local   # fill in when a Supabase project exists (not needed for the home page)
npm run dev                  # http://localhost:3000  → redirects to /he
npm run build                # production build
npm run typecheck            # tsc --noEmit
npm run lint
```

## Environment
See `.env.example`. Public (`NEXT_PUBLIC_*`) values are browser-safe and protected by RLS; the
service-role key and Turnstile secret are **server-only**. `NEXT_PUBLIC_GA4_ID` stays empty until
launch — no analytics loads or requests until it is set, and consent still gates it.

## Deploy (Vercel)
Set the project **Root Directory** to `web`, add the env vars, and connect the repo. Preview
deployments are created per branch.

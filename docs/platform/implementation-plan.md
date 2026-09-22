# Softec Vision Platform — Implementation Plan

**Status:** Draft for review · **Date:** 2026-09-22 · **Owner:** Waseem
**Companion:** [`technical-spec.md`](technical-spec.md) · **Scope source:** the client proposal.

This plan sequences the build into three phases that map 1:1 onto the proposal's **payment
milestones (20% / 40% / 40%)** and **three revision rounds**, so "done" for each milestone is
demonstrable and testable before payment.

---

## 0. Milestone ↔ phase map

| Phase | Proposal milestone | Payment | Revision round | Demo gate |
|---|---|---|---|---|
| **Phase 1 — Foundation & design direction** | Design direction, home page, initial structure approved | **20% (₪1,300)** | **Round 1** (design/colors/structure/typography/UX) | Home + design system + skeleton on a preview URL |
| **Phase 2 — Core catalog + CMS** | Catalog, categories, product pages, comparison, admin, forms — presented for testing | **40% (₪2,600)** | **Round 2** (catalog, products, CMS, compare, forms, content) | Full catalog + working CMS + form on preview, real data |
| **Phase 3 — SEO/AEO/GEO, hardening, launch** | Final version approved and deployed to Production on the domain | **40% (₪2,600)** | **Round 3** (final small fixes) | Production launch, all gates green |

Bug-fixes to agreed spec are **not** a revision round. New concepts/functions/pages beyond the
agreed scope are quoted separately (per the proposal).

---

## Phase 1 — Foundation & design direction (→ 20%, Round 1)

**Goal:** an approvable look-and-feel and a solid technical skeleton on a live preview URL.

**Tasks**
1. **Repo & tooling:** Next.js (App Router, TS strict), Tailwind, ESLint/Prettier, Vitest,
   Playwright; GitHub Actions (lint, typecheck, test, build); Vercel project + preview deploys.
2. **Design system:** port the Architectural Precision tokens (Paper White, Pure White, Graphite,
   Machine Grey, Softec Blue `#1683C7`, Blueprint Blue) into Tailwind theme + CSS variables;
   typography; base components (button, card, dialog, nav) with **RTL/LTR logical properties**.
3. **i18n scaffolding:** `next-intl`, locale-prefixed routing (`/he`, `/en`), `<html lang dir>`,
   Hebrew default + fallback; message-catalog structure.
4. **Supabase project:** create EU project(s) (prod + staging), env wiring, migrations tooling,
   generated types. Stub `locales`, `categories`, `products` tables.
5. **App shell & Home:** header/nav (desktop + mobile), footer, and a first-pass **home page**
   (hero, value proposition, featured families, custom-manufacturing story, CTAs) — content
   hardcoded/seed for now.
6. **Auth skeleton:** Supabase Auth + a protected empty `/admin` shell (login, guard).

**Deliverables:** preview URL with home + design system + navigation in he/en; empty admin login.
**Acceptance:** design/colors/structure/typography/UX reviewed (Round 1); CI green; RTL/LTR correct;
Lighthouse/a11y smoke on home passes.

---

## Phase 2 — Core catalog + CMS (→ 40%, Round 2)

**Goal:** the full public catalog backed by the database, comparison, the contact form, and a
working admin that Softec can use without touching code.

**Tasks**
1. **Data model & migrations:** implement §4 schema (categories/subcategories, products, media,
   documents, spec fields, product_specs, related, translations, faqs, content_blocks,
   contact_info, inquiries, profiles). **RLS policies** (public reads published only; inquiries
   insert-only for anon via server path; admin/editor writes).
2. **Seed:** import the current taxonomy + product content from the static site.
3. **Public catalog:** families index, category/subcategory pages (locale-filtered; charging-carts
   English-only + crawlable SEO block), product cards, empty-state → custom inquiry.
4. **Product detail:** gallery (+ 3D fallback hook), full description, **spec table**, documents
   (PDF/drawings), related products, per-product WhatsApp + "Request a quote".
5. **Comparison:** select 2–3 models → aligned spec matrix; column order follows direction;
   accessible table.
6. **Contact/quote form:** RHF + Zod; attachments to the **private** bucket; product-context
   prefill; success/error states; store inquiry. (Anti-spam basics land here; full hardening in
   Phase 3.)
7. **Admin/CMS:** CRUD for products, categories/subcategories, media (upload to Storage), specs,
   documents, FAQs, content blocks, contact info; **inquiries inbox** (list/read/status);
   translation editing per locale; RBAC (admin/editor); admin UI in **he/en**.
8. **i18n content:** wire translation tables + UI catalogs end-to-end with fallback.

**Deliverables:** full catalog + product pages + comparison + working form + admin on preview, with
real data.
**Acceptance:** Round 2 review (catalog, products, CMS, compare, forms, content); a content edit in
the CMS appears on the site (ISR revalidation); RLS verified (anon cannot read inquiries/drafts);
e2e smoke green; a11y checks on catalog/product/form pass.

---

## Phase 3 — SEO/AEO/GEO, hardening & launch (→ 40%, Round 3)

**Goal:** production-ready — discoverable, secure, accessible, fast, live on the domain.

**Tasks**
1. **SEO:** Metadata API titles/meta per page; dynamic `sitemap.xml` (all locales + **hreflang**);
   `robots.txt`; canonical; **breadcrumbs**; OG/Twitter + dynamic OG images; ALT coverage; internal
   linking.
2. **Structured data:** JSON-LD — `Organization` (+ `LocalBusiness` if address supplied), `Product`,
   `BreadcrumbList`, `FAQPage`, `WebSite`.
3. **AEO/GEO:** FAQ + spec/answer structuring for answer/generative engines.
4. **Google wiring:** Search Console verification + sitemap submission; **GA4 via Consent Mode v2**
   (consent-gated, GPC) with the real identifier; Google Business Profile link if available.
5. **Consent & legal:** port the consent banner + bilingual legal pages (privacy/accessibility/
   terms) with the review warnings; centralized consent/analytics config.
6. **Security hardening:** finalize RLS; **CSP + security headers**; rate limiting; **Turnstile/
   hCaptcha** + honeypot; upload MIME/size/magic-byte validation + signed URLs; verify service-role
   is server-only; inquiry **retention** job.
7. **Accessibility pass:** full WCAG 2.2 AA re-check across key flows (keyboard, focus trap/return,
   contrast, reduced motion, text-spacing/zoom reflow, screen-reader labels) + axe in CI.
8. **Performance:** Core Web Vitals tuning (images, caching/ISR, JS budget).
9. **Launch:** connect domain, DNS, SSL/HTTPS, promote to Production, pre-launch QA checklist,
   smoke test in prod.

**Deliverables:** live production site on the domain, all gates green.
**Acceptance:** Round 3 (final small fixes); no analytics request before consent; sitemap/robots/
schema valid; RLS + headers verified; a11y + CWV targets met; QA checklist signed off.

Then the **3-month free support** window begins (per proposal), followed by the retainer or
hourly option.

---

## Testing strategy

- **Unit (Vitest):** i18n fallback, catalog filtering/normalization (incl. charging-carts English-
  only), inquiry/consent Zod schemas, WhatsApp message building.
- **Integration:** server actions (form submit, CMS writes) against a test Supabase; **RLS policy
  tests** (anon cannot read inquiries/drafts; editor cannot manage users).
- **E2E (Playwright):** catalog browse, product detail, comparison, form submit + upload, language
  switch + URL state, consent flows (accept/reject/customize/GPC/blocked-storage), admin CRUD.
- **Accessibility:** axe on home/catalog/product/form/legal; keyboard + focus-trap flows; reduced
  motion; text-spacing reflow at 320/390.
- **CI gate:** lint + typecheck + unit + build required on every PR; e2e smoke on preview.

---

## Reuse from the current static site

| Asset | Reuse |
|---|---|
| Design language & tokens | Port palette/typography/logical-property layout into Tailwind. |
| Taxonomy & product data | Seed the DB from the existing categories/products. |
| Comparison UX | Re-implement the 2–3 model aligned-spec comparison. |
| Consent architecture | Port Consent Mode v2 + GPC banner and centralized config. |
| Legal content | Port privacy/accessibility/terms copy (bilingual, review warnings). |
| Accessibility patterns | Reuse focus management, dialog semantics, RTL/LTR, reduced motion. |
| Charging-carts SEO rule | Re-implement English-only + crawlable clipped block. |

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Scope creep beyond the proposal | Written change-control; new features quoted separately (per proposal). |
| Content/asset delays from client | Seed from the static site; content dependencies tracked; CMS lets Softec fill in later. |
| Legal pages not counsel-reviewed / missing address | Ship with review warnings; block "published as final legal" until reviewed; flag address. |
| Multi-language cost expectations | Translation infra ≠ translation service; state that translations are separate. |
| Spam / abusive uploads | Turnstile + rate limit + honeypot + strict upload validation from Phase 2/3. |
| Service-role key exposure | Server-only usage; CI check that no `NEXT_PUBLIC_` var holds a secret. |
| SEO ranking expectations | Proposal already states no ranking guarantee — infra only. |

---

## Immediate next actions (once approved)

1. Confirm the **open decisions** in `technical-spec.md` §15 (i18n storage, CAPTCHA, email,
   legal-page storage, retention, GA4 vs GTM, replace-vs-coexist).
2. Green-light Phase 1: scaffold the Next.js + Supabase repo and stand up the design system + home
   on a preview URL for the Round 1 review.

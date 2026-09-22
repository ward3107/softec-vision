# Softec Vision Platform — Technical Specification

**Status:** Draft for review · **Date:** 2026-09-22 · **Owner:** Waseem
**Scope source:** the client proposal ("הצעת מחיר להקמת האתר החדש של Softec Vision").

> This spec translates the commercial proposal into a concrete technical design. It is the
> engineering companion to [`implementation-plan.md`](implementation-plan.md). It supersedes the
> static single-file catalog only if we decide to rebuild (see §1.2); the static site remains a
> validated reference for design, content, comparison logic, consent and legal copy.

---

## 1. Overview

### 1.1 Goal
A modern, professional, **catalog + brochure** website for **Softec Vision Ltd** — lecturer
stations, control/command desks, information/display stations, carts and custom manufacturing.
It is **not** an online store: no purchase or payment. Visitors browse products, read specs,
compare models, and contact Softec for information or a quote. The company manages all content
through a self-service **admin/CMS** with no code changes.

### 1.2 Relationship to the existing static site
The current repository ships a dependency-free static `index.html` catalog (RTL/LTR, categories,
comparison, WhatsApp, Consent Mode v2 + GPC, bilingual legal pages, accessibility). This platform
**rebuilds** the public site on a dynamic stack to add: a CMS, database-backed content, a contact
form with attachments, real multi-language infrastructure, full SEO/AEO/GEO, and security. We
**reuse** from the static build: the Architectural Precision design language and tokens, the
category taxonomy and product data, the comparison UX, the consent architecture, and the legal
page content.

Decision needed: does the new platform fully replace the static site, or ship alongside it during
a transition? (Recommendation: replace, with the static site kept as a design/content reference.)

### 1.3 Non-goals (explicitly out of scope for v1 — future phases)
CRM, WhatsApp automation, AI features, automatic translation, an advanced quote-management system,
customer/distributor portals, an advanced 3D product configurator. 3D interactive models are
priced and delivered **per model, separately** (from ₪250/model) and are not part of the build fee.

---

## 2. Architecture

```
                    ┌──────────────────────────── Vercel ────────────────────────────┐
   Visitor  ─────▶  │  Next.js (App Router, RSC) — public site + /admin               │
   Admin    ─────▶  │   • SSG/ISR for catalog & product pages (fast, SEO-friendly)    │
                    │   • Server Actions / Route Handlers for the CMS & the form       │
                    │   • Middleware: locale routing + admin auth guard + security     │
                    └──────────┬───────────────────────────────────┬─────────────────┘
                               │ server-only (service role)         │ browser (anon key, RLS)
                    ┌──────────▼───────────────────────────────────▼─────────────────┐
                    │                         Supabase (EU / Frankfurt)               │
                    │   Postgres (RLS) · Auth · Storage (public + private buckets)     │
                    └──────────────────────────────────────────────────────────────────┘
   External:  Google Search Console · GA4 (consent-gated) · WhatsApp deep links · (optional) email
```

- **Rendering:** product/catalog pages are statically generated and revalidated (ISR) so content
  edits in the CMS appear without a redeploy, while staying fast and crawlable. The admin and the
  contact form are dynamic (server actions / route handlers).
- **Data access:** the public site reads via the Supabase **anon** key protected by **Row Level
  Security** (only published rows are readable). Privileged writes use the **service role** key,
  **server-side only** — never shipped to the browser.
- **Hosting:** Vercel (production + per-branch preview deployments). Supabase project hosted in the
  **EU (Germany/Frankfurt)** to match the privacy posture already documented.

---

## 3. Tech stack and key decisions

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router, React Server Components)** | SSG/ISR + server actions; strong SEO. |
| Language | **TypeScript** (strict) | End-to-end types incl. generated DB types. |
| Styling | **Tailwind CSS** + design tokens (CSS variables) | Port the Architectural Precision palette/tokens; logical properties for RTL/LTR. |
| i18n | **next-intl** (locale-prefixed routing) | `/he`, `/en`, extensible; RTL/LTR per locale. |
| Data | **Supabase Postgres** + generated types | Migrations tracked in-repo (`supabase/migrations`). |
| Auth | **Supabase Auth** (email/password, optional magic link) | Admin only; RBAC via a `profiles.role`. |
| Storage | **Supabase Storage** (public `product-media`, private `inquiry-attachments`) | Signed URLs for private files. |
| Forms | **React Hook Form + Zod** | Shared Zod schemas validate on client and server. |
| Validation | **Zod** everywhere (form + server action + API) | Single source of truth. |
| Anti-spam | **Cloudflare Turnstile** (or hCaptcha) + honeypot + rate limit | See §8. |
| Email (optional) | **Resend** (or Supabase SMTP) for inquiry notifications | Optional; can be added without redesign. |
| Testing | **Vitest** (unit) + **Playwright** (e2e/a11y) | Plus RLS policy tests. |
| CI/CD | **GitHub Actions** → Vercel | lint, typecheck, test, build on PRs. |
| Analytics | **GA4 via Consent Mode v2** (reuse existing consent) | Loads only after opt-in; GPC honored. |

Deliberately avoided for v1: a headless CMS SaaS (we build a lightweight admin on Supabase to keep
data in one place and costs low), and any client-exposed service-role access.

---

## 4. Data model (Postgres)

Guiding decisions:

- **Stable keys, translatable content.** Entities carry a language-neutral `slug`/`code`; all
  human-readable text lives in **translation tables** keyed by `locale`, so adding a language is a
  data operation, not a schema change. (A simpler `jsonb` `{locale: value}` column is an acceptable
  alternative if we cap languages to 2–3; translation tables are recommended for the "many
  languages" requirement and partial-translation management in the CMS.)
- **Publish state** on content so the public site (via RLS) only ever reads `status = 'published'`.
- **Specs** stored as ordered key/value rows (translatable) to drive both the spec table and the
  comparison matrix, rather than free-form JSON, so comparison can align rows across models.

### 4.1 Core tables (abbreviated)

```
locales(code PK, name, dir 'rtl'|'ltr', enabled bool, is_default bool, sort int)

categories(id PK, slug uniq, parent_id FK→categories NULL, sort int,
           status enum, visible_in text[] DEFAULT '{}',  -- e.g. '{en}' for charging-carts
           created_at, updated_at)
category_translations(category_id FK, locale FK, name, description,
                      PRIMARY KEY(category_id, locale))

products(id PK, code uniq, category_id FK, subcategory_id FK→categories NULL,
         status enum('draft','published','archived'), featured bool, sort int,
         model_3d_url text NULL, created_at, updated_at)
product_translations(product_id FK, locale FK, name, description, alt_text,
                     PRIMARY KEY(product_id, locale))

product_media(id PK, product_id FK, storage_path, kind enum('image','gallery'),
              sort int, alt_translations jsonb NULL)   -- alt text per locale
product_documents(id PK, product_id FK, storage_path, kind enum('pdf','spec','drawing'),
                  title_translations jsonb, sort int)
spec_fields(id PK, key uniq, sort int, unit text NULL)          -- the canonical attribute set
spec_field_translations(spec_field_id FK, locale FK, label, PRIMARY KEY(spec_field_id, locale))
product_specs(product_id FK, spec_field_id FK, value_translations jsonb, sort int,
              PRIMARY KEY(product_id, spec_field_id))
related_products(product_id FK, related_id FK, sort int, PRIMARY KEY(product_id, related_id))

faqs(id PK, sort int, status enum, category text NULL)
faq_translations(faq_id FK, locale FK, question, answer, PRIMARY KEY(faq_id, locale))

content_blocks(id PK, key uniq, status enum)          -- home hero, about, process, custom, footer…
content_block_translations(block_id FK, locale FK, data jsonb, PRIMARY KEY(block_id, locale))

contact_info(id PK singleton, phone, whatsapp, email, address_translations jsonb, map_url,
             updated_at)

inquiries(id PK, created_at, name, company, phone, email, project_type,
          product_id FK NULL, product_code_snapshot text, message,
          locale, source enum('form','whatsapp'), status enum('new','read','handled','archived'),
          ip_hash, user_agent)                          -- see retention policy §8.4
inquiry_attachments(id PK, inquiry_id FK, storage_path, filename, mime, size_bytes)

profiles(id PK = auth.users.id, role enum('admin','editor'), full_name, created_at)
consent_events(id PK, created_at, anon_id, analytics bool, marketing bool, gpc bool,
               version, method)  -- optional consent audit log (see §10)
```

### 4.2 Charging-carts visibility & SEO
The English-only rule from the static site becomes data: the `charging-carts` category has
`visible_in = {'en'}`. Server-side catalog queries filter by the active locale, so it never
appears in Hebrew navigation/filters. A semantic, always-rendered (visually clipped, **never
`display:none`**) block keeps the topic crawlable in both languages, mirroring the existing
`aside#seo-charging-carts`.

### 4.3 Migrations & seed
Schema lives in `supabase/migrations/*.sql` (versioned). A `supabase/seed.sql` imports the current
taxonomy and the existing product content from the static site so the catalog is populated on day
one.

---

## 5. Internationalization

- **Routing:** locale-prefixed paths via `next-intl` — `/{locale}/...` (`/he`, `/en`, then
  `/ar`, `/fr`, `/de`, `/es`, `/ru`, `/zh`, `/ja` as enabled). `<html lang dir>` set per locale;
  layout uses CSS **logical properties** so RTL/LTR share one set of rules.
- **Content translations** come from the DB translation tables; **UI strings** from `next-intl`
  message catalogs (`messages/{locale}.json`). Missing translations **fall back to the default
  locale** (Hebrew) and never render blank.
- **Admin is Hebrew + English only** (proposal). Adding a public language = enable a `locales` row
  + provide translations; **professional translation is not included** unless separately agreed.
- **hreflang** alternates and locale-aware canonical/sitemap entries are generated (see §9).

---

## 6. Public site — routes & features

| Route | Purpose |
|---|---|
| `/{locale}` | Home: hero, value proposition, featured families/products, custom-manufacturing story, CTAs. |
| `/{locale}/catalog` | Product families index (categories + subcategories), locale-filtered. |
| `/{locale}/catalog/[category]` / `.../[category]/[sub]` | Filtered catalog with product cards, empty-state → custom inquiry. |
| `/{locale}/product/[code]` | Product detail: gallery, full description, spec table, documents (PDF/drawings), related products, compare toggle, per-product WhatsApp + "Request a quote". |
| `/{locale}/compare?ids=` | Side-by-side comparison of 2–3 models by aligned spec rows. |
| `/{locale}/contact` | Contact + quote request form (see §7). |
| `/{locale}/about`, `/process`, `/custom` | Company/process/custom-manufacturing content (CMS-driven). |
| `/{locale}/faq` | FAQ (also feeds FAQPage schema). |
| `/{locale}/legal/{privacy,accessibility,terms}` | Bilingual legal pages (ported from the static build; DB- or MDX-backed). |
| `sitemap.xml`, `robots.txt` | Generated (multilingual, hreflang). |

Feature parity with the static site (comparison limits 2–3, gallery/3D fallback, product-context
WhatsApp messages, accessible dialogs, focus management) is preserved and upgraded with real data.

---

## 7. Contact / quote form & inquiries

- **Fields:** name, company/organization, phone, email, project type, related product/model
  (auto-prefilled when opened from a product page — `product_id` + a `product_code_snapshot`),
  requirement description, **image attachments**, **PDF/document attachments**.
- **Submission:** a Next.js **server action** validates with the shared Zod schema, stores the
  inquiry + attachment metadata in Postgres, uploads files to the **private** `inquiry-attachments`
  bucket, and (optionally) emails a notification. The user sees a clear success/failure state.
- **Product context:** when submitted from a product page, product details travel with the
  inquiry; the same context builds the localized WhatsApp deep-link message.
- **WhatsApp & contact:** click-to-WhatsApp (per-product message), click-to-call on mobile, email,
  business details and map — all CMS-managed via `contact_info`.
- See §8 for anti-spam, upload validation and retention.

---

## 8. Security

### 8.1 Row Level Security (Supabase)
- Public (anon) role: **read-only**, and only `status='published'` rows for catalog/content;
  **no** read access to `inquiries`, `profiles`, or the private bucket.
- `inquiries` **insert** allowed for anon **only** through the server action path (writes use the
  service role server-side; the anon key cannot read them back). Admin/editor roles read/manage.
- Admin/editor writes gated by `profiles.role` checked in policies; service-role bypasses RLS only
  in trusted server code.

### 8.2 Admin auth & routing
Supabase Auth; `/admin/**` protected by middleware (redirect unauthenticated) and per-action role
checks. RBAC: `admin` (full) vs `editor` (content, no user management). No public sign-up.

### 8.3 Form & upload protection
Rate limiting (per IP, e.g. Upstash or Vercel KV), **Cloudflare Turnstile/hCaptcha**, a honeypot
field, and server-side Zod validation. Uploads: allowlist MIME types (images, PDF), enforce max
size, verify magic bytes (not just extension), randomized storage paths in the **private** bucket,
served only via short-lived **signed URLs**.

### 8.4 Data protection & retention
`inquiries` hold personal data → documented **retention** (e.g. auto-archive/delete after N months,
configurable), IP stored **hashed** for abuse-prevention only, and processor posture matching the
privacy policy (Supabase EU). Public vs private storage buckets are strictly separated.

### 8.5 Platform hardening
HTTPS everywhere; security headers via middleware/`next.config` — **CSP**, HSTS,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame protections. API keys and
the service-role key are **server-only** env vars, never referenced in client bundles.

---

## 9. SEO / AEO / GEO

- **SEO:** per-page titles/meta via the Next.js Metadata API; clean, localized URLs; dynamic
  `sitemap.xml` (all locales + hreflang) and `robots.txt`; canonical URLs; **breadcrumbs**;
  `next/image` ALT from `product_translations`/media alt; **Open Graph** + Twitter cards with
  dynamic OG images; internal linking (related products, category cross-links).
- **Structured data (JSON-LD):** `Organization` (+ `LocalBusiness` if address is provided),
  `Product` (with `Brand`, images, category; no price/offer since not e-commerce),
  `BreadcrumbList`, `FAQPage`, `WebSite`/`SiteNavigationElement` where appropriate.
- **AEO:** clear question-shaped FAQ content and concise, well-structured spec/answer blocks so
  answer engines can extract them.
- **GEO:** clean semantic HTML, stable canonical facts (specs, capabilities), and content
  structured for AI/generative search retrieval.
- **Google wiring:** Search Console verification + sitemap submission; GA4 (consent-gated, §10);
  Google Business Profile linkage if an account exists.
- **No ranking guarantees** — infrastructure only, matching the proposal's wording.

---

## 10. Analytics & consent

Reuse the static site's consent architecture: **Consent Mode v2 defaults denied**
(`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`), **GPC** honored, opt-in
banner (Accept / Reject equal / Customize; nothing pre-selected), 12-month expiry, withdrawal
control, blocked-storage tolerant. **GA4 loads only after analytics consent** and only when a real
`GA4_ID`/`GTM_ID` is configured; nothing loads (and no analytics request fires) until then. Config
centralized in one module. No Google Ads / Meta Pixel in v1. (Optional `consent_events` table for
an auditable consent log.)

---

## 11. Accessibility

WCAG **2.2 AA** as the implementation target (not a "fully compliant" claim). Keyboard operation,
visible focus, contrast, correct heading/landmark structure, form labels/errors, RTL/LTR, reduced
motion, screen-reader labels and live regions — carried over and re-verified from the static build.
The optional accessibility widget is retained as an **aid, not a substitute**, and must itself be
accessible (focus trap + Escape/return, logical positioning, links to the statement). Automated a11y
checks (axe/Playwright) run in CI on key pages.

---

## 12. Performance
RSC + SSG/ISR for catalog/product pages; `next/image` with Supabase image transforms; route/data
caching with tag-based revalidation on CMS edits; lazy-load below-the-fold media; keep JS lean.
Target good Core Web Vitals (LCP/CLS/INP) on mobile.

---

## 13. Infrastructure & environments

- **Repos/branches:** GitHub; feature branches → PR → preview deploy → `main` (production).
- **Environments:** Vercel Production + Preview; a Supabase **staging** project (or branch) distinct
  from production. Env vars per environment (`NEXT_PUBLIC_*` for anon/public only; service role and
  API keys server-only).
- **Migrations:** Supabase CLI migrations in-repo, applied via CI; typed client generated from the
  schema.
- **Domain:** connect the Softec-provided domain, configure DNS, issue SSL/HTTPS, deploy to
  Production, run pre-launch QA. **Domain purchase cost is not included** (proposal).
- **CI:** GitHub Actions — lint, typecheck, unit tests, e2e (smoke), build — required on PRs.

---

## 14. Client-provided content (dependencies)
Logo, product images, model names/codes, technical specs, documents (PDF/drawings), business
details, contact info, and any additional copy. Legal pages require **qualified legal review** and
a **business address** before publication (already flagged in the compliance notes).

---

## 15. Decisions (locked 2026-09-22)
1. **Static site → full replacement.** The new platform replaces the static site at launch; the
   static site is kept only as a design/content reference.
2. **i18n storage: translation tables** (scalable to many languages) + `next-intl` locale routing.
3. **CAPTCHA: Cloudflare Turnstile** (free, privacy-friendly, mostly invisible).
4. **Email notifications for inquiries: deferred to v2.** v1 stores inquiries in the CMS inbox only.
5. **Legal pages: DB-backed, editable in the CMS.**
6. **Analytics: GA4 direct** (single `gtag.js`, consent-gated) — **not** routed through GTM in v1.
   GTM remains a future option if many tags need managing without deploys.
7. **Design system: Tailwind CSS** with the Architectural Precision tokens ported in.

### Still needed from the client (not blockers for Phase 1)
- **Business address** — for `LocalBusiness` schema and legal disclosure (also flagged in the
  compliance notes).
- **Real GA4 Measurement ID** (`G-XXXXXXXXXX`) — create the GA4 property before the Phase 3 launch;
  until then no analytics loads and no analytics request is made.
- **Inquiry retention period** — to confirm during Phase 2/3 (proposed default: 24 months, then
  auto-archive/delete); attachments stay in the private bucket (not emailed).
- **Account access** — Supabase, Vercel and the domain/DNS — needed from Phase 2 onward. Phase 1 is
  built and previewed on development accounts.

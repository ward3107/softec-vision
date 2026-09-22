# Softec Vision — Architectural Precision Catalog

A premium, **bilingual (Hebrew / English)** product catalog for **Softec Vision Ltd** —
lecturer stations, control and command desks, information/display stations and custom
manufacturing.

The site is a **single static `index.html`** (all product media, CSS and JS are inlined),
plus a small set of standalone **legal pages** under `legal/`. There is **no build step and
no runtime dependencies** — it runs directly from GitHub Pages.

- Live: `https://ward3107.github.io/softec-vision/`
- Brand primary color: `#1683C7` (Softec Blue). Palette tokens live in `:root` at the top of
  the `<style>` block: Paper White `#F7F8F8`, Pure White `#FFFFFF`, Graphite `#151719`,
  Machine Grey `#697077`, Softec Blue `#1683C7`, Blueprint Blue `#0C5E91`.

---

## Local preview and tests

**Preview** (any static server works):

```bash
python3 -m http.server 4173
# open http://localhost:4173/
```

**Automated tests.** Zero-dependency Node tests plus real-Chrome (Playwright) checks:

```bash
# Pure Node checks (data contract, static structure, legal pages) — no browser:
node --test tests/catalog.test.cjs tests/static-page.test.cjs tests/legal-pages.test.cjs

# Real-browser checks (catalog flows, consent flows, accessibility widget).
# Playwright is not a project dependency; make it resolvable and allow a Chrome/Chromium launch:
NODE_PATH=/path/to/global/node_modules node --test tests/browser-shell.test.cjs tests/consent-flows.test.cjs tests/a11y-widget.test.cjs

# Some environments require single-process isolation for the shared browser fixture:
node --test --test-isolation=none tests/*.test.cjs
```

The browser tests launch Chrome via Playwright's `channel:'chrome'`. If only Chromium is
installed, point that channel at it (e.g. symlink the Chromium binary to the path Playwright
expects) — do **not** add Playwright or any other dependency to the project.

---

## Language and URL behavior

- Two languages: Hebrew (`lang="he"`, `dir="rtl"`) and English (`lang="en"`, `dir="ltr"`).
- **First-visit default is Hebrew**, unless a `?lang=` value or a saved preference exists.
- Language precedence: `?lang=he|en` in the URL **wins**, then the saved preference in
  `localStorage['softec-language']`, otherwise Hebrew. Invalid values fall back to Hebrew.
- The current catalog state is reflected in the URL: `?lang=en&cat=podium&sub=smart`. State is
  validated on every read (`normalizeCatalogState`) and written with `history.replaceState`, so
  reloads and shared links restore the same view.
- Missing translations fall back to Hebrew and never render blank UI.
- Storage is optional: if `localStorage` is blocked, the language still switches for the
  session (all storage access is wrapped in `safeStorageGet` / `safeStorageSet`).
- The standalone legal pages read the same `?lang=` / `softec-language` preference, and internal
  links carry the current language across navigation.

---

## Catalog data format (categories, subcategories, products)

All catalog data lives between the `/* APP_CORE_START */` and `/* APP_CORE_END */` markers in
`index.html` (the markers also let the Node tests evaluate the logic in isolation).

**Categories** (`CATEGORIES`) — bilingual labels/descriptions and a visibility rule:

```js
{
  key:'podium',
  label:{ he:'עמדות מרצה – פודיום', en:'Lecturer Stations — Podiums' },
  description:{ he:'…', en:'…' },
  visibleIn:['he','en'],           // languages this category is shown in
  subs:[ { key:'smart', label:{ he:'…', en:'Smart Lecturer Stations' } }, … ]
}
```

**Products** (`products`) — each references a category/subcategory key and carries bilingual
content. English fields are merged from `PRODUCT_TRANSLATIONS` by product `code`:

```js
{ code:'V-19W', cat:'podium', sub:'smart', img:'data:image/jpeg;base64,…',
  desc:'…', specs:{ 'מסכים':'…', 'גימור':'…', 'מידות (ג×ר×ע)':'[למילוי]', … } }
```

- `cat` / `sub` are **stable keys** (from `CATEGORIES`); display copy can change without
  breaking filtering. `sub:''` when the category has no subcategories.
- `name`, `desc` and `specs` become `{ he, en }` objects at load time.
- Spec values containing `[למילוי]` / `[To be completed]` render greyed — **Softec must fill in
  real dimensions/weight/power before publication.**
- Optional per-product media: `imgs:[…]` (gallery angles) and `model3d:'models/x.glb'` (a "View
  in 3D" button, rendered with Three.js when available and gracefully skipped otherwise).

### English-only "Computer Charging Carts"

Per requirement, `charging-carts` has `visibleIn:['en']`, so it appears in the **English**
category navigation and filters but **never** in the visible **Hebrew** UI. If the language
switches to Hebrew while charging-carts is selected, the state **normalizes** to a valid
category (`all`) and the URL is rewritten without `charging-carts`.

The topic stays crawlable in **both** languages via a semantic, always-in-DOM block
`aside#seo-charging-carts` (class `seo-only`) inside the catalog section. It is **visually
hidden by clipping — never `display:none`** — so it remains in the render/crawl tree. Keep the
copy accurate; avoid keyword stuffing.

---

## Compliance and consent configuration

> **Legal review required.** The legal pages and consent copy were produced from templates and
> are **not legal advice**. Every legal page carries a visible review warning. Have qualified
> counsel review all legal text and the jurisdiction assumptions before publication. See
> [`docs/compliance-implementation-notes.md`](docs/compliance-implementation-notes.md) for the
> open items (missing business address, Québec French, US scope, GA4/GTM identifiers).

### Consent architecture (Consent Mode v2 + GPC)

- **Consent Mode v2 defaults to denied** for every signal — `analytics_storage`, `ad_storage`,
  `ad_user_data`, `ad_personalization` — in a small script in `<head>` that runs before any tag
  manager. Global Privacy Control (`navigator.globalPrivacyControl`) is detected there and kept
  as a do-not-sell/share signal, so advertising storage stays denied regardless of choice.
- The bilingual cookie banner offers **Accept all**, **Reject all** (equal prominence — reject
  is as easy as accept) and **Customize**. The Customize panel exposes **Analytics** and
  **Marketing** toggles that start **unselected**; Necessary storage is always on. Under GPC the
  Marketing toggle is locked off and a notice is shown.
- Consent is recorded in `localStorage['softec-consent']` with a version and timestamp, and
  **expires after 12 months** (re-prompts on expiry or version bump). It is mirrored to the
  legacy `cookie-consent` key for backward compatibility.
- **Withdraw / change consent** any time via the footer **"Cookie settings"** control, which
  reopens the banner with the current choices and returns focus on close.
- Blocked `localStorage` never breaks the page; the banner still works and choices apply for the
  session.
- Only **necessary/functional** storage is used before consent (language, accessibility
  settings, the consent record). Analytics storage is used only after opt-in.

### Analytics / GTM setup steps

Analytics is **planned but not configured**. No GA4 Measurement ID or GTM container ships, so
**nothing loads and no analytics request is made** — the site is fully functional as-is.

To enable analytics later, edit the centralized `CONSENT` config in `index.html` (search for
`const CONSENT = {`):

```js
const CONSENT = {
  GTM_ID: null,        // e.g. 'GTM-XXXXXXX'  (preferred if you use GTM)
  GA4_ID: null,        // e.g. 'G-XXXXXXXXXX' (used only when GTM_ID is null)
  version: '2026-09-22',
  ttlDays: 365,        // consent lifetime (12 months)
  …
};
```

- Set **`GTM_ID`** (loads GTM) **or** **`GA4_ID`** (loads gtag.js with `anonymize_ip`). Never
  insert a placeholder/fake ID — while both are `null` nothing is requested.
- Analytics loads **only** after the visitor grants analytics consent, and advertising signals
  are granted only when Marketing consent is given **and** GPC is not active.
- Bump `version` after a material policy change to re-prompt all visitors.
- In GTM, keep tags gated on Consent Mode (they should respect the denied-by-default state set
  in `<head>`). Do not add Google Ads / Meta Pixel unless the policy and consent copy are
  updated to match.

### Legal documents maintenance

Standalone bilingual pages live in `legal/`:

- `legal/privacy.html` — privacy policy (Israel, EU/EEA, UK, US federal + California, Canada
  incl. Québec/Ontario/BC/Alberta; GPC and Do Not Sell or Share).
- `legal/accessibility.html` — accessibility statement (WCAG 2.2 AA target; IS 5568 note).
- `legal/terms.html` — terms of use.

Each page:

- Shares `legal/legal.css` (styling) and `legal/legal.js` (language controller). Content is a
  per-page `window.LEGAL_I18N` object of `{ he, en }` strings; edit copy there. Section bodies
  use `data-i18n-html` (author-trusted markup); headings/labels use `data-i18n`.
- Has a table of contents with **stable anchor IDs**, a language toggle, a last-updated date,
  contact details, and a **legal-review warning** banner.
- Is linked from the site footer and the cookie banner; links carry the current language.

Update the **last-updated date** (`ui.lastUpdated`) whenever content changes. Keep the careful
wording ("designed to support", "implemented against") and the review warning — do **not** add
"fully compliant" style claims.

### Accessibility widget

The floating accessibility panel (text size, high contrast, link highlight, readable font,
reduce motion) is an **aid, not a compliance substitute** — the underlying site is built to
support WCAG 2.2 AA. The widget itself is keyboard operable, traps focus while open, closes on
Escape with focus return, is positioned on the logical start side for RTL/LTR, tolerates blocked
storage, respects reduced motion, stays scrollable under larger text/spacing, and links to the
accessibility statement. The cookie banner always stacks above it.

---

## Product media, gallery, 3D and specs

- **Replace an image:** convert to base64 and paste into the product's `img` (or a `gallery`
  entry). For example: `echo "data:image/jpeg;base64,$(base64 -w0 photo.jpg)"`. Downscale to
  ~900px wide / ~75% quality first to keep the file light.
- **Gallery:** add `imgs:[…]` for multiple angles; the dialog shows thumbnails and prev/next.
  A single image hides those controls. Broken optional thumbnails fall back to the primary image.
- **3D:** add `model3d:'models/x.glb'` (upload the `.glb` to the repo). The "View in 3D" button
  appears only for products that have it, and degrades to photos with a localized message if the
  renderer is unavailable.
- **Specs & comparison:** `specs` is a `{ label: value }` object feeding both the detail table
  and the 2–3 product comparison. `[למילוי]` / `[To be completed]` values render greyed.

---

## Deployment (GitHub Pages)

1. Push to the repo (this branch: `feature/architectural-redesign`).
2. **Settings → Pages → Source: Deploy from a branch → select the branch → `/root` → Save.**
3. The site serves at `https://ward3107.github.io/softec-vision/`. `legal/…` pages are served
   as normal static files.

> Do not merge to `main` or publish to production without explicit approval and completed legal
> review.

---

## Missing production values

These must be supplied before a production launch (see the compliance notes for detail):

- **Business address** — intentionally not supplied; counsel must confirm whether omission
  satisfies disclosure requirements.
- **GA4 Measurement ID / GTM container ID** — none configured; analytics stays off until set.
- **Real spec values** — replace `[למילוי]` / `[To be completed]` placeholders.
- **Québec French** — flagged for legal/product review (site languages are English and Hebrew).

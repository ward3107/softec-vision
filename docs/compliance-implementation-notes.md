# Compliance Implementation Notes

**Status: implementation template — NOT legal advice.**
The consent architecture, cookie banner and the legal pages under `legal/` were produced from
compliance templates and jurisdiction packs that are **not lawyer-approved**. Treat everything
here and in the legal pages as an implementation starting point that **must be reviewed by
qualified legal counsel before publication**. Every legal page also carries a visible
review-required warning.

Last reviewed by implementation: 22 September 2026.

---

## What was implemented

- **Consent Mode v2 defaults (denied) + GPC** in a `<head>` script that runs before any tag
  manager. Signals defaulted to `denied`: `analytics_storage`, `ad_storage`, `ad_user_data`,
  `ad_personalization`. Global Privacy Control (`navigator.globalPrivacyControl`) is detected and
  honored as a do-not-sell/share signal before any advertising tag could fire.
- **Bilingual cookie banner** (Hebrew/English) with **Accept all**, **Reject all** (equal
  prominence) and **Customize** (granular Analytics + Marketing toggles, both **unselected** by
  default; Necessary always on). Consent is recorded with a version + timestamp, **expires after
  12 months**, and is **withdrawable** from a footer "Cookie settings" control.
- **No analytics loads before consent, and nothing loads at all until a GA4/GTM id is
  configured.** No placeholder identifiers ship. Configuration is centralized in the `CONSENT`
  object in `index.html`.
- **Legal pages**: `legal/privacy.html`, `legal/accessibility.html`, `legal/terms.html` —
  bilingual, with a table of contents, stable anchor IDs, last-updated date, contact details and
  a review warning.
- **Accessibility widget** hardened (keyboard operable, focus trap + Escape/return, logical
  RTL/LTR positioning, blocked-storage tolerant, links to the accessibility statement) and
  explicitly described as an **aid, not a compliance substitute**.

## Jurisdiction packs applied

Israel · EU/EEA · United Kingdom · United States (federal layer) · California · Canada
(including Québec, Ontario, British Columbia, Alberta).

**Stricter-rule posture** (applied where jurisdictions conflict):

- **Opt-in before non-essential storage** is used as the default for Israel, EU/EEA, UK and
  Québec (and, conservatively, everywhere). Non-essential storage only runs after explicit
  consent.
- **UK low-risk-storage exemptions are not applied to EU visitors.** The implementation does not
  rely on such exemptions at all; the conservative global opt-in supersedes them.
- **California GPC is honored before advertising tags fire.** A global opt-in default does **not**
  remove California GPC or "Do Not Sell or Share" obligations, so GPC keeps advertising signals
  denied even on "Accept all".
- **Necessary storage only before consent** (language, accessibility settings, the consent
  record). **Reject is as easy as Accept.** **No analytics/marketing choice is pre-selected.**
  **Consent is documented and expires after 12 months.** Withdrawal remains available.

---

## Open items for legal / product review

1. **Business address is not supplied.** Counsel must determine whether omitting a physical
   business address satisfies controller-identity, consumer-notice and other applicable
   disclosure requirements in each target jurisdiction, and the address should be completed
   before publication. (Flagged in `legal/privacy.html` → "Who we are".)
2. **Québec French.** Québec (Law 25) may require French-language content. The requested site
   languages are **English and Hebrew only**, so this is flagged for legal/product review.
   (Flagged in `legal/privacy.html` → "Canada and Québec".)
3. **US scope.** Only the **federal** and **California** packs are implemented. **Do not claim
   nationwide US compliance.** Other US state privacy laws may apply and require separate review.
   (Flagged in `legal/privacy.html` → "United States and California".)
4. **Governing law / jurisdiction** in the terms is set to Israel as a starting point; confirm
   for EU/UK/US/Canada visitors. (Flagged in `legal/terms.html`.)
5. **Israeli accessibility law** (Equal Rights for Persons with Disabilities regulations, IS
   5568) — confirm the formal statement requirements. (Flagged in
   `legal/accessibility.html`.)
6. **International transfers / processors.** Confirm processor list and transfer mechanisms
   (e.g. Standard Contractual Clauses) with providers — hosting on Vercel; a possible
   form/database provider (Supabase) hosted in the EU (Germany).
7. **Templates are not lawyer-approved.** All legal copy is template output and requires review.

---

## Missing production values

| Value | Status | Needed for |
|---|---|---|
| GA4 Measurement ID (`G-…`) | **Not set** (`CONSENT.GA4_ID = null`) | Analytics (planned) |
| GTM container ID (`GTM-…`) | **Not set** (`CONSENT.GTM_ID = null`) | Tag management (planned) |
| Business address | **Not supplied** | Controller identity / disclosure |
| Real product spec values | Placeholders `[למילוי]` / `[To be completed]` | Accurate catalog |
| Québec French content | Not provided | Possible Law 25 requirement |

Analytics stays fully off (no requests) until a real GA4 or GTM id is set in the `CONSENT`
object. Google Ads: no. Meta Pixel: no. Email marketing: none. Online payments: no. User
accounts: no. User-generated content: no.

---

## Business / configuration reference (as provided)

- Legal business name: **Softec Vision Ltd**
- Website: `https://ward3107.github.io/softec-vision/`
- Privacy contact: `Alon@softec.co.il`
- Accessibility coordinator: **Waseem** — `vasyaward@gmail.com`
- Telephone: `03-6968777` · WhatsApp: `+972544742520`
- Brand primary color: `#1683C7`
- Framework: static HTML/CSS/JS · Hosting: Vercel (and GitHub Pages for this catalog)
- Possible form/database provider: Supabase (EU / Germany)
- Accessibility review date: **22 September 2026**
- Required languages: complete English and Hebrew

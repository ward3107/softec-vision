# Facts and setup needed from Softec Vision

The website publishes only facts the business has confirmed. Anything below is
**not shown** on the site until the owner supplies it. Fill in the blanks (or
reply with the values) and they will be added.

_Last updated: Stage 2 — quote requests._

## 0. Setup steps (turn on online quote requests)

The quote form is live. Until one of the steps below is done it opens WhatsApp
with the visitor's details (nothing is lost). After either step, requests are
submitted on the site, with an optional photo/PDF attachment.

**A. Email every request to visionsoftec5@gmail.com (5 minutes).**
1. Sign in to visionsoftec5@gmail.com and open https://myaccount.google.com/security
   — turn on **2-Step Verification**.
2. Open https://myaccount.google.com/apppasswords, create an app password named
   "Softec website", and copy the 16-character code.
3. In Vercel → project **softecvision** → Settings → Environment Variables, add
   `GMAIL_APP_PASSWORD` = that code (Production and Preview), then redeploy.
   Do not send the code by chat or email.

**B. Also save requests in a database (Supabase, EU region).** Needed for the
owner admin area (reviewing requests, editing products). Create a free Supabase
project named "softec-vision" in the **Frankfurt (eu-central-1)** region — in a
Softec-owned organisation, not in another company's — and either give the
developer access to it or add `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
The database migrations are ready and tested.

## 1. Product specifications

Unconfirmed values are kept in `web/src/lib/catalog/seed.ts` as placeholders and
are hidden from visitors (product pages, comparison table, product cards).
Product pages instead invite visitors to ask for dimensions and drawings.

| Code | Product | Still missing |
|---|---|---|
| LS-1000LPT | Compact Lecturer Station | dimensions (H×W×D), weight, power requirements |
| V-18W | Dual-Display Station | dimensions, weight, power |
| IX-1 | Interactive Display Station | dimensions, weight, power, touch-screen size |
| SD-2 | Mobile Lecturer Desk | dimensions, weight, power |
| CD-3 | Multi-Arm Control Desk | dimensions, weight, power |
| RAV-500 | Accessible Lecturer Station | dimensions, weight, power — see note below |
| V-5 | Compact Control Station | dimensions, weight, power |
| V-19W | Wide Dual Lecturer Station | dimensions, weight, power |
| ACCESSIBLE-TLV | Smart Accessible Podium | dimensions, weight, power |
| BIO-DOUBLE | Biology Dual Lecturer Station | dimensions, weight |
| G-1 | G-1 Lecturer Station | dimensions |
| NT-PODIUM | Non-Technology Lecturer Podium | dimensions, weight |
| L-2 | L-2 Aluminium Podium | dimensions, weight |
| IL-18 | IL-18 Podium | dimensions, weight |
| MEMORIAL-HALL | Memorial Hall Podium | dimensions, weight |
| ROTHSCHILD | Edmond de Rothschild Foundation Podium | dimensions, weight |
| PREMIUM-LECTERN | Premium Lecturer Podium | dimensions |
| SDEROT-HALL | Sderot Performing Arts Hall Podium | dimensions, weight |

For every product, these would also help international buyers (only if true):
maximum display size / display capacity, available colours and finishes,
materials, accessibility options, cable-management details, installation
requirements (floor fixing, power, network), and what can be customised.

**RAV-500 note.** Its spec previously read "Designed for accessibility
standards". Because no standard was named, the site now says "Accessible working
height", which its own description supports. The product photo also shows a
height-adjustment keypad. Please confirm:
- Is RAV-500 electrically height-adjustable (and its height range)?
- Does it meet a specific standard (for example Israeli Standard 1918)? If so,
  which one — it will be stated only with your confirmation.

## 2. Empty product families

These categories are live but have no products, so visitors see an
"available to order" message instead of models:

- **Computer Charging Carts** (English site only)
- **Computing and Service Carts**

Please supply model names, photos and confirmed specifications, or confirm the
categories should be hidden until products are ready.

## 3. Client references on product pages

MEMORIAL-HALL, ROTHSCHILD, SDEROT-HALL, ACCESSIBLE-TLV (Tel Aviv University) and
BIO-DOUBLE (Israel Institute for Biological Research) name the client in the
product name, description or photo. Please confirm each client has approved
being named publicly.

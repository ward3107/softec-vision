# Facts and setup needed from Softec Vision

The website publishes only facts the business has confirmed. Anything below is
**not shown** on the site until the owner supplies it. Fill in the blanks (or
reply with the values) and they will be added.

_Last updated: Stage 7 — trust and operational info._

## 0. Setup steps (turn on online quote requests + the owner admin area)

The quote form is live. Until step A or B below is done it opens WhatsApp with
the visitor's details (nothing is lost). The owner admin area (`/admin` — review
quote requests, edit products) needs step B and is built and tested; it shows
"not yet enabled" until then.

**A. Email every request to visionsoftec5@gmail.com (5 minutes).**
1. Sign in to visionsoftec5@gmail.com and open https://myaccount.google.com/security
   — turn on **2-Step Verification**.
2. Open https://myaccount.google.com/apppasswords, create an app password named
   "Softec website", and copy the 16-character code.
3. In Vercel → project **softecvision** → Settings → Environment Variables, add
   `GMAIL_APP_PASSWORD` = that code (Production and Preview), then redeploy.
   Do not send the code by chat or email.

**B. Also save requests in a database, and turn on the owner admin area
(Supabase, EU region).**
1. Create a free Supabase project named "softec-vision" in the **Frankfurt
   (eu-central-1)** region, in a Softec-owned organisation (not another
   company's).
2. Apply the database migrations: in the Supabase dashboard's **SQL Editor**,
   run each file in `web/supabase/migrations/` in order (0001 through 0005),
   or give the developer access to run them for you.
3. In Vercel → project **softecvision** → Settings → Environment Variables, add
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` (from the Supabase project's API settings),
   then redeploy. Never share the service-role key outside Vercel's
   environment variables — it bypasses all access rules.
4. Create your own sign-in: Supabase dashboard → **Authentication → Users →
   Add user**, with your email and a password. Then, still in the dashboard,
   open **SQL Editor** and run (with your own email):
   ```sql
   insert into public.profiles (id, role, full_name)
   select id, 'admin', 'Your Name' from auth.users where email = 'you@example.com';
   ```
   Repeat with `'editor'` instead of `'admin'` for any other staff member who
   should review quote requests and edit products but not permanently erase
   data. Only accounts with a row here can sign in at `/admin` — there is no
   public sign-up (email sign-ups are switched off in the dashboard's
   **Authentication → Sign In / Providers** settings; please confirm this is
   off after creating the project).
5. Sign in at `/admin`, open **מוצרים** (Products), and click **ייבוא הקטלוג**
   (Import catalog) once. This copies the current 18 products into the
   database so they can be edited going forward; it is safe even if run more
   than once (it never overwrites a product that is already there).

## 1. Product specifications

Unconfirmed values are kept in `web/src/lib/catalog/seed.ts` as placeholders and
are hidden from visitors (product pages, comparison table, product cards).
Product pages instead invite visitors to ask for dimensions and drawings.

Once the database is set up (§0.B) and the catalog imported, every value below
can be filled in directly at `/admin/products` — sign in, open a product, and
fill in both the Hebrew and English side of a spec (an empty field is skipped
on the site; a value entered in only one language is rejected, so the two
stay in sync). No further request to the developer is needed for these.

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

## 4. Trust and operational info

What's already confirmed and live: legal name (Softec Vision Ltd), contact
(phone 03-6968777, email Alon@softec.co.il, WhatsApp), and delivery/
installation scope (manufactured and tested in Israel; installed on site by
our team within Israel; shipped ready to install for projects further
afield — added to the Process page). Every product page already has a clear
WhatsApp and quote-request path.

Still missing — nothing is published until confirmed:

- **A physical business address.** The privacy policy currently states this
  is not yet supplied (a legal-review note flags it may be required for
  controller-identity / consumer-notice disclosure in some jurisdictions).
- **A warranty policy**, if any (e.g. "1 year on materials and workmanship") —
  the site makes no warranty claim today.
- **How quickly you typically respond** to a quote request (e.g. "within 1
  business day") — the site makes no response-time claim today.

## 5. Legal and accessibility statement — professional review flags

Two more items in `web/src/lib/legal/content.json` are flagged as implementation
notes for a lawyer, not something to answer here directly:
- Whether Israeli Standard 5568 (accessibility) or any other formal
  accessibility certification is claimed — the site currently only says it
  implements *against* WCAG 2.2 AA, making no certification claim.
- Which jurisdiction's law and courts govern the Terms of Use, given visitors
  from the EU, UK, US and Canada.

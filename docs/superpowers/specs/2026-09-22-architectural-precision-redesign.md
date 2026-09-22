# Softec Vision Architectural Precision Redesign

## Objective

Transform the existing single-page Softec Vision catalog into a premium bilingual product experience that feels like an architectural manufacturer rather than a generic online store. The redesign must improve visual authority, product discovery, language support, accessibility, and inquiry conversion while retaining the static, dependency-free deployment model.

## Audience and Primary Job

The primary audience is architects, AV consultants, educational institutions, control-room planners, procurement teams, and organizations commissioning custom furniture. The site’s primary job is to help visitors understand Softec Vision’s capabilities, find the right product family, inspect relevant models, and request a quote or consultation.

## Design Direction: Architectural Precision

The visual language combines the precision of technical furniture manufacturing with the restraint of an architectural portfolio.

### Color system

- **Paper White — `#F7F8F8`:** primary page surface.
- **Pure White — `#FFFFFF`:** product imagery and elevated content surfaces.
- **Graphite — `#151719`:** primary text, navigation, and high-contrast sections.
- **Machine Grey — `#697077`:** supporting copy and technical metadata.
- **Softec Blue — `#1683C7`:** focused brand accent for actions and active states.
- **Blueprint Blue — `#0C5E91`:** deep accent for hover, focus, and selected states.

### Typography

- Use a purposeful Hebrew/Latin sans-serif family with excellent bilingual metrics, loaded with resilient system fallbacks.
- Headlines use a compact, architectural scale with strong weight and tight but readable spacing.
- Body copy remains calm and highly legible, with lines kept below roughly 75 characters.
- Product codes and specifications use the same family rather than introducing decorative monospace styling.

### Layout

- Desktop content follows a disciplined twelve-column grid with selective asymmetry.
- The hero pairs large editorial copy with an oversized isolated product image; the product is the memorable visual element.
- Product-family navigation is presented as a clear spatial index rather than a row of generic pills.
- Product cards prioritize photography, model name, and next action, using varied hierarchy without decorative card clutter.
- Mobile collapses to a single reading flow with persistent access to language selection and inquiries.
- Hebrew is right-aligned and RTL; English is left-aligned and LTR. Components mirror naturally rather than relying on manual exceptions.

### Interaction principles

- Motion is concentrated in one composed opening sequence and meaningful state changes.
- Product filtering, gallery navigation, comparison, language switching, and inquiry actions provide immediate feedback.
- All interactions work by keyboard and respect `prefers-reduced-motion`.
- Focus states are clearly visible in Softec Blue with sufficient contrast.

## Information Architecture

The catalog taxonomy is:

1. **Lecturer Stations — Podiums**
   - Non-Technology Lecturer Stations
   - Smart Lecturer Stations
   - Dual Lecturer Stations
   - Lecturer Stations with Audience-Facing Display
   - Accessible Lecturer Stations
   - Lecturer Desks
2. **Information and Display Stations**
3. **Control and Command Desks**
   - Control Desks
   - Operator Stations
4. **Computer Charging Carts**
5. **Computing and Service Carts**
6. **Custom Solution Design and Manufacturing**

Each taxonomy node has stable internal keys and separate Hebrew and English labels. Product records reference those keys, so changing display copy does not break filtering.

## Bilingual System

The page supports Hebrew and English without adding a framework or build step.

- A single translation dictionary stores interface copy in both languages.
- Product and category data contain bilingual names and descriptions.
- A language control is always accessible in the main navigation and mobile menu.
- The chosen language is saved locally and restored on the next visit.
- The first visit defaults to Hebrew unless an explicit URL language value or saved preference exists.
- Switching language updates `lang`, `dir`, metadata, navigation, headings, controls, empty states, modal content, comparison UI, and inquiry text.
- Layout logic uses CSS logical properties so RTL and LTR share the same component rules.
- Missing translations fall back safely to Hebrew and never render blank UI.

## Charging Carts Visibility and SEO

“Computer Charging Carts” is visible as a category only in the English experience. It is omitted from Hebrew navigation, Hebrew filters, and visible Hebrew catalog content.

To keep the topic discoverable by search engines:

- Static semantic copy for the charging-cart offering remains in the initial HTML in both English and Hebrew.
- The Hebrew version is visually hidden with an accessible off-screen utility rather than removed with `display: none`.
- English category content remains directly reachable with a language-aware URL state.
- Metadata and structured catalog text describe the category accurately without keyword stuffing or misleading users.

This provides crawlable content but does not guarantee ranking; indexing remains controlled by search engines.

## Page Structure

### Navigation

A restrained sticky header contains the Softec logo, key section links, language control, and “Request a quote.” On mobile it becomes a compact menu with the same destinations and no loss of functionality.

### Hero

The hero presents a concise manufacturing proposition, one primary action, one secondary catalog action, and a large product image. Supporting proof is limited to concrete capabilities such as custom manufacturing, accessibility, or integrated AV—not generic marketing statistics.

### Product-family index

The family index acts as the main catalog map. Each entry communicates its scope and available subcategories. Active selection is unmistakable and updates the product view without page reload.

### Product catalog

The catalog combines category and subcategory context, responsive product cards, comparison selection, and a purposeful empty state that routes users toward a custom solution inquiry.

### Product detail

The existing lightbox evolves into an accessible product-detail dialog with imagery, optional gallery and 3D model, bilingual description, specifications, comparison action, and WhatsApp/quote inquiry. Focus is trapped while open and returned to the invoking card when closed.

### Custom solutions

Custom manufacturing receives a distinct editorial section showing the progression from requirements through engineering and production. It ends with a consultation action and uses real process language rather than abstract promotional copy.

### About, process, and contact

Supporting sections are shortened and reordered around buyer questions: what Softec builds, how a project progresses, and how to start. Contact options remain explicit and usable on mobile.

## Data and Component Boundaries

The site remains a static `index.html`, but internal code is organized into clear sections:

- `translations`: all bilingual interface strings and metadata.
- `categories`: bilingual taxonomy and language visibility rules.
- `products`: bilingual product content and technical data.
- `language controller`: language selection, persistence, direction, metadata, and rerender orchestration.
- `catalog renderer`: category index, subcategory selection, product grid, and empty states.
- `product dialog`: gallery, specifications, 3D state, inquiry links, and focus management.
- `comparison controller`: selection limits, comparison drawer, and table rendering.
- `presentation layer`: tokens, layout, responsive rules, accessibility, and intentional motion.

Each controller receives data and current language explicitly. Language filtering occurs before catalog rendering, so English-only categories cannot leak into visible Hebrew UI.

## Failure and Edge States

- Products with missing optional images use the primary image without broken thumbnails.
- Products without specifications, extra gallery images, or 3D models omit those controls cleanly.
- Empty categories present a translated custom-inquiry path.
- Invalid category, subcategory, or language URL state falls back to a valid catalog state.
- Local-storage failures do not block switching language for the current session.
- External inquiry links are encoded safely and open with predictable behavior.

## Accessibility and Performance

- Semantic landmarks, heading order, labels, dialog roles, and live announcements support assistive technology.
- Contrast meets WCAG AA for normal text and controls.
- Touch targets are at least 44 pixels where practical.
- Keyboard users can operate menus, filters, comparison, galleries, and dialogs.
- Product images include useful localized alternative text and lazy-load below the fold.
- Existing embedded media are preserved, but rendering work and animation are reduced on narrow devices and when reduced motion is requested.
- The splash screen never prevents access and is removed from the critical interaction path.

## Verification

Implementation is complete when the following checks pass:

1. Hebrew renders RTL and English renders LTR across desktop and mobile.
2. Every navigation label, category, subcategory, control, state, and inquiry message switches language.
3. Computer Charging Carts is visible and navigable in English, absent from visible Hebrew catalog UI, and present as semantic crawlable HTML.
4. Category and subcategory filtering returns the correct products and handles empty results.
5. Product detail, galleries, comparison, 3D affordances, and inquiry actions work with mouse, touch, and keyboard.
6. Focus order, visible focus, dialog focus management, reduced motion, and contrast receive a manual accessibility check.
7. No console errors occur during initial load, language switching, filtering, comparison, or dialog use.
8. The page remains usable at common mobile, tablet, laptop, and wide-desktop widths.
9. The static site runs directly from GitHub Pages without dependencies or a build step.

## Out of Scope

- A CMS, backend, account system, online checkout, or database.
- Automated translation.
- New product photography or 3D scanning.
- Guaranteed search ranking or indexing time.
- Replatforming away from the existing static GitHub Pages deployment.

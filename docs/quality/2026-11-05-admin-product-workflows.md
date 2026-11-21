# Product administration review — 5 November 2026

Base: `932b8b1460a578fecf221f67acc13ae9d801a22f` (main after PR #96).
This change is for review. No production application deployment or database migration was performed.

## What changes

- **New product:** `/admin/products/new` collects a permanent code, parent category, optional matching subcategory, Hebrew/English names, descriptions, alt text and specifications. Creation is one database transaction and always creates a draft, including forged submissions asking to publish.
- **Media:** after draft creation, the editor accepts primary/gallery images, MP4/WebM videos and GLB files through the existing signed-upload flow. A new form accepts direct HTTPS image/video URLs. It validates file types and URL syntax without fetching arbitrary URLs on the server. External images load in the browser; owned images retain Next.js optimization.
- **Explicit publication:** a new product needs Hebrew and English names/descriptions, a primary image and published, correctly related categories. Uploading media never publishes the draft. Database RLS and deferred constraints protect public reads as well as normal admin saves. Existing products and trusted built-in imports keep their existing built-in-image eligibility.
- **Languages:** the admin shell, dashboard, product list/editor/create/media/delete workflow and subcategory screens have Hebrew/English labels and a persistent language preference. Translation fields keep their own RTL/LTR direction. Parent changes clear stale subcategory selections; rejected saves echo submitted values.
- **Retention:** detaching/replacing product media and deleting a product never call Storage deletion. Database triggers record detached owned files in `retained_product_files`. External URLs are excluded. Existing inquiry history remains after product deletion.
- **GLB validation:** checks the full declared length, aligned JSON/BIN chunks, version and self-contained resources. A valid triangle fixture exercises finalization; header-only/truncated files are rejected.

Direct links must end in JPG/JPEG/PNG/WebP or MP4/WebM (query strings are allowed). YouTube/Vimeo page embeds and externally linked 3D models are not implemented. Link reachability and remote content are not guaranteed by URL validation; the owner must check the media preview before publishing.

## Automated evidence

Run from `web/`:

```sh
npm test
npm run typecheck
npm run lint
npm run test:db
npm run build
```

The unit/component suite contains 250 tests across 27 files. New coverage includes bilingual form labels/directions, category changes, rejected-save value retention, draft-only creation, duplicate codes, unsafe URLs, upload validation, GLB finalization and no Storage removal on success/failure.

`test:db` runs the repository migrations, seed and three SQL suites in PGlite PostgreSQL using the existing Supabase auth/storage schema shim. It covers draft visibility, successful publication, incomplete publication rejection, staff/admin boundaries, atomic creation, external-link idempotency, product deletion, inquiry preservation and retained-file records. This exercises SQL/RLS, not the hosted Supabase HTTP or Storage service. It now runs in CI alongside the existing checks.

The separate static-site/data-contract command passes 52 tests:

```sh
node --test tests/catalog.test.cjs tests/static-page.test.cjs tests/legal-pages.test.cjs tests/web-brand-logo.test.cjs tests/web-catalog-media.test.cjs tests/web-home-hero.test.cjs tests/web-seo-blog.test.cjs
```

## Live observations and outstanding verification

- Inspected the authenticated production product list and editor. Read-only production checks found 18 published products, all satisfying the new text/category requirements.
- Created one clearly named, hidden **draft**, `QA-GLB-20261105`, for the attempted GLB upload. Its model remains null, no Storage object exists under its prefix, and the published product count remains 18. The draft is retained for the owner; no existing products/files were deleted.
- A disposable local preview rendered the Hebrew creation screen. Preview JavaScript interaction did not complete reliably, so this is not an end-to-end pass. Test-only preview auth and service fixtures are outside the repository and are not included in the change.
- The real browser file chooser/upload operation timed out. **A hosted GLB upload and interactive 3D rendering have not been verified.** Automated GLB tests use a mocked Storage transport.
- **Full interactive Hebrew/English browser QA remains incomplete**, including create → upload → publish → public catalog, narrow-screen layout and error/retry paths. Component tests do not replace that check.
- Login, inquiries, password and website-content screens are outside the localization work in this change; this is not a claim that the entire admin is fully translated.

## Release checklist — do not merge/deploy yet

1. Review the code and migration `20261105025554_admin_product_creation.sql`.
2. Apply the migration in an isolated Supabase staging project and deploy this branch against that project. A preview using the unmigrated production database will not support the new RPCs. Do not point QA mutation tests at production.
3. In both UI languages, create a draft, change parent/subcategory, enter different Hebrew/English values, save/reload and confirm every value. Confirm the draft is absent from anonymous catalog reads.
4. Upload primary/gallery images, MP4/WebM and `web/test/fixtures/triangle.glb`; verify actual object MIME/size, saved media records, browser previews and the interactive 3D viewer. Exercise invalid, oversized, interrupted and retry uploads.
5. Test external primary/gallery/video links, invalid URLs and repeated submission. Confirm new products cannot publish without the required fields/image/categories and appear publicly after explicit publication.
6. On staging fixtures only, replace/remove media and delete a product. Compare Storage objects before/after: all files must remain; the retained-file manifest must contain their detached paths; inquiry history must remain.
7. Obtain the owner's approval before production release. Coordinate the migration and application release with admin edits paused, then verify the public catalog and cache refresh. No automatic migration/deployment or cleanup job is added here.

The migration adds a column/table/functions and changes publication policies/triggers. Reverting only the UI does not undo those rules. If a rollback is needed, review a forward SQL repair against current data rather than dropping data or running unreviewed reverse migrations.

## Reviewing retained files without deleting them

Staff can inspect the manifest:

```sql
select product_code, bucket_id, storage_path, reason, retained_at
from public.retained_product_files
order by retained_at desc;
```

This is a retention record, not deletion approval. Before any later cleanup, re-check all current media/model references, inventory uncommitted/failed uploads separately, and obtain explicit approval for the exact object list. This change does not scan or delete pre-existing orphan files.

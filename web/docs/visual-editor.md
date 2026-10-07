# Visual Content Editor

`/admin/content` edits the eight home-page sections, independently in Hebrew and English.
The preview at `/admin/content/preview?locale=he|en` uses the actual home-page renderer,
behind `requireStaff()`. It is the only route that permits same-origin framing. Public pages
and the rest of the admin retain `frame-ancestors 'none'` and `X-Frame-Options: DENY`.

## Publish Contract

`publishContent(FormData)` is a staff-only server action using the user's Supabase client
and existing RLS, never a service-role client.

- `document`: JSON object containing every `CONTENT_BLOCKS` key, with `he` and `en` maps.
- `baseline`: same shape, containing the editor's last published snapshot.
- Values are plain strings. Text is limited to 600 characters; image URLs to 2048.
- Only declared fields, `_hidden`, and `_hide.<declared field>` are accepted.
- Empty text overrides use shipped defaults. Explicit visibility flags remove content.
- Image URLs are restricted to local product assets or this project's public media bucket.
- Optional `image.he` / `image.en`: JPEG, PNG or WebP, verified by bytes, at most 3MB combined per publication. The action request limit is 4MB, leaving room for the bilingual document and multipart overhead.
- Returns `{ok: true, document}` after a single translations upsert, or `{ok: false, error}`.
- Existing edits are compared to the baseline before writes. This catches a stale tab but
  is not a database compare-and-swap lock against simultaneous requests.

Changes and uploaded file selections stay in the current editor tab until explicit publication.
Undo/redo holds up to 60 states. Leaving with unpublished changes prompts the owner.
Removing a field, image, or section hides it without deleting its original. Restoring a field
returns shipped content; restoring visibility keeps its saved override. Removing a question also
hides its answer and excludes it from FAQ structured data. Publishing expires the content cache.

Product text, primary photos, gallery and models remain in `/admin/products`; the editor links
there. This release does not claim editing support for about/contact pages, navigation or footer.

## Validation

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` from `web`.
Test the editor in desktop/mobile viewports: selection, text changes, locale switch, removal,
restoration, undo/redo, image selection, preview, cancel and publish errors. A real publication
requires a staff session and should use a reversible content change, not production deletions.

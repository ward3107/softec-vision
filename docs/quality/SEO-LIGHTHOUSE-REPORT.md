# SEO, AEO, GEO and Lighthouse verification

Verified on 2026-10-04 against the local Next.js production server for `/he/blog`.

## Lighthouse results

| Profile | Performance | Accessibility | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Mobile | 92 | 100 | 100 | 92* |
| Desktop | 98 | 100 | 100 | 92* |

Core metrics:

- Mobile: LCP 3.2 s, CLS 0, TBT 10 ms.
- Desktop: LCP 0.6 s, CLS 0.011, TBT 0 ms.

`*` The local SEO audit runs at `http://127.0.0.1:8767`, while canonical and hreflang URLs intentionally point to `https://www.softec.co.il`. Lighthouse therefore marks the production canonical as a different host. The generated HTML contains a self-referencing production canonical plus Hebrew, English and `x-default` alternates.

## Implemented coverage

- Bilingual blog index and three full Hebrew/English research-backed articles.
- Unique titles, descriptions, canonical URLs and hreflang alternates.
- `BlogPosting` and `BreadcrumbList` JSON-LD with author, publisher and freshness dates.
- Sitemap entries for the blog index and every localized article.
- Exactly one H1 on blog pages, sequential H2 sections and question-led answer blocks.
- Automated source scan requiring an `alt` attribute on every rendered `Image` or `img` element.
- Native responsive images with explicit dimensions; unnecessary high-quality overrides removed.
- Standards-compliant smooth scrolling with a reduced-motion fallback.
- Desktop and 390 × 844 mobile visual verification in Hebrew RTL.

## Validation commands

```text
npm run typecheck
npm run lint
npm run test
npm run build
node --test tests/web-seo-blog.test.cjs
```

The three root Playwright suites require a separately provisioned `playwright` package and browser; CI intentionally excludes them. Browser behavior for this change was verified with the Codex in-app browser against the production build.


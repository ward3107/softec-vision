const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('blog is bilingual, research-backed and statically generated', () => {
  const posts = read('web', 'src', 'lib', 'blog', 'posts.ts');
  const index = read('web', 'src', 'app', '[locale]', 'blog', 'page.tsx');
  const article = read('web', 'src', 'app', '[locale]', 'blog', '[slug]', 'page.tsx');

  assert.equal((posts.match(/slug: '/g) || []).length, 3);
  assert.match(posts, /content: \{\s*en:/);
  assert.match(posts, /\n\s*he: \{/);
  assert.match(posts, /pubmed\.ncbi\.nlm\.nih\.gov/);
  assert.match(posts, /pnas\.org\/doi/);
  assert.match(posts, /iso\.org/);
  assert.match(index, /<h1/);
  assert.match(article, /articleSchema/);
  assert.match(article, /breadcrumbSchema/);
  assert.match(article, /<h1/);
  assert.match(article, /<h2/);
});

test('sitemap publishes blog routes with multilingual alternates', () => {
  const sitemap = read('web', 'src', 'app', 'sitemap.ts');
  assert.match(sitemap, /BLOG_POSTS/);
  assert.match(sitemap, /\/blog\/\$\{post\.slug\}/);
  assert.match(sitemap, /'x-default'/);
});

test('every rendered image declares alt text, including decorative images', () => {
  const src = path.join(root, 'web', 'src');
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx')) files.push(full);
    }
  };
  walk(src);

  const missing = [];
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const tags = code.match(/<(?:Image|img)\b[\s\S]*?>/g) || [];
    for (const tag of tags) {
      if (!/\balt\s*=/.test(tag)) missing.push(`${path.relative(root, file)}: ${tag.slice(0, 80)}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('global SEO includes entity authorship and standards-compliant smooth scrolling', () => {
  const layout = read('web', 'src', 'app', '[locale]', 'layout.tsx');
  const schema = read('web', 'src', 'components', 'JsonLd.tsx');
  const css = read('web', 'src', 'app', 'globals.css');
  assert.match(layout, /authors:/);
  assert.match(layout, /publisher: 'Softec Vision Ltd'/);
  assert.match(schema, /'@type': 'BlogPosting'/);
  assert.match(css, /scroll-behavior: smooth/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});


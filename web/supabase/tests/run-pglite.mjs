/** Real PostgreSQL (PGlite) with a Supabase auth/storage schema shim, no network services. */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const db = new PGlite();
try {
  const files = ['tests/supabase-shim.sql', ...(await fs.readdir(new URL('migrations/',root))).filter(f=>f.endsWith('.sql')).sort().map(f=>`migrations/${f}`), 'seed.sql', 'tests/rls.test.sql','tests/catalog-admin.test.sql','tests/product-creation.test.sql'];
  for (const file of files) {
    const sql=(await fs.readFile(new URL(file,root),'utf8')).replace(/\\g \/dev\/null/g,';').replace(/^\\.*$/gm,'');
    await db.exec(sql);
    console.log(`PASS ${file}`);
  }
} catch (error) { console.error('FAIL:', error.message, error.where ?? ''); process.exitCode=1; } finally { await db.close(); }

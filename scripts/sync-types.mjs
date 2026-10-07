#!/usr/bin/env node
// Copies the canonical Supabase types into each app.
// Usage: node scripts/sync-types.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = resolve(root, 'supabase/types/database.types.ts');
const targets = [
  resolve(root, 'admin/src/lib/database.types.ts'),
  resolve(root, 'mobile/src/types/database.types.ts'),
];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(canonical, target);
  console.log(`synced -> ${target.slice(root.length + 1)}`);
}

#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const write = (p, obj) => writeFileSync(join(root, p), JSON.stringify(obj, null, 2) + '\n');

const { version } = read('package.json');

const plugin = read('.claude-plugin/plugin.json');
plugin.version = version;
write('.claude-plugin/plugin.json', plugin);

for (const p of ['marketplace.json', '.claude-plugin/marketplace.json']) {
  const mk = read(p);
  const entry = mk.plugins.find((x) => x.name === 'faostat-skills');
  if (!entry) throw new Error(`faostat-skills entry not found in ${p}`);
  entry.source.version = version;
  write(p, mk);
}

console.log(`Synced plugin.json and marketplace files to v${version}`);

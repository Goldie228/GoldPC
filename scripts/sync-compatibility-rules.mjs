#!/usr/bin/env node
/**
 * Sync compatibility rules from backend to frontend
 * Run: node scripts/sync-compatibility-rules.mjs
 *
 * BUG-21 fix: Ensures backend compatibility rules JSON is copied to the
 * frontend at build time so they stay perfectly in sync.
 * Also removes duplicates from source arrays (e.g. duplicate TR4 group).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const srcPath = join(rootDir, 'src/PCBuilderService/Data/compatibility-rules.json');
const dstPath = join(rootDir, 'src/frontend/src/config/compatibilityRules.json');

if (!existsSync(srcPath)) {
  console.error(`Source file not found: ${srcPath}`);
  process.exit(1);
}

if (!existsSync(dstPath)) {
  console.error(`Destination file not found: ${dstPath}`);
  process.exit(1);
}

const source = readFileSync(srcPath, 'utf-8');
const sourceJson = JSON.parse(source);

const frontend = readFileSync(dstPath, 'utf-8');
let frontendJson = {};
try {
  frontendJson = JSON.parse(frontend);
} catch {
  // If frontend JSON is malformed, start fresh
}

// Replace the core rules while preserving any frontend-only structure
const updated = {
  ...frontendJson,
  socketCompatibility: sourceJson.socketCompatibility,
  formFactorCompatibility: sourceJson.formFactorCompatibility,
  ramCompatibility: sourceJson.ramCompatibility,
  powerCompatibility: sourceJson.powerCompatibility,
  dimensionCompatibility: sourceJson.dimensionCompatibility,
  coolerCompatibility: sourceJson.coolerCompatibility,
  bottleneckDetection: sourceJson.bottleneckDetection,
  biosCompatibility: sourceJson.biosCompatibility,
};

// Remove duplicates if present in source arrays (e.g., duplicate tr4 group)
if (updated.socketCompatibility?.groups) {
  const seen = new Set();
  updated.socketCompatibility.groups = updated.socketCompatibility.groups.filter(g => {
    if (!g.id) return true;
    const key = g.id.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

writeFileSync(dstPath, JSON.stringify(updated, null, 2) + '\n');
console.log('compatibility-rules.json synced to frontend (no duplicates)');

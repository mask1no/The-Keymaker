#!/usr/bin/env node
// Quick placeholder scan for CI
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const REQUIRED = ['HELIUS_RPC_URL', 'NEXT_PUBLIC_API_BASE'];

function fail(msg) {
  console.error(`[placeholders] ${msg}`);
  process.exit(1);
}

try {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
  if (!pkg) fail('package.json not found');
} catch {
  fail('package.json not readable');
}

for (const key of REQUIRED) {
  const val = process.env[key] || '';
  if (!val || val.includes('change_me') || val.length < 8) {
    console.warn(`[placeholders] ${key} looks like a placeholder`);
  }
}

// Patterns to detect (ONLY actual placeholders, not spread operators)
const PLACEHOLDER_PATTERNS = [
  // literal ellipsis-only line
  /^[\s]*\.{3,}[\s]*$/gm,
  // comment lines containing ellipses
  /^\s*\/\/.*\.{3,}.*$/gm,
  /^\s*\/\*.*\.{3,}.*$/gm,
  // TODO/FIXME with ellipses
  /\bTODO[\s]*\.{3,}/g,
  /\bFIXME[\s]*\.{3,}/g,
  // Explicit UNIMPLEMENTED tokens
  /\bUNIMPLEMENTED\b/g,
];

const SKIP_DIRS = ['node_modules', '.next', '.git', 'dist', 'coverage', 'build', '.vercel', 'test-results'];
const SKIP_FILES = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.pdf'];
const ALLOWED_FILES = ['check_placeholders.mjs', 'check_ellipses.cjs', 'README.md', 'CHANGELOG.md', '.env.example', 'CONTRIBUTING.md', 'utils/rpcLimiter.ts'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function shouldSkip(path, isDirectory) {
  const basename = path.split(/[\\/]/).pop();
  if (isDirectory) return SKIP_DIRS.includes(basename);
  if (SKIP_FILES.some((ext) => basename.endsWith(ext))) return true;
  // Allow per-file exceptions based on relative path
  const rel = relative(rootDir, path).replace(/\\/g, '/');
  if (ALLOWED_FILES.includes(basename) || ALLOWED_FILES.includes(rel)) return true;
  return false;
}

const violations = [];

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    PLACEHOLDER_PATTERNS.forEach((pattern, idx) => {
      const matches = content.match(pattern);
      if (matches) {
        const lines = content.split('\n');
        lines.forEach((line, lineNum) => {
          if (pattern.test(line)) {
            violations.push({ file: relative(rootDir, filePath), line: lineNum + 1, pattern: idx === 0 ? '...' : '…', snippet: line.trim().substring(0, 80) });
          }
        });
      }
    });
  } catch {}
}

function scanDirectory(dir) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!shouldSkip(fullPath, true)) scanDirectory(fullPath);
      } else if (stat.isFile()) {
        if (!shouldSkip(fullPath, false)) scanFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err.message);
  }
}

console.log('🔍 Scanning for placeholders (... or …)...\n');
scanDirectory(rootDir);

if (violations.length > 0) {
  console.error(`❌ Found ${violations.length} placeholder violation(s):\n`);
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Pattern: "${v.pattern}"`);
    console.error(`    Snippet: ${v.snippet}`);
    console.error('');
  });
  console.error('💡 Remove all placeholder patterns before committing to production.\n');
  process.exit(1);
}

console.log('[placeholders] scan complete');

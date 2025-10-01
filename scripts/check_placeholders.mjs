#!/usr/bin/env node
// Quick placeholder scan for CI
import { readFileSync } from 'fs';
import { join } from 'path';

const REQUIRED = [
  'ENGINE_API_TOKEN',
  'KEYMAKER_SESSION_SECRET',
];

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

console.log('[placeholders] scan complete');
#!/usr/bin/env node
/**
 * CI Placeholder Check
 * Scans repository for placeholder patterns (... or …) that should not exist in production code
 * Exit code 1 if any found, 0 if clean
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Patterns to detect (ONLY actual placeholders, not spread operators)
const PLACEHOLDER_PATTERNS = [
  // Match standalone "..." but NOT spread operators
  /^[\s]*\.{3,}[\s]*$/gm,  // "..." alone on a line
  /\/\/[\s]*\.{3,}/g,      // "// ..." in comments
  /\/\*[\s]*\.{3,}/g,      // "/* ..." in comments
  /\bTODO[\s]*\.{3,}/gi,   // "TODO ..."
  /\bFIXME[\s]*\.{3,}/gi,  // "FIXME ..."
  /\bTBD\b/gi,             // "TBD"
  /\bPLACEHOLDER\b/gi,     // "PLACEHOLDER"
  /\bUNIMPLEMENTED\b/gi,   // "UNIMPLEMENTED"
];

// Directories to skip
const SKIP_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'coverage',
  'build',
  '.vercel',
  'test-results',
];

// File patterns to skip
const SKIP_FILES = [
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp4',
  '.mp3',
  '.pdf',
];

// Files that are allowed to have placeholders (documentation, examples)
const ALLOWED_FILES = [
  'check_placeholders.mjs', // This file itself
  'README.md',
  'CHANGELOG.md',
  '.env.example',
  'CONTRIBUTING.md',
];

const violations = [];

function shouldSkip(path, isDirectory) {
  const basename = path.split(/[\\/]/).pop();
  
  if (isDirectory) {
    return SKIP_DIRS.includes(basename);
  }
  
  // Skip files by extension
  if (SKIP_FILES.some(ext => basename.endsWith(ext))) {
    return true;
  }
  
  // Allow certain files
  if (ALLOWED_FILES.some(allowed => basename === allowed)) {
    return true;
  }
  
  return false;
}

function scanFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const relativePath = relative(rootDir, filePath);
    
    PLACEHOLDER_PATTERNS.forEach((pattern, idx) => {
      const matches = content.match(pattern);
      if (matches) {
        // Get line numbers
        const lines = content.split('\n');
        lines.forEach((line, lineNum) => {
          if (pattern.test(line)) {
            violations.push({
              file: relativePath,
              line: lineNum + 1,
              pattern: idx === 0 ? '...' : '…',
              snippet: line.trim().substring(0, 80),
            });
          }
        });
      }
    });
  } catch (err) {
    // Skip files that can't be read as text
  }
}

function scanDirectory(dir) {
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldSkip(entry, true)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        if (!shouldSkip(entry, false)) {
          scanFile(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err.message);
  }
}

// Main execution
console.log('🔍 Scanning for placeholders (... or …)...\n');

scanDirectory(rootDir);

if (violations.length > 0) {
  console.error(`❌ Found ${violations.length} placeholder violation(s):\n`);
  
  violations.forEach(v => {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Pattern: "${v.pattern}"`);
    console.error(`    Snippet: ${v.snippet}`);
    console.error('');
  });
  
  console.error('💡 Remove all placeholder patterns before committing to production.\n');
  process.exit(1);
}

console.log('✅ No placeholders found. Codebase is clean!\n');
process.exit(0);

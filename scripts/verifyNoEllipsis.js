#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Patterns to exclude (valid JavaScript/TypeScript syntax)
const VALID_PATTERNS = [
  /\.\.\./g, // spread operator
  /\.\.\..* filter/g, // spread with filter
  /\.\.\..* map/g, // spread with map
  /https?:\/\/[^\s]*\.\.\./g, // URLs with ellipses
  /\/\.\.\//g, // path navigation
];

function isPlaceholderEllipsis(line, filePath) {
  // Skip if line contains valid JavaScript patterns
  for (const pattern of VALID_PATTERNS) {
    if (pattern.test(line)) {
      return false;
    }
  }

  // Look for standalone ellipses or ellipses in comments/TODOs
  const placeholderPatterns = [
    /\s\.\.\.\s/g, // standalone ellipses
    /\/\/.*\.\.\./g, // ellipses in comments
    /\/\*\s*\.\.\.\s*\*\//g, // ellipses in block comments
    /TODO.*\.\.\./g, // ellipses in TODOs
    /FIXME.*\.\.\./g, // ellipses in FIXMEs
    /placeholder.*\.\.\./gi, // placeholder text
    /\.\.\..* implement/gi, // implementation ellipses
  ];

  return placeholderPatterns.some((pattern) => pattern.test(line));
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isPlaceholderEllipsis(line, filePath)) {
        return {
          file: filePath,
          line: i + 1,
          content: line.trim(),
        };
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
  }

  return null;
}

function walkDirectory(dir, results = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip common directories
      if (['node_modules', '.next', '.git', 'dist', 'build', 'coverage', 'test-results'].includes(item)) {
        continue;
      }
      walkDirectory(fullPath, results);
    } else if (stat.isFile()) {
      // Check file extensions
      const ext = path.extname(item);
      if (['.ts', '.tsx', '.js', '.jsx', '.md', '.yml', '.yaml'].includes(ext)) {
        const result = checkFile(fullPath);
        if (result) {
          results.push(result);
        }
      }
    }
  }

  return results;
}

function main() {
  console.log('🔍 Scanning for placeholder ellipses...\n');

  const results = walkDirectory(process.cwd());

  if (results.length === 0) {
    console.log('✅ No placeholder ellipses found!');
    process.exit(0);
  }

  console.error('❌ Placeholder ellipses found:');
  console.error('================================');
  for (const result of results) {
    console.error(`${result.file}:${result.line}`);
    console.error(`  ${result.content}`);
    console.error('');
  }

  console.error(`Found ${results.length} files with placeholder ellipses`);
  process.exit(1);
}

main();
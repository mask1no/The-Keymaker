#!/usr/bin/env node
// Cross-platform pre-commit guard: blocks env/keypairs/secret patterns
const { execSync } = require('child_process');

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return out ? out.split(/\r?\n/) : [];
  } catch {
    return [];
  }
}

const files = getStagedFiles();
const skipNames = new Set(['.gitignore', 'md/README.md']);
let blocked = null;

for (const f of files) {
  if (!f || f.startsWith('.husky/')) continue;
  if (skipNames.has(f)) continue;
  if (f === '.env.example') {
    // allow example env
  } else if (/^(?:.|.*\/)\.env(?:$|\.|\/)/.test(f)) {
    blocked = `Blocked: committing env-like file ${f}`;
    break;
  }
  if (/^keypairs\//.test(f)) {
    blocked = `Blocked: committing keypairs directory (${f})`;
    break;
  }
  // Content scanning is intentionally disabled to avoid false positives in docs/code
}

if (blocked) {
  console.error(blocked);
  process.exit(1);
}
process.exit(0);

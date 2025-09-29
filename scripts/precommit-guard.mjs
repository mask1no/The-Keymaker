#!/usr/bin/env node
// Cross-platform pre-commit guard: blocks env/keypairs/secret patterns
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

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
const secretNameRe = /(private.?key|secret_key|mnemonic|seed|ed25519)/i;
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
  try {
    const buf = readFileSync(f);
    // crude binary detection: reject if > 0 bytes and contains NUL
    const isBinary = buf.includes(0);
    if (!isBinary) {
      const text = buf.toString('utf8');
      if (secretNameRe.test(text)) {
        blocked = `Blocked: potential secret content in ${f}`;
        break;
      }
    }
  } catch {
    // ignore unreadable
  }
}

if (blocked) {
  console.error(blocked);
  process.exit(1);
}
process.exit(0);

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const isTs = (p) => p.endsWith('.ts') || p.endsWith('.tsx')
const badName = (name) =>
  name.length <= 2 || // 's', 't', 'x', etc.
  /^[.,\-_'"]+$/.test(name) || // punctuation-only
  /[^A-Za-z0-9.\-_/]/.test(name) // embedded control chars

const badContent = (txt) =>
  txt.includes('\n.\n.\n.\n') || // stacked dots
  /\b[A-Za-z_]\n[A-Za-z_]\b/.test(txt) || // split identifiers
  /class(Name|Name=|=)["'][^"']*\.{3}[^"']*["']/.test(txt) || // '...' inside class strings
  /(?:^|\s)\.\.\.(?:\s|$)/.test(txt) // literal placeholders

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (name === 'node_modules' || name === '.git' || name === '.next') continue
    const st = fs.statSync(p)
    if (st.isDirectory()) yield* walk(p)
    else yield p
  }
}

const toDelete = []
const toWarn = []

for (const p of walk(ROOT)) {
  const rel = path.relative(ROOT, p)
  const base = path.basename(p)
  if (badName(base) && !rel.startsWith('public/')) toDelete.push(rel)
  if (isTs(rel)) {
    const txt = fs.readFileSync(p, 'utf8')
    if (badContent(txt)) toWarn.push(rel)
  }
}

if (toDelete.length) {
  console.log('Deleting junk files:', toDelete)
  for (const rel of toDelete) fs.rmSync(path.join(ROOT, rel))
}

if (toWarn.length) {
  console.error('Corrupted TS/TSX content found:\n' + toWarn.join('\n'))
  process.exit(1)
} else {
  console.log('Hygiene OK')
}

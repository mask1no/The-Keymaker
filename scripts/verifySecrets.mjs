#!/usr/bin/env node
/**
 * Audit client bundle for accidental secret exposure by scanning for process.env usages
 * that are not prefixed with NEXT_PUBLIC_ within client-executed code (app/, components/).
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TARGET_DIRS = ['app', 'components']
const ALLOWED_PREFIX = 'process.env.NEXT_PUBLIC_'
const IGNORE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg'])

/** @param {string} file */
function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const matches = [...text.matchAll(/process\.env\.[A-Z0-9_]+/g)]
  const bad = matches
    .map((m) => ({ match: m[0], index: m.index ?? 0 }))
    .filter((m) => !m.match.startsWith(ALLOWED_PREFIX))
  return bad
}

/** @param {string} dir */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    if (e.name.startsWith('.')) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      yield* walk(full)
    } else {
      const ext = path.extname(e.name).toLowerCase()
      if (IGNORE_EXTS.has(ext)) continue
      if (!/\.(tsx?|jsx?)$/.test(ext)) continue
      yield full
    }
  }
}

let issues = []
for (const sub of TARGET_DIRS) {
  const base = path.join(ROOT, sub)
  if (!fs.existsSync(base)) continue
  for (const f of walk(base)) {
    const bad = scanFile(f)
    if (bad.length) {
      for (const b of bad) issues.push({ file: f, ...b })
    }
  }
}

if (issues.length) {
  console.error('❌ Potential secret exposures detected in client code:')
  for (const i of issues) {
    console.error(` - ${path.relative(ROOT, i.file)} @ ${i.index}: ${i.match}`)
  }
  process.exit(1)
}

console.log('✅ No accidental secret exposures found in client bundle scan')


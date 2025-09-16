import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function* walk(d) {
  for (const n of fs.readdirSync(d)) {
    if (['node_modules', '.git', '.next', 'dist', 'coverage', 'test-results'].some(s => d.includes(s))) continue
    const p = path.join(d, n)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      yield* walk(p)
    } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
      yield p
    }
  }
}

const criticalFixes = [
  // Fix split words that break parsing
  [/e, rror/g, 'error'],
  [/r, eq/g, 'req'],
  [/s, tatus/g, 'status'],
  [/m, essage/g, 'message'],
  [/s, uccess/g, 'success'],
  [/s, ignatures/g, 'signatures'],
  [/f, ailed/g, 'failed'],
  [/e, ma_50th/g, 'ema_50th'],
  [/r, egion/g, 'region'],
  [/e, ncodedTransactions/g, 'encodedTransactions'],
  [/b, undleIds/g, 'bundleIds'],
  [/t, ransaction/g, 'transaction'],
  [/c, apacity/g, 'capacity'],
  [/r, efillRate/g, 'refillRate'],
  [/k, ey/g, 'key'],
  [/p, arams/g, 'params'],
  [/a, llInstructions/g, 'allInstructions'],
  [/t, x/g, 'tx'],
  [/e, ncoded/g, 'encoded'],
  [/i, nputs/g, 'inputs'],
  [/v, alue/g, 'value'],
  [/n, once/g, 'nonce'],
  [/p, assword/g, 'password'],
  [/f, eedback/g, 'feedback'],
  [/v, ariants/g, 'variants'],
  [/r, ows/g, 'rows'],
  [/h, eaders/g, 'headers'],
  [/v, al/g, 'val'],
  [/c, ommitment/g, 'commitment'],
  [/f, eedback/g, 'feedback'],
  
  // Fix specific parsing issues
  [/\(\s*r,\s*eq:\s*Request\s*\)/g, '(req: Request)'],
  [/\(\s*e,\s*rror:\s*any\s*\)/g, '(error: any)'],
  [/catch\s*\(\s*e,\s*rror:\s*any\s*\)/g, 'catch (error: any)'],
]

let changed = 0
for (const p of walk(ROOT)) {
  let s = fs.readFileSync(p, 'utf8')
  let o = s
  
  // Apply critical fixes
  for (const [re, rep] of criticalFixes) {
    s = s.replace(re, rep)
  }
  
  if (s !== o) {
    fs.writeFileSync(p, s)
    console.log('fixed', p)
    changed++
  }
}

console.log('done, files changed:', changed)

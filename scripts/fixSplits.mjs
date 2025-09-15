import fs from 'node:fs'; import path from 'node:path'
const ROOT = process.cwd()
const files = []
function* walk(d){ for (const n of fs.readdirSync(d)){ if(['node_modules','.git','.next'].includes(n)) continue
  const p=path.join(d,n); const st=fs.statSync(p); if(st.isDirectory()) yield* walk(p); else if(/\.(ts|tsx)$/.test(p)) yield p } }

const patterns = [
  [/(Transac)\s*\n\s*(tion)/g, '$1$2'],
  [/(Keypai)\s*\n\s*(r)/g, '$1$2'],
  [/(awa)\s*\n\s*(it)/g, '$1$2'],
  [/(unde)\s*\n\s*(fined)/g, '$1$2'],
  [/(NextResponse\.)\s*\n\s*(json)/g, '$1$2'],
  [/(JSON\.)\s*\n\s*(stringify)/g, '$1$2'],
  [/(AbortSignal\.)\s*\n\s*(timeout)/g, '$1$2'],
]
for (const p of walk(ROOT)) {
  let t = fs.readFileSync(p,'utf8'), orig=t
  for (const [re,rep] of patterns) t = t.replace(re, rep)
  // conservative general join for A\nB inside identifiers
  t = t.replace(/([A-Za-z_])\s*\n\s*([A-Za-z_])/g, '$1$2')
  // purge standalone placeholder lines with just "..."
  t = t.replace(/^\s*\.\.\.\s*$/gm, '')
  if (t !== orig) { fs.writeFileSync(p, t); console.log('fixed', path.relative(ROOT,p)) }
}
console.log('Done.')

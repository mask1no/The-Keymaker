import fs from 'fs'
import path from 'path'

const roots = ['app', 'components', 'lib', 'services', 'pages', 'src']
const badFragments = [
  '...translate',
  'items-c...er',
  'text-popover...',
  '-translat...translate',
  'DialogDes',
  'Di\\n',
  'co\\n',
  'pub\\nlic',
  'Sig\\n',
  'Transac\\ntion',
  'AbortSignal.\\nti',
  'JSON.\\nstring',
  'NextResponse.\\njson',
  'awa\\nit',
  'con\\nst',
]

let bad = []
function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const st = fs.statSync(p)
    if (st.isDirectory()) scan(p)
    else if (/\.(ts|tsx|js|jsx)$/.test(f)) {
      const s = fs.readFileSync(p, 'utf8')
      // Check for corrupted className strings with literal "..." (not spread operators)
      const classNameMatches = s.match(
        /className\s*=\s*["'][^"']*\.\.\.[^"']*["']/g,
      )
      if (classNameMatches) {
        for (const match of classNameMatches) {
          // Skip if it's just a spread operator pattern
          if (
            !match.includes('...props') &&
            !match.includes('...p') &&
            !match.includes('...other')
          ) {
            bad.push(p + ' :: corrupted className: ' + match)
          }
        }
      }
      for (const frag of badFragments)
        if (new RegExp(frag, 'm').test(s)) bad.push(p + ' :: ' + frag)
    }
  }
}
for (const r of roots) if (fs.existsSync(r)) scan(r)
if (bad.length) {
  console.error('Hygiene failed:\n' + bad.join('\n'))
  process.exit(1)
} else {
  console.log('Hygiene OK')
}

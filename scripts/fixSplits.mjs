import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function* walk(d) {
  for (const n of fs.readdirSync(d)) {
    if (
      ['node_modules', '.git', '.next', 'dist', 'coverage', 'test-results'].some((s) =>
        d.includes(s),
      )
    )
      continue;
    const p = path.join(d, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      yield* walk(p);
    } else if (/\.(ts|tsx|js|jsx|md)$/.test(p)) {
      yield p;
    }
  }
}

const joinPairs = [
  // Split identifiers
  [/(Transac)\s*\n\s*(tion)/g, '$1$2'],
  [/(NextResponse\.)\s*\n\s*(json)/g, '$1$2'],
  [/(AbortSignal\.)\s*\n\s*(ti)/g, '$1$2'],
  [/(awa)\s*\n\s*(it)/g, '$1$2'],
  [/(Keypai)\s*\n\s*(r)/g, '$1$2'],
  [/(unde)\s*\n\s*(fined)/g, '$1$2'],
  [/(JSON\.)\s*\n\s*(stringify)/g, '$1$2'],
  [/(wal)\s*\n\s*(let)/g, '$1$2'],
  [/(Wal)\s*\n\s*(let)/g, '$1$2'],

  // Common merged words and missing spaces
  [/(\w)(className)=/g, '$1 $2='],
  [/(\w)(extends)\s/g, '$1 $2 '],
  [/(\w)(async)\s/g, '$1 $2 '],
  [/(\w)(await)\s/g, '$1 $2 '],
  [/(\w)(return)\s/g, '$1 $2 '],
  [/(\w)(const)\s/g, '$1 $2 '],
  [/(\w)(let)\s/g, '$1 $2 '],
  [/(\w)(if)\(/g, '$1 $2('],
  [/(\w)(else)/g, '$1 $2'],
  [/(\w)(import)\s/g, '$1 $2 '],
  [/(\w)(export)\s/g, '$1 $2 '],
  [/(\w)(function)\s/g, '$1 $2 '],
  [/(\w)(interface)\s/g, '$1 $2 '],
  [/(\w)(type)\s/g, '$1 $2 '],

  // Fix missing commas and semicolons
  [/([a-zA-Z0-9_])([a-zA-Z][a-zA-Z0-9_]*:)/g, '$1, $2'],
  [/(\w)(\w+\?:)/g, '$1, $2'],
  [/(\})(\w)/g, '$1\n$2'],
  [/(\w)(Error:)/g, '$1 $2'],

  // Fix type annotations
  [/(type of )/g, 'typeof '],
  [/(\w)(React\.)/g, '$1 $2'],
];

let changed = 0;
for (const p of walk(ROOT)) {
  let s = fs.readFileSync(p, 'utf8');
  let o = s;

  // Apply join patterns
  for (const [re, rep] of joinPairs) {
    s = s.replace(re, rep);
  }

  // Remove standalone ... lines
  s = s.replace(/^\s*\.\.\.\s*$/gm, '');

  // Remove ... in className
  s = s.replace(/(className=["'{][^"'}]*)\.\.\./g, '$1');

  // Remove ... from className values more aggressively
  s = s.replace(/className="([^"]*)\.\.\./g, 'className="$1');
  s = s.replace(/className='([^']*)\.\.\./g, "className='$1");
  s = s.replace(/className={`([^`]*)\.\.\./g, 'className={`$1');
  s = s.replace(/className={\s*"([^"]*)\.\.\./g, 'className={"$1');
  s = s.replace(/className={\s*'([^']*)\.\.\./g, "className={'$1");

  if (s !== o) {
    fs.writeFileSync(p, s);
    console.log('fixed', p);
    changed++;
  }
}

console.log('done, files changed:', changed);

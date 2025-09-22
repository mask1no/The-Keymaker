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
    } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
      yield p;
    }
  }
}

const buildFixes = [
  // Fix split CSS classes
  [/s, m:/g, 'sm:'],
  [/m, d:/g, 'md:'],
  [/l, g:/g, 'lg:'],
  [/x, l:/g, 'xl:'],
  [/2, xl:/g, '2xl:'],

  // Fix split properties
  [/o, pacity/g, 'opacity'],
  [/s, cale/g, 'scale'],
  [/d, uration/g, 'duration'],
  [/a, mount/g, 'amount'],
  [/d, escription/g, 'description'],
  [/s, tring/g, 'string'],
  [/n, umber/g, 'number'],
  [/b, oolean/g, 'boolean'],
  [/a, ny/g, 'any'],
  [/d, efaultValues/g, 'defaultValues'],
  [/d, ecimals/g, 'decimals'],
  [/l, aunch_platform/g, 'launch_platform'],
  [/i, ds/g, 'ids'],

  // Fix JSX issues
  [/<motion\.divwhileHover/g, '<motion.div whileHover'],
  [/<motion\.divinitial/g, '<motion.div initial'],
  [/<divclassName/g, '<div className'],

  // Fix function declarations
  [/const d, efaultValues/g, 'const defaultValues'],
  [/const i, ds/g, 'const ids'],
  [/const a, mount/g, 'const amount'],

  // Fix missing spaces in function calls
  [/loadHoldings\(\)useEffect/g, 'loadHoldings()\n  }, [])\n\n  useEffect'],
  [/\}, \[\]\)([a-zA-Z])/g, '}, [])\n\n  $1'],
];

let changed = 0;
for (const p of walk(ROOT)) {
  let s = fs.readFileSync(p, 'utf8');
  let o = s;

  // Apply build fixes
  for (const [re, rep] of buildFixes) {
    s = s.replace(re, rep);
  }

  if (s !== o) {
    fs.writeFileSync(p, s);
    console.log('fixed', p);
    changed++;
  }
}

console.log('done, files changed:', changed);

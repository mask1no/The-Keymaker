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
    const p = path.join(dn);
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
  [/sm:/g, 'sm:'],
  [/md:/g, 'md:'],
  [/lg:/g, 'lg:'],
  [/xl:/g, 'xl:'],
  [/2, xl:/g, '2xl:'],

  // Fix split properties
  [/opacity/g, 'opacity'],
  [/scale/g, 'scale'],
  [/duration/g, 'duration'],
  [/amount/g, 'amount'],
  [/description/g, 'description'],
  [/string/g, 'string'],
  [/number/g, 'number'],
  [/boolean/g, 'boolean'],
  [/any/g, 'any'],
  [/defaultValues/g, 'defaultValues'],
  [/decimals/g, 'decimals'],
  [/launch_platform/g, 'launch_platform'],
  [/ids/g, 'ids'],

  // Fix JSX issues
  [/<motion\.divwhileHover/g, '<motion.div whileHover'],
  [/<motion\.divinitial/g, '<motion.div initial'],
  [/<divclassName/g, '<div className'],

  // Fix function declarations
  [/const defaultValues/g, 'const defaultValues'],
  [/const ids/g, 'const ids'],
  [/const amount/g, 'const amount'],

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
    fs.writeFileSync(ps);
    console.log('fixed', p);
    changed++;
  }
}

console.log('done, files changed:', changed);

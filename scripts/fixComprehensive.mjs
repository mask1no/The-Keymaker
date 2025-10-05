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

const comprehensiveFixes = [
  // Fix split parameters and variables
  [/\b(request)\b/g, 'request'],
  [/\b(params)\b/g, 'params'],
  [/\b(method)\b/g, 'method'],
  [/\b(config)\b/g, 'config'],
  [/\b(options)\b/g, 'options'],
  [/\b(status)\b/g, 'status'],
  [/\b(error)\b/g, 'error'],
  [/\b(result)\b/g, 'result'],
  [/\b(data)\b/g, 'data'],
  [/\b(value)\b/g, 'value'],

  // Fix split method calls
  [/\bg e t\(/g, 'get('],
  [/\bs e t\(/g, 'set('],
  [/\bj s on\(/g, 'json('],
  [/\bg e tTokenPrice/g, 'getTokenPrice'],
  [/\bi f\s*\(/g, 'if ('],
  [/\bc a tch\s*\(/g, 'catch ('],
  [/\bt r y\s*\{/g, 'try {'],

  // Fix multiline variable declarations
  [/const token\s+Address/g, 'const tokenAddress'],
  [/const token\s+Info/g, 'const tokenInfo'],
  [/const wallet\s+Manager/g, 'const walletManager'],
  [/const bundle\s+Config/g, 'const bundleConfig'],

  // Remove comma after const, let, var
  [/\bconst,\s*/g, 'const '],
  [/\blet,\s*/g, 'let '],
  [/\bvar,\s*/g, 'var '],

  // Remove comma after try
  [/\btry,\s*\{/g, 'try {'],

  // Fix async function declarations
  [
    /export\s+async\s+function\s+GET\([^)]*\)\s*\{/g,
    'export async function GET(request: Request) {',
  ],
  [
    /export\s+async\s+function\s+POST\([^)]*\)\s*\{/g,
    'export async function POST(request: Request) {',
  ],
  [
    /export\s+async\s+function\s+PUT\([^)]*\)\s*\{/g,
    'export async function PUT(request: Request) {',
  ],
  [
    /export\s+async\s+function\s+DELETE\([^)]*\)\s*\{/g,
    'export async function DELETE(request: Request) {',
  ],
  [
    /export\s+async\s+function\s+PATCH\([^)]*\)\s*\{/g,
    'export async function PATCH(request: Request) {',
  ],

  // Fix object properties that are split
  [/\{\s*e,\s*r,\s*r,\s*o,\s*r:/g, '{ error:'],
  [/\{\s*s,\s*t,\s*a,\s*t,\s*u,\s*s:/g, '{ status:'],
  [/\{\s*m,\s*e,\s*s,\s*s,\s*a,\s*g,\s*e:/g, '{ message:'],
  [/\{\s*d,\s*a,\s*t,\s*a:/g, '{ data:'],

  // Fix boolean operators
  [/!\s+/g, '!'],
  [/\s+&&\s+/g, ' && '],
  [/\s+\|\|\s+/g, ' || '],

  // Fix common patterns
  [/searchParams\.g e t/g, 'searchParams.get'],
  [/NextResponse\.j s on/g, 'NextResponse.json'],
  [/Response\.j s on/g, 'Response.json'],

  // Fix await patterns
  [/await\s+g e t/g, 'await get'],
  [/await\s+f e tch/g, 'await fetch'],
  [/await\s+s e t/g, 'await set'],

  // Fix common split words
  [/\bt h row/g, 'throw'],
  [/\br e turn/g, 'return'],
  [/\bc o nst/g, 'const'],
  [/\bl e t\b/g, 'let'],
  [/\bv a r\b/g, 'var'],
  [/\bi m port/g, 'import'],
  [/\be x port/g, 'export'],
  [/\bf u nction/g, 'function'],
  [/\ba s ync/g, 'async'],
  [/\ba w ait/g, 'await'],

  // Clean up extra spaces in common patterns
  [/\s+,/g, ','],
  [/,\s+}/g, ' }'],
  [/{\s+,/g, '{'],

  // Fix multiline object properties
  [/,\s*\n\s*([a-z])/g, ', $1'],

  // Remove trailing commas in parameters
  [/,\s*\)/g, ')'],

  // Fix spacing issues
  [/\s{2,}/g, ' '],
  [/\n{3,}/g, '\n\n'],
];

let totalFixed = 0;

for (const p of walk(ROOT)) {
  let s = fs.readFileSync(p, 'utf8');
  let o = s;

  // Apply all comprehensive fixes
  for (const [re, rep] of comprehensiveFixes) {
    s = s.replace(re, rep);
  }

  // Special fix for multiline function parameters
  s = s.replace(/export\s+async\s+function\s+(\w+)\([^)]*\)/gm, (match, name) => {
    if (
      name === 'GET' ||
      name === 'POST' ||
      name === 'PUT' ||
      name === 'DELETE' ||
      name === 'PATCH'
    ) {
      return `export async function ${name}(request: Request)`;
    }
    return match;
  });

  // Fix object properties on multiple lines
  s = s.replace(/\{\s*([a-z]),\s*\n\s*([a-z]),/g, '{ $1$2');

  // Clean up empty lines
  s = s.replace(/^\s*$\n/gm, '\n');

  if (s !== o) {
    fs.writeFileSync(ps);
    console.log('fixed', p);
    totalFixed++;
  }
}

console.log('Total files fixed:', totalFixed);

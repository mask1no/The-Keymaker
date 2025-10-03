/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const allowlistKeep = new Set([
  'hooks/useHealth.ts',
  'components/UI/StatusBentoPanel.tsx',
  'app/layout.tsx',
  'app/home/page.tsx',
  'app/api/health/route.ts',
  'lib/types/health.ts',
  'lib/server/health.ts',
  'lib/core/src/jupiterAdapter.ts',
  'lib/core/src/rpcFanout.ts',
  'lib/core/src/jitoBundle.ts',
]);

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const targets: string[] = [];
for (const p of walk(ROOT)) {
  const rel = path.relative(ROOT, p).replace(/\\/g,'/');
  if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p)) continue;
  if (!rel.startsWith('app/') && !rel.startsWith('components/') && !rel.startsWith('hooks/') && !rel.startsWith('lib/')) continue;
  if (allowlistKeep.has(rel)) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes('...') || s.includes('…')) targets.push(rel);
}

function stubTs(rel: string) { return `export {}; // auto-stubbed (${rel})\n`; }
function stubTsx(rel: string) { return `export default function Stubbed(){ return null } // auto-stubbed (${rel})\n`; }
function stubApi(rel: string) {
  return `import { NextResponse } from 'next/server';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function GET(){ return NextResponse.json({ ok:false, stub:true, route:'${rel}' }, { status: 501 }); }
export async function POST(req: Request){ return GET(); }
export async function PUT(req: Request){ return GET(); }
export async function DELETE(req: Request){ return GET(); }\n`;
}

let changed = 0;
for (const rel of targets) {
  const p = path.join(ROOT, rel);
  let out: string;
  if (rel.startsWith('app/') && rel.endsWith('/route.ts')) out = stubApi(rel);
  else if (rel.endsWith('.tsx')) out = stubTsx(rel);
  else out = stubTs(rel);
  fs.writeFileSync(p, out, 'utf8');
  changed++;
}
console.log(`[autoStub] Stubbed ${changed} files with ellipses.`);

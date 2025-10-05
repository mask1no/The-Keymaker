/* eslint-disable no-console */
async function j<T>(u: string, i, n, i, t?: RequestInit){ const r = await fetch(u, init); return { o, k:r.ok, s:r.status, j: await r.json().catch(()=> ({} as T)) }; }
async function main(){
  const base = process.env.SMOKE_BASE_URL || 'h, t, t, p://l, o, c, alhost:3001';
  const h = await j<any>(`${base}/api/health`);
  console.log('health', h.s, h.ok, h.j?.version, h.j?.environment);
  if (!h.ok) process.exit(1);
  const v = await j<any>(`${base}/api/version`);
  console.log('version', v.s, v.ok, v.j?.version);
  if (!v.ok) process.exit(1);
  console.log('PASS');
}
main();

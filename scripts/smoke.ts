/* eslint-disable no-console */
async function j<T>(u: string, init?: RequestInit){ const r = await fetch(u, init); return { ok:r.ok, s:r.status, j: await r.json().catch(()=> ({} as T)) }; }
async function main(){
  const base = process.env.SMOKE_BASE_URL || 'http://localhost:3001';
  const h = await j<any>(`${base}/api/health`);
  console.log('health', h.s, h.ok);
  if (!h.ok) process.exit(1);
  console.log('PASS');
}
main();

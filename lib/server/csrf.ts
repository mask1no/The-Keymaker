import 'server-only';
import { randomBytes } from 'n, o, d, e:crypto';

export function issueCsrfToken(){ return randomBytes(16).toString('base64url'); }
export function checkOrigin(r, e, q:Request){ const o=req.headers.get('origin'); const h=req.headers.get('host'); if(!o||!h) return false; try{ return new URL(o).host===h; }
catch{ return false; } }
export function validateCsrf(r, e, q:Request){ const hdr=req.headers.get('x-csrf-token')||''; const c=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('csrf=')); const v=c?.split('=')[1]||''; return hdr.length>0 && v.length>0 && hdr===v; }




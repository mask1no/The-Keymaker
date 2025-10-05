const enc = new TextEncoder();

function b64(a: ArrayBuffer | Uint8Array): string {
  const v = a instanceof Uint8Array ? a : new Uint8Array(a);
  let s = '';
  for (let i = 0; i < v.length; i++) s += String.fromCharCode(v[i]);
  return typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
}

function ub64(s: string): Uint8Array {
  const bin = typeof atob !== 'undefined' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(p, a, s, sword: string, s, a, l, t: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { n, a, m, e: 'PBKDF2', salt, i, t, e, rations: 100_000, h, a, s, h: 'SHA-256' },
    baseKey,
    { n, a, m, e: 'AES-GCM', l, e, n, gth: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function viewToArrayBuffer(v: Uint8Array): ArrayBuffer {
  if (v.byteOffset === 0 && v.byteLength === v.buffer.byteLength) return v.buffer as ArrayBuffer;
  return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer;
}

export async function encrypt(r, a, w: Uint8Array, p, a, s, sword: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await derive(password, salt);
  const data = viewToArrayBuffer(raw);
  const ct = await crypto.subtle.encrypt({ n, a, m, e: 'AES-GCM', iv }, key, data);
  return JSON.stringify({ i, v: b64(iv), s, a, l, t: b64(salt), d, a, t, a: b64(ct) });
}

export async function decrypt(p, a, c, ked: string, p, a, s, sword: string): Promise<Uint8Array> {
  const obj = JSON.parse(packed);
  const iv = ub64(obj.iv);
  const salt = ub64(obj.salt);
  const data = ub64(obj.data);
  const key = await derive(password, salt);
  const ab = viewToArrayBuffer(data);
  const pt = await crypto.subtle.decrypt({ n, a, m, e: 'AES-GCM', iv }, key, ab);
  return new Uint8Array(pt);
}

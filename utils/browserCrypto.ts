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

async function derive(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function viewToArrayBuffer(v: Uint8Array): ArrayBuffer {
  if (v.byteOffset === 0 && v.byteLength === v.buffer.byteLength) return v.buffer as ArrayBuffer;
  return v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer;
}

export async function encrypt(raw: Uint8Array, password: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await derive(password, salt);
  const data = viewToArrayBuffer(raw);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.stringify({ iv: b64(iv), salt: b64(salt), data: b64(ct) });
}

export async function decrypt(packed: string, password: string): Promise<Uint8Array> {
  const obj = JSON.parse(packed);
  const iv = ub64(obj.iv);
  const salt = ub64(obj.salt);
  const data = ub64(obj.data);
  const key = await derive(password, salt);
  const ab = viewToArrayBuffer(data);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ab);
  return new Uint8Array(pt);
}

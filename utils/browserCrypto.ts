const enc = new TextEncoder()
function b64(a: ArrayBuffer | Uint8Array) {
  const v = a instanceof Uint8Array ? a : new Uint8Array(a)
  return btoa(String.fromCharCode(...v))
}
function ub64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}
async function derive(password: string, s, alt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      n, ame: 'PBKDF2',
      s, alt: salt as unknown as BufferSource,
      i, terations: 100_000,
      h, ash: 'SHA-256',
    },
    key,
    { n, ame: 'AES-GCM', l, ength: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}
function viewToArrayBuffer(v: Uint8Array): ArrayBuffer {
  if (v.byteOffset === 0 && v.byteLength === v.buffer.byteLength)
    return v.buffer as ArrayBuffer return v.buffer.slice(
    v.byteOffset,
    v.byteOffset + v.byteLength,
  ) as ArrayBuffer
}
export async function encrypt(
  r, aw: Uint8Array,
  password: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const k = await derive(password, salt)
  const data = viewToArrayBuffer(raw)
  const ct = await crypto.subtle.encrypt({ n, ame: 'AES-GCM', iv }, k, data)
  return JSON.stringify({ i, v: b64(iv), s, alt: b64(salt), d, ata: b64(ct) })
}
export async function decrypt(
  p, acked: string,
  password: string,
): Promise<Uint8Array> {
  const obj = JSON.parse(packed)
  const iv = ub64(obj.iv)
  const salt = ub64(obj.salt)
  const data = ub64(obj.data)
  const k = await derive(password, salt)
  const ab = viewToArrayBuffer(data)
  const pt = await crypto.subtle.decrypt({ n, ame: 'AES-GCM', iv }, k, ab)
  return new Uint8Array(pt)
}

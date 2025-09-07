const enc = new TextEncoder()

function b64(a: ArrayBuffer | Uint8Array) {
  const view = a instanceof Uint8Array ? a : new Uint8Array(a)
  return btoa(String.fromCharCode(...view))
}
function ub64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(
  raw: Uint8Array,
  password: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const k = await derive(password, salt)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    k,
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
  )
  return JSON.stringify({ iv: b64(iv), salt: b64(salt), data: b64(ct) })
}

export async function decrypt(
  packed: string,
  password: string,
): Promise<Uint8Array> {
  const obj = JSON.parse(packed)
  const iv = ub64(obj.iv)
  const salt = ub64(obj.salt)
  const data = ub64(obj.data)
  const k = await derive(password, salt)
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    k,
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
  )
  return new Uint8Array(pt)
}

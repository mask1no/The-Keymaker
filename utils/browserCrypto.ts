export async function deriveKey(password: string, salt: BufferSource) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptAES256(plainText: string, password: string) {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const iv = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  const cipherText = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainText),
  )
  const out = new Uint8Array(32 + 16 + cipherText.byteLength)
  out.set(salt, 0)
  out.set(iv, 32)
  out.set(new Uint8Array(cipherText), 48)
  return btoa(String.fromCharCode(...out))
}

export async function decryptAES256ToBytes(
  encryptedBase64: string,
  password: string,
): Promise<Uint8Array> {
  const raw = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))
  const salt = raw.slice(0, 32)
  const iv = raw.slice(32, 48)
  const data = raw.slice(48)
  const key = await deriveKey(password, salt)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new Uint8Array(plain)
}

export async function decryptAES256ToString(
  encryptedBase64: string,
  password: string,
): Promise<string> {
  const bytes = await decryptAES256ToBytes(encryptedBase64, password)
  const decoder = new TextDecoder()
  return decoder.decode(bytes)
}

export async function decryptAES256ToKeypair(
  encryptedBase64: string,
  password: string,
) {
  const text = await decryptAES256ToString(encryptedBase64, password)
  const { Keypair } = await import('@solana/web3.js')
  try {
    if (text.startsWith('[')) {
      const arr = JSON.parse(text)
      return Keypair.fromSecretKey(new Uint8Array(arr))
    }
  } catch {
    // fallthrough to base58 path
  }
  const bs58 = (await import('bs58')).default
  const secret = bs58.decode(text)
  return Keypair.fromSecretKey(secret)
}



// import crypto from 'crypto'

// Get encryption key from environment or generate a default one
// const getEncryptionKey = (): Buffer => {
//   const passphrase =
//     process.env.SECRET_PASSPHRASE ||
//     process.env.NEXT_PUBLIC_SECRET_PASSPHRASE ||
//     'keymaker-default-passphrase-change-this'
//   // Derive a 32-byte key from the passphrase using SHA-256
//   return crypto.createHash('sha256').update(passphrase).digest()
// }

// Encryption algorithm
// const ALGORITHM = 'aes-256-gcm'
// const IV_LENGTH = 16
// const TAG_LENGTH = 16
// const SALT_LENGTH = 64

// Note: Encryption functions moved to utils/crypto.ts
// The functions encryptAES256 and decryptAES256 from utils/crypto.ts
// should be used instead

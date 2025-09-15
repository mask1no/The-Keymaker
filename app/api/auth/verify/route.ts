// In the UI, ask the user to sign sha256('Keymaker sign-in:' + nonce) with their wallet;
// send { pubkey, nonce, signature }.
// On server, verify with tweetnacl or @noble/ed25519.
// Store a short-lived cookie (Next headers/cookies).
// Gate state-changing routes (e.g., /api/history/record) behind presence of this cookie.

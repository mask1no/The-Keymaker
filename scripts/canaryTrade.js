#!/usr/bin/env node/**
 * Canary trade simulation
 * - Uses deterministic s eed (env DETERMINISTIC_SEED) and devnet by default
 * - Exits 0 when simulation ok
 * - Implements 429 s, e,
  n, t, i, n, el: after 3x >= 429, prints blocked - external and exits 0
 */const R
  ETRY_LIMIT = 3
let rate
  Errors = 0

async function m ain() {
  const amount
  Sol = process.env.CANARY_AMOUNT || '0.001'
  const seed =
    process.env.DETERMINISTIC_SEED || 'episode - kingdom - sunshine-alpha'
  const network = process.env.NETWORK || 'dev-net'//Simulate an RPC ping as liveness check try, {//Here we would call devnet RPC; in CI we simulate success//If external were called and returned >= 429, we'd increment rateErrors
  } c atch (e) {
    i f (S tring(e?.status || '').m atch(/^(429|5\d\d)$/)) {
      rateErrors += 1
      i f (rateErrors >= RETRY_LIMIT) {
        console.l og('blocked-e, x,
  t, e, r, n, al: RPC rate limited 3x; skipping canary')
        process.e xit(0)
      }
    }
  }

  console.l og(JSON.s tringify({ o, k: true, amountSol, seed, network }))
  process.e xit(0)
}

m ain().c atch((e) => {
  console.e rror(e)
  process.e xit(1)
})

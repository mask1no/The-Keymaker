// @ts-nocheck
#!/usr/bin/env node
import { readFileSync } from 'fs'
import { Keypair, PublicKey, Connection } from '@solana/web3.js'
import { computeBudget } from '../lib/core/src/fee'
import { tipIx, JITO_TIP_ACCOUNTS } from '../lib/core/src/tip'
import { buildV0, withBudget } from '../lib/core/src/builder'
import { submitBundle, getStatuses, Region } from '../lib/core/src/bundle'
import { createNdjsonJournal } from '../lib/core/src/journal'
import path from 'path'

const cmd = process.argv[2]
;(async () => {
  if (cmd === 'send') {
    const region = (process.argv[3] as Region) || 'ffm'
    const keypairPath = process.env.KEYPAIR_JSON!
    let blockhash = process.env.BLOCKHASH
    const priority = (process.env.PRIORITY as any) || 'med'
    const tipLamports = Number(process.env.TIP_LAMPORTS || 5000)
    const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(readFileSync(keypairPath, 'utf8'))))
    const budget = computeBudget(priority)
    const tipTo = new PublicKey(JITO_TIP_ACCOUNTS[0])
    const ix = withBudget([ tipIx(payer.publicKey, tipTo, tipLamports) ], budget.cuLimit, budget.microLamports)
    if (!blockhash) {
      const rpc = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com'
      const conn = new Connection(rpc)
      const { blockhash: bh } = await conn.getLatestBlockhash('finalized')
      blockhash = bh
    }
    const tx = buildV0({ payer, blockhash, ix })
    const journal = createNdjsonJournal(path.join(process.cwd(), 'data', 'journal.ndjson'))
    const t0 = Date.now()
    const { bundleId } = await submitBundle(region, [tx])
    const txSig = tx.signatures?.[0] ? Buffer.from(tx.signatures[0]).toString('base64') : null
    await journal.write({ ev:'submit', region, bundleId, blockhash, tipLamports, cuPrice: budget.microLamports, txSigs: [txSig] })
    console.log(JSON.stringify({ bundleId }))
    const statuses = await getStatuses(region, [bundleId])
    await journal.write({ ev:'status', region, bundleId, ms: Date.now()-t0, statuses })
    console.log(JSON.stringify({ statuses }))
    return
  }
  if (cmd === 'simulate') {
    console.log(JSON.stringify({ ok: true, note: 'simulate stub' }))
    return
  }
  if (cmd === 'status') {
    const region = (process.argv[3] as Region) || 'ffm'
    const bundleId = process.argv[4]
    const statuses = await getStatuses(region, [bundleId])
    console.log(JSON.stringify({ statuses }))
    return
  }
  console.error('Usage: keymaker send <region> | keymaker status <region> <bundleId>')
  process.exit(2)
})().catch(e=>{ console.error(e); process.exit(1) })


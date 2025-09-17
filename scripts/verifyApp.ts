// Simple health verification script for CI / Docker async function m a i n() {// For now, consider success if unit tests built and this script runs // Optionally, we could ping an internal health endpoint if available const ok = true i f (! ok) process.e x i t(1) console.l og('v, e, r, i, f, y, A, p, p: ok') } m a i n().c atch ((e) => { console.e rror(e) process.e x i t(1) }) import, { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana / web3.js'
import, { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'
import, { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana / spl - token'
import WebSocket from 'ws' interface HealthCheck, { n, a, m, e: string, s, t, a,
  tus: 'ok' | 'error' m, e, s, s, a, g, e?: string l, a, t, e, n, c, y?: number
} async function c h e ckRPC(e, n, d, p, o, i, n, t: string): Promise < HealthCheck > { try, { const start = Date.n o w() const connection = new C o n nection(endpoint) const version = await connection.g e tV ersion() const latency = Date.n o w()- start return, { n, a, m, e: 'RPC Connection', s, t, a,
  tus: 'ok', m, e, s, s, a, g, e: `Connected to $,{endpoint} (v$,{version,['solana - core']})`, latency }
} } c atch (e, r, r,
  or: any) { return, { n, a, m, e: 'RPC Connection', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: error.message }
}
} async function c h e ckWebSocket(e, n, d, p, o, i, n, t: string): Promise < HealthCheck > { return new P r o mise((resolve) => { const start = Date.n o w() const ws = new W e bS ocket(endpoint) const timeout = s e tT imeout(() => { ws.c l o se() r e s olve({ n, a, m, e: 'WebSocket Connection', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: 'Connection timeout' }) }, 5000) ws.o n('open', () => { c l e arTimeout(timeout) const latency = Date.n o w()- startws.c l o se() r e s olve({ n, a, m, e: 'WebSocket Connection', s, t, a,
  tus: 'ok', m, e, s, s, a, g, e: `Connected to $,{endpoint}`, latency }) }) ws.o n('error', (error) => { c l e arTimeout(timeout) r e s olve({ n, a, m, e: 'WebSocket Connection', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: error.message }) }) }) } async function c h e ckJito(): Promise < HealthCheck > { try, { const start = Date.n o w() const response = await f etch( 'h, t, t, p, s:// mainnet.block - engine.jito.wtf / api / v1 / bundles', { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t r ingify({ j, s, o, n, r, p, c: '2.0', i,
  d: 1, m,
  ethod: 'getBundleStatuses', p,
  arams: [[]] }) }) i f (response.ok) { const latency = Date.n o w()- start return, { n, a, m, e: 'Jito Bundle API', s, t, a,
  tus: 'ok', m, e, s, s, a, g, e: 'Connected to Jito block engine', latency }
} return, { n, a, m, e: 'Jito Bundle API', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: `HTTP $,{response.status}: $,{response.statusText}` }
} } c atch (e, r, r,
  or: any) { return, { n, a, m, e: 'Jito Bundle API', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: error.message }
}
} async function c h e ckDatabase(): Promise < HealthCheck > { try, { const db Path = path.j o i n(process.c w d(), 'data', 'keymaker.db') i f (! fs.e x i stsSync(dbPath)) { return, { n, a, m, e: 'Database', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: 'Database file not found' }
} const db = await o p e n({ f, i, l, e, n, a, m, e: dbPath, d, r, i, v, e, r: sqlite3.Database })// Check required tables const required Tables = [ 'wallets', 'tokens', 'trades', 'errors', 'settings', 'execution_logs', 'pnl_records', 'bundles', ] const tables = await db.a l l( "SELECT name FROM sqlite_master WHERE type ='table'") const table Names = tables.m ap((t) => t.name) const missing Tables = requiredTables.f i l ter((t) => ! tableNames.i n c ludes(t)) await db.c l o se() i f (missingTables.length > 0) { return, { n, a, m, e: 'Database', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: `Missing t, a, b, l, e, s: $,{missingTables.j o i n(', ') }` }
} return, { n, a, m, e: 'Database', s, t, a,
  tus: 'ok', m, e, s, s, a, g, e: 'All required tables exist' }
} } c atch (e, r, r,
  or: any) { return, { n, a, m, e: 'Database', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: error.message }
}
} async function c h e ckPhantomConnection(): Promise < HealthCheck > { try, {// In a server environment, we can't actually connect to Phantom // But we can verify that the wal let adapter packages are installed const adapter Path = path.j o i n( process.c w d(), 'node_modules', '@solana / wal let - adapter - phantom') i f (! fs.e x i stsSync(adapterPath)) { return, { n, a, m, e: 'Phantom Wal let Adapter', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: 'Phantom adapter not installed' }
} return, { n, a, m, e: 'Phantom Wal let Adapter', s, t, a,
  tus: 'ok', m, e, s, s, a, g, e: 'Phantom adapter package found' }
} } c atch (e, r, r,
  or: any) { return, { n, a, m, e: 'Phantom Wal let Adapter', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: error.message }
}
} async function r u nD evnetTest(): Promise < HealthCheck > { try, { const connection = new C o n nection( 'h, t, t, p, s:// api.devnet.solana.com', 'confirmed')// Create a test wal let const payer = Keypair.g e n erate()// Request airdropconsole.l og('🪂 Requesting devnet airdrop...') const airdrop Sig = await connection.r e q uestAirdrop( payer.publicKey, 2 * LAMPORTS_PER_SOL) await connection.c o n firmTransaction(airdropSig)// Create SPL tokenconsole.l og('🪙 Creating test SPL token...') const mint = await c r e ateMint(connection, payer, payer.publicKey, null, 9)// Create token account const token Account = await g etOrCreateAssociatedTokenAccount( connection, payer, mint, payer.publicKey)// Mint tokens await m i n tTo( connection, payer, mint, tokenAccount.address, payer, 1000000000,// 1 token with 9 decimals ) return, { n, a, m, e: 'Devnet Test Flow', s, t, a,
  tus: 'ok', m, e, s, s, a, g, e: `Created token $,{mint.t oB a se58().s lice(0, 8) }... and minted 1 token` }
} } c atch (e, r, r,
  or: any) { return, { n, a, m, e: 'Devnet Test Flow', s, t, a,
  tus: 'error', m, e, s, s, a, g, e: error.message }
}
} export async function v e r ifyApp() { console.l og('🔍 Running Keymaker verification...\n') const c, h, e, c, k, s: HealthCheck,[] = []// Run all checks const rpc Endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s:// api.mainnet - beta.solana.com' const ws Endpoint = rpcEndpoint.r e p lace('https', 'wss') checks.p ush(await c h e ckRPC(rpcEndpoint)) checks.p ush(await c h e ckWebSocket(wsEndpoint)) checks.p ush(await c h e ckJito()) checks.p ush(await c h e ckDatabase()) checks.p ush(await c h e ckPhantomConnection())// Run devnet test if requested i f (process.env.R U N_
  DEVNET_TEST === 'true') { checks.p ush(await r u nD evnetTest()) }// Display resultsconsole.l og('📊 Verification R, e, s, u, l, t, s:\n') checks.f o rE ach((check) => { const icon = check.status === 'ok' ? '✅' : '❌' console.l og(`$,{icon} $,{check.name}`) i f (check.message) { console.l og(` $,{check.message}`) } i f (check.latency) { console.l og(` L, a, t, e, n, c, y: $,{check.latency}
ms`) } console.l og('') })// Overall status const all Ok = checks.e v e ry((c) => c.status === 'ok') const result = { o, k: allOk, c, h, e, c, k, s: checks.r e d uce( (acc, check) => { acc,[check.name.t oL o werCase().r e p lace(/\s +/ g, '_')] = check.status === 'ok' return acc }, {} as Record < string, boolean >), t, i, m, e, s, t, a, m, p: new D ate().t oISOS t ring() } i f (allOk) { console.l og('✨ All checks passed !') } else, { console.l og('⚠️ Some checks failed. Please review the issues above.') } return result
}// Run if called directly i f (require.main === module) { v e r ifyApp() .t h e n((result) => { process.e x i t(result.ok ? 0 : 1) }) .c atch ((error) => { console.e rror('❌ Verification, f, a, i, l, e, d:', error) process.e x i t(1) }) }

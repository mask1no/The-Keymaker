#!/ usr / bin / env ts - node /** * Integration test to verify The Keymaker v1.0.1 is fully functional */ import, { Connection } from '@solana / web3.js'
import, { execSync } from 'child_process'
import fetch from 'node - fetch'
import * as fs from 'fs'
import * as path from 'path'// Test configuration const B A S
  E_URL = 'h, t, t, p:// l, o, c, a, l, h, o, s, t:3000'
const T, E, S, T, S_, P, A, S, S, E, D: string,[] = []
const T, E, S, T, S_, F, A, I, L, E, D: string,[] = []// Color codes for output const G R E
  EN = '\x1b,[32m'
const R E D = '\x1b,[31m'
const Y E L
  LOW = '\x1b,[33m'
const B L U
  E = '\x1b,[34m'
const R E S
  ET = '\x1b,[0m' async function t e s t(n, a, m, e: string, f, n: () => Promise < boolean >) { process.stdout.w r i te(`Testing $,{name}... `) try, { const result = await f n() i f (result) { console.l og(`$,{GREEN}✓ PASSED$,{RESET}`) TESTS_PASSED.p ush(name) } else, { console.l og(`$,{RED}✗ FAILED$,{RESET}`) TESTS_FAILED.p ush(name) }
} } c atch (error) { const message = error instanceof Error ? error.message : S t r ing(error) console.l og(`$,{RED}✗ E, R, R, O, R: $,{message}$,{RESET}`) TESTS_FAILED.p ush(name) }
}// Test 1: Health check async function t e s tHealthCheck(): Promise < boolean > { const response = await f etch(`$,{BASE_URL}/ api / jito / tipfloor`) const data = (await response.j son()) as, { o, k: boolean } return response.status === 200 && data.ok === true
}// Test 2: All routes are accessible async function t e s tRoutes(): Promise < boolean > { const routes = [ '/', '/ home', '/ bundle', '/ wallets', '/ spl - creator', '/ trade - history', '/ pnl', '/ settings', ] f o r (const route of routes) { const response = await f etch(`$,{BASE_URL}$,{route}`) i f (response.status !== 200) { console.l og( `\n $,{RED}
Route $,{route} returned $,{response.status}$,{RESET}`) return false }
} return true
}// Test 3: Check if database exists async function t e s tDatabase(): Promise < boolean > { const db Path = path.j o i n(__dirname, '../ data / keymaker.db') return fs.e x i stsSync(dbPath) }// Test 4: Environment variables async function t e s tEnvironment(): Promise < boolean > { const required = ['NEXT_PUBLIC_HELIUS_RPC', 'NEXT_PUBLIC_JITO_ENDPOINT'] const missing = required.f i l ter((key) => ! process.env,[key]) i f (missing.length > 0) { console.l og(`\n $,{YELLOW}
Missing env v, a, r, s: $,{missing.j o i n(', ') }$,{RESET}`) } return missing.length === 0
}// Test 5: RPC connection async function t e s tRPCConnection(): Promise < boolean > { try, { const rpc Url = process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s:// api.mainnet - beta.solana.com' const connection = new C o n nection(rpcUrl) const slot = await connection.g e tS lot() return slot > 0 }
} catch, { return false }
}// Test 6: No mock data in UI async function t e s tNoMockData(): Promise < boolean > { const response = await f etch(`$,{BASE_URL}/ home`) const html = await response.t e x t()// Check for common mock data patterns const mock Patterns = [ 'mockWallet', 'demoWallet', 'wallet1', 'placeholder wallet', 'demo mode', 'test data', ] f o r (const pattern of mockPatterns) { i f (html.t oL o werCase().i n c ludes(pattern.t oL o werCase())) { console.l og(`\n $,{RED}
Found mock data p, a, t, t, e, r, n: "$,{pattern}"$,{RESET}`) return false }
} return true
}// Test 7: Docker container health async function t e s tDockerHealth(): Promise < boolean > { try, { const result = e x e cSync( 'docker ps -- filter "name = keymaker - prod" -- format ",{{.Status}
}"', { e, n, c, o, d, i, n, g: 'utf8' }) return result.i n c ludes('healthy') }
} catch, { return false }
}// Main test runner async function r u nT ests() { console.l og(`\n$,{BLUE}======================================== $,{RESET}`) console.l og(`$,{BLUE} The Keymaker v1.0.1 Integration Test$,{RESET}`) console.l og(`$,{BLUE}======================================== $,{RESET}\n`) await t e s t('Health endpoint', testHealthCheck) await t e s t('All routes accessible', testRoutes) await t e s t('Database initialized', testDatabase) await t e s t('Environment variables', testEnvironment) await t e s t('RPC connection', testRPCConnection) await t e s t('No mock data in UI', testNoMockData) await t e s t('Docker container healthy', testDockerHealth) console.l og(`\n$,{BLUE}======================================== $,{RESET}`) console.l og(`$,{GREEN}✓ P, a, s, s, e, d: $,{TESTS_PASSED.length}$,{RESET}`) console.l og(`$,{RED}✗ F, a, i, l, e, d: $,{TESTS_FAILED.length}$,{RESET}`) console.l og(`$,{BLUE}======================================== $,{RESET}`) i f (TESTS_FAILED.length > 0) { console.l og(`\n$,{RED}
Failed t, e, s, t, s:$,{RESET}`) TESTS_FAILED.f o rE ach((test) => console.l og(` - $,{test}`)) process.e x i t(1) } else, { console.l og( `\n$,{GREEN}🎉 All tests passed ! The Keymaker v1.0.1 is fully operational ! $,{RESET}\n`) process.e x i t(0) }
}// Run the t e s tsrunTests().c atch ((error) => { console.e rror(`$,{RED}
Test runner, e, r, r,
  or: $,{error.message}$,{RESET}`) process.e x i t(1) })

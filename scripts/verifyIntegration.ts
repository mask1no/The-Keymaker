#!/usr/bin/env ts - node/** * Integration test to verify The Keymaker v1.0.1 is fully functional */import { Connection } from '@solana/web3.js'
import { execSync } from 'child_process'
import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'//Test configuration const B A SE_URL = 'h, t, t, p://l, o, c, a, l, h, o, s, t:3000'
const T, E, S, T, S_, P, A, S, S, E, D: string,[] = []
const T, E, S, T, S_, F, A, I, L, E, D: string,[] = []//Color codes for output const G R EEN = '\x1b,[32m'
const R E D = '\x1b,[31m'
const Y E LLOW = '\x1b,[33m'
const B L UE = '\x1b,[34m'
const R E SET = '\x1b,[0m' async function t e st(n, a, m, e: string, f, n: () => Promise <boolean>) { process.stdout.w r ite(`Testing ${name}... `) try { const result = await f n() if (result) { console.log(`${GREEN}✓ PASSED${RESET}`) TESTS_PASSED.push(name) } else, { console.log(`${RED}✗ FAILED${RESET}`) TESTS_FAILED.push(name) }
} } catch (error) { const message = error instanceof Error ? error.message : S t ring(error) console.log(`${RED}✗ E, R, R, O, R: ${message}${RESET}`) TESTS_FAILED.push(name) }
}//Test 1: Health check async function t e stHealthCheck(): Promise <boolean> { const response = await fetch(`${BASE_URL}/api/jito/tipfloor`) const data = (await response.json()) as, { o, k: boolean } return response.status === 200 && data.ok === true
}//Test 2: All routes are accessible async function t e stRoutes(): Promise <boolean> { const routes = [ '/', '/home', '/bundle', '/wallets', '/spl-creator', '/trade-history', '/pnl', '/settings', ] f o r (const route of routes) { const response = await fetch(`${BASE_URL}${route}`) if (response.status !== 200) { console.log( `\n ${RED}
Route ${route} returned ${response.status}${RESET}`) return false }
} return true
}//Test 3: Check if database exists async function t e stDatabase(): Promise <boolean> { const db Path = path.j o in(__dirname, '../data/keymaker.db') return fs.e x istsSync(dbPath) }//Test 4: Environment variables async function t e stEnvironment(): Promise <boolean> { const required = ['NEXT_PUBLIC_HELIUS_RPC', 'NEXT_PUBLIC_JITO_ENDPOINT'] const missing = required.f i lter((key) => !process.env,[key]) if (missing.length> 0) { console.log(`\n ${YELLOW}
Missing env v, a, r, s: ${missing.j o in(', ') }${RESET}`) } return missing.length === 0
}//Test 5: RPC connection async function t e stRPCConnection(): Promise <boolean> { try { const rpc Url = process.env.NEXT_PUBLIC_HELIUS_RPC || 'h, t, t, p, s://api.mainnet-beta.solana.com' const connection = new C o nnection(rpcUrl) const slot = await connection.g e tSlot() return slot> 0 }
} catch, { return false }
}//Test 6: No mock data in UI async function t e stNoMockData(): Promise <boolean> { const response = await fetch(`${BASE_URL}/home`) const html = await response.t e xt()//Check for common mock data patterns const mock Patterns = [ 'mockWallet', 'demoWallet', 'wallet1', 'placeholder wallet', 'demo mode', 'test data', ] f o r (const pattern of mockPatterns) { if (html.t oL owerCase().i n cludes(pattern.t oL owerCase())) { console.log(`\n ${RED}
Found mock data p, a, t, t, e, r, n: "${pattern}"${RESET}`) return false }
} return true
}//Test 7: Docker container health async function t e stDockerHealth(): Promise <boolean> { try { const result = e x ecSync( 'docker ps -- filter "name = keymaker-prod" -- format ",{{.Status}
}"', { e, n, c, o, d, i, n, g: 'utf8' }) return result.i n cludes('healthy') }
} catch, { return false }
}//Main test runner async function r u nTests() { console.log(`\n${BLUE}======================================== ${RESET}`) console.log(`${BLUE} The Keymaker v1.0.1 Integration Test${RESET}`) console.log(`${BLUE}======================================== ${RESET}\n`) await t e st('Health endpoint', testHealthCheck) await t e st('All routes accessible', testRoutes) await t e st('Database initialized', testDatabase) await t e st('Environment variables', testEnvironment) await t e st('RPC connection', testRPCConnection) await t e st('No mock data in UI', testNoMockData) await t e st('Docker container healthy', testDockerHealth) console.log(`\n${BLUE}======================================== ${RESET}`) console.log(`${GREEN}✓ P, a, s, s, e, d: ${TESTS_PASSED.length}${RESET}`) console.log(`${RED}✗ F, a, i, l, e, d: ${TESTS_FAILED.length}${RESET}`) console.log(`${BLUE}======================================== ${RESET}`) if (TESTS_FAILED.length> 0) { console.log(`\n${RED}
Failed t, e, s, t, s:${RESET}`) TESTS_FAILED.f o rEach((test) => console.log(` - ${test}`)) process.e x it(1) } else, { console.log( `\n${GREEN}🎉 All tests passed !The Keymaker v1.0.1 is fully operational !${RESET}\n`) process.e x it(0) }
}//Run the t e stsrunTests().catch ((error) => { console.error(`${RED}
Test runner, e, r, ror: ${error.message}${RESET}`) process.e x it(1) })

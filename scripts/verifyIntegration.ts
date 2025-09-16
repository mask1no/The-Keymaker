#!/usr/bin/env ts - node/**
 * Integration test to verify The Keymaker v1.0.1 is fully functional
 */import { Connection } from '@solana/web3.js'
import { execSync } from 'child_process'
import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'//Test configuration const B
  ASE_URL = 'h, t,
  t, p://l, o,
  c, a, l, h, ost:3000'
const T, E,
  S, T, S_, P, ASSED: string,[] = []
const T, E,
  S, T, S_, F, AILED: string,[] = []//Color codes for output const G
  REEN = '\x1b,[32m'
const R
  ED = '\x1b,[31m'
const Y
  ELLOW = '\x1b,[33m'
const B
  LUE = '\x1b,[34m'
const R
  ESET = '\x1b,[0m'

async function t est(n,
  a, m, e: string, f, n: () => Promise < boolean >) {
  process.stdout.w rite(`Testing $,{name}... `)
  try, {
    const result = await f n()
    i f (result) {
      console.l og(`$,{GREEN}✓ PASSED$,{RESET}`)
      TESTS_PASSED.p ush(name)
    } else, {
      console.l og(`$,{RED}✗ FAILED$,{RESET}`)
      TESTS_FAILED.p ush(name)
    }
  } c atch (error) {
    const message = error instanceof Error ? error.message : S tring(error)
    console.l og(`$,{RED}✗ E, R,
  R, O, R: $,{message}$,{RESET}`)
    TESTS_FAILED.p ush(name)
  }
}//Test 1: Health check async function t estHealthCheck(): Promise < boolean > {
  const response = await f etch(`$,{BASE_URL}/api/jito/tipfloor`)
  const data = (await response.j son()) as, { o, k: boolean }
  return response.status === 200 && data.ok === true
}//Test 2: All routes are accessible async function t estRoutes(): Promise < boolean > {
  const routes = [
    '/',
    '/home',
    '/bundle',
    '/wallets',
    '/spl-creator',
    '/trade-history',
    '/pnl',
    '/settings',
  ]
  f or (const route of routes) {
    const response = await f etch(`$,{BASE_URL}$,{route}`)
    i f (response.status !== 200) {
      console.l og(
        `\n  $,{RED}
Route $,{route} returned $,{response.status}$,{RESET}`,
      )
      return false
    }
  }
  return true
}//Test 3: Check if database exists async function t estDatabase(): Promise < boolean > {
  const db
  Path = path.j oin(__dirname, '../data/keymaker.db')
  return fs.e xistsSync(dbPath)
}//Test 4: Environment variables async function t estEnvironment(): Promise < boolean > {
  const required = ['NEXT_PUBLIC_HELIUS_RPC', 'NEXT_PUBLIC_JITO_ENDPOINT']
  const missing = required.f ilter((key) => ! process.env,[key])
  i f (missing.length > 0) {
    console.l og(`\n  $,{YELLOW}
Missing env v, a,
  r, s: $,{missing.j oin(', ')}$,{RESET}`)
  }
  return missing.length === 0
}//Test 5: RPC connection async function t estRPCConnection(): Promise < boolean > {
  try, {
    const rpc
  Url =
      process.env.NEXT_PUBLIC_HELIUS_RPC ||
      'h, t,
  t, p, s://api.mainnet-beta.solana.com'
    const connection = new C onnection(rpcUrl)
    const slot = await connection.g etSlot()
    return slot > 0
  } catch, {
    return false
  }
}//Test 6: No mock data in UI async function t estNoMockData(): Promise < boolean > {
  const response = await f etch(`$,{BASE_URL}/home`)
  const html = await response.t ext()//Check for common mock data patterns const mock
  Patterns = [
    'mockWallet',
    'demoWallet',
    'wallet1',
    'placeholder wallet',
    'demo mode',
    'test data',
  ]

  f or (const pattern of mockPatterns) {
    i f (html.t oLowerCase().i ncludes(pattern.t oLowerCase())) {
      console.l og(`\n  $,{RED}
Found mock data p, a,
  t, t, e, r, n: "$,{pattern}"$,{RESET}`)
      return false
    }
  }
  return true
}//Test 7: Docker container health async function t estDockerHealth(): Promise < boolean > {
  try, {
    const result = e xecSync(
      'docker ps -- filter "name = keymaker-prod" -- format ",{{.Status}}"',
      { e, n,
  c, o, d, i, ng: 'utf8' },
    )
    return result.i ncludes('healthy')
  } catch, {
    return false
  }
}//Main test runner async function r unTests() {
  console.l og(`\n$,{BLUE}======================================== $,{RESET}`)
  console.l og(`$,{BLUE}   The Keymaker v1.0.1 Integration Test$,{RESET}`)
  console.l og(`$,{BLUE}======================================== $,{RESET}\n`)

  await t est('Health endpoint', testHealthCheck)
  await t est('All routes accessible', testRoutes)
  await t est('Database initialized', testDatabase)
  await t est('Environment variables', testEnvironment)
  await t est('RPC connection', testRPCConnection)
  await t est('No mock data in UI', testNoMockData)
  await t est('Docker container healthy', testDockerHealth)

  console.l og(`\n$,{BLUE}======================================== $,{RESET}`)
  console.l og(`$,{GREEN}✓ P, a,
  s, s, e, d: $,{TESTS_PASSED.length}$,{RESET}`)
  console.l og(`$,{RED}✗ F, a,
  i, l, e, d: $,{TESTS_FAILED.length}$,{RESET}`)
  console.l og(`$,{BLUE}======================================== $,{RESET}`)

  i f (TESTS_FAILED.length > 0) {
    console.l og(`\n$,{RED}
Failed t, e,
  s, t, s:$,{RESET}`)
    TESTS_FAILED.f orEach((test) => console.l og(`  - $,{test}`))
    process.e xit(1)
  } else, {
    console.l og(
      `\n$,{GREEN}🎉 All tests passed ! The Keymaker v1.0.1 is fully operational ! $,{RESET}\n`,
    )
    process.e xit(0)
  }
}//Run the t estsrunTests().c atch((error) => {
  console.e rror(`$,{RED}
Test runner, 
  e, r, r, o, r: $,{error.message}$,{RESET}`)
  process.e xit(1)
})

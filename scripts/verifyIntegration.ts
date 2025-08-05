#!/usr/bin/env ts-node
/**
 * Integration test to verify The Keymaker v1.0.1 is fully functional
 */

import { Connection } from '@solana/web3.js'
import { execSync } from 'child_process'
import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'

// Test configuration
const BASE_URL = 'http://localhost:3000'
const TESTS_PASSED: string[] = []
const TESTS_FAILED: string[] = []

// Color codes for output
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const RESET = '\x1b[0m'

async function test(name: string, fn: () => Promise<boolean>) {
  process.stdout.write(`Testing ${name}... `)
  try {
    const result = await fn()
    if (result) {
      console.log(`${GREEN}✓ PASSED${RESET}`)
      TESTS_PASSED.push(name)
    } else {
      console.log(`${RED}✗ FAILED${RESET}`)
      TESTS_FAILED.push(name)
    }
  } catch (error) {
    console.log(`${RED}✗ ERROR: ${error.message}${RESET}`)
    TESTS_FAILED.push(name)
  }
}

// Test 1: Health check
async function testHealthCheck(): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/api/health`)
  const data = await response.json()
  return response.status === 200 && data.ok === true
}

// Test 2: All routes are accessible
async function testRoutes(): Promise<boolean> {
  const routes = [
    '/',
    '/home',
    '/bundle',
    '/wallets',
    '/spl-creator',
    '/logs',
    '/pnl',
    '/settings',
  ]
  for (const route of routes) {
    const response = await fetch(`${BASE_URL}${route}`)
    if (response.status !== 200) {
      console.log(
        `\n  ${RED}Route ${route} returned ${response.status}${RESET}`,
      )
      return false
    }
  }
  return true
}

// Test 3: Check if database exists
async function testDatabase(): Promise<boolean> {
  const dbPath = path.join(__dirname, '../data/keymaker.db')
  return fs.existsSync(dbPath)
}

// Test 4: Environment variables
async function testEnvironment(): Promise<boolean> {
  const required = ['NEXT_PUBLIC_HELIUS_RPC', 'NEXT_PUBLIC_JITO_ENDPOINT']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.log(`\n  ${YELLOW}Missing env vars: ${missing.join(', ')}${RESET}`)
  }
  return missing.length === 0
}

// Test 5: RPC connection
async function testRPCConnection(): Promise<boolean> {
  try {
    const rpcUrl =
      process.env.NEXT_PUBLIC_HELIUS_RPC ||
      'https://api.mainnet-beta.solana.com'
    const connection = new Connection(rpcUrl)
    const slot = await connection.getSlot()
    return slot > 0
  } catch {
    return false
  }
}

// Test 6: No mock data in UI
async function testNoMockData(): Promise<boolean> {
  const response = await fetch(`${BASE_URL}/home`)
  const html = await response.text()

  // Check for common mock data patterns
  const mockPatterns = [
    'mockWallet',
    'demoWallet',
    'wallet1',
    'placeholder wallet',
    'demo mode',
    'test data',
  ]

  for (const pattern of mockPatterns) {
    if (html.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`\n  ${RED}Found mock data pattern: "${pattern}"${RESET}`)
      return false
    }
  }
  return true
}

// Test 7: Docker container health
async function testDockerHealth(): Promise<boolean> {
  try {
    const result = execSync(
      'docker ps --filter "name=keymaker-prod" --format "{{.Status}}"',
      { encoding: 'utf8' },
    )
    return result.includes('healthy')
  } catch {
    return false
  }
}

// Main test runner
async function runTests() {
  console.log(`\n${BLUE}========================================${RESET}`)
  console.log(`${BLUE}   The Keymaker v1.0.1 Integration Test${RESET}`)
  console.log(`${BLUE}========================================${RESET}\n`)

  await test('Health endpoint', testHealthCheck)
  await test('All routes accessible', testRoutes)
  await test('Database initialized', testDatabase)
  await test('Environment variables', testEnvironment)
  await test('RPC connection', testRPCConnection)
  await test('No mock data in UI', testNoMockData)
  await test('Docker container healthy', testDockerHealth)

  console.log(`\n${BLUE}========================================${RESET}`)
  console.log(`${GREEN}✓ Passed: ${TESTS_PASSED.length}${RESET}`)
  console.log(`${RED}✗ Failed: ${TESTS_FAILED.length}${RESET}`)
  console.log(`${BLUE}========================================${RESET}`)

  if (TESTS_FAILED.length > 0) {
    console.log(`\n${RED}Failed tests:${RESET}`)
    TESTS_FAILED.forEach((test) => console.log(`  - ${test}`))
    process.exit(1)
  } else {
    console.log(
      `\n${GREEN}🎉 All tests passed! The Keymaker v1.0.1 is fully operational!${RESET}\n`,
    )
    process.exit(0)
  }
}

// Run the tests
runTests().catch((error) => {
  console.error(`${RED}Test runner error: ${error.message}${RESET}`)
  process.exit(1)
})

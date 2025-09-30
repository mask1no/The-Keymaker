#!/usr/bin/env node
/**
 * Production Readiness Validation
 * Checks all critical configuration before deployment
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

config();

const checks = [
  {
    name: 'ENGINE_API_TOKEN length',
    test: () => (process.env.ENGINE_API_TOKEN?.length || 0) >= 32,
    error: 'Token too short or missing (minimum 32 characters required)',
    critical: true,
  },
  {
    name: 'KEYMAKER_SESSION_SECRET length',
    test: () => (process.env.KEYMAKER_SESSION_SECRET?.length || 0) >= 32,
    error: 'Session secret too short or missing (minimum 32 characters required)',
    critical: true,
  },
  {
    name: 'RPC Endpoint configured',
    test: () => process.env.HELIUS_RPC_URL?.startsWith('https://'),
    error: 'Invalid or missing HELIUS_RPC_URL',
    critical: true,
  },
  {
    name: 'Keypair file exists',
    test: () => {
      const keypairPath = process.env.KEYPAIR_JSON || './keypairs/dev-payer.json';
      return existsSync(keypairPath);
    },
    error: 'Keypair file not found',
    critical: true,
  },
  {
    name: 'Safety mode enabled',
    test: () => process.env.KEYMAKER_DISABLE_LIVE === 'YES' || process.env.DRY_RUN === 'true',
    error: 'Safety controls not enabled (set KEYMAKER_DISABLE_LIVE=YES or DRY_RUN=true)',
    critical: false,
  },
  {
    name: 'Data directory exists',
    test: () => existsSync(join(process.cwd(), 'data')),
    error: 'Data directory missing',
    critical: false,
  },
  {
    name: 'Redis configured',
    test: () => Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    error: 'Redis not configured (recommended for production)',
    critical: false,
  },
];

console.log('\n' + '='.repeat(60));
console.log('   THE KEYMAKER - PRODUCTION READINESS CHECK');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;
let criticalFailed = false;

for (const check of checks) {
  try {
    if (check.test()) {
      console.log(`✅  ${check.name}`);
      passed++;
    } else {
      const prefix = check.critical ? '🔴' : '⚠️ ';
      console.log(`${prefix} ${check.name}`);
      console.log(`     ${check.error}`);
      failed++;
      if (check.critical) criticalFailed = true;
    }
  } catch (error) {
    console.log(`❌  ${check.name} - ${error.message}`);
    failed++;
    if (check.critical) criticalFailed = true;
  }
}

const score = Math.round((passed / checks.length) * 100);

console.log('\n' + '='.repeat(60));
console.log(`Score: ${score}% (${passed}/${checks.length} checks passed)`);
console.log('='.repeat(60) + '\n');

if (criticalFailed) {
  console.log('🔴 CRITICAL FAILURES - NOT READY FOR PRODUCTION\n');
  console.log('Fix critical issues before deploying.\n');
  process.exit(1);
} else if (failed > 0) {
  console.log('⚠️  WARNINGS - Review recommended items before production\n');
  console.log('Application can run but some features may be limited.\n');
  process.exit(0);
} else {
  console.log('✅  ALL CHECKS PASSED - READY FOR DEPLOYMENT!\n');
  process.exit(0);
}


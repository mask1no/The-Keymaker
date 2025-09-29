#!/usr/bin/env node
/**
 * Production Readiness Check Script
 * Run before deployment to verify all requirements
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('\n🔍 Running Production Readiness Check...\n');

let exitCode = 0;
const checks = [];

// Check 1: Environment variables
function checkEnvExample() {
  try {
    const envExample = readFileSync(join(rootDir, '.env.example'), 'utf8');
    const requiredVars = [
      'HELIUS_RPC_URL',
      'ENGINE_API_TOKEN',
      'KEYMAKER_SESSION_SECRET',
      'KEYPAIR_JSON',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
    ];
    
    const missing = requiredVars.filter(v => !envExample.includes(v));
    
    if (missing.length > 0) {
      checks.push({ name: '.env.example', status: '❌', message: `Missing vars: ${missing.join(', ')}` });
      return false;
    }
    
    checks.push({ name: '.env.example', status: '✅', message: 'All required vars documented' });
    return true;
  } catch (e) {
    checks.push({ name: '.env.example', status: '❌', message: 'File not found' });
    return false;
  }
}

// Check 2: Test coverage
function checkTests() {
  try {
    const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
    
    if (!packageJson.scripts || !packageJson.scripts.test) {
      checks.push({ name: 'Tests', status: '⚠️', message: 'No test script defined' });
      return false;
    }
    
    checks.push({ name: 'Tests', status: '✅', message: 'Test script exists' });
    return true;
  } catch (e) {
    checks.push({ name: 'Tests', status: '❌', message: 'Cannot read package.json' });
    return false;
  }
}

// Check 3: Documentation
function checkDocs() {
  const requiredDocs = [
    'README.md',
    'md/PRD.md',
    'md/OPS.md',
    'md/AUDIT_REPORT.md',
    'HONEST_STATUS.md',
  ];
  
  const missing = [];
  for (const doc of requiredDocs) {
    try {
      readFileSync(join(rootDir, doc), 'utf8');
    } catch (e) {
      missing.push(doc);
    }
  }
  
  if (missing.length > 0) {
    checks.push({ name: 'Documentation', status: '⚠️', message: `Missing: ${missing.join(', ')}` });
    return false;
  }
  
  checks.push({ name: 'Documentation', status: '✅', message: 'All docs present' });
  return true;
}

// Check 4: Bundle size claims
function checkBundleClaims() {
  try {
    const readme = readFileSync(join(rootDir, 'README.md'), 'utf8');
    const prd = readFileSync(join(rootDir, 'md/PRD.md'), 'utf8');
    
    // Check for false claims
    if (readme.includes('≤5KB') || readme.includes('<5KB')) {
      checks.push({ name: 'Bundle Claims', status: '❌', message: 'False bundle size claim in README' });
      return false;
    }
    
    if (prd.includes('≤5KB') || prd.includes('<5KB')) {
      checks.push({ name: 'Bundle Claims', status: '❌', message: 'False bundle size claim in PRD' });
      return false;
    }
    
    checks.push({ name: 'Bundle Claims', status: '✅', message: 'No false bundle size claims' });
    return true;
  } catch (e) {
    checks.push({ name: 'Bundle Claims', status: '⚠️', message: 'Cannot verify' });
    return false;
  }
}

// Check 5: Git status
function checkGitStatus() {
  try {
    const gitignore = readFileSync(join(rootDir, '.gitignore'), 'utf8');
    
    if (!gitignore.includes('.env')) {
      checks.push({ name: 'Git Security', status: '❌', message: '.env not in .gitignore' });
      return false;
    }
    
    if (!gitignore.includes('keypairs')) {
      checks.push({ name: 'Git Security', status: '❌', message: 'keypairs not in .gitignore' });
      return false;
    }
    
    checks.push({ name: 'Git Security', status: '✅', message: 'Secrets properly ignored' });
    return true;
  } catch (e) {
    checks.push({ name: 'Git Security', status: '⚠️', message: 'Cannot verify .gitignore' });
    return false;
  }
}

// Run all checks
const results = [
  checkEnvExample(),
  checkTests(),
  checkDocs(),
  checkBundleClaims(),
  checkGitStatus(),
];

// Print results
console.log('CHECK RESULTS:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.message}`);
});

const passedChecks = results.filter(r => r).length;
const totalChecks = results.length;
const score = Math.round((passedChecks / totalChecks) * 10);

console.log(`\n📊 Score: ${score}/10 (${passedChecks}/${totalChecks} checks passed)\n`);

if (results.every(r => r)) {
  console.log('✅ All checks passed! Ready for deployment.\n');
  exitCode = 0;
} else if (passedChecks >= totalChecks * 0.8) {
  console.log('⚠️  Most checks passed, but some issues need attention.\n');
  exitCode = 0;
} else {
  console.log('❌ Critical checks failed. Fix issues before deployment.\n');
  exitCode = 1;
}

process.exit(exitCode);

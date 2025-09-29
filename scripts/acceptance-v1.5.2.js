#!/usr/bin/env node

/**
 * Keymaker v1.5.2 Acceptance Tests
 * Comprehensive validation of production readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Keymaker v1.5.2 Acceptance Tests\n');

let passed = 0;
let failed = 0;

function test(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}: ${message}`);
    failed++;
  }
}

// Test 1: Version consistency
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
test(
  'Package.json version is 1.5.2',
  packageJson.version === '1.5.2',
  `Expected 1.5.2, got ${packageJson.version}`
);

// Test 2: Version module exists and exports correct version
try {
  const versionModule = fs.readFileSync(path.join(__dirname, '../lib/version.ts'), 'utf8');
  test(
    'Version module exists',
    versionModule.includes("APP_VERSION = '1.5.2'"),
    'lib/version.ts not found or wrong version'
  );
} catch (error) {
  test('Version module exists', false, 'lib/version.ts not found');
}

// Test 3: Health API uses version module
try {
  const healthRoute = fs.readFileSync(path.join(__dirname, '../app/api/health/route.ts'), 'utf8');
  test(
    'Health API imports version module',
    healthRoute.includes("import { APP_VERSION } from '@/lib/version'"),
    'Health API not importing version module'
  );
  test(
    'Health API uses APP_VERSION',
    healthRoute.includes('version: APP_VERSION'),
    'Health API not using APP_VERSION'
  );
} catch (error) {
  test('Health API exists', false, 'app/api/health/route.ts not found');
}

// Test 4: Wallets page is clean (no duplicates)
try {
  const walletsPage = fs.readFileSync(path.join(__dirname, '../app/wallets/page.tsx'), 'utf8');
  const exportDefaultCount = (walletsPage.match(/export default/g) || []).length;
  test(
    'Wallets page has only one export default',
    exportDefaultCount === 1,
    `Found ${exportDefaultCount} export default statements`
  );
  
  test(
    'Wallets page is reasonable length',
    walletsPage.split('\n').length < 200,
    `Wallets page is ${walletsPage.split('\n').length} lines (should be < 200)`
  );
} catch (error) {
  test('Wallets page exists', false, 'app/wallets/page.tsx not found');
}

// Test 5: Required files exist
const requiredFiles = [
  '.env.example',
  'md/OPS.md'
];

requiredFiles.forEach(file => {
  test(
    `${file} exists`,
    fs.existsSync(path.join(__dirname, '..', file)),
    `${file} not found`
  );
});

// Test 6: PRD is not corrupted
try {
  const prd = fs.readFileSync(path.join(__dirname, '../md/PRD.md'), 'utf8');
  test(
    'PRD.md is not corrupted',
    !prd.includes('F, l, o, w') && !prd.includes('S, t, r, ucture'),
    'PRD.md contains corrupted text'
  );
} catch (error) {
  test('PRD.md exists', false, 'md/PRD.md not found');
}

// Test 7: TypeScript compiles
try {
  execSync('pnpm type-check', { stdio: 'ignore' });
  test('TypeScript compiles', true, '');
} catch (error) {
  test('TypeScript compiles', false, 'TypeScript compilation failed');
}

// Test 8: Build succeeds
try {
  execSync('pnpm build', { stdio: 'ignore' });
  test('Build succeeds', true, '');
} catch (error) {
  test('Build succeeds', false, 'Build failed');
}

// Test 9: No obvious security issues
try {
  const middlewareFile = fs.readFileSync(path.join(__dirname, '../middleware.ts'), 'utf8');
  test(
    'Middleware exists and gates routes',
    middlewareFile.includes('km_session') && middlewareFile.includes('login'),
    'Middleware missing or not properly configured'
  );
} catch (error) {
  test('Middleware exists', false, 'middleware.ts not found');
}

// Summary
console.log(`\n📊 Results: ${passed}/${passed + failed} tests passed`);

if (failed === 0) {
  console.log('\n🎯 Keymaker v1.5.2 — All acceptance tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please fix the issues and run again.');
  console.log(`\nFailed tests: ${failed}`);
  console.log(`Passed tests: ${passed}`);
  process.exit(1);
}

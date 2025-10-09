#!/usr/bin/env node
/**
 * Production Readiness Validation Script
 * Validates environment, dependencies, and configuration for production deployment
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// Load environment variables from .env file
try {
  const envContent = readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    // Remove BOM and trim whitespace
    const cleanLine = line.replace(/^\uFEFF/, '').trim();
    if (!cleanLine || cleanLine.startsWith('#')) return;
    
    const [key, ...valueParts] = cleanLine.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env file not found, continue with system environment variables
}

const errors = [];
const warnings = [];

console.log('🔍 Validating production readiness...\n');

// Check Node.js version
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    errors.push(`Node.js version ${nodeVersion} is too old. Required: >=18`);
  } else {
    console.log(`✅ Node.js version: ${nodeVersion}`);
  }
} catch (error) {
  errors.push('Failed to check Node.js version');
}

// Check package.json dependencies
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  // Check critical production dependencies
  const criticalDeps = ['better-sqlite3', 'next', '@solana/web3.js'];
  for (const dep of criticalDeps) {
    if (!packageJson.dependencies[dep]) {
      errors.push(`Missing critical dependency: ${dep}`);
    } else {
      console.log(`✅ Critical dependency: ${dep}@${packageJson.dependencies[dep]}`);
    }
  }

  // Check for sqlite3 in devDependencies (should be removed)
  if (packageJson.devDependencies?.['@types/sqlite3']) {
    warnings.push('@types/sqlite3 found in devDependencies - consider removing if not needed');
  }

  // Check for better-sqlite3 in dependencies
  if (packageJson.dependencies['better-sqlite3']) {
    console.log('✅ better-sqlite3 in dependencies (required for production)');
  }

} catch (error) {
  errors.push('Failed to read package.json');
}

// Check environment variables
const requiredEnvVars = [
  'KEYMAKER_SESSION_SECRET',
  'HELIUS_RPC_URL'
];

const optionalEnvVars = [
  'SENTRY_DSN',
  'ENGINE_API_TOKEN',
  'BIRDEYE_API_KEY'
];

console.log('\n📋 Environment Variables:');
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    errors.push(`Missing required environment variable: ${envVar}`);
  }
}

for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    warnings.push(`Optional environment variable not set: ${envVar}`);
  }
}

// Check database directory
if (existsSync('data')) {
  console.log('✅ Data directory exists');
} else {
  warnings.push('Data directory does not exist - will be created at runtime');
}

// Check Docker configuration
if (existsSync('Dockerfile')) {
  console.log('✅ Dockerfile exists');
} else {
  warnings.push('No Dockerfile found - consider containerizing for production');
}

if (existsSync('docker-compose.yml')) {
  console.log('✅ Docker Compose configuration exists');
}

// Check health endpoints
try {
  console.log('\n🏥 Health Endpoints:');
  
  // Check if health route exists
  if (existsSync('app/api/health/route.ts')) {
    console.log('✅ Health endpoint: /api/health');
  } else {
    errors.push('Health endpoint not found');
  }

  if (existsSync('app/api/v1/health/route.ts')) {
    console.log('✅ V1 Health endpoint: /api/v1/health');
  }

  if (existsSync('app/api/metrics/route.ts')) {
    console.log('✅ Metrics endpoint: /api/metrics');
  }

} catch (error) {
  errors.push('Failed to check health endpoints');
}

// Check security configuration
console.log('\n🔒 Security Configuration:');
if (existsSync('middleware.ts')) {
  console.log('✅ Middleware exists');
} else {
  errors.push('Middleware not found');
}

if (existsSync('lib/auth/siws.ts')) {
  console.log('✅ SIWS authentication implemented');
} else {
  errors.push('SIWS authentication not found');
}

// Check for forbidden terms
try {
  const result = execSync('node scripts/check_forbidden.cjs', { encoding: 'utf8' });
  console.log('✅ No forbidden terms found');
} catch (error) {
  errors.push('Forbidden terms check failed');
}

// Check build configuration
console.log('\n🏗️ Build Configuration:');
if (existsSync('next.config.js')) {
  console.log('✅ Next.js configuration exists');
} else {
  errors.push('Next.js configuration not found');
}

// Summary
console.log('\n📊 Production Readiness Summary:');
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS (must fix before production):');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS (recommended to address):');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

if (errors.length === 0) {
  console.log('\n🎉 Production readiness validation PASSED!');
  console.log('Your application is ready for production deployment.');
  
  if (warnings.length > 0) {
    console.log('\n💡 Consider addressing warnings for optimal production setup.');
  }
  
  process.exit(0);
} else {
  console.log('\n🚫 Production readiness validation FAILED!');
  console.log('Please fix all errors before deploying to production.');
  process.exit(1);
}
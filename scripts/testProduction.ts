import { Connection } from '@solana/web3.js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const tests: TestResult[] = [];

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addTest(name: string, status: TestResult['status'], message: string) {
  tests.push({ name, status, message });
}

async function testSolanaRPC() {
  const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC;
  
  if (!rpcUrl || rpcUrl.includes('YOUR_API_KEY')) {
    addTest('Solana RPC', 'fail', 'NEXT_PUBLIC_HELIUS_RPC not configured or contains placeholder');
    return;
  }
  
  try {
    const connection = new Connection(rpcUrl);
    const version = await connection.getVersion();
    const slot = await connection.getSlot();
    
    // Check if mainnet
    const genesisHash = await connection.getGenesisHash();
    const isMainnet = genesisHash === '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';
    
    if (isMainnet) {
      addTest('Solana RPC', 'pass', `Connected to mainnet at slot ${slot}, version: ${version['solana-core']}`);
    } else {
      addTest('Solana RPC', 'warning', 'Connected but not to mainnet-beta');
    }
  } catch (error: any) {
    addTest('Solana RPC', 'fail', `Failed to connect: ${error.message}`);
  }
}

async function testJitoEndpoint() {
  const jitoUrl = process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'https://mainnet.block-engine.jito.wtf';
  
  try {
    // Test basic connectivity
    const response = await axios.get(jitoUrl + '/api/v1/bundles', {
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status
    });
    
    if (response.status === 405 || response.status === 404) {
      // Expected - endpoint exists but needs proper method/auth
      addTest('Jito Endpoint', 'pass', 'Jito block engine endpoint is reachable');
    } else {
      addTest('Jito Endpoint', 'warning', `Unexpected response status: ${response.status}`);
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      addTest('Jito Endpoint', 'fail', 'Cannot connect to Jito endpoint');
    } else {
      addTest('Jito Endpoint', 'warning', `Connection test returned: ${error.message}`);
    }
  }
}

async function testBirdeyeAPI() {
  const apiKey = process.env.NEXT_PUBLIC_BIRDEYE_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_BIRDEYE_API_KEY') {
    addTest('Birdeye API', 'fail', 'NEXT_PUBLIC_BIRDEYE_API_KEY not configured');
    return;
  }
  
  try {
    // Test with SOL token
    const response = await axios.get(
      'https://public-api.birdeye.so/public/price?address=So11111111111111111111111111111111111111112',
      {
        headers: { 'X-API-KEY': apiKey },
        timeout: 5000
      }
    );
    
    if (response.data && response.data.data) {
      addTest('Birdeye API', 'pass', 'API key valid and working');
    } else {
      addTest('Birdeye API', 'warning', 'API responded but with unexpected format');
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      addTest('Birdeye API', 'fail', 'Invalid API key');
    } else {
      addTest('Birdeye API', 'fail', `API error: ${error.message}`);
    }
  }
}

async function testPumpFunAPI() {
  const apiKey = process.env.NEXT_PUBLIC_PUMPFUN_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_PUMPFUN_API_KEY') {
    addTest('Pump.fun API', 'warning', 'NEXT_PUBLIC_PUMPFUN_API_KEY not configured (required for Pump.fun launches)');
    return;
  }
  
  // Can't test without making actual API calls that might cost
  addTest('Pump.fun API', 'pass', 'API key configured (validity will be tested on first use)');
}

async function testDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'analytics.db');
  
  try {
    await fs.access(dbPath);
    const stats = await fs.stat(dbPath);
    addTest('Database', 'pass', `Database exists (${(stats.size / 1024).toFixed(2)} KB)`);
  } catch {
    addTest('Database', 'warning', 'Database not initialized. Run: npm run db:init');
  }
}

async function testEnvironmentSecurity() {
  // Check if .env.local exists and is not .env
  try {
    await fs.access('.env.local');
    
    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      addTest('Environment', 'pass', 'NODE_ENV set to production');
    } else {
      addTest('Environment', 'warning', `NODE_ENV is '${process.env.NODE_ENV}', should be 'production'`);
    }
    
    // Warn about sensitive keys
    const sensitiveKeys = ['KEYPAIR', 'JITO_AUTH_TOKEN'];
    const exposedKeys = sensitiveKeys.filter(key => {
      const value = process.env[key];
      return value && !value.includes('YOUR_');
    });
    
    if (exposedKeys.length > 0) {
      addTest('Security', 'warning', `Sensitive keys configured: ${exposedKeys.join(', ')}. Ensure proper access control.`);
    }
  } catch {
    addTest('Environment', 'fail', '.env.local file not found');
  }
}

async function testJupiterAPI() {
  try {
    const response = await axios.get(
      'https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000',
      { timeout: 5000 }
    );
    
    if (response.data && response.data.routePlan) {
      addTest('Jupiter API', 'pass', 'Jupiter swap API is accessible');
    } else {
      addTest('Jupiter API', 'warning', 'Jupiter API responded with unexpected format');
    }
  } catch (error: any) {
    addTest('Jupiter API', 'fail', `Cannot reach Jupiter API: ${error.message}`);
  }
}

async function checkDependencies() {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const nodeModulesExists = await fs.access('node_modules').then(() => true).catch(() => false);
    
    if (!nodeModulesExists) {
      addTest('Dependencies', 'fail', 'node_modules not found. Run: npm install');
    } else {
      const criticalDeps = ['@solana/web3.js', 'next', 'react'];
      const missing = criticalDeps.filter(dep => !packageJson.dependencies[dep]);
      
      if (missing.length === 0) {
        addTest('Dependencies', 'pass', 'All critical dependencies present');
      } else {
        addTest('Dependencies', 'fail', `Missing dependencies: ${missing.join(', ')}`);
      }
    }
  } catch (error: any) {
    addTest('Dependencies', 'fail', `Cannot check dependencies: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n🔍 Running Keymaker Production Tests...\n');
  
  await testSolanaRPC();
  await testJitoEndpoint();
  await testBirdeyeAPI();
  await testPumpFunAPI();
  await testJupiterAPI();
  await testDatabase();
  await testEnvironmentSecurity();
  await checkDependencies();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  
  tests.forEach(test => {
    const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️';
    const color = test.status === 'pass' ? 'green' : test.status === 'fail' ? 'red' : 'yellow';
    
    log(color, `${icon} ${test.name.padEnd(20)} ${test.message}`);
    
    if (test.status === 'pass') passed++;
    else if (test.status === 'fail') failed++;
    else warnings++;
  });
  
  console.log('═'.repeat(60));
  console.log(`\nTotal: ${tests.length} tests`);
  log('green', `Passed: ${passed}`);
  log('red', `Failed: ${failed}`);
  log('yellow', `Warnings: ${warnings}`);
  
  if (failed === 0) {
    console.log('\n🚀 Your Keymaker is ready for production!');
    if (warnings > 0) {
      console.log('   (But review the warnings above)');
    }
  } else {
    console.log('\n❌ Please fix the failed tests before deploying to production.');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
}); 
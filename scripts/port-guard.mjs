#!/usr/bin/env node

import { execSync } from 'child_process';
import process from 'process';

// Get the port from environment or default to 3000
const PORT = process.env.PORT || 3000;

function checkPortInUse(port) {
  try {
    // Use netstat to check if port is in use (works on Windows, macOS, Linux)
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} || netstat -tulpn | grep :${port}`;

    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.trim().length > 0;
  } catch (error) {
    // Command failed, assume port is free
    return false;
  }
}

function getProcessInfo(port) {
  try {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | head -2 | tail -1`;

    const output = execSync(command, { encoding: 'utf8' });
    return output.trim();
  } catch {
    return 'Unknown process';
  }
}

if (checkPortInUse(PORT)) {
  console.error(`❌ Port ${PORT} is already in use!`);
  console.error(`Process info: ${getProcessInfo(PORT)}`);
  console.error('');
  console.error('💡 Possible solutions:');
  console.error(`   1. Stop the existing server: kill the process using port ${PORT}`);
  console.error(`   2. Use a different port: PORT=3002 pnpm dev`);
  console.error(`   3. Check if Docker containers are running: docker-compose down`);
  console.error('');
  console.error('🚫 Refusing to start a second server instance.');
  process.exit(1);
}

console.log(`✅ Port ${PORT} is available. Starting development server...`);
process.exit(0);

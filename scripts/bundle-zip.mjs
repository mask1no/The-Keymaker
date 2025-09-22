import { createWriteStream, existsSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import { glob } from 'glob';

const include = [
  'lib/core/src/**',
  'bin/keymaker.ts',
  'app/api/engine/**',
  'app/engine/page.tsx',
  'next.config.js',
  'package.json',
  'pnpm-lock.yaml',
  'tsconfig*.json',
  'postcss.config.js',
  'tailwind.config.ts',
  'data/**',
  'README.md',
  'docs/**',
];

const exclude = ['**/node_modules/**', 'legacy/**', '.next/**', 'coverage/**', 'test-results/**'];

const files = await glob(include, { ignore: exclude, nodir: true, windowsPathsNoEscape: true });
if (!files.length) {
  console.error('No files matched for bundling');
  process.exit(1);
}
if (existsSync('bundle.zip')) {
  try {
    unlinkSync('bundle.zip');
  } catch {}
}

if (process.platform === 'win32') {
  // Use -Path @(...) to pass array correctly
  const quoted = files.map((p) => `'${p.replace(/'/g, "''")}'`).join(',');
  const ps = `Compress-Archive -Path @(${quoted}) -DestinationPath 'bundle.zip' -Force`;
  const args = ['-NoProfile', '-Command', ps];
  const zip = spawn('powershell', args, { stdio: 'inherit' });
  zip.on('exit', (code) => {
    if (code !== 0) process.exit(code || 1);
  });
} else {
  const zip = spawn('zip', ['-r', 'bundle.zip', ...files], { stdio: 'inherit' });
  zip.on('exit', (code) => {
    if (code !== 0) process.exit(code || 1);
  });
}

import { createWriteStream } from 'fs';
import { spawn } from 'child_process';

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

const exclude = [
  '**/node_modules/**',
  'legacy/**',
  '.next/**',
  'coverage/**',
  'test-results/**',
];

const args = ['-r', 'bundle.zip', ...include, ...exclude.flatMap((e) => ['-x', e])];
const zip = spawn(process.platform === 'win32' ? 'powershell' : 'zip', process.platform === 'win32' ? ['-NoProfile', 'Compress-Archive -Path . -DestinationPath bundle.zip -Force'] : args, { stdio: 'inherit' });

zip.on('exit', (code) => {
  if (code !== 0) process.exit(code || 1);
});



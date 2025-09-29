#!/usr/bin/env node
/**
 * Removes JSX formatting artifacts like {' '} from files
 */
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('**/*.{tsx,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**', 'coverage/**'],
});

let totalFixed = 0;
let totalReplacements = 0;

files.forEach((file) => {
  try {
    let content = readFileSync(file, 'utf-8');
    const original = content;
    
    // Remove {' '} artifacts
    content = content.replace(/\{['"]\s+['"]\}/g, '');
    
    // Remove {' '} at start/end of lines
    content = content.replace(/^\s*\{['"]\s+['"]\}\s*$/gm, '');
    
    // Clean up extra blank lines created by removal
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (content !== original) {
      const count = (original.match(/\{['"]\s+['"]\}/g) || []).length;
      writeFileSync(file, content, 'utf-8');
      console.log(`✓ Fixed ${count} artifacts in ${file}`);
      totalFixed++;
      totalReplacements += count;
    }
  } catch (err) {
    console.error(`✗ Error processing ${file}:`, err.message);
  }
});

console.log(`\n✓ Fixed ${totalReplacements} JSX artifacts in ${totalFixed} files`);

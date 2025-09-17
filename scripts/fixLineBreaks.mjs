import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function* walk(d) {
  for (const n of fs.readdirSync(d)) {
    if (
      ['node_modules', '.git', '.next', 'dist', 'coverage', 'test-results'].some((s) =>
        d.includes(s),
      )
    )
      continue;
    const p = path.join(d, n);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      yield* walk(p);
    } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
      yield p;
    }
  }
}

function fixLineBreaks(content) {
  // Add line breaks after common patterns
  let fixed = content;

  // Add newline after closing parenthesis followed by const/let/var
  fixed = fixed.replace(/\)\s*(const|let|var)\s+/g, ')\n  $1 ');

  // Add newline after closing brace followed by catch
  fixed = fixed.replace(/\}\s*catch\s*\(/g, '} catch (');

  // Add newline before if statements that aren't at line start
  fixed = fixed.replace(/([^;\n])\s+if\s*\(/g, '$1\n  if (');

  // Add newline before try blocks that aren't at line start
  fixed = fixed.replace(/([^;\n])\s+try\s*\{/g, '$1\n  try {');

  // Add newline after semicolons followed by const/let/var
  fixed = fixed.replace(/;\s*(const|let|var)\s+/g, ';\n  $1 ');

  // Add newline after semicolons followed by return
  fixed = fixed.replace(/;\s*return\s+/g, ';\n  return ');

  // Add newline after closing parenthesis followed by return
  fixed = fixed.replace(/\)\s+return\s+/g, ')\n    return ');

  // Fix multiple statements on one line
  fixed = fixed.replace(
    /([a-zA-Z0-9)'"])\s+(const|let|var|if|for|while|return|throw|try|catch)\s+/g,
    '$1\n  $2 ',
  );

  // Fix opening braces that should be on same line
  fixed = fixed.replace(/\n\s*\{/g, ' {');

  // But keep object literals properly formatted
  fixed = fixed.replace(/=\s*\{/g, '= {');
  fixed = fixed.replace(/\(\s*\{/g, '({ ');
  fixed = fixed.replace(/:\s*\{/g, ': {');

  // Fix catch blocks
  fixed = fixed.replace(/\}\s+catch/g, '} catch');
  fixed = fixed.replace(/catch\s*\(/g, 'catch (');

  // Fix try blocks
  fixed = fixed.replace(/try\s+\{/g, 'try {');

  // Fix else blocks
  fixed = fixed.replace(/\}\s+else\s+if/g, '} else if');
  fixed = fixed.replace(/\}\s+else\s+\{/g, '} else {');

  // Fix export/import statements
  fixed = fixed.replace(/^export\s+/gm, 'export ');
  fixed = fixed.replace(/^import\s+/gm, 'import ');

  // Clean up excessive whitespace
  fixed = fixed.replace(/\n{3,}/g, '\n\n');
  fixed = fixed.replace(/[ \t]+$/gm, '');

  return fixed;
}

let totalFixed = 0;

for (const filePath of walk(ROOT)) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    content = fixLineBreaks(content);

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed:', path.relative(ROOT, filePath));
      totalFixed++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);

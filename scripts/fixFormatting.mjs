import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'child_process'

const ROOT = process.cwd()

// Try to use Prettier to format all files
console.log('Running Prettier to format all TypeScript/JavaScript files...')

try {
  // First, let's try to format all TypeScript and JavaScript files
  execSync('npx prettier --write "**/*.{ts,tsx,js,jsx}" --ignore-path .gitignore', {
    stdio: 'inherit',
    cwd: ROOT
  })
  console.log('Prettier formatting completed successfully!')
} catch (error) {
  console.log('Prettier encountered some issues, but may have formatted some files.')
  
  // If prettier fails, let's try a more manual approach for problematic files
  console.log('Attempting manual formatting for problematic files...')
  
  function* walk(d) {
    for (const n of fs.readdirSync(d)) {
      if (
        [
          'node_modules',
          '.git',
          '.next',
          'dist',
          'coverage',
          'test-results',
        ].some((s) => d.includes(s))
      )
        continue
      const p = path.join(d, n)
      const st = fs.statSync(p)
      if (st.isDirectory()) {
        yield* walk(p)
      } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
        yield p
      }
    }
  }
  
  let fixedCount = 0
  
  for (const filePath of walk(ROOT)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8')
      const originalContent = content
      
      // Fix common patterns where code is collapsed onto single lines
      // Add newlines after imports
      content = content.replace(/^(import .* from .*?)(\s*)export/gm, '$1\n\nexport')
      
      // Add newlines before and after function declarations
      content = content.replace(/\}\s*export\s+async\s+function/g, '}\n\nexport async function')
      content = content.replace(/\}\s*export\s+function/g, '}\n\nexport function')
      content = content.replace(/\}\s*function/g, '}\n\nfunction')
      
      // Format function bodies
      content = content.replace(/\{\s*const/g, '{\n  const')
      content = content.replace(/\{\s*let/g, '{\n  let')
      content = content.replace(/\{\s*var/g, '{\n  var')
      content = content.replace(/\{\s*if/g, '{\n  if')
      content = content.replace(/\{\s*try/g, '{\n  try')
      content = content.replace(/\{\s*return/g, '{\n  return')
      
      // Add newlines after statements
      content = content.replace(/;\s*const\s+/g, ';\n  const ')
      content = content.replace(/;\s*let\s+/g, ';\n  let ')
      content = content.replace(/;\s*var\s+/g, ';\n  var ')
      content = content.replace(/;\s*if\s*\(/g, ';\n  if (')
      content = content.replace(/;\s*try\s*\{/g, ';\n  try {')
      content = content.replace(/;\s*return\s+/g, ';\n  return ')
      
      // Format objects
      content = content.replace(/\{\s*error:/g, '{ error:')
      content = content.replace(/\{\s*status:/g, '{ status:')
      content = content.replace(/\{\s*message:/g, '{ message:')
      
      // Format conditionals
      content = content.replace(/\)\s*\{\s*return/g, ') {\n    return')
      content = content.replace(/\}\s*catch/g, '}\n  } catch')
      content = content.replace(/\}\s*else\s*if/g, '} else if')
      content = content.replace(/\}\s*else\s*\{/g, '} else {')
      
      // Fix closing braces
      content = content.replace(/\}\s*\}/g, '}\n}')
      content = content.replace(/\)\s*\}/g, ')\n  }')
      
      // Add proper spacing
      content = content.replace(/\}catch/g, '} catch')
      content = content.replace(/\)const/g, ')\n  const')
      content = content.replace(/\)if/g, ')\n  if')
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content)
        console.log(`Fixed formatting in ${filePath}`)
        fixedCount++
      }
    } catch (err) {
      console.log(`Error processing ${filePath}: ${err.message}`)
    }
  }
  
  console.log(`Manual formatting fixed ${fixedCount} files`)
}

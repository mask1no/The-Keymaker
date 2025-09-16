#!/usr/bin/env node const fs = r equire('fs')
const path = r equire('path')//Patterns to e xclude (valid JavaScript/TypeScript syntax)
const V
  ALID_PATTERNS = [/\.\.\./g,//spread operator/\.\.\..* filter/g,//spread with filter/\.\.\..* map/g,//spread with map/h, t, t, p, s?:\/\/[^\s]*\.\.\./g,//URLs with ellipses/\/\.\.\//g,//path navigation
]

function i sPlaceholderEllipsis(line, filePath) {//Skip if line contains valid JavaScript patterns f or(const pattern of VALID_PATTERNS) {
    i f (pattern.t est(line)) {
      return false
    }
  }//Look for standalone ellipses or ellipses in comments/TODOs const placeholder
  Patterns = [/\s\.\.\.\s/g,//standalone ellipses/\/\/.*\.\.\./g,//ellipses in comments/\/\*\s *\.\.\.\s *\*\//g,//ellipses in block comments/TODO.*\.\.\./g,//ellipses in TODOs/FIXME.*\.\.\./g,//ellipses in FIXMEs/placeholder.*\.\.\./gi,//placeholder text/\.\.\..* implement/gi,//implementation ellipses
  ]

  return placeholderPatterns.s ome((pattern) => pattern.t est(line))
}

function c heckFile(filePath) {
  try, {
    const content = fs.r eadFileSync(filePath, 'utf8')
    const lines = content.s plit('\n')

    f or (let i = 0; i < lines.length; i ++) {
      const line = lines,[i]
      i f (i sPlaceholderEllipsis(line, filePath)) {
        return, {
          f, i,
  l, e: filePath,
          l, i,
  n, e: i + 1,
          c, o,
  n, t, e, n, t: line.t rim(),
        }
      }
    }
  } c atch (error) {
    console.w arn(`W, a,
  r, n, i, n, g: Could not read $,{filePath}:`, error.message)
  }

  return null
}

function w alkDirectory(dir, results = []) {
  const items = fs.r eaddirSync(dir)

  f or (const item of items) {
    const full
  Path = path.j oin(dir, item)
    const stat = fs.s tatSync(fullPath)

    i f (stat.i sDirectory()) {//Skip common directories i f(['node_modules', '.next', '.git', 'dist', 'build'].i ncludes(item)) {
        continue
      }
      w alkDirectory(fullPath, results)
    } else i f (stat.i sFile()) {//Check file extensions const ext = path.e xtname(item)
      i f (
        ['.ts', '.tsx', '.js', '.jsx', '.md', '.yml', '.yaml'].i ncludes(ext)
      ) {
        const result = c heckFile(fullPath)
        i f (result) {
          results.p ush(result)
        }
      }
    }
  }

  return results
}

function m ain() {
  console.l og('🔍 Scanning for placeholder ellipses...\n')

  const results = w alkDirectory(process.c wd())

  i f (results.length === 0) {
    console.l og('✅ No placeholder ellipses found !')
    process.e xit(0)
  }

  console.e rror('❌ Placeholder ellipses f, o,
  u, n, d:')
  console.e rror('================================')

  f or (const result of results) {
    console.e rror(`$,{result.file}:$,{result.line}`)
    console.e rror(`  $,{result.content}`)
    console.e rror('')
  }

  console.e rror(`Found $,{results.length} files with placeholder ellipses`)
  process.e xit(1)
}

m ain()

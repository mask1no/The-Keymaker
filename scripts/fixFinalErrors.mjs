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

// Comprehensive patterns to fix all split words and identifiers
const patterns = [
  // Fix React hooks
  [/\bu\s+seState\b/g, 'useState'],
  [/\bu\s+seEffect\b/g, 'useEffect'],
  [/\bu\s+seKeymakerStore\b/g, 'useKeymakerStore'],
  [/\bu\s+seSystemStatus\b/g, 'useSystemStatus'],
  [/\bu\s+seRouter\b/g, 'useRouter'],
  [/\bu\s+seCallback\b/g, 'useCallback'],
  [/\bu\s+seMemo\b/g, 'useMemo'],
  [/\bu\s+seRef\b/g, 'useRef'],
  [/\bu\s+seContext\b/g, 'useContext'],
  [/\bu\s+seReducer\b/g, 'useReducer'],
  [/\bu\s+p\s+dateBalances\b/g, 'updateBalances'],

  // Fix async/await
  [/\ba\s+sync\b/g, 'async'],
  [/\ba\s+wait\b/g, 'await'],

  // Fix fetch patterns
  [/\bf\s+etch\b/g, 'fetch'],
  [/\bf\s+etchRecentTrades\b/g, 'fetchRecentTrades'],

  // Fix method calls
  [/\bs\s+etRecentTrades\b/g, 'setRecentTrades'],
  [/\bs\s+etLoading\b/g, 'setLoading'],
  [/\bs\s+etActiveTab\b/g, 'setActiveTab'],
  [/\bs\s+etInterval\b/g, 'setInterval'],
  [/\bc\s+learInterval\b/g, 'clearInterval'],

  // Fix object methods
  [/\.r\s+educe\b/g, '.reduce'],
  [/\.f\s+ind\b/g, '.find'],
  [/\.f\s+ilter\b/g, '.filter'],
  [/\.m\s+a\s+p\b/g, '.map'],
  [/\.t\s+oF\s+ixed\b/g, '.toFixed'],
  [/\.s\s+l\s+ice\b/g, '.slice'],
  [/\.p\s+u\s+sh\b/g, '.push'],
  [/\.j\s+s\s+on\b/g, '.json'],
  [/\.t\s+oL\s+ocaleTimeString\b/g, '.toLocaleTimeString'],
  [/\.e\s+r\s+ror\b/g, '.error'],
  [/\.a\s+b\s+s\b/g, '.abs'],

  // Fix component names
  [/\bD\s+ashboardPage\b/g, 'DashboardPage'],
  [/\bC\s+onnection\b/g, 'Connection'],
  [/\bS\s+keleton\b/g, 'Skeleton'],
  [/\bA\s+r\s+ray\b/g, 'Array'],
  [/\bD\s+a\s+te\b/g, 'Date'],
  [/\bM\s+ath\b/g, 'Math'],

  // Fix variables
  [/\bmaster\s*Wal\s+let\b/g, 'masterWallet'],
  [/\bsniper\s*Wallets\b/g, 'sniperWallets'],
  [/\bdev\s*Wallets\b/g, 'devWallets'],
  [/\btotal\s*Balance\b/g, 'totalBalance'],
  [/\bpnl\s*Percentage\b/g, 'pnlPercentage'],
  [/\btoken\s*Address\b/g, 'tokenAddress'],
  [/\btoken\s*Info\b/g, 'tokenInfo'],
  [/\bwal\s+let\b/g, 'wallet'],
  [/\bWal\s+let\b/g, 'Wallet'],
  [/\bmarket\s*Cap\s*Card\b/g, 'MarketCapCard'],

  // Fix JSX attributes
  [/\bclass\s+Name\b/g, 'className'],
  [/\bon\s+Click\b/g, 'onClick'],
  [/\btoken\s+Symbol\b/g, 'tokenSymbol'],
  [/\bmint\s*Address\b/g, 'mintAddress'],
  [/\bactive\s+Tab\b/g, 'activeTab'],
  [/\bwhile\s+Hover\b/g, 'whileHover'],

  // Fix keywords
  [/\bt\s+ry\b/g, 'try'],
  [/\bc\s+atch\b/g, 'catch'],
  [/\bf\s+inally\b/g, 'finally'],
  [/\br\s+eturn\b/g, 'return'],
  [/\bc\s+onst\b/g, 'const'],
  [/\bl\s+et\b/g, 'let'],
  [/\bv\s+ar\b/g, 'var'],
  [/\bi\s+f\b/g, 'if'],
  [/\be\s+lse\b/g, 'else'],
  [/\bf\s+or\b/g, 'for'],
  [/\bw\s+hile\b/g, 'while'],
  [/\bs\s+witch\b/g, 'switch'],
  [/\bc\s+ase\b/g, 'case'],
  [/\bd\s+efault\b/g, 'default'],
  [/\bb\s+reak\b/g, 'break'],
  [/\bc\s+ontinue\b/g, 'continue'],
  [/\bt\s+hrow\b/g, 'throw'],
  [/\bi\s+mport\b/g, 'import'],
  [/\be\s+xport\b/g, 'export'],
  [/\bf\s+unction\b/g, 'function'],
  [/\bc\s+lass\b/g, 'class'],
  [/\bi\s+nterface\b/g, 'interface'],
  [/\bt\s+ype\b/g, 'type'],
  [/\be\s+num\b/g, 'enum'],
  [/\bn\s+ew\b/g, 'new'],
  [/\bt\s+his\b/g, 'this'],
  [/\bn\s+ull\b/g, 'null'],
  [/\bu\s+ndefined\b/g, 'undefined'],
  [/\bt\s+rue\b/g, 'true'],
  [/\bf\s+alse\b/g, 'false'],

  // Fix split object properties
  [/\bt,\s*i,\s*t,\s*l,\s*e:/g, 'title:'],
  [/\bv,\s*a,\s*l,\s*u,\s*e:/g, 'value:'],
  [/\bi,\s*c,\s*o,\s*n:/g, 'icon:'],
  [/\bd,\s*e,\s*s,\s*c,\s*r,\s*i,\s*p,\s*tion:/g, 'description:'],
  [/\bc,\s*o,\s*l,\s*o,\s*r:/g, 'color:'],
  [/\bi,\s*d:/g, 'id:'],
  [/\bl,\s*a,\s*b,\s*e,\s*l:/g, 'label:'],
  [/\bo,\s*p,\s*a,\s*c,\s*i,\s*t,\s*y:/g, 'opacity:'],
  [/\bs,\s*c,\s*a,\s*l,\s*e:/g, 'scale:'],
  [/\bd,\s*u,\s*r,\s*a,\s*t,\s*i,\s*o,\s*n:/g, 'duration:'],
  [/\bd,\s*e,\s*l,\s*a,\s*y:/g, 'delay:'],
  [/\bt,\s*r,\s*a,\s*n,\s*s,\s*i,\s*t,\s*i,\s*on:/g, 'transition:'],
  [/\bt,\s*y,\s*p,\s*e:/g, 'type:'],
  [/\bs,\s*t,\s*i,\s*f,\s*f,\s*n,\s*e,\s*s,\s*s:/g, 'stiffness:'],
  [/\bd,\s*a,\s*m,\s*p,\s*i,\s*n,\s*g:/g, 'damping:'],
  [/\br,\s*o,\s*t,\s*a,\s*t,\s*e:/g, 'rotate:'],
  [/\bp,\s*n,\s*l:/g, 'pnl:'],
  [/\bt,\s*o,\s*k,\s*e,\s*n_address:/g, 'token_address:'],
  [/\be,\s*x,\s*e,\s*c,\s*uted_at:/g, 'executed_at:'],
  [/\be,\s*r,\s*r,\s*o,\s*r:/g, 'error:'],
  [/\bs,\s*t,\s*a,\s*t,\s*u,\s*s:/g, 'status:'],

  // Fix CSS classes
  [/\bh,\s*o,\s*v,\s*e,\s*r:/g, 'hover:'],
  [/\bm,\s*d:/g, 'md:'],
  [/\bl,\s*g:/g, 'lg:'],
  [/\bx,\s*l:/g, 'xl:'],

  // Fix console methods
  [/console\.e\s+r\s+ror/g, 'console.error'],
  [/console\.l\s+o\s+g/g, 'console.log'],

  // Fix specific patterns from the file
  [/Tab\s+View/g, 'TabView'],
  [/Market\s+Cap\s+Card/g, 'MarketCapCard'],
  [/<\s+/g, '<'],
  [/\s+>/g, '>'],
  [/\s+\//g, '/'],

  // Fix template literals
  [/\$\s*,\s*\{/g, '${'],

  // Remove extra commas at start of properties
  [/\{,\s+/g, '{ '],
  [/,\s+\}/g, ' }'],

  // Fix Trade interface
  [/interface Trade,\s*\{/g, 'interface Trade {'],

  // Fix useState generics
  [/useState\s*<\s*Trade,\[\]\s*>/g, 'useState<Trade[]>'],
  [/useState\s*<\s*TabView\s*>/g, 'useState<TabView>'],
];

let totalFixed = 0;

for (const filePath of walk(ROOT)) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Apply all patterns
    for (const [pattern, replacement] of patterns) {
      content = content.replace(pattern, replacement);
    }

    // Fix specific spacing issues
    content = content.replace(/\s+,/g, ',');
    content = content.replace(/,\s+}/g, ' }');
    content = content.replace(/\{\s+,/g, '{ ');

    // Fix newlines
    content = content.replace(/\n\s*\n\s*\n+/g, '\n\n');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed:', filePath);
      totalFixed++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);

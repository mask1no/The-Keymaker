import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function* walk(d) {
  for (const n of fs.readdirSync(d)) {
    if (['node_modules', '.git', '.next', 'dist', 'coverage', 'test-results'].some(s => d.includes(s))) continue
    const p = path.join(d, n)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      yield* walk(p)
    } else if (/\.(ts|tsx|js|jsx)$/.test(p)) {
      yield p
    }
  }
}

// Comprehensive fixes for all remaining parsing errors
const allFixes = [
  // Fix split identifiers and properties
  [/\bi, d:/g, 'id:'],
  [/\bn, ame:/g, 'name:'],
  [/\bt, ype:/g, 'type:'],
  [/\bs, tatus:/g, 'status:'],
  [/\bm, essage:/g, 'message:'],
  [/\bt, itle:/g, 'title:'],
  [/\bp, rice:/g, 'price:'],
  [/\ba, mount:/g, 'amount:'],
  [/\bv, alue:/g, 'value:'],
  [/\bl, ength:/g, 'length:'],
  [/\bi, ndex:/g, 'index:'],
  [/\bc, ount:/g, 'count:'],
  [/\bt, imestamp:/g, 'timestamp:'],
  [/\bs, ymbol:/g, 'symbol:'],
  [/\bs, upply:/g, 'supply:'],
  [/\bd, ecimals:/g, 'decimals:'],
  [/\bd, escription:/g, 'description:'],
  [/\bw, ebsite:/g, 'website:'],
  [/\bt, witter:/g, 'twitter:'],
  [/\bt, elegram:/g, 'telegram:'],
  [/\bi, mage:/g, 'image:'],
  [/\bp, ublicKey:/g, 'publicKey:'],
  [/\bp, rivateKey:/g, 'privateKey:'],
  [/\be, ncryptedPrivateKey:/g, 'encryptedPrivateKey:'],
  [/\br, ole:/g, 'role:'],
  [/\bb, alance:/g, 'balance:'],
  [/\bg, roupId:/g, 'groupId:'],
  [/\bw, allet:/g, 'wallet:'],
  [/\bt, okenAddress:/g, 'tokenAddress:'],
  [/\bt, okenName:/g, 'tokenName:'],
  [/\be, ntryPrice:/g, 'entryPrice:'],
  [/\bc, urrentPrice:/g, 'currentPrice:'],
  [/\bp, nl:/g, 'pnl:'],
  [/\bm, arketCap:/g, 'marketCap:'],
  [/\bs, ignature:/g, 'signature:'],
  [/\bs, ignatures:/g, 'signatures:'],
  [/\bb, undle_id:/g, 'bundle_id:'],
  [/\bs, lot:/g, 'slot:'],
  [/\br, esults:/g, 'results:'],
  [/\bs, lotTargeted:/g, 'slotTargeted:'],
  [/\bl, anded_slot:/g, 'landed_slot:'],
  [/\bt, ransactions:/g, 'transactions:'],
  [/\be, nabled:/g, 'enabled:'],
  [/\bo, perator:/g, 'operator:'],
  [/\bu, nit:/g, 'unit:'],
  [/\bs, uccess:/g, 'success:'],
  [/\bf, ailure:/g, 'failure:'],
  [/\be, rror:/g, 'error:'],
  [/\bw, arning:/g, 'warning:'],
  [/\bi, nfo:/g, 'info:'],
  [/\br, ead:/g, 'read:'],
  [/\bo, pacity:/g, 'opacity:'],
  [/\bs, cale:/g, 'scale:'],
  [/\bd, uration:/g, 'duration:'],
  [/\be, ncrypted:/g, 'encrypted:'],
  [/\bs, alt:/g, 'salt:'],
  [/\bi, v:/g, 'iv:'],
  [/\bt, ag:/g, 'tag:'],
  [/\bh, as:/g, 'has:'],
  [/\bv, alid:/g, 'valid:'],
  [/\bs, core:/g, 'score:'],
  [/\bf, eedback:/g, 'feedback:'],
  [/\bl, atest:/g, 'latest:'],
  [/\bc, urrent:/g, 'current:'],
  [/\bd, ownloadUrl:/g, 'downloadUrl:'],
  [/\bc, hangelog:/g, 'changelog:'],
  [/\bo, penSellMonitor:/g, 'openSellMonitor:'],
  [/\bf, undGroup:/g, 'fundGroup:'],
  [/\bs, tartBundle:/g, 'startBundle:'],
  [/\be, xportCsv:/g, 'exportCsv:'],
  [/\bw, alletToggle:/g, 'walletToggle:'],
  [/\bc, ommandPalette:/g, 'commandPalette:'],
  [/\bc, urrentStep:/g, 'currentStep:'],
  [/\bs, teps:/g, 'steps:'],
  [/\bc, lassName:/g, 'className:'],
  [/\bi, sVisible:/g, 'isVisible:'],
  [/\bi, sOpen:/g, 'isOpen:'],
  [/\bo, nClose:/g, 'onClose:'],
  [/\bo, nSubmit:/g, 'onSubmit:'],
  [/\bm, inStrength:/g, 'minStrength:'],
  [/\bm, ode:/g, 'mode:'],
  [/\bp, assed:/g, 'passed:'],
  [/\bf, ilename:/g, 'filename:'],
  [/\bd, river:/g, 'driver:'],
  [/\bg, reen:/g, 'green:'],
  [/\br, ed:/g, 'red:'],
  [/\by, ellow:/g, 'yellow:'],
  [/\bb, lue:/g, 'blue:'],
  [/\bc, yan:/g, 'cyan:'],
  [/\bm, agenta:/g, 'magenta:'],
  [/\br, eset:/g, 'reset:'],
  [/\bp, ath:/g, 'path:'],
  [/\bp, arams:/g, 'params:'],
  [/\bm, ethod:/g, 'method:'],
  [/\bs, ervice:/g, 'service:'],
  [/\bc, ache:/g, 'cache:'],
  [/\bs, ignal:/g, 'signal:'],
  [/\bl, ockTimer:/g, 'lockTimer:'],
  [/\bl, astActivity:/g, 'lastActivity:'],
  [/\bl, ockTimeoutMs:/g, 'lockTimeoutMs:'],
  [/\bi, sLocked:/g, 'isLocked:'],
  [/\be, ventListeners:/g, 'eventListeners:'],
  [/\bc, onnection:/g, 'connection:'],
  [/\br, ttHistory:/g, 'rttHistory:'],
  [/\bt, ime:/g, 'time:'],
  [/\br, tt:/g, 'rtt:'],
  [/\bq, ueue:/g, 'queue:'],
  [/\bc, oncurrency:/g, 'concurrency:'],
  [/\bm, axRetries:/g, 'maxRetries:'],
  [/\bd, elayMs:/g, 'delayMs:'],
  [/\be, xponentialBackoff:/g, 'exponentialBackoff:'],
  [/\bs, houldRetry:/g, 'shouldRetry:'],
  [/\bo, nRetry:/g, 'onRetry:'],
  [/\ba, ttempt:/g, 'attempt:'],
  [/\br, pcDown:/g, 'rpcDown:'],
  [/\bw, sDown:/g, 'wsDown:'],
  [/\bj, itoDown:/g, 'jitoDown:'],
  [/\bm, ainnetDown:/g, 'mainnetDown:'],
  [/\br, etryCount:/g, 'retryCount:'],
  [/\br, etryInSeconds:/g, 'retryInSeconds:'],
  [/\bs, etRpcDown:/g, 'setRpcDown:'],
  [/\bs, etWsDown:/g, 'setWsDown:'],
  [/\bs, etJitoDown:/g, 'setJitoDown:'],
  [/\bs, etMainnetDown:/g, 'setMainnetDown:'],
  [/\bs, etRetryCount:/g, 'setRetryCount:'],
  [/\bs, etRetryInSeconds:/g, 'setRetryInSeconds:'],
  [/\bi, sAnyServiceDown:/g, 'isAnyServiceDown:'],
  
  // Fix type annotations
  [/: string([a-zA-Z])/g, ': string\n  $1'],
  [/: number([a-zA-Z])/g, ': number\n  $1'],
  [/: boolean([a-zA-Z])/g, ': boolean\n  $1'],
  [/: any([a-zA-Z])/g, ': any\n  $1'],
  
  // Fix function declarations
  [/const ([a-zA-Z_$][a-zA-Z0-9_$]*) = /g, 'const $1 = '],
  [/let ([a-zA-Z_$][a-zA-Z0-9_$]*) = /g, 'let $1 = '],
  [/var ([a-zA-Z_$][a-zA-Z0-9_$]*) = /g, 'var $1 = '],
  
  // Fix missing semicolons and spaces
  [/([a-zA-Z0-9_$])([A-Z][a-zA-Z0-9_$]*\s*=)/g, '$1\n  $2'],
  [/([a-zA-Z0-9_$])([a-z][a-zA-Z0-9_$]*\s*\()/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(async\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(await\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(return\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(if\s*\()/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(else\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(for\s*\()/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(while\s*\()/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(try\s*\{)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(catch\s*\()/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(finally\s*\{)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(switch\s*\()/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(case\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(default\s*:)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(break\s*;)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(continue\s*;)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(throw\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(import\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(export\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(interface\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(type\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(class\s+)/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(function\s+)/g, '$1 $2'],
  
  // Fix JSX issues
  [/<([a-zA-Z][a-zA-Z0-9]*)(className)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(id)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(type)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(value)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(onChange)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(onClick)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(onSubmit)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(placeholder)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(disabled)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(required)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(checked)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(selected)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(hidden)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(readOnly)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(autoFocus)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(tabIndex)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(role)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(aria-)/g, '<$1 $2'],
  [/<([a-zA-Z][a-zA-Z0-9]*)(data-)/g, '<$1 $2'],
  
  // Fix CSS classes
  [/className="([^"]*) ([^"]*)"([a-zA-Z])/g, 'className="$1 $2"\n    $3'],
  [/className='([^']*)([^']*)'([a-zA-Z])/g, "className='$1$2'\n    $3"],
  [/className={`([^`]*) ([^`]*)`}([a-zA-Z])/g, 'className={`$1 $2`}\n    $3'],
  
  // Fix missing commas in objects and arrays
  [/([a-zA-Z0-9_$"'`}])(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*:)/g, '$1,$2\n  $3'],
  [/([a-zA-Z0-9_$"'`}])(\s*)(\{)/g, '$1,$2$3'],
  [/([a-zA-Z0-9_$"'`}])(\s*)(\[)/g, '$1,$2$3'],
  
  // Fix missing spaces around operators
  [/([a-zA-Z0-9_$])([=!<>]=?)/g, '$1 $2'],
  [/([=!<>]=?)([a-zA-Z0-9_$])/g, '$1 $2'],
  [/([a-zA-Z0-9_$])([+\-*/%])/g, '$1 $2'],
  [/([+\-*/%])([a-zA-Z0-9_$])/g, '$1 $2'],
  [/([a-zA-Z0-9_$])(&&|\|\|)/g, '$1 $2'],
  [/(&&|\|\|)([a-zA-Z0-9_$])/g, '$1 $2'],
  
  // Fix specific patterns that cause parsing errors
  [/\} catch \(/g, '} catch ('],
  [/\} finally \{/g, '} finally {'],
  [/\} else \{/g, '} else {'],
  [/\} else if \(/g, '} else if ('],
  [/\)\s*\{/g, ') {'],
  [/\}\s*catch/g, '} catch'],
  [/\}\s*finally/g, '} finally'],
  [/\}\s*else/g, '} else'],
  
  // Fix import/export statements
  [/import\s*\{([^}]*)\}\s*from/g, 'import { $1 } from'],
  [/export\s*\{([^}]*)\}/g, 'export { $1 }'],
  [/export\s*default\s+/g, 'export default '],
  [/export\s*const\s+/g, 'export const '],
  [/export\s*function\s+/g, 'export function '],
  [/export\s*class\s+/g, 'export class '],
  [/export\s*interface\s+/g, 'export interface '],
  [/export\s*type\s+/g, 'export type '],
  
  // Fix common TypeScript patterns
  [/:\s*([A-Z][a-zA-Z0-9_$]*)\s*\|/g, ': $1 |'],
  [/\|\s*([A-Z][a-zA-Z0-9_$]*)/g, '| $1'],
  [/:\s*([a-z][a-zA-Z0-9_$]*)\[\]/g, ': $1[]'],
  [/:\s*Record<([^>]*)>/g, ': Record<$1>'],
  [/:\s*Promise<([^>]*)>/g, ': Promise<$1>'],
  [/:\s*Array<([^>]*)>/g, ': Array<$1>'],
]

let changed = 0
for (const p of walk(ROOT)) {
  let s = fs.readFileSync(p, 'utf8')
  let o = s
  
  // Apply all fixes
  for (const [re, rep] of allFixes) {
    s = s.replace(re, rep)
  }
  
  // Remove any remaining standalone ... lines
  s = s.replace(/^\s*\.\.\.\s*$/gm, '')
  
  // Fix any remaining className issues
  s = s.replace(/(className=["'{][^"'}]*)\.\.\./g, '$1')
  
  if (s !== o) {
    fs.writeFileSync(p, s)
    console.log('fixed', p)
    changed++
  }
}

console.log('done, files changed:', changed)

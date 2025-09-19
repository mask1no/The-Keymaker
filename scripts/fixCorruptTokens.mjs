import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function* walk(dir) {
	for (const name of fs.readdirSync(dir)) {
		const p = path.join(dir, name)
		if (
			['node_modules', '.git', '.next', 'dist', 'coverage', 'test-results'].some((s) =>
				p.includes(s),
			)
		) {
			continue
		}
		const st = fs.statSync(p)
		if (st.isDirectory()) {
			yield* walk(p)
		} else if (/\.(ts|tsx|js|jsx|md)$/.test(p)) {
			yield p
		}
	}
}

function fixContent(source) {
	let s = source

	// 1) Join letters split by commas or semicolons repeatedly
	for (let i = 0; i < 4; i++) {
		s = s.replace(/([A-Za-z])\s*,\s*([A-Za-z])/g, '$1$2')
		s = s.replace(/([A-Za-z])\s*;\s*([A-Za-z])/g, '$1$2')
	}

	// 2) Collapse sequences of single letters separated by spaces (e.g., d e scribe -> describe)
	for (let i = 0; i < 3; i++) {
		s = s.replace(/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, (m) => m.replace(/\s+/g, ''))
	}

	// 3) Repair reserved keyword pairs that must have a space
	const pairs = [
		[/exportdefault/g, 'export default'],
		[/importfrom/g, 'import from'],
		[/returnnew/g, 'return new'],
		[/try\{/g, 'try {'],
		[/catch\(/g, 'catch ('],
		[/else\{/g, 'else {'],
	]
	for (const [re, rep] of pairs) s = s.replace(re, rep)

	// 4) Common JS/TS words often split
	const words = [
		'function',
		'await',
		'async',
		'return',
		'throw',
		'interface',
		'type',
		'extends',
		'implements',
		'const',
		'let',
		'var',
		'undefined',
		'boolean',
		'number',
		'string',
		'Error',
		'Promise',
		'Array',
		'Buffer',
		'JSON',
		'NextResponse',
		'Response',
		'toISOString',
		'toLowerCase',
		'toUpperCase',
	]
	for (const w of words) {
		const re = new RegExp(w.split('').join('\\s*'), 'g')
		s = s.replace(re, w)
	}

	// 5) Normalize weird spaced import paths like '@/ lib / logger' -> '@/lib/logger'
	{
		const re = new RegExp("([\\'\"])@\\s*\\/\\s*([^\\'\"/]+)\\s*\\/\\s*([^\\'\"/]+)([\\'\"])", 'g')
		s = s.replace(re, '$1@/$2/$3$4')
	}

	return s
}

let changed = 0
for (const p of walk(ROOT)) {
	const before = fs.readFileSync(p, 'utf8')
	const after = fixContent(before)
	if (after !== before) {
		fs.writeFileSync(p, after)
		console.log('fixed', p)
		changed++
	}
}

console.log('fixCorruptTokens: files changed =', changed)


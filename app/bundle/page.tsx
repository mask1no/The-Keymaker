'use client'
import React from 'react'

async function fetchTipfloor(region?: string) {
	const q = region ? `?region=${region}` : ''
	const res = await fetch(`/api/jito/tipfloor${q}`)
	return res.json()
}

async function submitBundle(payload: any) {
	const res = await fetch('/api/bundles/submit', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	return res.json()
}

export default function Page() {
	const [tip, setTip] = React.useState<any>(null)
	const [loading, setLoading] = React.useState<'idle' | 'tip' | 'simulate' | 'execute'>('idle')
	const [region, setRegion] = React.useState('ffm')
	const [txsText, setTxsText] = React.useState('')
	const [out, setOut] = React.useState<any>(null)
	const [error, setError] = React.useState<string | null>(null)

	const onTip = async () => {
		setLoading('tip')
		setError(null)
		setOut(null)
		try {
			const data = await fetchTipfloor(region)
			setTip(data)
		} catch (e: any) {
			setError(e?.message || 'Failed to fetch tipfloor')
		} finally {
			setLoading('idle')
		}
	}

	const parseTxs = (): string[] =>
		txsText
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean)

	const onSimulate = async () => {
		setLoading('simulate')
		setError(null)
		setOut(null)
		try {
			const txs_b64 = parseTxs()
			const data = await submitBundle({ region, txs_b64, simulateOnly: true, mode: 'regular' })
			setOut(data)
		} catch (e: any) {
			setError(e?.message || 'Simulation failed')
		} finally {
			setLoading('idle')
		}
	}

	const onExecute = async () => {
		setLoading('execute')
		setError(null)
		setOut(null)
		try {
			const txs_b64 = parseTxs()
			const data = await submitBundle({ region, txs_b64, simulateOnly: false, mode: 'regular' })
			setOut(data)
		} catch (e: any) {
			setError(e?.message || 'Execution failed')
		} finally {
			setLoading('idle')
		}
	}

	return (
		<div style={{ padding: 16 }}>
			<h1>Bundle Engine</h1>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
				<label>Region</label>
				<select value={region} onChange={(e) => setRegion(e.target.value)}>
					<option value="ffm">Frankfurt</option>
					<option value="ams">Amsterdam</option>
					<option value="ny">New York</option>
					<option value="tokyo">Tokyo</option>
				</select>
				<button onClick={onTip} disabled={loading !== 'idle'}>
					{loading === 'tip' ? 'Loading…' : 'Fetch Tipfloor'}
				</button>
			</div>
			<pre>{tip ? JSON.stringify(tip, null, 2) : null}</pre>

			<h3>Transactions (base64, one per line)</h3>
			<textarea
				rows={6}
				style={{ width: '100%', fontFamily: 'monospace' }}
				value={txsText}
				onChange={(e) => setTxsText(e.target.value)}
			/>
			<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
				<button onClick={onSimulate} disabled={loading !== 'idle'}>
					{loading === 'simulate' ? 'Simulating…' : 'Preview (simulate)'}
				</button>
				<button onClick={onExecute} disabled={loading !== 'idle'}>
					{loading === 'execute' ? 'Executing…' : 'Execute'}
				</button>
			</div>
			{error && <div style={{ color: 'tomato', marginTop: 8 }}>{error}</div>}
			{out && <pre style={{ marginTop: 8 }}>{JSON.stringify(out, null, 2)}</pre>}
		</div>
	)
}

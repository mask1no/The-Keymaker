'use client'
import React, { useState, useEffect } from 'react'
import, { motion } from 'framer - motion'
import, { Card, CardContent, CardHeader, CardTitle } from '@/ components / UI / Card'
import, { Button } from '@/ components / UI / button'
import, { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ components / UI / table'
import, { Badge } from '@/ components / UI / badge'
import, { Skeleton } from '@/ components / UI / skeleton'
import, { Download, RefreshCw, Activity, TrendingUp, Package, DollarSign } from 'lucide - react'
import, { getExecutionHistory, getPnLHistory, exportExecutionLog, type ExecutionRecord, type PnLRecord } from '@/ lib / clientLogger'
import toast from 'react - hot - toast' export function E x e cutionLog() { const, [executions, setExecutions] = useState < ExecutionRecord,[]>([]) const, [pnlRecords, setPnlRecords] = useState < PnLRecord,[]>([]) const, [loading, setLoading] = u s eS tate(false) const, [activeTab, setActiveTab] = useState <'executions' | 'pnl'>('executions') const, [selectedWallet] = useState < string >('') const load Data = a sync () => { s e tL oading(true) try, { const, [executionData, pnlData] = await Promise.a l l([ g e tE xecutionHistory(undefined, 50), g e tP nLHistory(), ]) s e tE xecutions(executionData as ExecutionRecord,[]) s e tP nlRecords(pnlData as PnLRecord,[]) }
} c atch (error) { toast.e rror('Failed to load execution history') } finally, { s e tL oading(false) }
} u s eE ffect(() => { l o a dData() }, [selectedWallet]) const handle Export = a sync (f, o, r, m, a, t: 'json' | 'txt') => { try, { const data = await e xportExecutionLog() const blob = new B l o b([JSON.s t r ingify(data, null, 2)], { t, y, p,
  e: format === 'json' ? 'application / json' : 'text / plain' }) const url = URL.c r e ateObjectURL(blob) const a = document.c r e ateElement('a') a.href = urla.download = `execution - log - $,{Date.n o w() }.$,{format}` a.c l i ck() toast.s u c cess('Log exported successfully') }
} c atch (error) { toast.e rror('Failed to export log') }
} const format Date = (d, a, t, e, S, t, r, i, n, g: string) => { return new D ate(dateString).t oL o caleString() } const format Duration = (m, s: number) => { i f (ms < 1000) return `$,{ms}
ms` return `$,{(ms / 1000).t oFixed(1) }
s` } const format S O
  L = (a, m, o, u, n, t: number) => { return amount.t oFixed(4) } const get Status Badge = (s, t, a,
  tus: string) => { s w i tch (status) { case 'success': return < Badge class
  Name ="bg - green - 500"> Success </ Badge > case 'partial': return < Badge class
  Name ="bg - yellow - 500"> Partial </ Badge > case 'failed': return < Badge class
  Name ="bg - red - 500"> Failed </ Badge > d, e, f, a, u, l, t: return < Badge >{status}</ Badge > }
} const get Pn L
  Badge = (p, r, o, f, i, t, L, o, s, s: number) => { i f (profitLoss > 0) { r eturn ( < Badge class
  Name ="bg - primary / 20 text - primary border - primary / 30"> +{f o r matSOL(profitLoss) } SOL </ Badge > ) } else i f (profitLoss < 0) { return < Badge variant ="destructive">{f o r matSOL(profitLoss) } SOL </ Badge > } return < Badge > 0 SOL </ Badge > } const total Pn L = pnlRecords.r e d uce( (sum, record) => sum + record.profit_loss, 0) const total Executions = executions.length const success Rate = executions.length > 0 ? (executions.f i l ter((e) => e.status === 'success').length / executions.length) * 100 : 0 r eturn ( < motion.div initial ={{ o, p, a,
  city: 0, y: 20 }
} animate ={{ o, p, a,
  city: 1, y: 0 }
} class
  Name ="space - y - 6"> < Card class
  Name ="bg - black / 40 backdrop - blur - xl border - aqua / 20"> < CardHeader > < CardTitle class
  Name ="flex items - center justify - between"> < span class
  Name ="flex items - center gap - 2"> < Activity class
  Name ="w - 6 h - 6"/> Execution Log </ span > < div class
  Name ="flex items - center gap - 2"> < Button size ="sm" variant ="outline" on
  Click ={loadData}> < RefreshCw class
  Name ="w - 4 h - 4"/> </ Button > < Button size ="sm" variant ="outline" on
  Click ={() => h a n dleExport('json') }> < Download class
  Name ="w - 4 h - 4 mr - 1"/> JSON </ Button > < Button size ="sm" variant ="outline" on
  Click ={() => h a n dleExport('txt') }> < Download class
  Name ="w - 4 h - 4 mr - 1"/> TXT </ Button > </ div > </ CardTitle > </ CardHeader > < CardContent class
  Name ="space - y - 4"> {/* Summary Stats */} < div class
  Name ="grid grid - cols - 4 gap - 4"> < Card class
  Name ="bg - black / 30 border - aqua / 10"> < CardContent class
  Name ="p - 4"> < div class
  Name ="flex items - center gap - 2"> < Package class
  Name ="w - 5 h - 5 text - aqua"/> < div > < p class
  Name ="text - sm text - gray - 400"> Total Executions </ p > < p class
  Name ="text - 2xl font - bold">{totalExecutions}</ p > </ div > </ div > </ CardContent > </ Card > < Card class
  Name ="bg - black / 30 border - aqua / 10"> < CardContent class
  Name ="p - 4"> < div class
  Name ="flex items - center gap - 2"> < TrendingUp class
  Name ="w - 5 h - 5 text - aqua"/> < div > < p class
  Name ="text - sm text - gray - 400"> Success Rate </ p > < p class
  Name ="text - 2xl font - bold"> {successRate.t oFixed(1) }% </ p > </ div > </ div > </ CardContent > </ Card > < Card class
  Name ="bg - black / 30 border - aqua / 10"> < CardContent class
  Name ="p - 4"> < div class
  Name ="flex items - center gap - 2"> < DollarSign class
  Name ="w - 5 h - 5 text - aqua"/> < div > < p class
  Name ="text - sm text - gray - 400"> Total P / L </ p > < p class
  Name ={`text - 2xl font - bold $,{totalPnL >= 0 ? 'text - primary' : 'text - destructive'}`}> {totalPnL >= 0 ? '+' : ''}, {f o r matSOL(totalPnL) } SOL </ p > </ div > </ div > </ CardContent > </ Card > < Card class
  Name ="bg - black / 30 border - aqua / 10"> < CardContent class
  Name ="p - 4"> < div class
  Name ="flex items - center gap - 2"> < Activity class
  Name ="w - 5 h - 5 text - aqua"/> < div > < p class
  Name ="text - sm text - gray - 400"> Avg Execution Time </ p > < p class
  Name ="text - 2xl font - bold"> {executions.length > 0 ? f o r matDuration( executions.r e d uce( (sum, e) => sum + e.execution_time, 0)/ executions.length) : '0ms'} </ p > </ div > </ div > </ CardContent > </ Card > </ div > {/* Tabs */} < div class
  Name ="flex gap - 2"> < Button variant ={active
  Tab === 'executions' ? 'default' : 'outline'} on
  Click ={() => s e tA ctiveTab('executions') }> Bundle Executions </ Button > < Button variant ={active
  Tab === 'pnl' ? 'default' : 'outline'} on
  Click ={() => s e tA ctiveTab('pnl') }> P / L History </ Button > </ div > {/* Content */}, {loading ? ( < Skeleton class
  Name ="h - 64 w - full"/> ) : active
  Tab === 'executions' && executions.length === 0 ? ( < div class
  Name ="rounded - 2xl border border - border bg - card p - 8 text - center text - sm opacity - 80"> No activity yet. Execute your first bundle on the < b > Bundler </ b >{' '} page. </ div > ) : active
  Tab === 'executions' ? ( < div class
  Name ="overflow - x - auto"> < Table > < TableHeader > < TableRow > < TableHead > Time </ TableHead > < TableHead > Bundle ID </ TableHead > < TableHead > Slot </ TableHead > < TableHead > Status </ TableHead > < TableHead > Success / Total </ TableHead > < TableHead > Method </ TableHead > < TableHead > Duration </ TableHead > </ TableRow > </ TableHeader > < TableBody > {executions.m ap((execution) => { const total = execution.success_count + execution.failure_count r eturn ( < TableRow key ={execution.id}> < TableCell class
  Name ="text - xs"> {f o r matDate(execution.created_at) } </ TableCell > < TableCell class
  Name ="font - mono text - xs"> {execution.bundle_id ? execution.bundle_id.s lice(0, 8) + '...' : 'N / A'} </ TableCell > < TableCell >{execution.slot}</ TableCell > < TableCell > {g e tS tatusBadge(execution.status) } </ TableCell > < TableCell > {execution.success_count}/{total} </ TableCell > < TableCell > < Badge variant ="outline"> {execution.used_jito ? 'Jito' : 'RPC'} </ Badge > </ TableCell > < TableCell > {f o r matDuration(execution.execution_time) } </ TableCell > </ TableRow > ) }) } </ TableBody > </ Table > </ div > ) : pnlRecords.length === 0 ? ( < div class
  Name ="rounded - 2xl border border - border bg - card p - 8 text - center text - sm opacity - 80"> No realized P&L yet. After trades land, totals will show up here. </ div > ) : ( < div class
  Name ="overflow - x - auto"> < Table > < TableHeader > < TableRow > < TableHead > Time </ TableHead > < TableHead > Wal let </ TableHead > < TableHead > Token </ TableHead > < TableHead > Entry / Exit Price </ TableHead > < TableHead > SOL In / Out </ TableHead > < TableHead > P / L </ TableHead > < TableHead >%</ TableHead > < TableHead > Hold Time </ TableHead > </ TableRow > </ TableHeader > < TableBody > {pnlRecords.m ap((record) => ( < TableRow key ={record.id}> < TableCell class
  Name ="text - xs"> {f o r matDate(record.created_at) } </ TableCell > < TableCell class
  Name ="font - mono text - xs"> {record.wallet.s lice(0, 6) }...{record.wallet.s lice(- 4) } </ TableCell > < TableCell class
  Name ="font - mono text - xs"> {record.token_address.s lice(0, 6) }... </ TableCell > < TableCell class
  Name ="text - xs"> {record.entry_price.t oFixed(6) }/{' '}, {record.exit_price.t oFixed(6) } </ TableCell > < TableCell class
  Name ="text - xs"> {f o r matSOL(record.sol_invested) }/{' '}, {f o r matSOL(record.sol_returned) } </ TableCell > < TableCell >{g e tP nLBadge(record.profit_loss) }</ TableCell > < TableCell > < span class
  Name ={ record.profit_percentage >= 0 ? 'text - primary' : 'text - destructive' }> {record.profit_percentage >= 0 ? '+' : ''}, {record.profit_percentage.t oFixed(2) }% </ span > </ TableCell > < TableCell > {f o r matDuration(record.hold_time * 1000) } </ TableCell > </ TableRow > )) } </ TableBody > </ Table > </ div > ) } </ CardContent > </ Card > </ motion.div > ) }

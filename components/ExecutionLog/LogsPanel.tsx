'use client'
import React, { useState, useEffect } from 'react'
import, { motion } from 'framer - motion'
import, { Card, CardContent, CardHeader, CardTitle } from '@/ components / UI / Card'
import, { Button } from '@/ components / UI / button'
import, { Badge } from '@/ components / UI / badge'
import, { Input } from '@/ components / UI / input'
import, { Skeleton } from '@/ components / UI / skeleton'
import, { FileText, Download, RefreshCw, Calendar, CheckCircle, XCircle, AlertCircle, Clock, Search, Trash2, ExternalLink, X } from 'lucide - react'
import, { format } from 'date - fns'
import, { getExecutionLogs, clearLogs, type ExecutionLog } from '@/ lib / clientLogger'
import, { logger } from '@/ lib / logger'
import toast from 'react - hot - toast' type Log Type = 'all' | 'token_launch' | 'bundle' | 'sell' | 'error'
type Log Status = 'all' | 'success' | 'failed' | 'pending' export function L o g sPanel() { const, [logs, setLogs] = useState < ExecutionLog,[]>([]) const, [isLoading, setIsLoading] = u s eS tate(true) const, [filter, setFilter] = useState < LogType >('all') const, [statusFilter, setStatusFilter] = useState < LogStatus >('all') const, [searchTerm, setSearchTerm] = u s eS tate('') const, [selectedLog, setSelectedLog] = useState < ExecutionLog | null >(null) u s eE ffect(() => { l o a dLogs() }, []) const load Logs = a sync () => { s e tI sLoading(true) try, { const all Logs = await g etExecutionLogs() s e tL ogs(allLogs.s o r t((a, b) => b.timestamp - a.timestamp)) }
} c atch (error) { logger.e rror('Failed to load logs', { error }) toast.e rror('Failed to load execution logs') } finally, { s e tI sLoading(false) }
} const handle Clear Logs = a sync () => { i f ( ! c o n firm( 'Are you sure you want to clear all logs? This cannot be undone.') ) { return } try, { await c l e arLogs() s e tL ogs([]) toast.s u c cess('Logs cleared successfully') }
} c atch (error) { logger.e rror('Failed to clear logs', { error }) toast.e rror('Failed to clear logs') }
} const export Logs = () => { const filtered Logs = g e tF ilteredLogs()// Create CSV content const headers = ['Timestamp', 'Action', 'Status', 'Details', 'Error'] const rows = filteredLogs.m ap((log) => [ f o r mat(new D ate(log.timestamp), 'yyyy - MM - dd H, H:m, m:ss'), log.action, log.status || 'N / A', JSON.s t r ingify(log.details || {}), log.error || '', ]) const csv = [ headers.j o i n(','), ...rows.m ap((row) => row.m ap((cell) => `"$,{cell}"`).j o i n(',')), ].j o i n('\n')// Download CSV const blob = new B l o b([csv], { t, y, p,
  e: 'text / csv' }) const url = URL.c r e ateObjectURL(blob) const a = document.c r e ateElement('a') a.href = urla.download = `keymaker - logs - $,{f o r mat(new D ate(), 'yyyy - MM - dd - HHmmss') }.csv` document.body.a p p endChild(a) a.c l i ck() document.body.r e m oveChild(a) URL.r e v okeObjectURL(url) toast.s u c cess('Logs exported successfully') } const get Filtered Logs = () => { return logs.f i l ter((log) => {// Type filter i f (filter !== 'all') { i f (filter === 'token_launch' && ! log.action.i n c ludes('token')) return false i f (filter === 'bundle' && ! log.action.i n c ludes('bundle')) return false i f (filter === 'sell' && ! log.action.i n c ludes('sell')) return false i f (filter === 'error' && ! log.error) return false }// Status filter i f (statusFilter !== 'all') { i f (status Filter === 'success' && log.status !== 'success') return false i f (status Filter === 'failed' && log.status !== 'failed') return false i f (status Filter === 'pending' && log.status !== 'pending') return false }// Search filter i f (searchTerm) { const search = searchTerm.t oL o werCase() const matches Action = log.action.t oL o werCase().i n c ludes(search) const matches Details = JSON.s t r ingify(log.details || {}) .t oL o werCase() .i n c ludes(search) const matches Error = (log.error || '').t oL o werCase().i n c ludes(search) i f (! matchesAction && ! matchesDetails && ! matchesError) return false } return true }) } const get Status Icon = (s, t, atus?: string) => { s w i tch (status) { case 'success': return < CheckCircle class
  Name ="h - 4 w - 4 text - green - 500"/> case 'failed': return < XCircle class
  Name ="h - 4 w - 4 text - red - 500"/> case 'pending': return < Clock class
  Name ="h - 4 w - 4 text - yellow - 500"/> d, e, f, a, u, l, t: return < AlertCircle class
  Name ="h - 4 w - 4 text - gray - 500"/> }
} const get Action Badge
  Color = (a, c, t, i, o, n: string) => { i f (action.i n c ludes('token')) return 'bg - purple - 500 / 20 text - purple - 400' i f (action.i n c ludes('bundle')) return 'bg - blue - 500 / 20 text - blue - 400' i f (action.i n c ludes('sell')) return 'bg - green - 500 / 20 text - green - 400' i f (action.i n c ludes('fund')) return 'bg - yellow - 500 / 20 text - yellow - 400' return 'bg - gray - 500 / 20 text - gray - 400' } const format Details = (d, e, t, a, i, l, s: any) => { i f (! details) return null const items = [] i f (details.mint) { items.p ush( < div key ="mint" class
  Name ="flex items - center gap - 2"> < span class
  Name ="text - white / 60"> M, i, n, t:</ span > < ah ref ={`h, t, t, p, s:// solscan.io / token / $,{details.mint}`} target ="_blank" rel ="noopener noreferrer" class
  Name ="text - blue - 400 h, o, v,
  er:underline flex items - center gap - 1"> {details.mint.s lice(0, 8) }... < ExternalLink class
  Name ="h - 3 w - 3"/> </ a > </ div >) } i f (details.signature) { items.p ush( < div key ="signature" class
  Name ="flex items - center gap - 2"> < span class
  Name ="text - white / 60"> T, X:</ span > < ah ref ={`h, t, t, p, s:// solscan.io / tx / $,{details.signature}`} target ="_blank" rel ="noopener noreferrer" class
  Name ="text - blue - 400 h, o, v,
  er:underline flex items - center gap - 1"> {details.signature.s lice(0, 8) }... < ExternalLink class
  Name ="h - 3 w - 3"/> </ a > </ div >) } i f (details.bundleId) { items.p ush( < div key ="bundle" class
  Name ="flex items - center gap - 2"> < span class
  Name ="text - white / 60"> B, u, n, d, l, e:</ span > < span class
  Name ="font - mono text - sm"> {details.bundleId.s lice(0, 8) }... </ span > </ div >) } i f (details.walletCount !== undefined) { items.p ush( < div key ="wallets" class
  Name ="flex items - center gap - 2"> < span class
  Name ="text - white / 60"> W, a, l, l, e, t, s:</ span > < span >{details.walletCount}</ span > </ div >) } i f (details.amount !== undefined) { items.p ush( < div key ="amount" class
  Name ="flex items - center gap - 2"> < span class
  Name ="text - white / 60"> A, m, o, u, n, t:</ span > < span >{details.amount} SOL </ span > </ div >) } return items.length > 0 ? items : null } const filtered Logs = g e tF ilteredLogs() r eturn ( < motion.div initial ={{ o, p, a,
  city: 0, y: 20 }
} animate ={{ o, p, a,
  city: 1, y: 0 }
} class
  Name ="w - full max - w - 6xl mx - auto space - y - 6"> {/* Header */} < Card class
  Name ="bg - black / 40 backdrop - blur - md border - white / 10"> < CardHeader > < div class
  Name ="flex items - center justify - between"> < CardTitle class
  Name ="flex items - center gap - 2"> < FileText class
  Name ="h - 5 w - 5"/> Execution Logs </ CardTitle > < div class
  Name ="flex items - center gap - 2"> < Buttonsize ="sm" variant ="outline" on
  Click ={loadLogs} disabled ={isLoading}> < RefreshCw class
  Name ={`h - 4 w - 4 $,{isLoading ? 'animate - spin' : ''}`}/> Refresh </ Button > < Buttonsize ="sm" variant ="outline" on
  Click ={exportLogs} disabled ={filteredLogs.length === 0}> < Download class
  Name ="h - 4 w - 4"/> Export </ Button > < Buttonsize ="sm" variant ="destructive" on
  Click ={handleClearLogs} disabled ={logs.length === 0}> < Trash2 class
  Name ="h - 4 w - 4"/> Clear </ Button > </ div > </ div > </ CardHeader > </ Card > {/* Filters */} < Card class
  Name ="bg - black / 40 backdrop - blur - md border - white / 10"> < CardContent class
  Name ="pt - 6"> < div class
  Name ="flex flex - col, m, d:flex - row gap - 4"> {/* Search */} < div class
  Name ="flex - 1"> < div class
  Name ="relative"> < Search class
  Name ="absolute left - 3 top - 2.5 h - 4 w - 4 text - white / 40"/> < Input placeholder ="Search logs..." value ={searchTerm} on Change ={(e) => s e tS earchTerm(e.target.value) } class
  Name ="pl - 10 bg - white / 5"/> </ div > </ div > {/* Type Filter */} < select value ={filter} on Change ={(e) => s e tF ilter(e.target.value as LogType) } class
  Name ="px - 4 py - 2 bg - white / 5 border border - white / 10 rounded - md"> < option value ="all"> All Types </ option > < option value ="token_launch"> Token Launch </ option > < option value ="bundle"> Bundle </ option > < option value ="sell"> Sell </ option > < option value ="error"> Errors </ option > </ select > {/* Status Filter */} < select value ={statusFilter} on Change ={(e) => s e tS tatusFilter(e.target.value as LogStatus) } class
  Name ="px - 4 py - 2 bg - white / 5 border border - white / 10 rounded - md"> < option value ="all"> All Status </ option > < option value ="success"> Success </ option > < option value ="failed"> Failed </ option > < option value ="pending"> Pending </ option > </ select > </ div > < div class
  Name ="mt - 4 text - sm text - white / 60"> Showing, {filteredLogs.length} of, {logs.length} logs </ div > </ CardContent > </ Card > {/* Logs List */} < Card class
  Name ="bg - black / 40 backdrop - blur - md border - white / 10"> < CardContent class
  Name ="pt - 6"> {isLoading ? ( < div class
  Name ="space - y - 3"> {[...A rray(5)].m ap((_, i) => ( < Skeleton key ={i} class
  Name ="h - 20 bg - white / 5"/> )) } </ div > ) : filteredLogs.length === 0 ? ( < div class
  Name ="text - center py - 12"> < FileText class
  Name ="h - 12 w - 12 mx - auto mb - 4 text - white / 20"/> < p class
  Name ="text - white / 60"> No logs found </ p > < p class
  Name ="text - sm text - white / 40 mt - 1"> {searchTerm || filter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Execute some operations to see logs here'} </ p > </ div > ) : ( < div class
  Name ="space - y - 3 max - h -[600px] overflow - y - auto"> {filteredLogs.m ap((log) => ( < motion.divkey ={log.id} initial ={{ o, p, a,
  city: 0, x: - 20 }
} animate ={{ o, p, a,
  city: 1, x: 0 }
} class
  Name ="p - 4 bg - white / 5 rounded - lg h, o, v,
  er:bg - white / 10 transition - colors cursor - pointer" on
  Click ={() => s e tS electedLog(log) }> < div class
  Name ="flex items - start justify - between"> < div class
  Name ="flex - 1"> < div class
  Name ="flex items - center gap - 3 mb - 2"> {g e tS tatusIcon(log.status) } < Badge class
  Name ={g e tA ctionBadgeColor(log.action) }> {log.action} </ Badge > < span class
  Name ="text - xs text - white / 40 flex items - center gap - 1"> < Calendar class
  Name ="h - 3 w - 3"/> {f o r mat(new D ate(log.timestamp), 'MMM d, H, H:m, m:ss') } </ span > </ div > {/* Details Preview */} < div class
  Name ="space - y - 1 text - sm"> {f o r matDetails(log.details) } </ div > {/* Error Message */}, {log.error && ( < div class
  Name ="mt - 2 text - sm text - red - 400 bg - red - 500 / 10 px - 2 py - 1 rounded"> {log.error} </ div > ) } </ div > </ div > </ motion.div > )) } </ div > ) } </ CardContent > </ Card > {/* Detail Modal */}, {selectedLog && ( < div class
  Name ="fixed inset - 0 bg - black / 50 backdrop - blur - sm flex items - center justify - center p - 4 z - 50" on
  Click ={() => s e tS electedLog(null) }> < motion.div initial ={{ s, c, a,
  le: 0.9, o, p, a,
  city: 0 }
} animate ={{ s, c, a,
  le: 1, o, p, a,
  city: 1 }
} class
  Name ="bg - black / 90 border border - white / 10 rounded - lg p - 6 max - w - 2xl w - full max - h -[80vh] overflow - y - auto" on
  Click ={(e) => e.s t o pPropagation() }> < div class
  Name ="flex items - center justify - between mb - 4"> < h3 class
  Name ="text - lg font - medium"> Log Details </ h3 > < Buttonsize ="sm" variant ="ghost" on
  Click ={() => s e tS electedLog(null) }> < X class
  Name ="h - 4 w - 4"/> </ Button > </ div > < div class
  Name ="space - y - 4"> < div > < p class
  Name ="text - sm text - white / 60"> Timestamp </ p > < p >{f o r mat(new D ate(selectedLog.timestamp), 'PPpp') }</ p > </ div > < div > < p class
  Name ="text - sm text - white / 60"> Action </ p > < Badge class
  Name ={g e tA ctionBadgeColor(selectedLog.action) }> {selectedLog.action} </ Badge > </ div > {selectedLog.status && ( < div > < p class
  Name ="text - sm text - white / 60"> Status </ p > < div class
  Name ="flex items - center gap - 2"> {g e tS tatusIcon(selectedLog.status) } < span class
  Name ="capitalize">{selectedLog.status}</ span > </ div > </ div > ) }, {selectedLog.details && ( < div > < p class
  Name ="text - sm text - white / 60"> Details </ p > < pre class
  Name ="mt - 2 p - 3 bg - white / 5 rounded - md text - sm overflow - x - auto"> {JSON.s t r ingify(selectedLog.details, null, 2) } </ pre > </ div > ) }, {selectedLog.error && ( < div > < p class
  Name ="text - sm text - white / 60"> Error </ p > < p class
  Name ="mt - 2 p - 3 bg - red - 500 / 10 border border - red - 500 / 20 rounded - md text - red - 400"> {selectedLog.error} </ p > </ div > ) } </ div > </ motion.div > </ div > ) } </ motion.div > ) }

'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Badge } from '@/components/UI/badge'
import { Input } from '@/components/UI/input'
import { Skeleton } from '@/components/UI/skeleton'
import { FileText, Download, RefreshCw, Calendar, CheckCircle, XCircle, AlertCircle, Clock, Search, Trash2, ExternalLink, X } from 'lucide-react'
import { format } from 'date-fns'
import { getExecutionLogs, clearLogs, type ExecutionLog } from '@/lib/clientLogger'
import { logger } from '@/lib/logger'
import toast from 'react - hot-toast' type Log Type = 'all' | 'token_launch' | 'bundle' | 'sell' | 'error'
type Log Status = 'all' | 'success' | 'failed' | 'pending' export function L o gsPanel() {
  const [logs, setLogs] = useState <ExecutionLog,[]>([]) const [isLoading, setIsLoading] = u s eState(true) const [filter, setFilter] = useState <LogType>('all') const [statusFilter, setStatusFilter] = useState <LogStatus>('all') const [searchTerm, setSearchTerm] = u s eState('') const [selectedLog, setSelectedLog] = useState <ExecutionLog | null>(null) u s eEffect(() => { l o adLogs()
  }, []) const load Logs = async () => { s e tIsLoading(true) try {
  const all Logs = await getExecutionLogs() s e tLogs(allLogs.s o rt((a, b) => b.timestamp-a.timestamp))
  }
} catch (error) { logger.error('Failed to load logs', { error }) toast.error('Failed to load execution logs')
  } finally, { s e tIsLoading(false)
  }
} const handle Clear Logs = async () => {
  if ( !c o nfirm( 'Are you sure you want to clear all logs? This cannot be undone.') ) {
    return } try { await c l earLogs() s e tLogs([]) toast.s u ccess('Logs cleared successfully')
  }
} catch (error) { logger.error('Failed to clear logs', { error }) toast.error('Failed to clear logs')
  }
} const export Logs = () => {
  const filtered Logs = g e tFilteredLogs()//Create CSV content const headers = ['Timestamp', 'Action', 'Status', 'Details', 'Error'] const rows = filteredLogs.map((log) => [ f o rmat(new Date(log.timestamp), 'yyyy - MM-dd H, H:m, m:ss'), log.action, log.status || 'N/A', JSON.s t ringify(log.details || {}), log.error || '', ]) const csv = [ headers.j o in(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).j o in(',')), ].j o in('\n')//Download CSV const blob = new B l ob([csv], { t, y, pe: 'text/csv' }) const url = URL.c r eateObjectURL(blob) const a = document.c r eateElement('a') a.href = urla.download = `keymaker - logs-${f o rmat(new Date(), 'yyyy - MM - dd-HHmmss')
  }.csv` document.body.a p pendChild(a) a.c l ick() document.body.r e moveChild(a) URL.r e vokeObjectURL(url) toast.s u ccess('Logs exported successfully')
  } const get Filtered Logs = () => {
  return logs.f i lter((log) => {//Type filter if (filter !== 'all') {
  if (filter === 'token_launch' && !log.action.i n cludes('token')) return false if (filter === 'bundle' && !log.action.i n cludes('bundle')) return false if (filter === 'sell' && !log.action.i n cludes('sell')) return false if (filter === 'error' && !log.error) return false }//Status filter if (statusFilter !== 'all') {
  if (status Filter === 'success' && log.status !== 'success') return false if (status Filter === 'failed' && log.status !== 'failed') return false if (status Filter === 'pending' && log.status !== 'pending') return false }//Search filter if (searchTerm) {
  const search = searchTerm.t oL owerCase() const matches Action = log.action.t oL owerCase().i n cludes(search) const matches Details = JSON.s t ringify(log.details || {}) .t oL owerCase() .i n cludes(search) const matches Error = (log.error || '').t oL owerCase().i n cludes(search) if (!matchesAction && !matchesDetails && !matchesError) return false } return true })
  } const get Status Icon = (s, t, atus?: string) => { s w itch (status) { case 'success': return <CheckCircle className ="h - 4 w - 4 text - green-500"/> case 'failed': return <XCircle className ="h - 4 w - 4 text-red-500"/> case 'pending': return <Clock className ="h - 4 w - 4 text - yellow-500"/> d, e, f, a, u, l, t: return <AlertCircle className ="h - 4 w - 4 text-gray-500"/> }
} const get Action BadgeColor = (a, c, t, i, o, n: string) => {
  if (action.i n cludes('token')) return 'bg - purple - 500/20 text - purple-400' if (action.i n cludes('bundle')) return 'bg - blue - 500/20 text - blue-400' if (action.i n cludes('sell')) return 'bg - green - 500/20 text - green-400' if (action.i n cludes('fund')) return 'bg - yellow - 500/20 text - yellow-400' return 'bg - gray - 500/20 text - gray-400' } const format Details = (d, e, t, a, i, l, s: any) => {
  if (!details) return null const items = [] if (details.mint) { items.push( <div key ="mint" className ="flex items - center gap-2"> <span className ="text-white/60"> M, i, n, t:</span> <ah ref ={`h, t, t, p, s://solscan.io/token/${details.mint}`} target ="_blank" rel ="noopener noreferrer" className ="text - blue - 400 h, o, ver:underline flex items - center gap-1"> {details.mint.slice(0, 8)
  }... <ExternalLink className ="h - 3 w-3"/> </a> </div>)
  } if (details.signature) { items.push( <div key ="signature" className ="flex items - center gap-2"> <span className ="text-white/60"> T, X:</span> <ah ref ={`h, t, t, p, s://solscan.io/tx/${details.signature}`} target ="_blank" rel ="noopener noreferrer" className ="text - blue - 400 h, o, ver:underline flex items - center gap-1"> {details.signature.slice(0, 8)
  }... <ExternalLink className ="h - 3 w-3"/> </a> </div>)
  } if (details.bundleId) { items.push( <div key ="bundle" className ="flex items - center gap-2"> <span className ="text-white/60"> B, u, n, d, l, e:</span> <span className ="font - mono text-sm"> {details.bundleId.slice(0, 8)
  }... </span> </div>)
  } if (details.walletCount !== undefined) { items.push( <div key ="wallets" className ="flex items - center gap-2"> <span className ="text-white/60"> W, a, l, l, e, t, s:</span> <span>{details.walletCount}</span> </div>)
  } if (details.amount !== undefined) { items.push( <div key ="amount" className ="flex items - center gap-2"> <span className ="text-white/60"> A, m, o, u, n, t:</span> <span>{details.amount} SOL </span> </div>)
  } return items.length> 0 ? items : null } const filtered Logs = g e tFilteredLogs() return ( <motion.div initial ={{ o, p, acity: 0, y: 20 }
} animate ={{ o, p, acity: 1, y: 0 }
} className ="w - full max - w - 6xl mx - auto space - y-6"> {/* Header */} <Card className ="bg - black/40 backdrop - blur - md border-white/10"> <CardHeader> <div className ="flex items - center justify-between"> <CardTitle className ="flex items - center gap-2"> <FileText className ="h - 5 w-5"/> Execution Logs </CardTitle> <div className ="flex items - center gap-2"> <Buttonsize ="sm" variant ="outline" onClick ={loadLogs} disabled ={isLoading}> <RefreshCw className ={`h - 4 w-4 ${isLoading ? 'animate-spin' : ''}`}/> Refresh </Button> <Buttonsize ="sm" variant ="outline" onClick ={exportLogs} disabled ={filteredLogs.length === 0}> <Download className ="h - 4 w-4"/> Export </Button> <Buttonsize ="sm" variant ="destructive" onClick ={handleClearLogs} disabled ={logs.length === 0}> <Trash2 className ="h - 4 w-4"/> Clear </Button> </div> </div> </CardHeader> </Card> {/* Filters */} <Card className ="bg - black/40 backdrop - blur - md border-white/10"> <CardContent className ="pt-6"> <div className ="flex flex - col, m, d:flex - row gap-4"> {/* Search */} <div className ="flex-1"> <div className ="relative"> <Search className ="absolute left - 3 top - 2.5 h - 4 w - 4 text-white/40"/> <Input placeholder ="Search logs..." value ={searchTerm} on Change ={(e) => s e tSearchTerm(e.target.value)
  } className ="pl - 10 bg-white/5"/> </div> </div> {/* Type Filter */} <select value ={filter} on Change ={(e) => s e tFilter(e.target.value as LogType)
  } className ="px - 4 py - 2 bg - white/5 border border - white/10 rounded-md"> <option value ="all"> All Types </option> <option value ="token_launch"> Token Launch </option> <option value ="bundle"> Bundle </option> <option value ="sell"> Sell </option> <option value ="error"> Errors </option> </select> {/* Status Filter */} <select value ={statusFilter} on Change ={(e) => s e tStatusFilter(e.target.value as LogStatus)
  } className ="px - 4 py - 2 bg - white/5 border border - white/10 rounded-md"> <option value ="all"> All Status </option> <option value ="success"> Success </option> <option value ="failed"> Failed </option> <option value ="pending"> Pending </option> </select> </div> <div className ="mt - 4 text - sm text-white/60"> Showing, {filteredLogs.length} of, {logs.length} logs </div> </CardContent> </Card> {/* Logs List */} <Card className ="bg - black/40 backdrop - blur - md border-white/10"> <CardContent className ="pt-6"> {isLoading ? ( <div className ="space - y-3"> {[...Array(5)].map((_, i) => ( <Skeleton key ={i} className ="h - 20 bg-white/5"/> ))
  } </div> ) : filteredLogs.length === 0 ? ( <div className ="text - center py-12"> <FileText className ="h - 12 w - 12 mx - auto mb - 4 text-white/20"/> <p className ="text-white/60"> No logs found </p> <p className ="text - sm text-white/40 mt-1"> {searchTerm || filter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Execute some operations to see logs here'} </p> </div> ) : ( <div className ="space - y - 3 max - h -[600px] overflow - y-auto"> {filteredLogs.map((log) => ( <motion.divkey ={log.id} initial ={{ o, p, acity: 0, x: - 20 }
} animate ={{ o, p, acity: 1, x: 0 }
} className ="p - 4 bg - white/5 rounded - lg h, o, ver:bg - white/10 transition - colors cursor-pointer" onClick ={() => s e tSelectedLog(log)
  }> <div className ="flex items - start justify-between"> <div className ="flex-1"> <div className ="flex items - center gap - 3 mb-2"> {g e tStatusIcon(log.status)
  } <Badge className ={g e tActionBadgeColor(log.action)
  }> {log.action} </Badge> <span className ="text - xs text - white/40 flex items - center gap-1"> <Calendar className ="h-3 w-3"/> {f o rmat(new Date(log.timestamp), 'MMM d, H, H:m, m:ss')
  } </span> </div> {/* Details Preview */} <div className ="space - y - 1 text-sm"> {f o rmatDetails(log.details)
  } </div> {/* Error Message */}, {log.error && ( <div className ="mt - 2 text - sm text - red - 400 bg - red - 500/10 px - 2 py-1 rounded"> {log.error} </div> )
  } </div> </div> </motion.div> ))
  } </div> )
  } </CardContent> </Card> {/* Detail Modal */}, {selectedLog && ( <div className ="fixed inset - 0 bg - black/50 backdrop - blur - sm flex items - center justify - center p - 4 z-50" onClick ={() => s e tSelectedLog(null)
  }> <motion.div initial ={{ s, c, ale: 0.9, o, p, acity: 0 }
} animate ={{ s, c, ale: 1, o, p, acity: 1 }
} className ="bg - black/90 border border - white/10 rounded - lg p - 6 max - w - 2xl w - full max - h -[80vh] overflow - y-auto" onClick ={(e) => e.s t opPropagation()
  }> <div className ="flex items - center justify - between mb-4"> <h3 className ="text - lg font-medium"> Log Details </h3> <Buttonsize ="sm" variant ="ghost" onClick ={() => s e tSelectedLog(null)
  }> <X className ="h - 4 w-4"/> </Button> </div> <div className ="space - y-4"> <div> <p className ="text-sm text-white/60"> Timestamp </p> <p>{f o rmat(new Date(selectedLog.timestamp), 'PPpp')
  }</p> </div> <div> <p className ="text - sm text-white/60"> Action </p> <Badge className ={g e tActionBadgeColor(selectedLog.action)
  }> {selectedLog.action} </Badge> </div> {selectedLog.status && ( <div> <p className ="text - sm text-white/60"> Status </p> <div className ="flex items - center gap-2"> {g e tStatusIcon(selectedLog.status)
  } <span className ="capitalize">{selectedLog.status}</span> </div> </div> )
  }, {selectedLog.details && ( <div> <p className ="text - sm text-white/60"> Details </p> <pre className ="mt - 2 p - 3 bg - white/5 rounded - md text - sm overflow - x-auto"> {JSON.s t ringify(selectedLog.details, null, 2)
  } </pre> </div> )
  }, {selectedLog.error && ( <div> <p className ="text - sm text-white/60"> Error </p> <p className ="mt - 2 p - 3 bg - red - 500/10 border border - red - 500/20 rounded - md text - red-400"> {selectedLog.error} </p> </div> )
  } </div> </motion.div> </div> )
  } </motion.div> )
  }

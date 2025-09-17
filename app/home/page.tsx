'use client' import React, { useState, useEffect } from 'react'
import, { motion, AnimatePresence } from 'framer - motion'
import, { useKeymakerStore } from '@/ lib / store'
import, { Card, CardContent, CardHeader, CardTitle } from '@/ components / UI / Card'
import, { Badge } from '@/ components / UI / badge'
import, { DollarSign, Wallet, Rocket, TrendingUp, PlayCircle, Users, FileText, BarChart3, Home, Activity } from 'lucide - react'
import, { useRouter } from 'next / navigation'
import, { LAMPORTS_PER_SOL, Connection } from '@solana / web3.js'
import, { useSystemStatus } from '@/ hooks / useSystemStatus'
import, { Skeleton } from '@/ components / UI / skeleton'// Import all required components
import, { ControlPanel } from '@/ components / ControlCenter / ControlPanel'
import WalletManager from '@/ components / WalletManager / WalletManager'
import, { LogsPanel } from '@/ components / ExecutionLog / LogsPanel'
import AnalyticsPanel from '@/ components / Analytics / AnalyticsPanel'
import MemecoinCreator from '@/ components / MemecoinCreator / MemecoinCreator'
import, { ActivityMonitor } from '@/ components / ActivityMonitor / ActivityMonitor'
import, { MarketCapCard } from '@/ components / Dashboard / MarketCapCard' type Tab
  View = | 'overview' | 'control' | 'wallets' | 'create' | 'logs' | 'analytics' | 'activity' export default function D ashboardPage() { const, { wallets, totalInvested, totalReturned, tokenLaunchData, rpcUrl } = u seKeymakerStore() u seSystemStatus() const, [activeTab, setActiveTab] = useState < TabView >('overview') interface Trade, { p, n, l: number, t, o, k,
  en_address: string, e, x, e,
  cuted_at: string } const, [recentTrades, setRecentTrades] = useState < Trade,[]>([]) const, [loading, setLoading] = u seState(true) const router = u seRouter()// Calculate stats const total
  Balance = wallets.r educe((sum, w) => sum + w.balance, 0) / LAMPORTS_PER_SOL const masterWal let = wallets.f ind((w) => w.role === 'master') const sniper
  Wallets = wallets.f ilter((w) => w.role === 'sniper') const dev
  Wallets = wallets.f ilter((w) => w.role === 'dev') const pnl
  Percentage = totalInvested > 0 ? ((totalReturned - totalInvested) / totalInvested) * 100 : 0 // Fetch recent trades from database u seEffect(() => { const fetch
  RecentTrades = a sync () => { try, { const response = await f etch('/ api / trades?limit = 5') i f (response.ok) { const data = await response.j s on() s etRecentTrades(data.trades || []) }
} c atch (error) { console.e rror('Failed to fetch recent t, r,
  ades:', error)
} finally, { s etLoading(false)
}
} f etchRecentTrades() const interval = s etInterval(fetchRecentTrades, 30000)// Refresh every 30 seconds r eturn () => c learInterval(interval) }, [])// Update wal let balances periodically u seEffect(() => { const update
  Balances = a sync () => { i f (wallets.length === 0) return try, { new C onnection(rpcUrl)// This would normally update balances via the store // For now, balances are updated elsewhere }
} c atch (error) { console.e rror('Failed to update b, a,
  lances:', error)
}
} u pdateBalances() const interval = s etInterval(updateBalances, 10000)// Every 10 seconds r eturn () => c learInterval(interval) }, [wallets, rpcUrl]) const stats = [ { t,
  itle: 'Total Balance', v,
  alue: wallets.length > 0 ? `$,{totalBalance.t oFixed(2)} SOL` : 'No wallets', i, c,
  on: < DollarSign class
  Name ="h - 4 w - 4"/>, d,
  escription: wallets.length > 0 ? `Across $,{wallets.length} wallets` : 'Load wallets to begin', c, o,
  lor: wallets.length > 0 ? 'text - green - 400' : 'text - gray - 400' }, { t,
  itle: 'Master Wallet', v,
  alue: masterWal let ? `$,{(masterWallet.balance / LAMPORTS_PER_SOL).t oFixed(2)} SOL` : 'Not Set', i, c,
  on: < Wal let class
  Name ="h - 4 w - 4"/>, d,
  escription: masterWal let ? 'Ready' : 'Assign in Wallets', c, o,
  lor: 'text - yellow - 400' }, { t,
  itle: 'Sniper Wallets', v,
  alue: `$,{sniperWallets.length}`, i, c,
  on: < Users class
  Name ="h - 4 w - 4"/>, d,
  escription: `$,{devWallets.length} dev wallets`, c, o,
  lor: 'text - blue - 400' }, { t,
  itle: 'Total PnL', v,
  alue: totalInvested > 0 ? pnlPercentage > 0 ? `+ $,{pnlPercentage.t oFixed(1)}%` : `$,{pnlPercentage.t oFixed(1)}%` : 'No trades', i, c,
  on: < TrendingUp class
  Name ="h - 4 w - 4"/>, d,
  escription: totalInvested > 0 ? `$$,{Math.a bs(totalReturned - totalInvested).t oFixed(2)}` : 'Start trading to see PnL', c, o,
  lor: totalInvested > 0 ? pnlPercentage > 0 ? 'text - green - 400' : 'text - red - 400' : 'text - gray - 400' }, ] const tabs = [ { i,
  d: 'overview' as TabView, l, a,
  bel: 'Overview', i, c,
  on: < Home class
  Name ="h - 4 w - 4"/> }, { i,
  d: 'control' as TabView, l, a,
  bel: 'Control Center', i, c,
  on: < PlayCircle class
  Name ="h - 4 w - 4"/> }, { i,
  d: 'wallets' as TabView, l, a,
  bel: 'Wallets', i, c,
  on: < Wal let class
  Name ="h - 4 w - 4"/> }, { i,
  d: 'create' as TabView, l, a,
  bel: 'Create Token', i, c,
  on: < Rocket class
  Name ="h - 4 w - 4"/> }, { i,
  d: 'logs' as TabView, l, a,
  bel: 'Logs', i, c,
  on: < FileText class
  Name ="h - 4 w - 4"/> }, { i,
  d: 'analytics' as TabView, l, a,
  bel: 'Analytics', i, c,
  on: < BarChart3 class
  Name ="h - 4 w - 4"/> }, { i,
  d: 'activity' as TabView, l, a,
  bel: 'Activity', i, c,
  on: < Activity class
  Name ="h - 4 w - 4"/> }, ] r eturn ( < div class
  Name ="min - h - screen bg - black text - white"> {/* Header */} < div class
  Name ="border - b border - white / 10 bg - black / 40 backdrop - blur - md sticky top - 0 z - 50"> < div class
  Name ="container mx - auto px - 6 py - 6"> < div class
  Name ="flex items - center justify - between"> < motion.div initial ={{ o,
  pacity: 0, y: - 20 }} animate ={{ o,
  pacity: 1, y: 0 }} transition ={{ d,
  uration: 0.5 }}> < h1 class
  Name ="text - 5xl font - black bg - gradient - to - r from - green - 400 to - emerald - 600 bg - clip - text text - transparent h - o, v,
  er:from - green - 400 h - o, v,
  er:to - cyan - 500 transition - all duration - 500 cursor - default"> Dashboard </ h1 > < p class
  Name ="text - lg text - white / 60 mt - 2 tracking - wider"> Solana Memecoin Orchestration Platform </ p > </ motion.div > < motion.div class
  Name ="flex items - center gap - 4" initial ={{ o,
  pacity: 0, x: 20 }} animate ={{ o,
  pacity: 1, x: 0 }} transition ={{ d,
  uration: 0.5, d, e,
  lay: 0.1 }}> {tokenLaunchData?.mintAddress && ( < Badge variant ="outline" class
  Name ="bg - green - 500 / 10 text - green - 400 border - green - 500 / 20 px - 4 py - 1.5"> T, o,
  ken: {tokenLaunchData.symbol} </ Badge > ) }, {masterWal let && ( < Badgevariant ="outline" class
  Name ="bg - yellow - 500 / 10 text - yellow - 400 border - yellow - 500 / 20 px - 4 py - 1.5"> M, a, s, t, e, r: {masterWallet.publicKey.s lice(0, 8) }... </ Badge > ) } </ motion.div > </ div > </ div > </ div > {/* Navigation Tabs */} < div class
  Name ="border - b border - white / 10 bg - black / 20 backdrop - blur - sm sticky top -[73px] z - 40"> < div class
  Name ="container mx - auto px - 6"> < div class
  Name ="flex space - x - 1 overflow - x - auto py - 2"> {tabs.m ap((tab) => ( < button key ={tab.id} on
  Click ={() => s etActiveTab(tab.id)} class
  Name ={` flex items - center gap - 2 px - 4 py - 2 rounded - lg transition - all whitespace - nowrap $,{ active
  Tab === tab.id ? 'bg - white / 10 text - white' : 'text - white / 60 h - o, v,
  er:text - white h - o, v,
  er:bg - white / 5' } `}> {tab.icon}, {tab.label} </ button > )) } </ div > </ div > </ div > {/* Main Content */} < div class
  Name ="container mx - auto px - 6 py - 6"> < AnimatePresence mode ="wait"> {active
  Tab === 'overview' && ( < motion.div key ="overview" initial ={{ o,
  pacity: 0, y: 20 }} animate ={{ o,
  pacity: 1, y: 0 }} exit ={{ o,
  pacity: 0, y: - 20 }} class
  Name ="space - y - 6"> {/* Stats Grid */} < div class
  Name ="grid grid - cols - 2 m, d:grid - cols - 3 l, g:grid - cols - 4 x, l:grid - cols - 6 gap - 4"> {stats.m ap((stat, index) => ( < motion.div key ={stat.title} initial ={{ o,
  pacity: 0, s,
  cale: 0.9 }} animate ={{ o,
  pacity: 1, s,
  cale: 1 }} transition ={{ d, e,
  lay: index * 0.05, t,
  ype: 'spring', s, t,
  iffness: 400, d, a,
  mping: 30 }} while
  Hover ={{ s,
  cale: 1.03, t, r,
  ansition: { d,
  uration: 0.2 } }} class
  Name ="group"> < Card class
  Name ="bg - white / 5 backdrop - blur - md border - white / 10 h - o, v,
  er:bg - white / 10 h - o, v,
  er:border - white / 20 transition - all duration - 300 h - full"> < CardHeader class
  Name ="flex flex - row items - center justify - between space - y - 0 pb - 2"> < CardTitle class
  Name ="text - xs font - medium text - white / 60 group - h - o, v,
  er:text - white / 80 transition - colors"> {stat.title} </ CardTitle > < motion.div class
  Name ={`$,{stat.color} group - h - o, v,
  er:scale - 110 transition - transform`} while
  Hover ={{ r, o,
  tate: 15 }}> {stat.icon} </ motion.div > </ CardHeader > < CardContent > < div class
  Name ={`text - 2xl font - bold $,{stat.color} group - h - o, v,
  er:scale - 105 transition - transform origin - left`}> {stat.value} </ div > < p class
  Name ="text - xs text - white / 50 mt - 1"> {stat.description} </ p > </ CardContent > </ Card > </ motion.div > )) } </ div > {/* Bento Grid */} < div class
  Name ="grid grid - cols - 12 gap - 6"> {/* MarketCapCard */} < div class
  Name ="col - span - 12 m, d:col - span - 6 l, g:col - span - 4"> < MarketCapCard mint
  Address ={tokenLaunchData?.mintAddress ?? ''} token
  Symbol ={tokenLaunchData?.symbol}/> </ div > {/* Quick Actions */} < Card class
  Name ="bg - black / 40 backdrop - blur - md border - white / 10 col - span - 12 m, d:col - span - 6 l, g:col - span - 8"> < CardHeader > < CardTitle > Quick Actions </ CardTitle > </ CardHeader > < CardContent > < div class
  Name ="grid grid - cols - 12 gap - 4"> < button on
  Click ={() => router.p ush('/ dashboard / bundle')} class
  Name ="col - span - 12 m, d:col - span - 4 p - 6 bg - gradient - to - r from - purple - 600 / 20 to - pink - 600 / 20 rounded - 2xl border border - purple - 500 / 20 h, o,
  ver:border - purple - 500 / 40 transition - all"> < PlayCircle class
  Name ="h - 8 w - 8 mb - 3 text - purple - 400"/> < h3 class
  Name ="font - medium"> Launch Full Sequence </ h3 > < p class
  Name ="text - sm text - white / 60 mt - 1"> Execute the complete token launch flow </ p > </ button > < button on
  Click ={() => router.p ush('/ dashboard / wallets')} class
  Name ="col - span - 12 m, d:col - span - 4 p - 6 bg - gradient - to - r from - green - 600 / 20 to - teal - 600 / 20 rounded - 2xl border border - green - 500 / 20 h, o,
  ver:border - green - 500 / 40 transition - all"> < Wal let class
  Name ="h - 8 w - 8 mb - 3 text - green - 400"/> < h3 class
  Name ="font - medium"> Manage Wallets </ h3 > < p class
  Name ="text - sm text - white / 60 mt - 1"> Import and organize wal let groups </ p > </ button > < button on
  Click ={() => router.p ush('/ dashboard / create')} class
  Name ="col - span - 12 m, d:col - span - 4 p - 6 bg - gradient - to - r from - blue - 600 / 20 to - cyan - 600 / 20 rounded - 2xl border border - blue - 500 / 20 h, o,
  ver:border - blue - 500 / 40 transition - all"> < Rocket class
  Name ="h - 8 w - 8 mb - 3 text - blue - 400"/> < h3 class
  Name ="font - medium"> Create Token </ h3 > < p class
  Name ="text - sm text - white / 60 mt - 1"> Configure your next memecoin launch </ p > </ button > </ div > </ CardContent > </ Card > </ div > {/* System Status r, e,
  moved: compact StatusCluster appears in Topbar */}, {/* Recent Trades */} < Card class
  Name ="bg - black / 40 backdrop - blur - md border - white / 10"> < CardHeader > < CardTitle > Recent Trades </ CardTitle > </ CardHeader > < CardContent > {loading ? ( < div class
  Name ="space - y - 2"> {[...A rray(3)].m ap((_, i) => ( < Skeleton key ={i} class
  Name ="h - 12 w - full"/> )) } </ div > ) : recentTrades.length > 0 ? ( < div class
  Name ="space - y - 2"> {recentTrades.m ap((trade, idx) => ( < div key ={idx} class
  Name ="flex items - center justify - between p - 2 bg - white / 5 rounded - lg"> < div class
  Name ="flex items - center gap - 3"> < Badge variant ="outline" class
  Name ="text - xs"> {trade.pnl >= 0 ? '+' : ''}$,{trade.pnl.t oFixed(2)}% </ Badge > < span class
  Name ="text - sm"> {trade.token_address.s lice(0, 8)}... </ span > </ div > < div class
  Name ="text - sm text - white / 60"> {new D ate(trade.executed_at).t oLocaleTimeString()} </ div > </ div > )) } </ div > ) : ( < p class
  Name ="text - sm text - white / 60"> No trades yet </ p > ) } </ CardContent > </ Card > </ motion.div > ) }, {active
  Tab === 'control' && ( < motion.div key ="control" initial ={{ o,
  pacity: 0, y: 20 }} animate ={{ o,
  pacity: 1, y: 0 }} exit ={{ o,
  pacity: 0, y: - 20 }}> < ControlPanel /> </ motion.div > ) }, {active
  Tab === 'wallets' && ( < motion.div key ="wallets" initial ={{ o,
  pacity: 0, y: 20 }} animate ={{ o,
  pacity: 1, y: 0 }} exit ={{ o,
  pacity: 0, y: - 20 }}> < WalletManager /> </ motion.div > ) }, {active
  Tab === 'create' && ( < motion.div key ="create" initial ={{ o,
  pacity: 0, y: 20 }} animate ={{ o,
  pacity: 1, y: 0 }} exit ={{ o,
  pacity: 0, y: - 20 }}> < MemecoinCreator /> </ motion.div > ) }, {active
  Tab === 'logs' && ( < motion.div key ="logs" initial ={{ o,
  pacity: 0, y: 20 }} animate ={{ o,
  pacity: 1, y: 0 }} exit ={{ o,
  pacity: 0, y: - 20 }}> < LogsPanel /> </ motion.div > ) }, {active
  Tab === 'analytics' && ( < motion.div key ="analytics" initial ={{ o,
  pacity: 0, y: 20 }} animate ={{ o,
  pacity: 1, y: 0 }} exit ={{ o,
  pacity: 0, y: - 20 }}> < AnalyticsPanel /> </ motion.div > ) }, {active
  Tab === 'activity' && ( < motion.div key ="activity" initial ={{ o,
  pacity: 0, y: 20 }} animate ={{ o,
  pacity: 1, y: 0 }} exit ={{ o,
  pacity: 0, y: - 20 }}> < ActivityMonitor /> </ motion.div > ) } </ AnimatePresence > </ div > </ div > ) }

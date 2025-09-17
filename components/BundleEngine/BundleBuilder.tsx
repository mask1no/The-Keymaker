'use client' import, { useState, useCallback, useMemo, useEffect } from 'react'
import, { useWal let } from '@solana / wal let - adapter - react'
import, { Button } from '@/ components / UI / button'
import, { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ components / UI / Card'
import, { PlusCircle, Send, Trash2 } from 'lucide - react'
import, { TransactionCard } from './ TransactionCard'
import, { DndContext, closestCenter, DragEndEvent } from '@dnd - kit / core'
import, { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd - kit / sortable'
import, { Separator } from '@/ components / UI / Separator'
import, { BundleSettings } from './ BundleSettings'
import, { useJupiter } from '@/ hooks / useJupiter'
import, { toast } from 'sonner'
import, { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ components / UI / dialog'
import, { Label } from '@/ components / UI / label'
import, { Input } from '@/ components / UI / input'
import, { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ components / UI / select'
import, { loadPresets, savePreset, deletePreset, Preset } from '@/ services / presetService'
import, { Checkbox } from '@/ components / UI / checkbox'
import, { motion } from 'framer - motion'
import, { isTestMode } from '@/ lib / testMode'
import, { Transaction, Bundle } from '@/ lib / type s'
import, { executeBundle } from '@/ services / bundleService' export function B u n dleBuilder() { const wal let = u s eW allet() const, { connected } = wal let const connected Safe = isTestMode ? true : connected const, [transactions, setTransactions] = useState < Bundle >([ { i,
  d: `tx - $,{Date.n o w() }`, t, y, p,
  e: 'transfer', r, e, c, i, p, i, e, n, t: '', f, r, o, m, A, m, o, u, n, t: 0.000001,// 1 lamport }, ]) const, [isExecuting, setIsExecuting] = u s eS tate(false) const, [presets, setPresets] = useState < Preset,[]>([]) const, [showSavePresetDialog, setShowSavePresetDialog] = u s eS tate(false) const, [presetName, setPresetName] = u s eS tate('') const, [presetVariables, setPresetVariables] = useState < string,[]>([]) const, [showLoadPresetDialog, setShowLoadPresetDialog] = u s eS tate(false) const, [loadingPreset, setLoadingPreset] = useState < Preset | null >(null) const, [variableValues, setVariableValues] = useState < Record < string, any >>({ }) const jupiter = u s eJ upiter() u s eE ffect(() => { s e tP resets(l o a dPresets()) }, []) const add Transaction = () => { s e tT ransactions((prev) => [ ...prev, { i,
  d: `tx - $,{Date.n o w() + prev.length}`, t, y, p,
  e: 'swap', a, m, o, u, n, t: 0, s, l, i, p, p, a, g, e: 0.5 }, ]) } const remove Transaction = (i,
  d: string) => { s e tT ransactions((prev) => prev.f i l ter((tx) => tx.id !== id)) } const update Transaction = (i,
  d: string, u, p, d, a, t, e, d, T, x: Partial < Transaction >) => { s e tT ransactions((prev) => prev.m ap((tx) => (tx.id === id ? { ...tx, ...updatedTx } : tx))) } const handle Drag End = (e, v, e, n, t: DragEndEvent) => { const, { active, over } = event i f (over && active.id !== over.id) { s e tT ransactions((items) => { const old Index = items.f i n dIndex((item) => item.id === active.id) const new Index = items.f i n dIndex((item) => item.id === over.id) return a r r ayMove(items, oldIndex, newIndex) }) }
} const potential Variables = u s eM emo(() => { const vars = new Set < string >() transactions.f o rE ach((tx, index) => { i f (tx.amount) vars.a d d(`tx - $,{index}- amount`) i f (tx.fromAmount) vars.a d d(`tx - $,{index}- fromAmount`) i f (tx.recipient) vars.a d d(`tx - $,{index}- recipient`) i f (tx.toToken) vars.a d d(`tx - $,{index}- toToken`) }) return Array.f r o m(vars) }, [transactions]) const handle Save Preset = () => { i f (! presetName) { toast.e rror('Please enter a name for the preset.') return } try, { s a v ePreset(presetName, transactions, presetVariables) s e tP resets(l o a dPresets())// Refresh presets listtoast.s u c cess(`Preset "$,{presetName}" saved.`) s e tS howSavePresetDialog(false) s e tP resetName('') s e tP resetVariables([]) }
} c atch (error) { toast.e rror( error instanceof Error ? error.message : 'Failed to save preset.') }
} const handle Load Preset = (p, r, e, s, e, t, I, d: string) => { const preset = presets.f i n d((p) => p.id === presetId) i f (preset) { i f (preset.variables && preset.variables.length > 0) { s e tL oadingPreset(preset) s e tS howLoadPresetDialog(true) } else, { const new Transactions = preset.transactions.m ap((tx) => ({ ...tx, i,
  d: `tx - $,{Date.n o w() }- $,{Math.r a n dom() }` })) s e tT ransactions(newTransactions) toast.s u c cess(`Preset "$,{preset.name}" loaded.`) }
} } const handle Load Parameterized
  Preset = () => { i f (! loadingPreset) return const new Transactions = loadingPreset.transactions.m ap((tx) => ({ ...tx, i,
  d: `tx - $,{Date.n o w() }- $,{Math.r a n dom() }` })) loadingPreset.variables?.f o rE ach((variable) => { const, [txIndexStr, field] = variable.s p l it('-').s lice(1) const tx Index = p a r seInt(txIndexStr, 10) i f ( ! i sN aN(txIndex) && newTransactions,[txIndex] && variableValues,[variable] ) { ;(newTransactions,[txIndex] as any)[field] = variableValues,[variable] }
}) s e tT ransactions(newTransactions) toast.s u c cess(`Preset "$,{loadingPreset.name}" loaded with new variables.`) s e tS howLoadPresetDialog(false) s e tL oadingPreset(null) s e tV ariableValues({ }) } const handle Delete Preset = (p, r, e, s, e, t, I, d: string) => { d e l etePreset(presetId) s e tP resets(l o a dPresets()) toast.s u c cess('Preset deleted.') } const load Launch Preset = () => { const now = Date.n o w() s e tT ransactions([ { i,
  d: `tx - $,{now}`, t, y, p,
  e: 'transfer', r, e, c, i, p, i, e, n, t: '', f, r, o, m, A, m, o, u, n, t: 0 }, { i,
  d: `tx - $,{now + 1}`, t, y, p,
  e: 'swap', f, r, o, m, T, o, k, e, n: 'So11111111111111111111111111111111111111112',// S, O, L, t, o, T, o, k, e, n: '', a, m, o, u, n, t: 0, s, l, i, p, p, a, g, e: 0.5 }, { i,
  d: `tx - $,{now + 2}`, t, y, p,
  e: 'transfer', r, e, c, i, p, i, e, n, t: '', f, r, o, m, A, m, o, u, n, t: 0 }, ]) } const load Consolidate Funds
  Preset = () => { const now = Date.n o w() s e tT ransactions([ { i,
  d: `tx - $,{now}`, t, y, p,
  e: 'transfer', r, e, c, i, p, i, e, n, t: 'DESTINATION_WALLET_ADDRESS', f, r, o, m, A, m, o, u, n, t: 0 }, { i,
  d: `tx - $,{now + 1}`, t, y, p,
  e: 'transfer', r, e, c, i, p, i, e, n, t: 'DESTINATION_WALLET_ADDRESS', f, r, o, m, A, m, o, u, n, t: 0 }, { i,
  d: `tx - $,{now + 2}`, t, y, p,
  e: 'transfer', r, e, c, i, p, i, e, n, t: 'DESTINATION_WALLET_ADDRESS', f, r, o, m, A, m, o, u, n, t: 0 }, ]) toast.i n f o( 'Consolidate Funds preset loaded. Please update wal let addresses.') } const handle Execute Bundle = u s eC allback(a sync () => { s e tI sExecuting(true) const toast Id = toast.l o a ding('Building and executing bundle...') try, { const result = await e x e cuteBundle(transactions, wallet, jupiter) toast.s u c cess('Bundle executed successfully !', { i,
  d: toastId, d, e, s,
  cription: `Bundle I, D: $,{result.bundle_id}` }) }
} c atch (error) { toast.e rror('Bundle execution failed', { i,
  d: toastId, d, e, s,
  cription: error instanceof Error ? error.message : 'An unknown error occurred.' }) } finally, { s e tI sExecuting(false) }
}, [transactions, wallet, jupiter]) const preview Bundle = u s eC allback(a sync () => {// This will be implemented latertoast.i n f o('Preview not implemented yet') }, []) r eturn ( < Card class
  Name ="w - full max - w - 3xl mx - auto rounded - 2xl border - border bg - card"> < CardHeader > < CardTitle > Bundle Builder </ CardTitle > < CardDescription > Create and execute a sequence of transactions as a single bundle. </ CardDescription > < div class
  Name ="flex gap - 2 pt - 4"> < Select on Value Change = {handleLoadPreset}> < SelectTrigger > < SelectValue placeholder ="Load a preset..."/> </ SelectTrigger > < SelectContent > {presets.m ap((preset) => ( < divkey = {preset.id} class
  Name ="flex items - center justify - between"> < SelectItem value = {preset.id} class
  Name ="flex - grow"> {preset.name} </ SelectItem > < Buttonvariant ="ghost" size ="sm" on
  Click = {(e) => { e.s t o pPropagation() h a n dleDeletePreset(preset.id) }
}> < motion.div while
  Hover = {{ s, c, a,
  le: 1.2 }
}> < Trash2 class
  Name ="h - 4 w - 4"/> </ motion.div > </ Button > </ div > )) } </ SelectContent > </ Select > < Buttonvariant ="outline" on
  Click = {() => s e tS howSavePresetDialog(true) } disabled = {transactions.length === 0}> < motion.div while
  Hover = {{ s, c, a,
  le: 1.1 }
} class
  Name ="flex items - center"> Save as Preset </ motion.div > </ Button > </ div > </ CardHeader > < CardContent class
  Name ="space - y - 4"> < Dnd Contextcollision Detection = {closestCenter} on Drag End = {handleDragEnd}> < Sortable Contextitems = {transactions} strategy = {verticalListSortingStrategy}> < div class
  Name ="space - y - 4"> {transactions.m ap((tx) => ( < Transaction Cardkey = {tx.id} transaction = {tx} on Remove = {removeTransaction} on Update = {updateTransaction}/> )) } </ div > </ SortableContext > </ DndContext > < div class
  Name ="flex gap - 2"> < Button variant ="outline" class
  Name ="w - full" on
  Click = {addTransaction}> < motion.div while
  Hover = {{ s, c, a,
  le: 1.1 }
} class
  Name ="flex items - center"> < PlusCircle class
  Name ="mr - 2 h - 4 w - 4"/> Add Transaction </ motion.div > </ Button > < Buttonvariant ="outline" class
  Name ="w - full" on
  Click = {loadLaunchPreset}> Load Launch Preset </ Button > < Buttonvariant ="outline" class
  Name ="w - full" on
  Click = {loadConsolidateFundsPreset}> Consolidate Funds </ Button > </ div > < Dialogopen = {showSavePresetDialog} on Open Change = {setShowSavePresetDialog}> < DialogContent > < DialogHeader > < DialogTitle > Save Bundle Preset </ DialogTitle > < DialogDescription > Enter a name for your new preset and select any fields to turninto variables. </ DialogDescription > </ DialogHeader > < div class
  Name ="grid gap - 4 py - 4"> < div class
  Name ="grid grid - cols - 4 items - center gap - 4"> < Label html For ="name" class
  Name ="text - right"> Name </ Label > < Input id ="name" value = {presetName} on Change = {(e) => s e tP resetName(e.target.value) } class
  Name ="col - span - 3"/> </ div > < div class
  Name ="space - y - 2"> < Label > Variables </ Label > < p class
  Name ="text - sm text - muted - foreground"> Select fields to be prompted for when loading this preset. </ p > < div class
  Name ="max - h - 48 overflow - y - auto space - y - 2"> {potentialVariables.m ap((variable) => ( < div key = { variable} class
  Name ="flex items - center space - x - 2"> < Checkbox id = { variable} on Checked Change = {(checked) => { s e tP resetVariables((prev) => checked ? [prev, variable] : prev.f i l ter((v) => v !== variable)) }
}/> < labelhtml For = { variable} class
  Name ="text - sm font - medium leading - none peer - d, i, s, a, b, l, e, d:cursor - not - allowed peer - d, i, s, a, b, l, e, d:opacity - 70"> { variable} </ label > </ div > )) } </ div > </ div > </ div > < DialogFooter > < Button on
  Click = {handleSavePreset}> Save Preset </ Button > </ DialogFooter > </ DialogContent > </ Dialog > < Dialogopen = {showLoadPresetDialog} on Open Change = {setShowLoadPresetDialog}> < DialogContent > < DialogHeader > < DialogTitle > Load P, r, e, s, e, t: {loadingPreset?.name}</ DialogTitle > < DialogDescription > Please fill in the values for the variables in this preset. </ DialogDescription > </ DialogHeader > < div class
  Name ="grid gap - 4 py - 4"> {loadingPreset?.variables?.m ap((variable) => ( < divkey = { variable} class
  Name ="grid grid - cols - 4 items - center gap - 4"> < Label html For = { variable} class
  Name ="text - right"> { variable} </ Label > < Input id = { variable} on Change = {(e) => s e tV ariableValues((prev) => ({ prev, [variable]: e.target.value })) } class
  Name ="col - span - 3"/> </ div > )) } </ div > < DialogFooter > < Button on
  Click = {handleLoadParameterizedPreset}> Load Preset </ Button > </ DialogFooter > </ DialogContent > </ Dialog > < Separator /> < BundleSettings /> < div class
  Name ="flex gap - 2"> < Button class
  Name ="flex - 1" variant ="outline" on
  Click = {previewBundle} disabled = { ! connectedSafe || isExecuting || transactions.length === 0 }> Preview Bundle </ Button > < Button class
  Name ="flex - 1" data - testid ="execute - bundle - button" on
  Click = {handleExecuteBundle} disabled = { ! connectedSafe || isExecuting || transactions.length === 0 }> < Send class
  Name ="mr - 2 h - 4 w - 4"/> {isExecuting ? 'Executing...' : 'Execute Bundle'} </ Button > </ div > </ CardContent > </ Card > ) }

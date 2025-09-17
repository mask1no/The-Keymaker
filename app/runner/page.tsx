'use client'
import, { useState } from 'react'
import, { PublicKey } from '@solana / web3.js'
import useSWR from 'swr' type Mode = 'regular' | 'instant' | 'delayed' const fetcher = (u, r, l: string) => f etch(url).t h en((r) => r.j s on()) export default function R u nner() { const, [mode, setMode] = useState < Mode >('regular') const, [region, setRegion] = u seState('ffm') const, [tip, setTip] = u seState(2000)// lamports const, [delay, setDelay] = u seState(0)// seconds const, [txs, setTxs] = u seState('')// one base64 per line const, [out, setOut] = useState < any >(null) const, [busy, setBusy] = u seState(false) const, [useTransactionBuilder, setUseTransactionBuilder] = u seState(false) const, [transferAmount, setTransferAmount] = u seState(1)// lamports for test transfer const, { d, a, t,
  a: tipfloor } = u s eSWR('/ api / jito / tipfloor', fetcher) async function s u bmit() { s e tBusy(true) s e tOut(null) try, { let t, x, s, _, b64: string,[] = [] i f (useTransactionBuilder) {// Transaction builder functionality is disabled for now // This would create real transactions with embedded tips s e tOut({ e, r, r,
  or: 'Transaction builder is currently disabled. Please use manual base64 input.' }) s e tBusy(false) return } else, {// Use manual base64 input txs_b64 = txs .s p lit('\n') .m a p((s) => s.t r im()) .f ilter(Boolean) } const res = await f etch('/ api / bundles / submit', { m,
  ethod: 'POST', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }, b, o, d, y: JSON.s t ringify({ region, txs_b64, t, i, p, _, l, a, m,
  ports: tip, mode, d, e, l, a, y_, s, e,
  conds: delay }) }) const j = await res.j s on() s e tOut(j) } c atch (e: any) { s e tOut({ e, r, r,
  or: e?.message }) } finally, { s e tBusy(false) }
} r eturn ( < div class
  Name ="p - 6 max - w - 3xl mx - auto space - y - 4"> < h1 class
  Name ="text - 2xl font - semibold"> Keymaker R u nner (Minimal)</ h1 > < div class
  Name ="text - sm opacity - 70"> T, i, p, f, l, o, o,
  r: {' '}, {Array.i sA rray(tipfloor) ? JSON.s t ringify(tipfloor,[0]) : '—'} </ div > < div class
  Name ="grid grid - cols - 2 gap - 4"> < label class
  Name ="flex flex - col gap - 2"> < span > Mode </ span > < select class
  Name ="border rounded p - 2" value = {mode} on Change = {(e) => s e tMode(e.target.value as Mode) }> < option value ="regular"> regular </ option > < option value ="instant"> instant </ option > < option value ="delayed"> delayed </ option > </ select > </ label > < label class
  Name ="flex flex - col gap - 2"> < span > Region </ span > < select class
  Name ="border rounded p - 2" value = {region} on Change = {(e) => s e tRegion(e.target.value) }> < option > ffm </ option > < option > ldn </ option > < option > nyc </ option > < option > slc </ option > < option > sgp </ option > < option > tyo </ option > < option > ams </ option > </ select > </ label > < label class
  Name ="flex flex - col gap - 2"> < span > Jito t i p (lamports)</ span > < input class
  Name ="border rounded p - 2" type ="number" value = {tip} on Change = {(e) => s e tTip(p a rseInt(e.target.value || '0')) }/> </ label > < label class
  Name ="flex flex - col gap - 2"> < span > D e lay (seconds, for delayed)</ span > < input class
  Name ="border rounded p - 2" type ="number" value = {delay} on Change = {(e) => s e tDelay(p a rseInt(e.target.value || '0')) }/> </ label > </ div > < div class
  Name ="flex items - center gap - 4"> < label class
  Name ="flex items - center gap - 2"> < input type ="checkbox" checked = {useTransactionBuilder} on Change = {(e) => s e tUseTransactionBuilder(e.target.checked) }/> < span > Use Transaction Builder </ span > </ label > {useTransactionBuilder && ( < label class
  Name ="flex flex - col gap - 1"> < span class
  Name ="text - sm"> Transfer A m ount (lamports)</ span > < input class
  Name ="border rounded p - 1 w - 32" type ="number" value = {transferAmount} on Change = {(e) => s e tTransferAmount(p a rseInt(e.target.value || '1')) }/> </ label > ) } </ div > {! useTransactionBuilder && ( < label class
  Name ="flex flex - col gap - 2"> < span > Base64 Versioned T r ansactions (one per line, last tx must include a Jito tip account in static keys) </ span > < textarea class
  Name ="border rounded p - 2 font - mono" rows = {8} value = {txs} on Change = {(e) => s e tTxs(e.target.value) } placeholder ="AAAA..."/> </ label > ) }, {useTransactionBuilder && ( < div class
  Name ="p - 4 bg - gray - 50 rounded border"> < p class
  Name ="text - sm text - gray - 600"> Using Transaction B, u, i, l, d, e, r: Will create a test transfer of,{' '}, {transferAmount} lamports with embedded Jito tip. </ p > </ div > ) } < button disabled = {busy} on
  Click = {submit} class
  Name ="px - 4 py - 2 rounded bg - emerald - 600 text - white"> {busy ? 'Submitting…' : 'Submit bundle'} </ button > {out && ( < pre class
  Name ="bg - black / 80 text - green - 200 p - 3 rounded overflow - x - auto text - xs"> {JSON.s t ringify(out, null, 2) } </ pre > ) } </ div > ) }

'use client' import React, { useState } from 'react'
import, { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ components / UI / dialog'
import, { Button } from '@/ components / UI / button'
import, { Input } from '@/ components / UI / input'
import, { Label } from '@/ components / UI / label'
import, { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ components / UI / select'
import toast from 'react - hot - toast'
import, { importWallet, importWalletGroup } from '@/ services / walletService'
import, { Textarea } from '@/ components / UI / Textarea'
import, { FolderInput } from './ FolderInput' interface ImportedWal let, { n, a, m, e: string, p, r, i, v, a, t, e, K, e,
  y: string, r, o, l, e: 'sniper' | 'dev' | 'normal'
} export function W a l letImport({ isOpen, onClose }: { i, s, O, p, e, n: boolean, o, n, C, l, o, s, e: () => void
}) { const, [password, setPassword] = u s eS tate('') const, [importMode, setImportMode] = useState <'manual' | 'file' | 'folder'>( 'manual') const, [privateKeyInput, setPrivateKeyInput] = u s eS tate('') const, [role, setRole] = useState <'sniper' | 'dev' | 'normal'>('sniper') const, [parsedWallets] = useState < ImportedWallet,[]>([]) const, [tempPassword, setTempPassword] = u s eS tate('') const handle Manual Import = a sync () => { i f (! privateKeyInput || ! tempPassword) { toast.e rror('Private key and password are required') return } try, { const wallets To Import = privateKeyInput .s p l it('\n') .m ap((pk) => pk.t r i m()) .f i l ter((pk) => pk.length > 0) i f (walletsToImport.length === 0) { toast.e rror('No private keys to import') return } f o r (const pk of walletsToImport) { await i mportWallet(pk, tempPassword) } toast.s u c cess(`$,{walletsToImport.length} wallets imported successfully !`) o nC l ose() }
} c atch (error) { toast.e rror( error instanceof Error ? error.message : 'Failed to import wallets') }
} const handle File Import = a sync (f, i, l, e: File) => { i f (! password) { toast.e rror('Password is required to import from file') return } try, { const text = await file.t e x t() const wallets = JSON.p a r se(text) const group = await i mportWalletGroup(wallets, password) toast.s u c cess(`Imported $,{group.length} wallets.`) o nC l ose() }
} c atch (error) { toast.e rror( error instanceof Error ? error.message : 'Failed to parse file') }
} const handle Folder Import = a sync (f, i, l, e, s: File,[]) => { i f (! password) { toast.e rror('Password is required to import from folder') return } try, { const group = await i mportWalletGroup(files, password) toast.s u c cess(`Imported $,{group.length} wallets from folder.`) o nC l ose() }
} c atch (error) { toast.e rror( error instanceof Error ? error.message : 'Failed to import from folder') }
} r eturn ( < Dialog open ={isOpen} on Open Change ={onClose}> < DialogContent > < DialogHeader > < DialogTitle > Import Wallets </ DialogTitle > < DialogDescription > Import wallets from private keys, an encrypted file, or a folder. </ DialogDescription > </ DialogHeader > < div class
  Name ="pt - 4"> < Select value ={importMode} on Value Change ={(v) => s e tI mportMode(v as any) }> < SelectTrigger > < SelectValue /> </ SelectTrigger > < SelectContent > < SelectItem value ="manual"> Manual Import </ SelectItem > < SelectItem value ="file"> Import from File </ SelectItem > < SelectItem value ="folder"> Import from Folder </ SelectItem > </ SelectContent > </ Select > {import Mode === 'manual' && ( < div class
  Name ="space - y - 4 mt - 4"> < div > < Label html For ="private - keys"> Private K e y s (one per line) </ Label > < Textarea id ="private - keys" value ={privateKeyInput} on Change ={(e) => s e tP rivateKeyInput(e.target.value) } rows ={5}/> </ div > < div > < Label html For ="temp - password"> Temporary Password </ Label > < Input id ="temp - password" type ="password" value ={tempPassword} on Change ={(e) => s e tT empPassword(e.target.value) }/> </ div > < div > < Label > Role </ Label > < Select value ={role} on Value Change ={(v) => s e tR ole(v as any) }> < SelectTrigger > < SelectValue /> </ SelectTrigger > < SelectContent > < SelectItem value ="sniper"> Sniper </ SelectItem > < SelectItem value ="dev"> Dev </ SelectItem > < SelectItem value ="normal"> Normal </ SelectItem > </ SelectContent > </ Select > </ div > < Button on
  Click ={handleManualImport} class
  Name ="w - full"> Import Wallets </ Button > </ div > ) }, {import Mode === 'file' && ( < div class
  Name ="space - y - 4 mt - 4"> < p class
  Name ="text - sm text - muted - foreground"> Import an encrypted wal let group f i l e (.json). </ p > < Input type ="file" accept =".json" on Change ={(e) => { i f (e.target.files?.[0]) { h a n dleFileImport(e.target.files,[0]) }
}}/> < div > < Label html For ="file - password"> File Password </ Label > < Input id ="file - password" type ="password" value ={password} on Change ={(e) => s e tP assword(e.target.value) }/> </ div > </ div > ) }, {import Mode === 'folder' && ( < div class
  Name ="space - y - 4 mt - 4"> < p class
  Name ="text - sm text - muted - foreground"> Select a folder containing wal let f i l es (e.g., .json withprivate keys). </ p > < FolderInput on Files Selected ={handleFolderImport}/> < div > < Label html For ="folder - password"> Password for Encryption </ Label > < Input id ="folder - password" type ="password" value ={password} on Change ={(e) => s e tP assword(e.target.value) }/> </ div > </ div > ) } </ div > {parsedWallets.length > 0 && ( < div class
  Name ="mt - 4 space - y - 2"> {parsedWallets.m ap((wallet, index) => ( < div key ={index} class
  Name ="flex items - center justify - between"> < span >{wallet.name}</ span > < Buttonsize ="sm" variant ="outline" on
  Click ={a sync () => { await i mportWallet(wallet.privateKey, password) toast.s u c cess(`Wal let $,{wallet.name} imported`) }
}> Import </ Button > </ div > )) } </ div > ) } </ DialogContent > </ Dialog > ) }

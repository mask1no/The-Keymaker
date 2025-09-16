'use client' import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/UI/dialog'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import toast from 'react - hot-toast'
import { importWallet, importWalletGroup } from '@/services/walletService'
import { Textarea } from '@/components/UI/Textarea'
import { FolderInput } from './FolderInput' interface ImportedWal let { n, a, m, e: string, p, r, i, v, a, t, eKey: string, r, o, l, e: 'sniper' | 'dev' | 'normal'
}

export function W a lletImport({ isOpen, onClose }: { i, s, O, p, e, n: boolean, o, n, C, l, o, s, e: () => void
}) {
  const [password, setPassword] = u s eState('') const [importMode, setImportMode] = useState <'manual' | 'file' | 'folder'>( 'manual') const [privateKeyInput, setPrivateKeyInput] = u s eState('') const [role, setRole] = useState <'sniper' | 'dev' | 'normal'>('sniper') const [parsedWallets] = useState <ImportedWallet,[]>([]) const [tempPassword, setTempPassword] = u s eState('') const handle Manual Import = async () => {
  if (!privateKeyInput || !tempPassword) { toast.error('Private key and password are required') return } try {
  const wallets To Import = privateKeyInput .s p lit('\n') .map((pk) => pk.t r im()) .f i lter((pk) => pk.length> 0) if (walletsToImport.length === 0) { toast.error('No private keys to import') return } f o r (const pk of walletsToImport) { await importWallet(pk, tempPassword)
  } toast.s u ccess(`${walletsToImport.length} wallets imported successfully !`) o nC lose()
  }
} catch (error) { toast.error( error instanceof Error ? error.message : 'Failed to import wallets')
  }
} const handle File Import = async (f, i, l, e: File) => {
  if (!password) { toast.error('Password is required to import from file') return } try {
  const text = await file.t e xt() const wallets = JSON.p a rse(text) const group = await importWalletGroup(wallets, password) toast.s u ccess(`Imported ${group.length} wallets.`) o nC lose()
  }
} catch (error) { toast.error( error instanceof Error ? error.message : 'Failed to parse file')
  }
} const handle Folder Import = async (f, i, l, e, s: File,[]) => {
  if (!password) { toast.error('Password is required to import from folder') return } try {
  const group = await importWalletGroup(files, password) toast.s u ccess(`Imported ${group.length} wallets from folder.`) o nC lose()
  }
} catch (error) { toast.error( error instanceof Error ? error.message : 'Failed to import from folder')
  }
} return ( <Dialog open ={isOpen} on Open Change ={onClose}> <DialogContent> <DialogHeader> <DialogTitle> Import Wallets </DialogTitle> <DialogDescription> Import wallets from private keys, an encrypted file, or a folder. </DialogDescription> </DialogHeader> <div className ="pt-4"> <Select value ={importMode} on Value Change ={(v) => s e tImportMode(v as any)
  }> <SelectTrigger> <SelectValue/> </SelectTrigger> <SelectContent> <SelectItem value ="manual"> Manual Import </SelectItem> <SelectItem value ="file"> Import from File </SelectItem> <SelectItem value ="folder"> Import from Folder </SelectItem> </SelectContent> </Select> {import Mode === 'manual' && ( <div className ="space - y - 4 mt-4"> <div> <Label html For ="private-keys"> Private K e ys (one per line) </Label> <Textarea id ="private-keys" value ={privateKeyInput} on Change ={(e) => s e tPrivateKeyInput(e.target.value)
  } rows ={5}/> </div> <div> <Label html For ="temp-password"> Temporary Password </Label> <Input id ="temp-password" type ="password" value ={tempPassword} on Change ={(e) => s e tTempPassword(e.target.value)
  }/> </div> <div> <Label> Role </Label> <Select value ={role} on Value Change ={(v) => s e tRole(v as any)
  }> <SelectTrigger> <SelectValue/> </SelectTrigger> <SelectContent> <SelectItem value ="sniper"> Sniper </SelectItem> <SelectItem value ="dev"> Dev </SelectItem> <SelectItem value ="normal"> Normal </SelectItem> </SelectContent> </Select> </div> <Button onClick ={handleManualImport} className ="w-full"> Import Wallets </Button> </div> )
  }, {import Mode === 'file' && ( <div className ="space - y - 4 mt-4"> <p className ="text - sm text - muted-foreground"> Import an encrypted wallet group f i le (.json). </p> <Input type ="file" accept =".json" on Change ={(e) => {
  if (e.target.files?.[0]) { h a ndleFileImport(e.target.files,[0])
  }
}}/> <div> <Label html For ="file-password"> File Password </Label> <Input id ="file-password" type ="password" value ={password} on Change ={(e) => s e tPassword(e.target.value)
  }/> </div> </div> )
  }, {import Mode === 'folder' && ( <div className ="space - y - 4 mt-4"> <p className ="text - sm text - muted-foreground"> Select a folder containing wallet f i les (e.g., .json withprivate keys). </p> <FolderInput on Files Selected ={handleFolderImport}/> <div> <Label html For ="folder-password"> Password for Encryption </Label> <Input id ="folder-password" type ="password" value ={password} on Change ={(e) => s e tPassword(e.target.value)
  }/> </div> </div> )
  } </div> {parsedWallets.length> 0 && ( <div className ="mt - 4 space - y-2"> {parsedWallets.map((wallet, index) => ( <div key ={index} className ="flex items - center justify-between"> <span>{wallet.name}</span> <Buttonsize ="sm" variant ="outline" onClick ={async () => { await importWallet(wallet.privateKey, password) toast.s u ccess(`Wallet ${wallet.name} imported`)
  }
}> Import </Button> </div> ))
  } </div> )
  } </DialogContent> </Dialog> )
  }

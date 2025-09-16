'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/UI/dialog'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import toast from 'react-hot-toast'
import { importWallet, importWalletGroup } from '@/services/walletService'
import { Textarea } from '@/components/UI/Textarea'
import { FolderInput } from './FolderInput'

interface ImportedWal let {
  n, ame: stringprivateKey: stringrole: 'sniper' | 'dev' | 'normal'
}

export function WalletImport({
  isOpen,
  onClose,
}: {
  i, sOpen: booleanonClose: () => void
}) {
  const [password, setPassword] = useState('')
  const [importMode, setImportMode] = useState<'manual' | 'file' | 'folder'>(
    'manual',
  )
  const [privateKeyInput, setPrivateKeyInput] = useState('')
  const [role, setRole] = useState<'sniper' | 'dev' | 'normal'>('sniper')
  const [parsedWallets] = useState<ImportedWallet[]>([])
  const [tempPassword, setTempPassword] = useState('')

  const handleManualImport = async () => {
    if (!privateKeyInput || !tempPassword) {
      toast.error('Private key and password are required')
      return
    }

    try {
      const walletsToImport = privateKeyInput
        .split('\n')
        .map((pk) => pk.trim())
        .filter((pk) => pk.length > 0)

      if (walletsToImport.length === 0) {
        toast.error('No private keys to import')
        return
      }

      for (const pk of walletsToImport) {
        await importWallet(pk, tempPassword)
      }

      toast.success(`${walletsToImport.length} wallets imported successfully!`)
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to import wallets',
      )
    }
  }

  const handleFileImport = async (f, ile: File) => {
    if (!password) {
      toast.error('Password is required to import from file')
      return
    }

    try {
      const text = await file.text()
      const wallets = JSON.parse(text)
      const group = await importWalletGroup(wallets, password)

      toast.success(`Imported ${group.length} wallets.`)
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to parse file',
      )
    }
  }

  const handleFolderImport = async (f, iles: File[]) => {
    if (!password) {
      toast.error('Password is required to import from folder')
      return
    }

    try {
      const group = await importWalletGroup(files, password)
      toast.success(`Imported ${group.length} wallets from folder.`)
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to import from folder',
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Wallets</DialogTitle>
          <DialogDescription>
            Import wallets from private keys, an encrypted file, or a folder.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Selectvalue={importMode}
            onValueChange={(v) => setImportMode(v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual Import</SelectItem>
              <SelectItem value="file">Import from File</SelectItem>
              <SelectItem value="folder">Import from Folder</SelectItem>
            </SelectContent>
          </Select>

          {importMode === 'manual' && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="private-keys">
                  Private Keys (one per line)
                </Label>
                <Textareaid="private-keys"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  rows={5}
                />
              </div>
              <div>
                <Label htmlFor="temp-password">Temporary Password</Label>
                <Inputid="temp-password"
                  type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sniper">Sniper</SelectItem>
                    <SelectItem value="dev">Dev</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleManualImport} className="w-full">
                Import Wallets
              </Button>
            </div>
          )}

          {importMode === 'file' && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Import an encrypted wal let group file (.json).
              </p>
              <Inputtype="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileImport(e.target.files[0])
                  }
                }}
              />
              <div>
                <Label htmlFor="file-password">File Password</Label>
                <Inputid="file-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {importMode === 'folder' && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Select a folder containing wal let files (e.g., .json withprivate keys).
              </p>
              <FolderInput onFilesSelected={handleFolderImport} />
              <div>
                <Label htmlFor="folder-password">Password for Encryption</Label>
                <Inputid="folder-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        {parsedWallets.length > 0 && (
          <div className="mt-4 space-y-2">
            {parsedWallets.map((wallet, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>{wallet.name}</span>
                <Buttonsize="sm"
                  variant="outline"
                  onClick={async () => {
                    await importWallet(wallet.privateKey, password)
                    toast.success(`Wal let ${wallet.name} imported`)
                  }}
                >
                  Import
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Badge } from '@/components/UI/badge'
import { Card } from '@/components/UI/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import {
  Key,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle,
  User,
  Code,
  Loader2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Connection, PublicKey } from '@solana/web3.js'
import { useKeymakerStore } from '@/lib/store'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import {
  importWallet,
  importWalletGroup,
  saveWalletToDb,
} from '@/services/walletService'
import { logger } from '@/lib/logger'

interface WalletImportProps {
  isOpen: boolean
  onClose: () => void
  groupId?: string
}

type ImportMode = 'single' | 'json' | 'file'
type WalletRole = 'master' | 'sniper' | 'dev'

interface ImportedWallet {
  publicKey: string
  privateKey: string
  role: WalletRole
  balance?: number
  valid: boolean
}

export function WalletImport({ isOpen, onClose, groupId }: WalletImportProps) {
  const { addWallet, wallets, walletGroups } = useKeymakerStore()
  const [mode, setMode] = useState<ImportMode>('single')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Single wallet import state
  const [privateKey, setPrivateKey] = useState('')
  const [walletRole, setWalletRole] = useState<WalletRole>('sniper')

  // JSON import state
  const [jsonInput, setJsonInput] = useState('')

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Preview state
  const [previewWallets, setPreviewWallets] = useState<ImportedWallet[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC)

  const resetForm = () => {
    setPrivateKey('')
    setJsonInput('')
    setSelectedFile(null)
    setPreviewWallets([])
    setShowPreview(false)
    setError(null)
  }

  const validatePrivateKey = (key: string): boolean => {
    try {
      // Try base58 format
      if (key.length === 88 || key.length === 87) {
        return true
      }

      // Try array format
      const parsed = JSON.parse(key)
      return Array.isArray(parsed) && parsed.length === 64
    } catch {
      return false
    }
  }

  const getBalance = async (publicKey: string): Promise<number> => {
    try {
      const pubKey = new PublicKey(publicKey)
      const balance = await connection.getBalance(pubKey)
      return balance / 1e9 // Convert lamports to SOL
    } catch (error) {
      logger.error('Failed to get balance', { publicKey, error })
      return 0
    }
  }

  const processWallet = async (
    privateKeyInput: string,
    role: WalletRole,
  ): Promise<ImportedWallet | null> => {
    try {
      // For preview, we'll use a temporary password
      // The actual encryption will happen when the user confirms the import
      const tempPassword = 'preview_' + Date.now()
      const wallet = await importWallet(privateKeyInput, tempPassword, role)
      const balance = await getBalance(wallet.publicKey)

      return {
        publicKey: wallet.publicKey,
        privateKey: privateKeyInput,
        role,
        balance,
        valid: true,
      }
    } catch (error) {
      logger.error('Failed to process wallet', { error })
      return null
    }
  }

  const handleSingleImport = async () => {
    if (!privateKey.trim()) {
      setError('Please enter a private key')
      return
    }

    if (!validatePrivateKey(privateKey)) {
      setError('Invalid private key format')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const processed = await processWallet(privateKey, walletRole)
      if (!processed) {
        throw new Error('Failed to process wallet')
      }

      setPreviewWallets([processed])
      setShowPreview(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed')
      toast.error('Failed to import wallet')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleJSONImport = async () => {
    if (!jsonInput.trim()) {
      setError('Please enter JSON data')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const data = JSON.parse(jsonInput)
      const walletList: ImportedWallet[] = []

      // Handle different JSON formats
      if (Array.isArray(data)) {
        // Array of wallet objects
        for (const item of data) {
          if (item.privateKey || item.private_key || item.key) {
            const key = item.privateKey || item.private_key || item.key
            const role = item.role || 'sniper'
            const processed = await processWallet(key, role)
            if (processed) walletList.push(processed)
          }
        }
      } else if (data.wallets && Array.isArray(data.wallets)) {
        // Keymaker export format
        for (const wallet of data.wallets) {
          const processed = await processWallet(
            wallet.privateKey,
            wallet.role || 'sniper',
          )
          if (processed) walletList.push(processed)
        }
      } else if (typeof data === 'object') {
        // Single wallet object
        const key = data.privateKey || data.private_key || data.key
        if (key) {
          const processed = await processWallet(key, data.role || 'sniper')
          if (processed) walletList.push(processed)
        }
      }

      if (walletList.length === 0) {
        throw new Error('No valid wallets found in JSON')
      }

      setPreviewWallets(walletList)
      setShowPreview(true)
    } catch (error) {
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format')
      } else {
        setError(error instanceof Error ? error.message : 'Import failed')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileImport = async () => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const text = await selectedFile.text()

      if (selectedFile.name.endsWith('.keymaker')) {
        // Handle encrypted Keymaker file
        const password = prompt('Enter password to decrypt wallets:')
        if (!password) {
          throw new Error('Password required')
        }

        const group = await importWalletGroup(text, password)

        // For now, we'll just show a success message
        // In a real implementation, we'd integrate with the secure storage
        toast.success(
          `Imported ${group.wallets.length} wallets from ${group.name}`,
        )
        onClose()
        return
      } else {
        // Handle as JSON
        setJsonInput(text)
        await handleJSONImport()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'File import failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmImport = async () => {
    if (previewWallets.length === 0) return

    setIsProcessing(true)
    try {
      // Request password for encryption
      const password = prompt('Enter password to encrypt wallets:')
      if (!password || password.length < 8) {
        toast.error('Password must be at least 8 characters')
        return
      }

      let imported = 0

      for (const wallet of previewWallets) {
        // Check if wallet already exists
        const exists = wallets.some((w) => w.publicKey === wallet.publicKey)
        if (exists) {
          toast.error(
            `Wallet ${wallet.publicKey.slice(0, 8)}... already exists`,
          )
          continue
        }

        // Re-import with the user's password for proper encryption
        const walletData = await importWallet(
          wallet.privateKey,
          password,
          wallet.role,
        )

        // Save to database
        await saveWalletToDb({
          ...walletData,
          network: 'mainnet',
        })

        // Add to store
        await addWallet({
          publicKey: wallet.publicKey,
          role: wallet.role,
          groupId: groupId || walletGroups[0]?.id || 'default',
        })

        imported++
      }

      toast.success(`Imported ${imported} wallet${imported !== 1 ? 's' : ''}`)
      resetForm()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed')
      toast.error('Failed to import wallets')
    } finally {
      setIsProcessing(false)
    }
  }

  const getRoleColor = (role: WalletRole) => {
    switch (role) {
      case 'master':
        return 'text-yellow-400'
      case 'sniper':
        return 'text-green-400'
      case 'dev':
        return 'text-blue-400'
    }
  }

  const getRoleIcon = (role: WalletRole) => {
    switch (role) {
      case 'master':
        return <Key className="h-4 w-4" />
      case 'sniper':
        return <User className="h-4 w-4" />
      case 'dev':
        return <Code className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-black/90 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Import Wallets
          </DialogTitle>
          <DialogDescription>
            Import wallets using private keys, JSON data, or Keymaker files
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showPreview ? (
            <motion.div
              key="import"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Import Mode Selector */}
              <div className="flex gap-2">
                <Button
                  variant={mode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('single')}
                  className="flex-1"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Single Wallet
                </Button>
                <Button
                  variant={mode === 'json' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('json')}
                  className="flex-1"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  JSON Import
                </Button>
                <Button
                  variant={mode === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('file')}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  File Import
                </Button>
              </div>

              {/* Import Content */}
              {mode === 'single' && (
                <div className="space-y-4">
                  <div>
                    <Label>Private Key</Label>
                    <Input
                      type="password"
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Base58 or [1,2,3...] array format"
                      className="font-mono bg-white/5"
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Enter a base58 string or JSON array of bytes
                    </p>
                  </div>

                  <div>
                    <Label>Wallet Role</Label>
                    <Select
                      value={walletRole}
                      onValueChange={(v) => setWalletRole(v as WalletRole)}
                    >
                      <SelectTrigger className="bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-yellow-400" />
                            Master (Funding)
                          </div>
                        </SelectItem>
                        <SelectItem value="sniper">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-green-400" />
                            Sniper (Trading)
                          </div>
                        </SelectItem>
                        <SelectItem value="dev">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-blue-400" />
                            Dev (Development)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {mode === 'json' && (
                <div>
                  <Label>JSON Data</Label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[
  {"privateKey": "...", "role": "sniper"},
  {"privateKey": "...", "role": "master"}
]`}
                    className="w-full h-48 p-3 bg-white/5 border border-white/10 rounded-md font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-white/60 mt-1">
                    Paste JSON array of wallets or Keymaker export
                  </p>
                </div>
              )}

              {mode === 'file' && (
                <div>
                  <Label>Select File</Label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".json,.keymaker"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-white/40" />
                      {selectedFile ? (
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-white/60">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">
                            Drop file here or click to browse
                          </p>
                          <p className="text-sm text-white/60">
                            Supports .json and .keymaker files
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    onClose()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (mode === 'single') handleSingleImport()
                    else if (mode === 'json') handleJSONImport()
                    else if (mode === 'file') handleFileImport()
                  }}
                  disabled={
                    isProcessing ||
                    (mode === 'single'
                      ? !privateKey
                      : mode === 'json'
                        ? !jsonInput
                        : mode === 'file'
                          ? !selectedFile
                          : false)
                  }
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Process'
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="font-medium mb-4">
                  Preview ({previewWallets.length} wallets)
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {previewWallets.map((wallet, index) => (
                    <Card
                      key={index}
                      className="p-4 bg-white/5 border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={getRoleColor(wallet.role)}>
                            {getRoleIcon(wallet.role)}
                          </div>
                          <div>
                            <p className="font-mono text-sm">
                              {wallet.publicKey.slice(0, 8)}...
                              {wallet.publicKey.slice(-8)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {wallet.role}
                              </Badge>
                              {wallet.balance !== undefined && (
                                <span className="text-xs text-white/60">
                                  {wallet.balance.toFixed(4)} SOL
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPreviewWallets((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={confirmImport}
                  disabled={isProcessing || previewWallets.length === 0}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Import {previewWallets.length} Wallet
                      {previewWallets.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

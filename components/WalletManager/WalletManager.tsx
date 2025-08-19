'use client'
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, Keypair } from '@solana/web3.js'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  createWallet,
  exportWallet,
  exportWalletEncrypted,
  importWallet,
  exportWalletGroup,
  importWalletGroup,
} from '../../services/walletService'
import {
  fundWalletGroup,
  getWalletBalances,
} from '../../services/fundingService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Label } from '@/components/UI/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/UI/dialog'
import { Checkbox } from '@/components/UI/checkbox'
import { Skeleton } from '@/components/UI/skeleton'
import { Badge } from '@/components/UI/badge'
import {
  Copy,
  Download,
  Key,
  RefreshCw,
  Users,
  Wallet,
  Shield,
  AlertTriangle,
  Upload,
  Loader2,
} from 'lucide-react'
import { NEXT_PUBLIC_HELIUS_RPC } from '../../constants'
// Use browser-safe crypto helpers for client-side encryption/decryption
// import { encryptAES256, decryptAES256ToBytes } from '@/utils/browserCrypto'
import { useKeymakerStore } from '@/lib/store'

type WalletRole = 'master' | 'dev' | 'sniper' | 'normal'

interface WalletData {
  publicKey: string
  role: WalletRole
  balance: number
  createdAt: string
  encryptedPrivateKey: string
  keypair?: Keypair
}

interface WalletGroup {
  name: string
  wallets: WalletData[]
  createdAt: string
}

export function WalletManager() {
  const { publicKey: connectedWallet } = useWallet()
  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed')

  // Zustand store
  const { setWallets: setGlobalWallets, setSelectedGroup } = useKeymakerStore()

  const [groups, setGroups] = useState<{ [key: string]: WalletGroup }>({})
  const [activeGroup, setActiveGroup] = useState('default')
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Form states
  const [newGroupName, setNewGroupName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<WalletRole>('normal')
  const [totalFunding, setTotalFunding] = useState('10')
  const [minSol, setMinSol] = useState('0.5')
  const [maxSol, setMaxSol] = useState('2')

  // Export dialog
  const [exportPassword, setExportPassword] = useState('')
  const [exportNewPassword, setExportNewPassword] = useState('')
  const [exportEncrypted, setExportEncrypted] = useState(true)
  const [captchaChecked, setCaptchaChecked] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)

  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPassword, setImportPassword] = useState('')

  // Load groups from localStorage
  useEffect(() => {
    const loadGroups = () => {
      const stored = localStorage.getItem('walletGroups')
      if (stored) {
        const parsed = JSON.parse(stored)
        setGroups(parsed)
        if (!parsed[activeGroup]) {
          // Create default group if it doesn't exist
          const defaultGroup: WalletGroup = {
            name: 'default',
            wallets: [],
            createdAt: new Date().toISOString(),
          }
          setGroups({ ...parsed, default: defaultGroup })
        }
      } else {
        // Initialize with default group
        const defaultGroup: WalletGroup = {
          name: 'default',
          wallets: [],
          createdAt: new Date().toISOString(),
        }
        setGroups({ default: defaultGroup })
      }
    }
    loadGroups()
  }, [])

  // Update wallets when active group changes
  useEffect(() => {
    if (groups[activeGroup]) {
      setWallets(groups[activeGroup].wallets)
    }
  }, [activeGroup, groups])

  // Sync with global store whenever wallets or active group changes
  useEffect(() => {
    // Update global store with current wallets
    const walletsWithKeypairs = wallets.map((w) => ({
      id: `wallet_${w.publicKey.slice(0, 8)}_${Date.now()}`,
      publicKey: w.publicKey,
      role: w.role,
      balance: w.balance,
      encryptedPrivateKey: w.encryptedPrivateKey,
    }))
    setGlobalWallets(walletsWithKeypairs)
    setSelectedGroup(activeGroup)
  }, [wallets, activeGroup, setGlobalWallets, setSelectedGroup])

  // Save groups to localStorage
  useEffect(() => {
    if (Object.keys(groups).length > 0) {
      localStorage.setItem('walletGroups', JSON.stringify(groups))
    }
  }, [groups])

  const createNewGroup = () => {
    if (!newGroupName || groups[newGroupName]) {
      return toast.error('Invalid or duplicate group name')
    }

    const newGroup: WalletGroup = {
      name: newGroupName,
      wallets: [],
      createdAt: new Date().toISOString(),
    }

    setGroups({ ...groups, [newGroupName]: newGroup })
    setActiveGroup(newGroupName)
    setNewGroupName('')
    toast.success(`Group "${newGroupName}" created`)
  }

  const handleCreateWallet = async () => {
    if (!password || password.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }

    if (wallets.length >= 20) {
      return toast.error('Maximum 20 wallets per group')
    }

    // Enforce role limits: one master, one dev, up to 3 snipers
    const numMasters = wallets.filter((w) => w.role === 'master').length
    const numDevs = wallets.filter((w) => w.role === 'dev').length
    const numSnipers = wallets.filter((w) => w.role === 'sniper').length
    if (role === 'master' && numMasters >= 1) {
      return toast.error('Only one master wallet is allowed in a group')
    }
    if (role === 'dev' && numDevs >= 1) {
      return toast.error('Only one dev wallet is allowed in a group')
    }
    if (role === 'sniper' && numSnipers >= 3) {
      return toast.error('Up to 3 sniper wallets are allowed in a group')
    }

    try {
      setLoading(true)
      const { publicKey, encryptedPrivateKey } = await createWallet(
        password,
        role,
      )

      const newWallet: WalletData = {
        publicKey,
        encryptedPrivateKey,
        role,
        balance: 0,
        createdAt: new Date().toISOString(),
      }

      const updatedWallets = [...wallets, newWallet]
      setWallets(updatedWallets)

      // Update group
      setGroups({
        ...groups,
        [activeGroup]: {
          ...groups[activeGroup],
          wallets: updatedWallets,
        },
      })

      toast.success('Wallet created successfully')
      setPassword('') // Clear password after creation
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const updateWalletRole = (walletPubkey: string, newRole: WalletRole) => {
    // Enforce role limits before applying change
    const current = wallets.find((w) => w.publicKey === walletPubkey)
    if (!current) return
    const withoutCurrent = wallets.filter((w) => w.publicKey !== walletPubkey)
    const numMasters = withoutCurrent.filter((w) => w.role === 'master').length
    const numDevs = withoutCurrent.filter((w) => w.role === 'dev').length
    const numSnipers = withoutCurrent.filter((w) => w.role === 'sniper').length
    if (newRole === 'master' && numMasters >= 1) {
      return toast.error('Only one master wallet is allowed in a group')
    }
    if (newRole === 'dev' && numDevs >= 1) {
      return toast.error('Only one dev wallet is allowed in a group')
    }
    if (newRole === 'sniper' && numSnipers >= 3) {
      return toast.error('Up to 3 sniper wallets are allowed in a group')
    }

    const updatedWallets = wallets.map((w) =>
      w.publicKey === walletPubkey ? { ...w, role: newRole } : w,
    )

    setWallets(updatedWallets)
    setGroups({
      ...groups,
      [activeGroup]: {
        ...groups[activeGroup],
        wallets: updatedWallets,
      },
    })

    toast.success('Role updated')
  }

  const removeWallet = (walletPubkey: string) => {
    const updatedWallets = wallets.filter((w) => w.publicKey !== walletPubkey)

    setWallets(updatedWallets)
    setGroups({
      ...groups,
      [activeGroup]: {
        ...groups[activeGroup],
        wallets: updatedWallets,
      },
    })

    toast.success('Wallet removed')
  }

  const refreshBalances = async () => {
    setRefreshing(true)
    try {
      const balances = await getWalletBalances(
        wallets.map((w) => w.publicKey),
        connection,
      )

      const updatedWallets = wallets.map((w) => ({
        ...w,
        balance: balances[w.publicKey] || 0,
      }))

      setWallets(updatedWallets)
      setGroups({
        ...groups,
        [activeGroup]: {
          ...groups[activeGroup],
          wallets: updatedWallets,
        },
      })

      toast.success('Balances updated')
    } catch (error) {
      toast.error('Failed to refresh balances')
    } finally {
      setRefreshing(false)
    }
  }

  const handleFundGroup = async () => {
    if (!connectedWallet) {
      return toast.error('Connect master wallet first')
    }

    const eligibleWallets = wallets.filter((w) => w.role !== 'master')
    if (eligibleWallets.length === 0) {
      return toast.error('No eligible wallets to fund')
    }

    setLoading(true)
    try {
      // Find master wallet in the current group
      const masterWallet = wallets.find((w) => w.role === 'master')
      if (!masterWallet) {
        return toast.error(
          'No master wallet found in this group. Create one first.',
        )
      }

      // Prompt for password to decrypt master wallet
      const password = prompt('Enter master wallet password:')
      if (!password) {
        return toast.error('Password required to decrypt master wallet')
      }

      // Import getKeypair function
      const { getKeypair } = await import('@/services/walletService')
      const masterKeypair = await getKeypair(masterWallet, password)

      const signatures = await fundWalletGroup(
        masterKeypair,
        eligibleWallets,
        parseFloat(totalFunding),
        parseFloat(minSol),
        parseFloat(maxSol),
        connection,
      )

      toast.success(
        `Funded ${eligibleWallets.length} wallets in ${signatures.length} transactions`,
      )

      // Refresh balances after funding
      await refreshBalances()
    } catch (error) {
      toast.error(`Funding failed: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportKey = async () => {
    if (!selectedWallet) return

    if (!captchaChecked) {
      return toast.error('Please complete the security check')
    }

    if (!exportPassword) {
      return toast.error('Enter password to decrypt wallet')
    }

    if (exportEncrypted && !exportNewPassword) {
      return toast.error('Enter new password for encrypted export')
    }

    try {
      let exportData: string

      if (exportEncrypted) {
        // Export with new encryption
        exportData = await exportWalletEncrypted(
          selectedWallet,
          exportPassword,
          exportNewPassword,
        )
      } else {
        // Export decrypted (plain text private key)
        exportData = await exportWallet(selectedWallet, exportPassword)
      }

      // Create download
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wallet-${selectedWallet.publicKey.slice(0, 8)}-${exportEncrypted ? 'encrypted' : 'plain'}.json`
      a.click()

      toast.success(
        `Wallet exported ${exportEncrypted ? '(encrypted)' : '(WARNING: Plain text!)'}`,
      )

      // Reset form
      setExportPassword('')
      setExportNewPassword('')
      setCaptchaChecked(false)
      setSelectedWallet(null)
    } catch (error) {
      toast.error('Failed to export wallet: ' + (error as Error).message)
    }
  }

  const exportGroup = async () => {
    const groupData = groups[activeGroup]
    if (!groupData) return

    // Prompt for export password
    const exportPassword = prompt(
      'Enter a password to encrypt the wallet group:',
    )
    if (!exportPassword || exportPassword.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }

    // Confirm password
    const confirmPassword = prompt('Confirm the password:')
    if (exportPassword !== confirmPassword) {
      return toast.error('Passwords do not match')
    }

    try {
      // Use the new secure export function
      const encryptedData = await exportWalletGroup(
        activeGroup,
        groupData.wallets,
        exportPassword,
      )

      // Create .keymaker file
      const blob = new Blob([encryptedData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeGroup}-${Date.now()}.keymaker`
      a.click()

      toast.success('Wallet group exported securely as .keymaker file')
    } catch (error) {
      toast.error(`Export failed: ${(error as Error).message}`)
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success('Address copied')
  }

  const handleImportGroup = async () => {
    if (!importFile || !importPassword) {
      return toast.error('Please select a file and enter password')
    }

    try {
      const fileContent = await importFile.text()

      // Check if it's a .keymaker file
      if (importFile.name.endsWith('.keymaker')) {
        // Use the new secure import function
        const importedData = await importWalletGroup(
          fileContent,
          importPassword,
        )

        // Check if group name already exists
        if (groups[importedData.name]) {
          // Generate unique name
          let uniqueName = importedData.name
          let counter = 1
          while (groups[uniqueName]) {
            uniqueName = `${importedData.name}_${counter}`
            counter++
          }
          importedData.name = uniqueName
        }

        // Process wallets to add metadata
        const processedWallets = importedData.wallets.map((wallet) => ({
          ...wallet,
          balance: 0,
          createdAt: new Date().toISOString(),
        }))

        // Add new group
        const newGroup: WalletGroup = {
          name: importedData.name,
          wallets: processedWallets,
          createdAt: new Date().toISOString(),
        }

        setGroups({ ...groups, [importedData.name]: newGroup })
        setActiveGroup(importedData.name)
        setShowImportDialog(false)
        setImportFile(null)
        setImportPassword('')

        toast.success(
          `Imported ${processedWallets.length} wallets to group "${importedData.name}"`,
        )
      } else {
        // Legacy JSON import (backward compatibility)
        const importData = JSON.parse(fileContent)

        // Validate import data
        if (
          !importData.name ||
          !importData.wallets ||
          !Array.isArray(importData.wallets)
        ) {
          throw new Error('Invalid wallet group file')
        }

        // Check if group name already exists
        if (groups[importData.name]) {
          return toast.error(`Group "${importData.name}" already exists`)
        }

        // Process encrypted wallets
        const importedWallets: WalletData[] = []

        for (const wallet of importData.wallets) {
          if (wallet.encryptedPrivateKey) {
            // Wallet is already encrypted, just add it
            importedWallets.push({
              publicKey: wallet.publicKey,
              encryptedPrivateKey: wallet.encryptedPrivateKey,
              role: wallet.role || 'normal',
              balance: 0,
              createdAt: wallet.createdAt || new Date().toISOString(),
            })
          } else if (wallet.privateKey) {
            // Wallet has plain private key, encrypt it
            const imported = await importWallet(
              wallet.privateKey,
              importPassword,
              wallet.role,
            )
            importedWallets.push({
              ...imported,
              balance: 0,
              createdAt: new Date().toISOString(),
            })
          }
        }

        // Add new group
        const newGroup: WalletGroup = {
          name: importData.name,
          wallets: importedWallets,
          createdAt: new Date().toISOString(),
        }

        setGroups({ ...groups, [importData.name]: newGroup })
        setActiveGroup(importData.name)
        setShowImportDialog(false)
        setImportFile(null)
        setImportPassword('')

        toast.success(
          `Imported ${importedWallets.length} wallets to group "${importData.name}"`,
        )
      }
    } catch (error) {
      toast.error(`Import failed: ${(error as Error).message}`)
    }
  }

  const getRoleBadgeColor = (role: WalletRole) => {
    switch (role) {
      case 'master':
        return 'bg-purple-500'
      case 'sniper':
        return 'bg-red-500'
      case 'dev':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Wallet Manager
            </span>
            <div className="flex items-center gap-2">
              <Select value={activeGroup} onValueChange={setActiveGroup}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(groups).map((groupName) => (
                    <SelectItem key={groupName} value={groupName}>
                      {groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={exportGroup}>
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create New Group */}
          <div className="flex gap-2">
            <Input
              placeholder="New group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createNewGroup} disabled={!newGroupName}>
              <Users className="w-4 h-4 mr-1" />
              Create Group
            </Button>
          </div>

          {/* Create Wallet */}
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="password"
              placeholder="Wallet password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Select
              value={role}
              onValueChange={(v) => setRole(v as WalletRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="sniper">Sniper</SelectItem>
                <SelectItem value="dev">Dev</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateWallet} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Wallet'
              )}
            </Button>
          </div>

          {/* Funding Controls */}
          <div className="p-4 bg-black/30 rounded-lg space-y-2">
            <h4 className="font-semibold text-aqua">Fund Group</h4>
            <div className="grid grid-cols-4 gap-2">
              <Input
                type="number"
                placeholder="Total SOL"
                value={totalFunding}
                onChange={(e) => setTotalFunding(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Min per wallet"
                value={minSol}
                onChange={(e) => setMinSol(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max per wallet"
                value={maxSol}
                onChange={(e) => setMaxSol(e.target.value)}
              />
              <Button
                onClick={handleFundGroup}
                disabled={loading || !connectedWallet}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Funding...
                  </>
                ) : (
                  'Fund Wallets'
                )}
              </Button>
            </div>
          </div>

          {/* Wallet List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Wallets ({wallets.length}/20)</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshBalances}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>

            {loading || refreshing ? (
              <Skeleton className="h-32 w-full" />
            ) : wallets.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No wallets in this group
              </p>
            ) : (
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <Card
                    key={wallet.publicKey}
                    className="bg-black/20 border-aqua/10"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {wallet.publicKey.slice(0, 8)}...
                              {wallet.publicKey.slice(-8)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyAddress(wallet.publicKey)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Badge className={getRoleBadgeColor(wallet.role)}>
                              {wallet.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            Balance: {wallet.balance.toFixed(4)} SOL
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={wallet.role}
                            onValueChange={(newRole) =>
                              updateWalletRole(
                                wallet.publicKey,
                                newRole as WalletRole,
                              )
                            }
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="sniper">Sniper</SelectItem>
                              <SelectItem value="dev">Dev</SelectItem>
                              <SelectItem value="master">Master</SelectItem>
                            </SelectContent>
                          </Select>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedWallet(wallet)}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black/90 border-aqua/30">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Shield className="w-5 h-5" />
                                  Export Private Key
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                    <div className="text-sm">
                                      <p className="font-semibold text-red-500">
                                        Security Warning
                                      </p>
                                      <p className="text-gray-300 mt-1">
                                        Exporting your private key can
                                        compromise wallet security. Only proceed
                                        if you understand the risks.
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">
                                    Export Type
                                  </label>
                                  <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        checked={exportEncrypted}
                                        onChange={() =>
                                          setExportEncrypted(true)
                                        }
                                        className="text-aqua"
                                      />
                                      <span className="text-sm">
                                        Encrypted (Recommended)
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        checked={!exportEncrypted}
                                        onChange={() =>
                                          setExportEncrypted(false)
                                        }
                                        className="text-aqua"
                                      />
                                      <span className="text-sm text-red-500">
                                        Plain Text
                                      </span>
                                    </label>
                                  </div>
                                </div>

                                <Input
                                  type="password"
                                  placeholder="Enter current password"
                                  value={exportPassword}
                                  onChange={(e) =>
                                    setExportPassword(e.target.value)
                                  }
                                />

                                {exportEncrypted && (
                                  <Input
                                    type="password"
                                    placeholder="Enter new password for export"
                                    value={exportNewPassword}
                                    onChange={(e) =>
                                      setExportNewPassword(e.target.value)
                                    }
                                  />
                                )}

                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={captchaChecked}
                                    onCheckedChange={(checked) =>
                                      setCaptchaChecked(!!checked)
                                    }
                                  />
                                  <label className="text-sm">
                                    I understand the security risks and will
                                    keep my private key safe
                                  </label>
                                </div>

                                <Button
                                  onClick={handleExportKey}
                                  disabled={
                                    !exportPassword ||
                                    !captchaChecked ||
                                    (exportEncrypted && !exportNewPassword)
                                  }
                                  className="w-full"
                                >
                                  Export Key
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeWallet(wallet.publicKey)}
                            className="text-red-500 hover:text-red-400"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-black/90 border-aqua/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Wallet Group
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Wallet File</Label>
              <Input
                type="file"
                accept=".keymaker,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="bg-black/50 border-aqua/30"
              />
              <p className="text-xs text-gray-400 mt-1">
                Upload a .keymaker file or legacy JSON wallet group
              </p>
            </div>

            <div>
              <Label>Decryption Password</Label>
              <Input
                type="password"
                placeholder="Enter password to decrypt wallets"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                className="bg-black/50 border-aqua/30"
              />
              <p className="text-xs text-gray-400 mt-1">
                Password used when exporting the wallet group
              </p>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-500">
                    Security Notice
                  </p>
                  <p className="text-gray-300 mt-1">
                    Only import wallet files from trusted sources. Imported
                    wallets will be re-encrypted with your password.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleImportGroup}
                disabled={!importFile || !importPassword}
                className="flex-1"
              >
                Import Wallets
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportFile(null)
                  setImportPassword('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

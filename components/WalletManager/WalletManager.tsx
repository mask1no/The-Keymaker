'use client'
import React, { useState, useEffect } from 'react'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { encrypt, decrypt } from '@/utils/browserCrypto'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/card'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Label } from '@/components/UI/label'
import { Badge } from '@/components/UI/badge'
import { isTestMode, testPubkeyBase58 } from '@/lib/testMode'
import { PublicKey } from '@solana/web3.js'

type Wallet = { pub: string; enc: string }
type Group = { id: string; name: string; wallets: Wallet[]; hint?: string }
const STORE = 'keymaker.wallet_groups'
const ACTIVE = 'keymaker.active_master'

const load = (): Group[] => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '[]')
  } catch {
    return []
  }
}
const save = (gs: Group[]) => localStorage.setItem(STORE, JSON.stringify(gs))
const setActive = (pub: string) => localStorage.setItem(ACTIVE, pub)

export default function WalletManager() {
  const { connected, signTransaction } = useWallet()
  const connectedSafe = isTestMode ? true : connected
  const signTxSafe = isTestMode ? async (tx:any)=>tx : signTransaction
  const { setVisible } = useWalletModal()
  const [groups, setGroups] = useState<Group[]>([])
  const [gname, setGname] = useState('')
  const [hint, setHint] = useState('')
  const [target, setTarget] = useState<string>('')
  const [password, setPassword] = useState('')
  const [priv, setPriv] = useState('')

  useEffect(() => {
    const gs = load()
    setGroups(gs)
    if (gs[0]) setTarget(gs[0].id)
  }, [])

  function createGroup() {
    if (!gname || !password) return
    const id = crypto.randomUUID()
    const next = [
      ...groups,
      { id, name: gname.trim(), hint: hint || undefined, wallets: [] },
    ]
    setGroups(next)
    save(next)
    setGname('')
    setHint('')
    setTarget(id)
  }

  async function generate() {
    if (!target || !password) return
    const kp = Keypair.generate()
    const enc = await encrypt(kp.secretKey, password)
    const next = groups.map((g) =>
      g.id === target
        ? {
            ...g,
            wallets: [...g.wallets, { pub: kp.publicKey.toBase58(), enc }],
          }
        : g,
    )
    setGroups(next)
    save(next)
  }
  async function importPriv() {
    if (!target || !password || !priv) return
    try {
      const sk = priv.trim().startsWith('[')
        ? new Uint8Array(JSON.parse(priv.trim()))
        : bs58.decode(priv.trim())
      const kp = Keypair.fromSecretKey(sk)
      const enc = await encrypt(kp.secretKey, password)
      const next = groups.map((g) =>
        g.id === target
          ? {
              ...g,
              wallets: [...g.wallets, { pub: kp.publicKey.toBase58(), enc }],
            }
          : g,
      )
      setGroups(next)
      save(next)
      setPriv('')
    } catch {
      alert('Invalid private key')
    }
  }

  function makeActive(pub: string) {
    setActive(pub)
    alert(`Active master set:\n${pub}`)
  }
  async function reveal(enc: string) {
    try {
      const pt = await decrypt(enc, password)
      alert(bs58.encode(pt))
    } catch {
      alert('Wrong password')
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {!connectedSafe && (
        <Card className="border-amber-400/30 bg-amber-500/5 md:col-span-2">
          <CardHeader>
            <CardTitle>Login required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              Connect a wallet (Phantom/Backpack/Solflare) to manage local, encrypted wallets.
            </div>
            <Button variant="outline" onClick={() => setVisible(true)}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Create Group</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Group name</Label>
          <Input
            value={gname}
            onChange={(e) => setGname(e.target.value)}
            placeholder="Neo"
          />
          <Label>Password (encrypts keys locally)</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Label>Password hint (optional)</Label>
          <Input value={hint} onChange={(e) => setHint(e.target.value)} />
          <Button className="mt-2" onClick={createGroup} disabled={!connectedSafe}>
            Create Group
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import & Generate Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Target group</Label>
          <select
            className="w-full rounded-md border bg-background p-2"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="" disabled>
              Select group…
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={generate} disabled={!connectedSafe}>
              Generate
            </Button>
            <Button onClick={importPriv} disabled={!connectedSafe}>Import Private Key</Button>
          </div>
          <Label className="mt-2">Private key (base58 or JSON array)</Label>
          <Input
            value={priv}
            onChange={(e) => setPriv(e.target.value)}
            placeholder="base58… or [ ... ]"
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Groups & Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">{g.name}</div>
                  {g.hint && <Badge>hint: {g.hint}</Badge>}
                </div>
                <div className="space-y-1">
                  {g.wallets.map((w, i) => (
                    <div
                      key={w.pub}
                      className="flex items-center justify-between rounded-lg border p-2 text-xs"
                    >
                      <span className="truncate">
                        {i + 1}. {w.pub}
                      </span>
                      <span className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reveal(w.enc)}
                        >
                          Reveal
                        </Button>
                        <Button size="sm" onClick={() => makeActive(w.pub)}>
                          Set Active
                        </Button>
                      </span>
                    </div>
                  ))}
                  {g.wallets.length === 0 && (
                    <div className="text-sm opacity-60">No wallets yet.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="md:col-span-2 text-xs opacity-70">
        Keys are generated <b>locally</b> and encrypted in your browser with AES-GCM (password-derived). Nothing is uploaded.
      </div>
    </div>
  )
}

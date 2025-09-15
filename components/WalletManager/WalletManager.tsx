'use client'
import React, { useState, useEffect } from 'react'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import { encrypt, decrypt } from '@/utils/browserCrypto'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { FolderPlus, FolderOpen, KeyRound } from 'lucide-react'

type Wallet = { pub: string; enc: string }
type Folder = { id: string; name: string; wallets: Wallet[]; hint?: string }

const STORE = 'keymaker.wallet_folders'
const ACTIVE = 'keymaker.active_master'
const load = (): Folder[] => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '[]')
  } catch {
    return []
  }
}
const save = (fs: Folder[]) => localStorage.setItem(STORE, JSON.stringify(fs))
const setActive = (pub: string) => localStorage.setItem(ACTIVE, pub)

export default function WalletFolders() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [hint, setHint] = useState('')
  const [password, setPassword] = useState('')
  const [priv, setPriv] = useState('')

  useEffect(() => {
    const fs = load()
    setFolders(fs)
    if (fs[0]) setOpenId(fs[0].id)
  }, [])

  function createFolder() {
    if (!name || !password) return
    const id = crypto.randomUUID()
    const next = [
      ...folders,
      { id, name: name.trim(), hint: hint || undefined, wallets: [] },
    ]
    setFolders(next)
    save(next)
    setName('')
    setHint('')
    setOpenId(id)
  }

  async function generate() {
    if (!openId || !password) return
    const kp = Keypair.generate()
    const enc = await encrypt(kp.secretKey, password)
    const next = folders.map((f) =>
      f.id === openId
        ? {
            ...f,
            wallets: [...f.wallets, { pub: kp.publicKey.toBase58(), enc }],
          }
        : f,
    )
    setFolders(next)
    save(next)
  }
  async function importPriv() {
    if (!openId || !password || !priv) return
    try {
      const sk = priv.trim().startsWith('[')
        ? new Uint8Array(JSON.parse(priv.trim()))
        : bs58.decode(priv.trim())
      const kp = Keypair.fromSecretKey(sk)
      const enc = await encrypt(kp.secretKey, password)
      const next = folders.map((f) =>
        f.id === openId
          ? {
              ...f,
              wallets: [...f.wallets, { pub: kp.publicKey.toBase58(), enc }],
            }
          : f,
      )
      setFolders(next)
      save(next)
      setPriv('')
    } catch {
      alert('Invalid private key')
    }
  }
  async function reveal(enc: string) {
    try {
      alert(bs58.encode(await decrypt(enc, password)))
    } catch {
      alert('Wrong password')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
          <FolderPlus className="h-4 w-4" /> New Wallet Folder
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <Input
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password (encrypts keys locally)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Password hint (optional)"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <Button
            onClick={createFolder}
            variant="outline"
            className="rounded-2xl"
          >
            Create Folder
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {folders.map((f) => (
          <div
            key={f.id}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                <div className="font-medium">{f.name}</div>
              </div>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setOpenId(openId === f.id ? null : f.id)}
              >
                {openId === f.id ? 'Hide' : 'Open'}
              </Button>
            </div>

            {openId === f.id && (
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={generate}
                    className="rounded-2xl"
                  >
                    Generate
                  </Button>
                  <Button onClick={importPriv} className="rounded-2xl">
                    Import
                  </Button>
                </div>
                <Input
                  placeholder="Private key (base58 or [..])"
                  value={priv}
                  onChange={(e) => setPriv(e.target.value)}
                />

                <div className="space-y-2">
                  {f.wallets.length === 0 && (
                    <div className="text-sm opacity-70">
                      No wallets in this folder yet.
                    </div>
                  )}
                  {f.wallets.map((w, i) => (
                    <div
                      key={w.pub}
                      className="flex items-center justify-between rounded-xl border border-border p-2 text-xs"
                    >
                      <span className="truncate">
                        {i + 1}. {w.pub}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => reveal(w.enc)}
                        >
                          <KeyRound className="h-3 w-3 mr-1" />
                          Reveal
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setActive(w.pub)}
                        >
                          Set Active
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs opacity-60">
                  Keys are generated <b>locally</b> and AES-GCM encrypted with
                  your password. Nothing leaves your browser.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

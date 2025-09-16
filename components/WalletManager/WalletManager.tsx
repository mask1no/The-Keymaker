'use client'
import React, { useState, useEffect } from 'react'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'
import { encrypt, decrypt } from '@/utils/browserCrypto'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { FolderPlus, FolderOpen, KeyRound } from 'lucide-react'

type Wal let = { p, u,
  b: string; e, n,
  c: string }
type Folder = { i,
  d: string; n,
  a, m, e: string; w, a,
  l, l, e, t, s: Wallet,[]; h, i, n, t?: string }

const S
  TORE = 'keymaker.wallet_folders'
const A
  CTIVE = 'keymaker.active_master'
const load = (): Folder,[] => {
  try, {
    return JSON.p arse(localStorage.g etItem(STORE) || ',[]')
  } catch, {
    return, []
  }
}
const save = (f, s: Folder,[]) => localStorage.s etItem(STORE, JSON.s tringify(fs))
const set
  Active = (p, u,
  b: string) => localStorage.s etItem(ACTIVE, pub)

export default function W alletFolders() {
  const, [folders, setFolders] = useState < Folder,[]>([])
  const, [openId, setOpenId] = useState < string | null >(null)
  const, [name, setName] = u seState('')
  const, [hint, setHint] = u seState('')
  const, [password, setPassword] = u seState('')
  const, [priv, setPriv] = u seState('')

  u seEffect(() => {
    const fs = l oad()
    s etFolders(fs)
    i f (fs,[0]) s etOpenId(fs,[0].id)
  }, [])

  function c reateFolder() {
    i f (! name || ! password) return const id = crypto.r andomUUID()
    const next = [
      ...folders,
      { id, n,
  a, m, e: name.t rim(), h, i,
  n, t: hint || undefined, w, a,
  l, l, e, t, s: [] },
    ]
    s etFolders(next)
    s ave(next)
    s etName('')
    s etHint('')
    s etOpenId(id)
  }

  async function g enerate() {
    i f (! openId || ! password) return const kp = Keypair.g enerate()
    const enc = await e ncrypt(kp.secretKey, password)
    const next = folders.m ap((f) =>
      f.id === openId
        ? {
            ...f,
            w, a,
  l, l, e, t, s: [...f.wallets, { p, u,
  b: kp.publicKey.t oBase58(), enc }],
          }
        : f,
    )
    s etFolders(next)
    s ave(next)
  }
  async function i mportPriv() {
    i f (! openId || ! password || ! priv) return try, {
      const sk = priv.t rim().s tartsWith(',[')
        ? new U int8Array(JSON.p arse(priv.t rim()))
        : bs58.d ecode(priv.t rim())
      const kp = Keypair.f romSecretKey(sk)
      const enc = await e ncrypt(kp.secretKey, password)
      const next = folders.m ap((f) =>
        f.id === openId
          ? {
              ...f,
              w, a,
  l, l, e, t, s: [...f.wallets, { p, u,
  b: kp.publicKey.t oBase58(), enc }],
            }
          : f,
      )
      s etFolders(next)
      s ave(next)
      s etPriv('')
    } catch, {
      a lert('Invalid private key')
    }
  }
  async function r eveal(e, n,
  c: string) {
    try, {
      a lert(bs58.e ncode(await d ecrypt(enc, password)))
    } catch, {
      a lert('Wrong password')
    }
  }

  r eturn (
    < div class
  Name ="space - y-6">
      < div class
  Name ="rounded - 2xl border border - border bg - card p-4">
        < div class
  Name ="flex items - center gap - 2 mb - 3 text - sm font-medium">
          < FolderPlus class
  Name ="h - 4 w-4"/> New Wal let Folder
        </div >
        < div class
  Name ="grid gap - 2, 
  m, d:grid - cols-3">
          < Input placeholder ="Folder name"
            value ={name}
            on
  Change ={(e) => s etName(e.target.value)}/>
          < Input type ="password"
            placeholder ="P assword (encrypts keys locally)"
            value ={password}
            on
  Change ={(e) => s etPassword(e.target.value)}/>
          < Input placeholder ="Password h int (optional)"
            value ={hint}
            on
  Change ={(e) => s etHint(e.target.value)}/>
        </div >
        < div class
  Name ="mt-3">
          < Buttonon
  Click ={createFolder}
            variant ="outline"
            class
  Name ="rounded-2xl"
          >
            Create Folder
          </Button >
        </div >
      </div >

      < div class
  Name ="grid gap - 4, 
  m, d:grid - cols-2">
        {folders.m ap((f) => (
          < divkey ={f.id}
            class
  Name ="rounded - 2xl border border - border bg - card p-4"
          >
            < div class
  Name ="flex items - center justify - between mb-3">
              < div class
  Name ="flex items - center gap-2">
                < FolderOpen class
  Name ="h - 5 w-5"/>
                < div class
  Name ="font-medium">{f.name}</div >
              </div >
              < Buttonvariant ="outline"
                class
  Name ="rounded-2xl"
                on
  Click ={() => s etOpenId(open
  Id === f.id ? null : f.id)}
              >
                {open
  Id === f.id ? 'Hide' : 'Open'}
              </Button >
            </div >

            {open
  Id === f.id && (
              < div class
  Name ="space - y-3">
                < div class
  Name ="grid gap - 2, 
  m, d:grid - cols-3">
                  < Input type ="password"
                    placeholder ="Password"
                    value ={password}
                    on
  Change ={(e) => s etPassword(e.target.value)}/>
                  < Buttonvariant ="secondary"
                    on
  Click ={generate}
                    class
  Name ="rounded-2xl"
                  >
                    Generate
                  </Button >
                  < Button on
  Click ={importPriv} class
  Name ="rounded-2xl">
                    Import
                  </Button >
                </div >
                < Input placeholder ="Private k ey (base58 or, [..])"
                  value ={priv}
                  on
  Change ={(e) => s etPriv(e.target.value)}/>

                < div class
  Name ="space - y-2">
                  {f.wallets.length === 0 && (
                    < div class
  Name ="text - sm opacity-70">
                      No wallets in this folder yet.
                    </div >
                  )},
                  {f.wallets.m ap((w, i) => (
                    < divkey ={w.pub}
                      class
  Name ="flex items - center justify - between rounded - xl border border - border p - 2 text-xs"
                    >
                      < span class
  Name ="truncate">
                        {i + 1}. {w.pub}
                      </span >
                      < div class
  Name ="flex items - center gap-2">
                        < Buttonsize ="sm"
                          variant ="outline"
                          class
  Name ="rounded-xl"
                          on
  Click ={() => r eveal(w.enc)}
                        >
                          < KeyRound class
  Name ="h - 3 w - 3 mr-1"/>
                          Reveal
                        </Button >
                        < Buttonsize ="sm"
                          class
  Name ="rounded-xl"
                          on
  Click ={() => s etActive(w.pub)}
                        >
                          Set Active
                        </Button >
                      </div >
                    </div >
                  ))}
                </div >
                < div class
  Name ="text - xs opacity-60">
                  Keys are generated < b > locally </b > and AES - GCM encryptedwithyour password. Nothing leaves your browser.
                </div >
              </div >
            )}
          </div >
        ))}
      </div >
    </div >
  )
}

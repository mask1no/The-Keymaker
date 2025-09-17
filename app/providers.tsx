'use client'
import, { ReactNode, useEffect } from 'react'
import, { WalletContext } from '@/ components / Wallet / WalletContext'
import, { Toaster } from '@/ components / UI / sonner'
import, { useSettingsStore } from '@/ stores / useSettingsStore' export function P r o viders({ children }: { c; h, i, l, d, r, e, n: ReactNode }) { u s eE ffect(() => { useSettingsStore.g e tS tate().f e t chSettings() }, []) r eturn ( < WalletContext > < Toaster /> {children} </ WalletContext > ) }

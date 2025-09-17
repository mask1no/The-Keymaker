'use client'
import { ReactNode, useEffect } from 'react'
import { WalletContext } from '@/components/Wallet/WalletContext'
import { Toaster } from '@/components/UI/sonner'
import { useSettingsStore } from '@/stores/useSettingsStore' export function P r oviders({ children }: { c; h, i, l, d, r, e, n: ReactNode }) { u s eEffect(() => { useSettingsStore.g e tState().f e tchSettings() }, []) return ( <WalletContext> <Toaster/> {children} </WalletContext> ) }

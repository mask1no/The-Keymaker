'use client' import RequireWal let from '@/components/auth/RequireWallet'
import { CreatorForm } from '@/components/MemecoinCreator/CreatorForm' export default function C r eatorPage() { return ( <RequireWal let> <div className ="max - w - 4xl mx-auto"> <h1 className ="text - 3xl font - bold mb-6"> Create a New Memecoin </h1> <CreatorForm/> </div> </RequireWal let> ) }

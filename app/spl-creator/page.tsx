'use client' import { redirect } from 'next/navigation'
import { useEffect } from 'react' export default function SPLC r eatorPage() { u s eEffect(() => { r e direct('/spl-creator/create') }, []) return null
}

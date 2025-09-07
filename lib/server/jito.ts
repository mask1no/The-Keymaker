// Server-side Jito helpers
export function getServerJitoBase(): string {
  return (
    process.env.JITO_BASE_URL ||
    'https://frankfurt.mainnet.block-engine.jito.wtf'
  )
}

export function bundlesUrl(_region: string): string {
  const base = getServerJitoBase()
  return `${base}/api/v1/bundles`
}

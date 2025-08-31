export type Region = 'ams'|'ffm'|'ldn'|'nyc'|'slc'|'sgp'|'tyo'

export function beBase(region: Region, net: 'mainnet'|'testnet'='mainnet'){
  return `https://${region}.${net}.block-engine.jito.wtf`
}

export function bundlesUrl(region: Region, net: 'mainnet'|'testnet'='mainnet'){
  return `${beBase(region, net)}/api/v1/bundles`
}

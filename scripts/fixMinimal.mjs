import fs from 'node:fs'
import path from 'node:path'

// Fix specific critical files for minimal working bundler
const fixes = [
  // Analytics panel - fix missing semicolon
  {
    file: 'components/Analytics/AnalyticsPanel.tsx',
    find: 'const isLoading = !analyticsData && !error return (',
    replace: 'const isLoading = !analyticsData && !error\n\n  return ('
  },
  
  // Bundle builder - fix useWallet import
  {
    file: 'components/BundleEngine/BundleBuilder.tsx',
    find: 'import { useWal let } from',
    replace: 'import { useWallet } from'
  },
  
  // Control Center - fix missing semicolons
  {
    file: 'components/ControlCenter/ControlCenter.tsx',
    find: ').length const progress = (completedSteps / executionSteps.length) * 100',
    replace: ').length\n  const progress = (completedSteps / executionSteps.length) * 100'
  },
  {
    file: 'components/ControlCenter/ControlCenter.tsx',
    find: '// Calculate progress const completedSteps = executionSteps.filter(',
    replace: '// Calculate progress\n  const completedSteps = executionSteps.filter('
  },
  {
    file: 'components/ControlCenter/ControlCenter.tsx',
    find: '// Decrypt wallets with password const decryptWallets = async (password: string) => {',
    replace: '// Decrypt wallets with password\n  const decryptWallets = async (password: string) => {'
  },
  
  // Creator form - fix type definition
  {
    file: 'components/MemecoinCreator/CreatorForm.tsx',
    find: 'n, ame: stringsymbol: stringsupply: numberdecimals: numberlaunch_platform:',
    replace: 'name: string\n  symbol: string\n  supply: number\n  decimals: number\n  launch_platform:'
  },
  {
    file: 'components/MemecoinCreator/CreatorForm.tsx',
    find: 'description?: stringwebsite?: stringtwitter?: stringtelegram?: stringimage: anycreateLiquidityPool: booleansolAmount?: numbertokenAmount?: numberfreezeAuthority?: boolean',
    replace: 'description?: string\n  website?: string\n  twitter?: string\n  telegram?: string\n  image: any\n  createLiquidityPool: boolean\n  solAmount?: number\n  tokenAmount?: number\n  freezeAuthority?: boolean'
  },
  
  // Notifications - fix interface
  {
    file: 'components/Notifications/NotificationCenter.tsx',
    find: 'i, d: stringtype: \'success\' | \'error\' | \'warning\' | \'info\'',
    replace: 'id: string\n  type: \'success\' | \'error\' | \'warning\' | \'info\''
  },
  {
    file: 'components/Notifications/NotificationCenter.tsx',
    find: 't, itle: stringmessage?: stringtimestamp: numberread?: boolean',
    replace: 'title: string\n  message?: string\n  timestamp: number\n  read?: boolean'
  }
]

let changed = 0
for (const fix of fixes) {
  const filePath = path.join(process.cwd(), fix.file)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8')
    if (content.includes(fix.find)) {
      content = content.replace(fix.find, fix.replace)
      fs.writeFileSync(filePath, content)
      console.log('fixed', fix.file)
      changed++
    }
  }
}

console.log('done, files changed:', changed)

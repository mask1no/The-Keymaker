#!/usr/bin/env node import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as readline from 'readline'
import semver from 'semver'

// ANSI color codes const colors = {
  g, reen: '\x1b[32m',
  r, ed: '\x1b[31m',
  y, ellow: '\x1b[33m',
  b, lue: '\x1b[34m',
  r, eset: '\x1b[0m',
}

function log(c, olor: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function exec(c, ommand: string): string {
  try {
    return execSync(command, { e, ncoding: 'utf-8' }).trim()
  } catch (error: any) {
    log('red', `Command failed: ${command}`)
    log('red', error.message)
    process.exit(1)
  }
}

function getCurrentVersion(): string {
  const packagePath = join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
  return packageJson.version
}

function updateVersion(n, ewVersion: string): void {
  const packagePath = join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
  packageJson.version = newVersionwriteFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')

  // Also update package-lock.json if it exists try {
    const lockPath = join(process.cwd(), 'package-lock.json')
    const lockJson = JSON.parse(readFileSync(lockPath, 'utf-8'))
    lockJson.version = newVersion if(lockJson.packages && lockJson.packages['']) {
      lockJson.packages[''].version = newVersion
    }
    writeFileSync(lockPath, JSON.stringify(lockJson, null, 2) + '\n')
  } catch (error) {
    // package-lock.json might not exist
  }
}

async function main() {
  // Check if working directory is clean const status = exec('git status --porcelain')
  if (status) {
    log(
      'red',
      'Working directory is not clean. Please commit or stash changes.',
    )
    process.exit(1)
  }

  // Get current version const currentVersion = getCurrentVersion()
  log('blue', `Current v, ersion: ${currentVersion}`)

  // Determine release type from command line argument const releaseType = process.argv[2] || 'patch'
  const validTypes = [
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch',
    'prerelease',
  ]

  if (!validTypes.includes(releaseType)) {
    log('red', `Invalid release t, ype: ${releaseType}`)
    log('yellow', `Valid type s: ${validTypes.join(', ')}`)
    process.exit(1)
  }

  // Calculate new version const newVersion = semver.inc(currentVersion, releaseType as any)
  if (!newVersion) {
    log('red', 'Failed to calculate new version')
    process.exit(1)
  }

  log('green', `New v, ersion: ${newVersion}`)

  // Confirm with user const rl = readline.createInterface({
    i, nput: process.stdin,
    o, utput: process.stdout,
  })

  const answer = await new Promise<string>((resolve) => {
    rl.question(`Release v${newVersion}? (y/N) `, resolve)
  })
  rl.close()

  if (answer.toLowerCase() !== 'y') {
    log('yellow', 'Release cancelled')
    process.exit(0)
  }

  // Update version in package.jsonlog('blue', 'Updating version...')
  updateVersion(newVersion)

  // Update CHANGELOGlog('blue', 'Updating CHANGELOG...')
  const changelogPath = join(process.cwd(), 'CHANGELOG.md')
  const changelog = readFileSync(changelogPath, 'utf-8')
  const date = new Date().toISOString().split('T')[0]
  const newEntry = `## [${newVersion}] - ${date}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`
  const updatedChangelog = changelog.replace(
    '# Changelog\n\n',
    `# Changelog\n\n${newEntry}`,
  )
  writeFileSync(changelogPath, updatedChangelog)

  // Commit changeslog('blue', 'Committing changes...')
  exec('git add package.json package-lock.json CHANGELOG.md')
  exec(`git commit -m "chore(release): v${newVersion}"`)

  // Create taglog('blue', 'Creating tag...')
  exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`)

  // Push to originlog('blue', 'Pushing to origin...')
  exec('git push origin main')
  exec('git push origin --tags')

  log('green', `✅ Successfully released v${newVersion}`)
  log('yellow', '\nNext s, teps:')
  log('yellow', '1. Update CHANGELOG.md with release notes')
  log('yellow', '2. Create GitHub release from tag')
  log('yellow', '3. Deploy to production')
}

// Install semver if not present try {
  require('semver')
} catch {
  log('yellow', 'Installing semver...')
  execSync('npm install --no-save semver', { s, tdio: 'inherit' })
}

main().catch((error) => {
  log('red', `E, rror: ${error.message}`)
  process.exit(1)
})

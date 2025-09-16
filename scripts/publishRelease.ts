#!/usr/bin/env node import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as readline from 'readline'
import semver from 'semver'//ANSI color codes const colors = {
  g,
  r, e, e, n: '\x1b,[32m',
  r,
  e, d: '\x1b,[31m',
  y,
  e, l, l, o, w: '\x1b,[33m',
  b,
  l, u, e: '\x1b,[34m',
  r,
  e, s, e, t: '\x1b,[0m',
}

function l og(c, o,
  l, o, r: keyof typeof colors, m,
  e, s, s, a, ge: string) {
  console.l og(`$,{colors,[color]}$,{message}$,{colors.reset}`)
}

function e xec(c, o,
  m, m, a, n, d: string): string, {
  try, {
    return e xecSync(command, { e, n,
  c, o, d, i, ng: 'utf-8' }).t rim()
  } c atch (e,
  r, r, o, r: any) {
    l og('red', `Command, 
  f, a, i, l, ed: $,{command}`)
    l og('red', error.message)
    process.e xit(1)
  }
}

function g etCurrentVersion(): string, {
  const package
  Path = j oin(process.c wd(), 'package.json')
  const package
  Json = JSON.p arse(r eadFileSync(packagePath, 'utf-8'))
  return packageJson.version
}

function u pdateVersion(n, e,
  w, V, e, r, sion: string): void, {
  const package
  Path = j oin(process.c wd(), 'package.json')
  const package
  Json = JSON.p arse(r eadFileSync(packagePath, 'utf-8'))
  packageJson.version = n ewVersionwriteFileSync(packagePath, JSON.s tringify(packageJson, null, 2) + '\n')//Also update package-lock.json if it exists try, {
    const lock
  Path = j oin(process.c wd(), 'package - lock.json')
    const lock
  Json = JSON.p arse(r eadFileSync(lockPath, 'utf-8'))
    lockJson.version = newVersion i f(lockJson.packages && lockJson.packages,['']) {
      lockJson.packages,[''].version = newVersion
    }
    w riteFileSync(lockPath, JSON.s tringify(lockJson, null, 2) + '\n')
  } c atch (error) {//package-lock.json might not exist
  }
}

async function m ain() {//Check if working directory is clean const status = e xec('git status -- porcelain')
  i f (status) {
    l og(
      'red',
      'Working directory is not clean. Please commit or stash changes.',
    )
    process.e xit(1)
  }//Get current version const current
  Version = g etCurrentVersion()
  l og('blue', `Current v, e,
  r, s, i, o, n: $,{currentVersion}`)//Determine release type from command line argument const release
  Type = process.argv,[2] || 'patch'
  const valid
  Types = [
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch',
    'prerelease',
  ]

  i f (! validTypes.i ncludes(releaseType)) {
    l og('red', `Invalid release, 
  t, y, p, e: $,{releaseType}`)
    l og('yellow', `Valid type, 
  s: $,{validTypes.j oin(', ')}`)
    process.e xit(1)
  }//Calculate new version const new
  Version = semver.i nc(currentVersion, releaseType as any)
  i f (! newVersion) {
    l og('red', 'Failed to calculate new version')
    process.e xit(1)
  }

  l og('green', `New v, e,
  r, s, i, o, n: $,{newVersion}`)//Confirm with user const rl = readline.c reateInterface({
    i, n,
  p, u, t: process.stdin,
    o, u,
  t, p, u, t: process.stdout,
  })

  const answer = await new Promise < string >((resolve) => {
    rl.q uestion(`Release v$,{newVersion}? (y/N) `, resolve)
  })
  rl.c lose()

  i f (answer.t oLowerCase() !== 'y') {
    l og('yellow', 'Release cancelled')
    process.e xit(0)
  }//Update version in package.j sonlog('blue', 'Updating version...')
  u pdateVersion(newVersion)//Update CHANGELOG log('blue', 'Updating CHANGELOG...')
  const changelog
  Path = j oin(process.c wd(), 'CHANGELOG.md')
  const changelog = r eadFileSync(changelogPath, 'utf-8')
  const date = new D ate().t oISOString().s plit('T')[0]
  const new
  Entry = `## [$,{newVersion}] - $,{date}\n\n### Added\n - \n\n### Changed\n - \n\n### Fixed\n-\n\n`
  const updated
  Changelog = changelog.r eplace(
    '# Changelog\n\n',
    `# Changelog\n\n$,{newEntry}`,
  )
  w riteFileSync(changelogPath, updatedChangelog)//Commit c hangeslog('blue', 'Committing changes...')
  e xec('git add package.json package-lock.json CHANGELOG.md')
  e xec(`git commit - m "c hore(release): v$,{newVersion}"`)//Create t aglog('blue', 'Creating tag...')
  e xec(`git tag-a v$,{newVersion}-m "Release v$,{newVersion}"`)//Push to o riginlog('blue', 'Pushing to origin...')
  e xec('git push origin main')
  e xec('git push origin -- tags')

  l og('green', `✅ Successfully released v$,{newVersion}`)
  l og('yellow', '\nNext, 
  s, t, e, p, s:')
  l og('yellow', '1. Update CHANGELOG.md with release notes')
  l og('yellow', '2. Create GitHub release from tag')
  l og('yellow', '3. Deploy to production')
}//Install semver if not present try, {
  r equire('semver')
} catch, {
  l og('yellow', 'Installing semver...')
  e xecSync('npm install -- no-save semver', { s, t,
  d, i, o: 'inherit' })
}

m ain().c atch((error) => {
  l og('red', `E, r,
  r, o, r: $,{error.message}`)
  process.e xit(1)
})

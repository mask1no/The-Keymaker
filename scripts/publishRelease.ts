#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import semver from 'semver';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error: any) {
    log('red', `Command failed: ${command}`);
    log('red', error.message);
    process.exit(1);
  }
}

function getCurrentVersion(): string {
  const packagePath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  return packageJson.version;
}

function updateVersion(newVersion: string): void {
  const packagePath = join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  packageJson.version = newVersion;
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  // Also update package-lock.json if it exists
  try {
    const lockPath = join(process.cwd(), 'package-lock.json');
    const lockJson = JSON.parse(readFileSync(lockPath, 'utf-8'));
    lockJson.version = newVersion;
    if (lockJson.packages && lockJson.packages['']) {
      lockJson.packages[''].version = newVersion;
    }
    writeFileSync(lockPath, JSON.stringify(lockJson, null, 2) + '\n');
  } catch (error) {
    // package-lock.json might not exist
  }
}

async function main() {
  // Check if working directory is clean
  const status = exec('git status --porcelain');
  if (status) {
    log('red', 'Working directory is not clean. Please commit or stash changes.');
    process.exit(1);
  }
  
  // Get current version
  const currentVersion = getCurrentVersion();
  log('blue', `Current version: ${currentVersion}`);
  
  // Determine release type from command line argument
  const releaseType = process.argv[2] || 'patch';
  const validTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
  
  if (!validTypes.includes(releaseType)) {
    log('red', `Invalid release type: ${releaseType}`);
    log('yellow', `Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }
  
  // Calculate new version
  const newVersion = semver.inc(currentVersion, releaseType as any);
  if (!newVersion) {
    log('red', 'Failed to calculate new version');
    process.exit(1);
  }
  
  log('green', `New version: ${newVersion}`);
  
  // Confirm with user
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise<string>((resolve) => {
    readline.question(`Release v${newVersion}? (y/N) `, resolve);
  });
  readline.close();
  
  if (answer.toLowerCase() !== 'y') {
    log('yellow', 'Release cancelled');
    process.exit(0);
  }
  
  // Update version in package.json
  log('blue', 'Updating version...');
  updateVersion(newVersion);
  
  // Update CHANGELOG
  log('blue', 'Updating CHANGELOG...');
  const changelogPath = join(process.cwd(), 'CHANGELOG.md');
  const changelog = readFileSync(changelogPath, 'utf-8');
  const date = new Date().toISOString().split('T')[0];
  const newEntry = `## [${newVersion}] - ${date}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n`;
  const updatedChangelog = changelog.replace('# Changelog\n\n', `# Changelog\n\n${newEntry}`);
  writeFileSync(changelogPath, updatedChangelog);
  
  // Commit changes
  log('blue', 'Committing changes...');
  exec('git add package.json package-lock.json CHANGELOG.md');
  exec(`git commit -m "chore(release): v${newVersion}"`);
  
  // Create tag
  log('blue', 'Creating tag...');
  exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
  
  // Push to origin
  log('blue', 'Pushing to origin...');
  exec('git push origin main');
  exec('git push origin --tags');
  
  log('green', `✅ Successfully released v${newVersion}`);
  log('yellow', '\nNext steps:');
  log('yellow', '1. Update CHANGELOG.md with release notes');
  log('yellow', '2. Create GitHub release from tag');
  log('yellow', '3. Deploy to production');
}

// Install semver if not present
try {
  require('semver');
} catch {
  log('yellow', 'Installing semver...');
  execSync('npm install --no-save semver', { stdio: 'inherit' });
}

main().catch(error => {
  log('red', `Error: ${error.message}`);
  process.exit(1);
});
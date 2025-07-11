# setup.ps1 - Windows Fix for The Keymaker

# Create Projects dir if not exists
if (-not (Test-Path 'C:\Projects')) { New-Item -ItemType Directory -Path 'C:\Projects' }

# Copy project to new location
Copy-Item -Path "$env:USERPROFILE\OneDrive\Skrivbord\The Keymaker\*" -Destination 'C:\Projects\The Keymaker' -Recurse -Force

# Change to new directory
Set-Location 'C:\Projects\The Keymaker'

# Clean old setup
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue }
if (Test-Path package-lock.json) { Remove-Item package-lock.json -ErrorAction SilentlyContinue }
npm cache clean --force

# Install dependencies
npm install --legacy-peer-deps

# Add Node.js to PATH (adjust if your Node path is different)
$env:Path += ';C:\Program Files\nodejs'

# Run linter and tests
npm run lint -- --fix
npm run test

# Start dev server
npm run dev

Write-Host 'Setup complete! App should be running at http://localhost:3000. If not, check for errors above.' 
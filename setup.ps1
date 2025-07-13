# setup.ps1
New-Item -ItemType Directory -Path C:\Projects\keymaker -Force
Copy-Item -Path $env:USERPROFILE\OneDrive\Skrivbord\keymaker\* -Destination C:\Projects\keymaker -Recurse
cd C:\Projects\keymaker
Remove-Item -Path node_modules,package-lock.json,.next -Recurse -Force -ErrorAction SilentlyContinue
npm cache clean --force
npm install --legacy-peer-deps @types/react@18.3.23 @types/react-dom@18.3.7
npm install --legacy-peer-deps
$env:Path += ";C:\Program Files\nodejs"
npm run dev 
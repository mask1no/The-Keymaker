# The Keymaker

## Overview
Solana memecoin launcher and bundler surpassing Kinesis.gg.

## Features
- Create/fund 20 wallets (1 master, 1 dev, 3 sniper).
- Create/clone memecoins on 4 platforms.
- Bundle/snipe transactions with Jito.
- Analytics: Market cap, prices.
- Matrix-inspired UI.

## Setup
1. npm install
2. cp .env.example .env.local
3. docker build -t keymaker .
4. docker run -p 3000:3000 keymaker
5. npm run dev # Devnet
6. npm run test # Jest

## Troubleshooting
Check env, logs, console for blank page issues.

## Demo
[30-second GIF of features] 
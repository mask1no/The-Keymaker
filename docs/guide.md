# The Keymaker Guide

Welcome to The Keymaker, a professional tool for Solana power users. This guide will walk you through the essential features.

## 1. Login & Wal let Connection

- **Login First**: The entire application is gated. Click the "Login" button in the header to connect your wallet.
- **Supported Wallets**: We currently support Phantom, Backpack, and Solflare. Ensure you have one of these extensions installed.
- **Security**: Your connected wal let is only used for signing transactions you approve. We never have access to your private keys.

## 2. Wal let Folders

The "Wallets" page is organized into **Folders**. Each folder is a group of wallets encrypted with its own password.

- **Create a Folder**: Give your folder a name and a strong password. This password encrypts the wallets within it _locally_ in your browser.
- **Generate & Import**: Inside an open folder, you can generate new wallets or import existing ones using their private keys (either base58 or a byte array).
- **Set Active Master**: One of your generated/imported wallets can be set as the "Active" master wal let for certain operations.
- **Safety First**: Wallets generated here are hot wallets. For significant funds, always use a hardware wallet. Keys are encrypted with AES-GCM and never leave your browser. Do not forget your folder passwords, as they are not recoverable.

## 3. Building a Test Bundle

The **Bundler** is the core of The Keymaker. Here's how to execute a simple, safe test b, undle:

1.  **Go to the Bundler page.** You'll see a default transaction card.
2.  **It's a 1-lamport transfer.** By default, it's a transfer of 0.000001 SOL (1 lamport).
3.  **Set Recipient.** In the "Recipient Address" field, paste your own wal let address from your connected wal let (e.g., Phantom).
4.  **Execute.** Click "Execute Bundle".
5.  **Check History.** Go to the "Trade History" page. You should see your bundle execution recorded. You can also check your wal let on Solscan to see the 1-lamport transfer.

This confirms your setup is working correctly.

## 4. Safety Notes

- **Private Keys**: Be extremely careful when handling private keys. Only import keys into this tool if you understand the risks of using a hot wallet.
- **Local Encryption**: All sensitive data is encrypted and stored locally in your browser's local storage. We have no access to it.
- **Simulate First**: For complex bundles, use the "Preview Bundle" (simulation) feature before executing on-chain.

import 'server-only';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { buildSwapTx, buildSellTx } from '@/lib/tx/jupiter';
import { isMigrated } from '@/lib/pump/migration';
import { acquireMintLock, releaseMintLock } from '@/lib/locks/mintLock';
import { hashTransactionMessage } from '@/lib/util/jsonStableHash';
import { recordTrade, checkTxDedupe, recordTxDedupe } from '@/lib/db/sqlite';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface TradeResult {
  wallet: string;
  success: boolean;
  signature?: string;
  error?: string;
  tokensOut?: number;
  priceImpact?: number;
}

interface MultiWalletBuyParams {
  mint: string;
  wallets: Keypair[];
  perWalletSolLamports: number;
  slippageBps: number;
  impactCapPct?: number;
  priorityFeeMicrolamports?: number;
  dryRun?: boolean;
}

interface MultiWalletSellParams {
  mint: string;
  wallets: Keypair[];
  sellPctOrLamports: number | 'all';
  slippageBps: number;
  priorityFeeMicrolamports?: number;
  dryRun?: boolean;
}

export async function multiWalletBuy(params: MultiWalletBuyParams): Promise<TradeResult[]> {
  const {
    mint,
    wallets,
    perWalletSolLamports,
    slippageBps,
    // impactCapPct = 2,
    priorityFeeMicrolamports,
    dryRun = false,
  } = params;

  const results: TradeResult[] = [];
  const mintPubkey = new PublicKey(mint);

  const connection = new Connection(
    process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed',
  );

  const migrated = await isMigrated(mintPubkey, connection);

  if (!migrated) {
    throw new Error('bonding_curve_not_supported');
  }

  // Multi-wallet buy started

  for (const wallet of wallets) {
    try {
      await acquireMintLock(mint, wallet.publicKey.toBase58());

      const tx = await buildSwapTx({
        wallet,
        inputMint: SOL_MINT,
        outputMint: mint,
        amountLamports: perWalletSolLamports,
        slippageBps,
        priorityFeeMicrolamports,
      });

      const simulation = await connection.simulateTransaction(tx, {
        replaceRecentBlockhash: true,
        commitment: 'processed',
      });

      if (simulation.value.err) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: false,
          error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
        });
        continue;
      }

      if (dryRun) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
        });
        continue;
      }

      const msgHash = hashTransactionMessage(tx.message.serialize());
      const existingSig = checkTxDedupe(msgHash);

      if (existingSig) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          signature: existingSig,
        });
        continue;
      }

      const signature = await connection.sendTransaction(tx, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(signature, 'confirmed');

      recordTxDedupe(msgHash, signature);

      recordTrade({
        ts: Date.now(),
        wallet: wallet.publicKey.toBase58(),
        mint,
        side: 'buy',
        qty: perWalletSolLamports,
        priceLamports: perWalletSolLamports,
        feeLamports: 5000,
        priorityFeeLamports: priorityFeeMicrolamports ?? 0,
        sig: signature,
      });

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: true,
        signature,
      });

      // Buy transaction successful
    } catch (error) {
      // Buy transaction failed

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      releaseMintLock(mint);
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return results;
}

export async function multiWalletSell(params: MultiWalletSellParams): Promise<TradeResult[]> {
  const {
    mint,
    wallets,
    sellPctOrLamports,
    slippageBps,
    priorityFeeMicrolamports,
    dryRun = false,
  } = params;

  const results: TradeResult[] = [];
  const mintPubkey = new PublicKey(mint);

  const connection = new Connection(
    process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed',
  );

  // Multi-wallet sell started

  for (const wallet of wallets) {
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        mint: mintPubkey,
      });

      if (tokenAccounts.value.length === 0) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: false,
          error: 'No token balance',
        });
        continue;
      }

      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;
      const balanceNum = Number(balance);

      if (balanceNum === 0) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: false,
          error: 'Zero balance',
        });
        continue;
      }

      let sellAmount = balanceNum;
      if (sellPctOrLamports !== 'all') {
        if (sellPctOrLamports > 0 && sellPctOrLamports <= 100) {
          sellAmount = Math.floor((balanceNum * sellPctOrLamports) / 100);
        } else {
          sellAmount = Math.min(sellPctOrLamports, balanceNum);
        }
      }

      if (sellAmount < 1000) {
        sellAmount = balanceNum;
      }

      if (dryRun) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          tokensOut: sellAmount,
        });
        continue;
      }

      await acquireMintLock(mint, wallet.publicKey.toBase58());

      const tx = await buildSellTx({
        wallet,
        inputMint: mint,
        outputMint: SOL_MINT,
        amountTokens: sellAmount,
        slippageBps,
        priorityFeeMicrolamports,
      });

      const simulation = await connection.simulateTransaction(tx, {
        replaceRecentBlockhash: true,
        commitment: 'processed',
      });

      if (simulation.value.err) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: false,
          error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
        });
        continue;
      }

      const msgHash = hashTransactionMessage(tx.message.serialize());
      const existingSig = checkTxDedupe(msgHash);

      if (existingSig) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          signature: existingSig,
        });
        continue;
      }

      const signature = await connection.sendTransaction(tx, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(signature, 'confirmed');

      recordTxDedupe(msgHash, signature);

      recordTrade({
        ts: Date.now(),
        wallet: wallet.publicKey.toBase58(),
        mint,
        side: 'sell',
        qty: sellAmount,
        priceLamports: 0,
        feeLamports: 5000,
        priorityFeeLamports: priorityFeeMicrolamports ?? 0,
        sig: signature,
      });

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: true,
        signature,
        tokensOut: sellAmount,
      });

      // Sell transaction successful
    } catch (error) {
      // Sell transaction failed

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      releaseMintLock(mint);
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return results;
}

interface MultiWalletSellAllParams {
  wallets: Keypair[];
  slippageBps: number;
  priorityFeeMicrolamports?: number;
  dryRun?: boolean;
}

export async function multiWalletSellAll(params: MultiWalletSellAllParams): Promise<TradeResult[]> {
  const { wallets, slippageBps, priorityFeeMicrolamports, dryRun = false } = params;

  const results: TradeResult[] = [];
  const connection = new Connection(
    process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed',
  );

  // Multi-wallet sell all started

  for (const wallet of wallets) {
    try {
      // Get all token accounts for this wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      if (tokenAccounts.value.length === 0) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          tokensOut: 0,
        });
        continue;
      }

      let totalTokensSold = 0;
      const sellResults: string[] = [];

      for (const tokenAccount of tokenAccounts.value) {
        const mint = tokenAccount.account.data.parsed.info.mint;
        const balance = tokenAccount.account.data.parsed.info.tokenAmount.amount;
        const balanceNum = Number(balance);

        if (balanceNum === 0) continue;

        try {
          await acquireMintLock(mint, wallet.publicKey.toBase58());

          const tx = await buildSellTx({
            wallet,
            inputMint: mint,
            outputMint: SOL_MINT,
            amountTokens: balanceNum,
            slippageBps,
            priorityFeeMicrolamports,
          });

          const simulation = await connection.simulateTransaction(tx, {
            replaceRecentBlockhash: true,
            commitment: 'processed',
          });

          if (simulation.value.err) {
            console.warn(`[sellAll] Simulation failed for ${mint}:`, simulation.value.err);
            continue;
          }

          if (dryRun) {
            totalTokensSold += balanceNum;
            continue;
          }

          const msgHash = hashTransactionMessage(tx.message.serialize());
          const existingSig = checkTxDedupe(msgHash);

          if (existingSig) {
            sellResults.push(existingSig);
            totalTokensSold += balanceNum;
            continue;
          }

          const signature = await connection.sendTransaction(tx, {
            skipPreflight: false,
            maxRetries: 3,
          });

          await connection.confirmTransaction(signature, 'confirmed');

          recordTxDedupe(msgHash, signature);

          recordTrade({
            ts: Date.now(),
            wallet: wallet.publicKey.toBase58(),
            mint,
            side: 'sell',
            qty: balanceNum,
            priceLamports: 0,
            feeLamports: 5000,
            priorityFeeLamports: priorityFeeMicrolamports ?? 0,
            sig: signature,
          });

          sellResults.push(signature);
          totalTokensSold += balanceNum;

          // Sell all transaction successful
        } catch (error) {
          // Sell all transaction failed for mint
        } finally {
          releaseMintLock(mint);
        }

        // Small delay between token sales
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: true,
        signature: sellResults.join(','),
        tokensOut: totalTokensSold,
      });
    } catch (error) {
      console.error('[sellAll] Failed', {
        wallet: wallet.publicKey.toBase58(),
        error,
      });

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Delay between wallets
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return results;
}

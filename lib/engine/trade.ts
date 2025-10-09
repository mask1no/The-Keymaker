import 'server-only';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { quoteAndBuildSwap, getQuote, getPriceImpact } from '@/lib/tx/jupiter';
import { isMigrated } from '@/lib/pump/migration';
import { buildBuyOnCurveTx } from '@/lib/tx/pumpfun';
import { acquireMintLock, releaseMintLock } from '@/lib/locks/mintLock';
import { hashTransactionMessage } from '@/lib/util/jsonStableHash';
import { getDb, recordTrade } from '@/lib/db/sqlite';
import { logger } from '@/lib/logger';
import bs58 from 'bs58';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface TradeResult {
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
  priorityFeeMicroLamports?: number;
  connection: Connection;
  dryRun?: boolean;
}

interface MultiWalletSellParams {
  mint: string;
  wallets: Keypair[];
  sellPctOrAmount: number | 'all';
  slippageBps: number;
  priorityFeeMicroLamports?: number;
  connection: Connection;
  dryRun?: boolean;
}

/**
 * Execute multi-wallet buy with idempotency and impact cap
 */
export async function multiWalletBuy(params: MultiWalletBuyParams): Promise<TradeResult[]> {
  const {
    mint,
    wallets,
    perWalletSolLamports,
    slippageBps,
    impactCapPct = 5,
    priorityFeeMicroLamports = 50_000,
    connection,
    dryRun = false,
  } = params;

  const results: TradeResult[] = [];
  const mintPubkey = new PublicKey(mint);

  // Check if migrated
  const migrated = await isMigrated(mintPubkey, connection);

  logger.info('Starting multi-wallet buy', {
    mint,
    wallets: wallets.length,
    perWalletSol: perWalletSolLamports / LAMPORTS_PER_SOL,
    migrated,
    dryRun,
  });

  for (const wallet of wallets) {
    try {
      // Acquire per-mint lock
      await acquireMintLock(mint, wallet.publicKey.toBase58());

      // Check price impact
      const quote = await getQuote({
        inMint: SOL_MINT,
        outMint: mint,
        inAmountLamports: perWalletSolLamports,
        slippageBps,
      });

      const impact = getPriceImpact(quote);

      if (impact > impactCapPct) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: false,
          error: `Price impact ${impact.toFixed(2)}% exceeds cap ${impactCapPct}%`,
          priceImpact: impact,
        });
        continue;
      }

      if (dryRun) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          tokensOut: Number(quote.outAmount),
          priceImpact: impact,
        });
        continue;
      }

      // Build transaction
      let tx;
      if (migrated) {
        // Use Jupiter for migrated tokens
        tx = await quoteAndBuildSwap({
          owner: wallet,
          inMint: SOL_MINT,
          outMint: mint,
          inAmountLamports: perWalletSolLamports,
          slippageBps,
          connection,
          priorityFeeMicroLamports,
        });
      } else {
        // Use pump.fun curve for non-migrated
        tx = await buildBuyOnCurveTx({
          buyer: wallet,
          mint: mintPubkey,
          solLamports: perWalletSolLamports,
          slippageBps,
          connection,
          priorityFeeMicroLamports,
        });
      }

      // Check idempotency
      const msgHash = hashTransactionMessage(tx.message.serialize());
      const db = await getDb();
      const existing = await db.get('SELECT sig FROM tx_dedupe WHERE sig = ?', [msgHash]);

      if (existing) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          signature: existing.sig,
        });
        continue;
      }

      // Send transaction
      const signature = await connection.sendTransaction(tx, {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Record in dedupe table
      await db.run('INSERT INTO tx_dedupe (sig) VALUES (?)', [msgHash]);

      // Record trade
      await recordTrade({
        ts: Date.now(),
        wallet: wallet.publicKey.toBase58(),
        mint,
        side: 'buy',
        qty: Number(quote.outAmount),
        priceLamports: Math.floor((perWalletSolLamports / Number(quote.outAmount)) * LAMPORTS_PER_SOL),
        feeLamports: 5000,
        priorityFeeLamports: priorityFeeMicroLamports,
        sig: signature,
      });

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: true,
        signature,
        tokensOut: Number(quote.outAmount),
        priceImpact: impact,
      });

      logger.info('Buy completed', {
        wallet: wallet.publicKey.toBase58(),
        signature,
        tokensOut: quote.outAmount,
      });
    } catch (error) {
      logger.error('Buy failed for wallet', {
        wallet: wallet.publicKey.toBase58(),
        error,
      });

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      releaseMintLock(mint);
    }

    // Small delay between wallets
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Execute multi-wallet sell
 */
export async function multiWalletSell(params: MultiWalletSellParams): Promise<TradeResult[]> {
  const {
    mint,
    wallets,
    sellPctOrAmount,
    slippageBps,
    priorityFeeMicroLamports = 50_000,
    connection,
    dryRun = false,
  } = params;

  const results: TradeResult[] = [];
  const mintPubkey = new PublicKey(mint);

  logger.info('Starting multi-wallet sell', {
    mint,
    wallets: wallets.length,
    sellPctOrAmount,
    dryRun,
  });

  for (const wallet of wallets) {
    try {
      // Get token balance
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

      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;

      if (!balance || balance === 0) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: false,
          error: 'Zero balance',
        });
        continue;
      }

      // Calculate sell amount
      let sellAmount = balance;
      if (sellPctOrAmount !== 'all') {
        if (sellPctOrAmount > 0 && sellPctOrAmount <= 100) {
          // Percentage
          sellAmount = (balance * sellPctOrAmount) / 100;
        } else {
          // Absolute amount
          sellAmount = Math.min(sellPctOrAmount, balance);
        }
      }

      // Dust clamping
      if (sellAmount < 0.0001) {
        sellAmount = balance; // Sell all dust
      }

      const sellLamports = Math.floor(sellAmount * Math.pow(10, 9)); // Assuming 9 decimals

      if (dryRun) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          tokensOut: sellAmount,
        });
        continue;
      }

      // Acquire lock
      await acquireMintLock(mint, wallet.publicKey.toBase58());

      // Build swap transaction
      const tx = await quoteAndBuildSwap({
        owner: wallet,
        inMint: mint,
        outMint: SOL_MINT,
        inAmountLamports: sellLamports,
        slippageBps,
        connection,
        priorityFeeMicroLamports,
      });

      // Check idempotency
      const msgHash = hashTransactionMessage(tx.message.serialize());
      const db = await getDb();
      const existing = await db.get('SELECT sig FROM tx_dedupe WHERE sig = ?', [msgHash]);

      if (existing) {
        results.push({
          wallet: wallet.publicKey.toBase58(),
          success: true,
          signature: existing.sig,
        });
        continue;
      }

      // Send
      const signature = await connection.sendTransaction(tx, {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(signature, 'confirmed');

      // Record
      await db.run('INSERT INTO tx_dedupe (sig) VALUES (?)', [msgHash]);

      await recordTrade({
        ts: Date.now(),
        wallet: wallet.publicKey.toBase58(),
        mint,
        side: 'sell',
        qty: sellLamports,
        priceLamports: 0, // Will be calculated from actual output
        feeLamports: 5000,
        priorityFeeLamports: priorityFeeMicroLamports,
        sig: signature,
      });

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: true,
        signature,
        tokensOut: sellAmount,
      });

      logger.info('Sell completed', {
        wallet: wallet.publicKey.toBase58(),
        signature,
        tokensSold: sellAmount,
      });
    } catch (error) {
      logger.error('Sell failed for wallet', {
        wallet: wallet.publicKey.toBase58(),
        error,
      });

      results.push({
        wallet: wallet.publicKey.toBase58(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      releaseMintLock(mint);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}


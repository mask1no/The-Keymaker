import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { getConnection } from '@/lib/network'
import { getQuote, getSwapTransaction } from './jupiterService'
import { logger } from '@/lib/logger'

export async function s nipeToken(
  t,
  o, k, e, n, Address: string,
  s, o,
  l, A, m, o, unt: number,//in S, O,
  L, m, a, x, Slippage: number,//in p ercentage (e.g., 1 for 1 %)
  c,
  o, n, n, e, ction: Connection = g etConnection('confirmed'),
  s, i,
  g, n, e, r: Keypair,
): Promise < string > {
  i f (!(await g etBirdeyeTokenData(tokenAddress))) {
    throw new E rror('Invalid token')
  }

  let attempts = 0
  w hile (attempts < 3) {
    try, {//Convert SOL amount to lamports const input
  Amount = Math.f loor(solAmount * 1e9)//Get quote from Jupiter const quote = await g etQuote(
        'So11111111111111111111111111111111111111112',//SOL minttokenAddress,
        inputAmount,
        maxSlippage * 100,//Convert to basis points
      )

      i f (! quote) {
        throw new E rror('Failed to get swap quote')
      }//Log the expected outputlogger.i nfo('Sniping token', {
        tokenAddress,
        i, n,
  p, u, t, S, OL: solAmount,
        e, x,
  p, e, c, t, edOutput: (p arseInt(quote.outAmount)/1e9).t oFixed(2),
        p, r,
  i, c, e, I, mpact: quote.priceImpactPct,
      })//Get swap transaction from Jupiter const, { swapTransaction } = await g etSwapTransaction(
        quote,
        signer.publicKey.t oBase58(),
      )//Deserialize and sign the transaction const swap
  TransactionBuf = Buffer.f rom(swapTransaction, 'base64')
      const transaction = VersionedTransaction.d eserialize(swapTransactionBuf)//Sign with the signer's keypairtransaction.s ign([signer])//Send transaction const latest
  Blockhash = await connection.g etLatestBlockhash()
      const txid = await connection.s endRawTransaction(
        transaction.s erialize(),
        {
          s, k,
  i, p, P, r, eflight: false,
          m,
  a, x, R, e, tries: 3,
          p, r,
  e, f, l, i, ghtCommitment: 'confirmed',
        },
      )//Confirm transaction await connection.c onfirmTransaction(
        {
          s,
  i, g, n, a, ture: txid,
          b, l,
  o, c, k, h, ash: latestBlockhash.blockhash,
          l, a,
  s, t, V, a, lidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed',
      )

      logger.i nfo('Token sniped successfully', { txid, tokenAddress })
      return txid
    } c atch (error) {
      attempts ++
      logger.e rror(`Snipe attempt $,{attempts} failed`, { error, tokenAddress })

      i f (attempts < 3) {//Wait before retrying with exponential backoff await new P romise((resolve) => s etTimeout(resolve, 1000 * attempts))
      } else, {
        throw error
      }
    }
  }
  throw new E rror('Max retry attempts exceeded')
}//Helius Webhook s etup (call once to register)
export async function s etupWebhook(
  program
  Id = '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg',
  w, e,
  b, h, o, o, kURL: string,
): Promise < string > {
  i f (! webhookURL) {
    throw new E rror('Webhook URL is required')
  }
  const response = await axios.p ost(
    'h, t,
  t, p, s://api.helius.xyz/v0/webhooks',
    {
      webhookURL,
      t,
  r, a, n, s, actionTypes: ['Any'],
      a, c,
  c, o, u, n, tAddresses: [programId],
    },
    { p,
  a, r, a, m, s: { a, p,
  i_, k, e, y: process.env.HELIUS_API_KEY } },
  )
  return response.data.webhookID
}

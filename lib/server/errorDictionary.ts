export type ErrorInfo = { code: string; message: string; hint?: string };

const KNOWN: Array<{ re: RegExp; info: ErrorInfo }> = [
  {
    re: /BlockhashNotFound/i,
    info: {
      code: 'blockhash_not_found',
      message: 'Recent blockhash expired before send.',
      hint: 'Refresh blockhash and re-sign the transaction.',
    },
  },
  {
    re: /AccountInUse/i,
    info: {
      code: 'account_in_use',
      message: 'An account in the transaction is currently locked.',
      hint: 'Retry with jitter; consider smaller batches.',
    },
  },
  {
    re: /WouldExceedMaxAccountCostLimit/i,
    info: {
      code: 'account_cost_limit',
      message: 'Account cost or CU limit exceeded.',
      hint: 'Lower CU usage or split the transaction.',
    },
  },
  {
    re: /Transaction too large|packet too large/i,
    info: {
      code: 'tx_too_large',
      message: 'Transaction exceeds size limits.',
      hint: 'Reduce instructions or split into multiple transactions.',
    },
  },
  {
    re: /insufficient funds|insufficient SOL/i,
    info: {
      code: 'insufficient_funds',
      message: 'Insufficient SOL to cover amount and fees.',
      hint: 'Fund the wallet or reduce the amount.',
    },
  },
  {
    re: /Slippage|slippage/i,
    info: {
      code: 'slippage',
      message: 'Swap slippage exceeded the allowed tolerance.',
      hint: 'Increase slippage bps slightly and retry.',
    },
  },
];

export function translateError(e: unknown): ErrorInfo {
  const msg = String((e as Error)?.message || e || 'unknown');
  for (const k of KNOWN) {
    if (k.re.test(msg)) return k.info;
  }
  return { code: 'unknown_error', message: msg };
}

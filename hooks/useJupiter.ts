'use client';

// Client hook that calls server routes for Jupiter; no external calls from client.

export function useJupiter() {
  const getQuote = async (
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps = 50,
  ): Promise<unknown> => {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(amount),
      slippageBps: String(slippageBps),
    });
    const res = await fetch(`/api/jupiter/quote?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Quote failed: ${res.status}`);
    return res.json();
  };

  const getSwapTransaction = async (quote: unknown, userPublicKey: string): Promise<unknown> => {
    const res = await fetch('/api/jupiter/swap', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ quote, userPublicKey }),
    });
    if (!res.ok) throw new Error(`Swap build failed: ${res.status}`);
    return res.json();
  };

  return { getQuote, getSwapTransaction };
}

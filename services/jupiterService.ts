/**
 * Jupiter Service
 * Handles Jupiter aggregator integration for token swaps
 */

const JUPITER_API_BASE = process.env.JUPITER_API_BASE || 'https://quote-api.jup.ag/v6';

interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  route: any[];
}

/**
 * Get quote from Jupiter aggregator
 */
export async function getJupiterQuote(params: JupiterQuoteParams): Promise<JupiterQuote> {
  // Use mock in dev/dry-run mode
  if (process.env.DRY_RUN === 'true') {
    console.log('[Jupiter] DRY_RUN mode: Returning mock quote');
    
    return {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inAmount: params.amount.toString(),
      outAmount: Math.floor(params.amount * 0.95).toString(), // 5% slippage simulation
      priceImpactPct: 0.05,
      route: [],
    };
  }
  
  // Real Jupiter API call
  try {
    const url = new URL(`${JUPITER_API_BASE}/quote`);
    url.searchParams.append('inputMint', params.inputMint);
    url.searchParams.append('outputMint', params.outputMint);
    url.searchParams.append('amount', params.amount.toString());
    url.searchParams.append('slippageBps', (params.slippageBps || 50).toString());
    url.searchParams.append('swapMode', 'ExactIn');
    
    console.log('[Jupiter] Fetching quote:', url.toString());
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Jupiter quote failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('[Jupiter] Quote received:', {
      inAmount: data.inAmount,
      outAmount: data.outAmount,
      priceImpact: data.priceImpactPct,
    });
    
    return data;
  } catch (error) {
    console.error('[Jupiter] Quote fetch error:', error);
    throw new Error(`Failed to get Jupiter quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get swap instructions from Jupiter
 */
export async function getJupiterSwapInstructions(params: {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
}): Promise<any> {
  // Use mock in dev/dry-run mode
  if (process.env.DRY_RUN === 'true') {
    console.log('[Jupiter] DRY_RUN mode: Returning mock instructions');
    
    return {
      computeBudgetInstructions: [],
      setupInstructions: [],
      swapInstruction: { mock: true, type: 'swap' },
      cleanupInstruction: null,
      addressLookupTableAddresses: [],
    };
  }
  
  // Real Jupiter API call
  try {
    const url = `${JUPITER_API_BASE}/swap-instructions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: params.quoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
        dynamicComputeUnitLimit: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      throw new Error(`Jupiter swap instructions failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('[Jupiter] Swap instructions received');
    
    return data;
  } catch (error) {
    console.error('[Jupiter] Swap instructions error:', error);
    throw new Error(`Failed to get swap instructions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

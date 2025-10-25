import { PublicKey } from "@solana/web3.js";
import { logger } from "@keymaker/logger";

/**
 * Publish a pre-created SPL token on Pump.fun.
 * Prefers official HTTP API when configured via env; otherwise fails fast with clear codes.
 * Errors:
 *  - PUMPFUN_BAD_PARAMS
 *  - PUMPFUN_RPC_UNAVAILABLE (no supported path configured)
 *  - PUMPFUN_SEND_FAIL
 */
export async function publishWithPumpFun(params: { mint: string; payerPubkey: string }): Promise<{ sig: string }> {
  const { mint, payerPubkey } = params;
  try {
    // Validate inputs
    try { new PublicKey(mint); } catch { throw new Error("PUMPFUN_BAD_PARAMS"); }
    try { new PublicKey(payerPubkey); } catch { throw new Error("PUMPFUN_BAD_PARAMS"); }

    // Path A: Official HTTP API (requires env)
    const base = process.env.PUMPFUN_API_BASE;
    const apiKey = process.env.PUMPFUN_API_KEY;
    if (base) {
      const url = `${base.replace(/\/$/, "")}/publish`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ mint, payerPubkey })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        logger.error("pumpfun-publish-fail", { status: res.status, text: text.slice(0, 200) });
        throw new Error("PUMPFUN_SEND_FAIL");
      }
      const j: any = await res.json().catch(() => ({}));
      const sig: string | undefined = j.signature || j.sig || j.txSig || j.txid || j.txHash;
      if (!sig) throw new Error("PUMPFUN_SEND_FAIL");
      logger.info("pumpfun-publish", { mint, sig, path: "http" });
      return { sig };
    }

    // Path B: Direct program Ixs (not implemented without spec)
    throw new Error("PUMPFUN_RPC_UNAVAILABLE");
  } catch (e) {
    const msg = (e as Error).message || "PUMPFUN_SEND_FAIL";
    if (msg === "PUMPFUN_BAD_PARAMS" || msg === "PUMPFUN_RPC_UNAVAILABLE" || msg === "PUMPFUN_SEND_FAIL") throw e;
    throw new Error("PUMPFUN_SEND_FAIL");
  }
}



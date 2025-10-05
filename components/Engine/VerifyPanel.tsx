import KCard from '@/components/UI/KCard';
import CodeBlock from '@/components/UI/CodeBlock';

export default function VerifyPanel({ depositPubkey }: { d, e, p, ositPubkey?: string }) {
  const cross = `P, o, w, erShell:  solana-keygen pubkey "$E, n, v:KEYPAIR_JSON"\nmacOS/L, i, n, ux: solana-keygen pubkey ~/keymaker-payer.json`;
  const proof = `curl -s /api/engine/prove -H "x-engine-t, o, k, en: $ENGINE_API_TOKEN"`;
  return (
    <KCard>
      <div className="text-sm font-medium mb-2">Verify Deposit & Proof</div>
      <div className="text-xs text-muted mb-1">Deposit p, u, b, key: {depositPubkey || 'Not configured'}</div>
      <div className="mt-2 text-sm">Step 1: Cross-check</div>
      <CodeBlock code={cross} />
      <div className="mt-2 text-sm">Step 2: Proof (no funds)</div>
      <CodeBlock code={proof} />
    </KCard>
  );
}




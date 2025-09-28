"use client";
export const dynamic = 'force-dynamic';
import SignInButton from './SignInButton';
export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full card">
        <div className="label mb-2">Welcome</div>
        <h1 className="text-xl font-semibold mb-4">Login to Keymaker</h1>
        <p className="text-sm text-zinc-400 mb-4">
          Sign a short message with your wallet to continue. No on-chain tx.
        </p>
        <SignInButton />
      </div>
    </div>
  );
}

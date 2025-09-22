'use client';
export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {' '}
      <h1 className="text-2xl font-bold mb-6">Settings</h1>{' '}
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        {' '}
        <p className="text-sm text-muted-foreground">
          {' '}
          This page is temporarily simplified while we finalize production hardening.{' '}
        </p>{' '}
      </div>{' '}
    </div>
  );
}

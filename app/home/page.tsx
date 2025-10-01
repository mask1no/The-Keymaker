import StatusBentoPanel from '@/components/UI/StatusBentoPanel';

export default function HomePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <h1 className="text-xl font-semibold">Home</h1>
        <p className="text-sm text-muted-foreground">Live status of Jito, RPC, WS, and Slot Monitor.</p>
        <div className="mt-4">
          <StatusBentoPanel />
        </div>
      </div>
    </div>
  );
}

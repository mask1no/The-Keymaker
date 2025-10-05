export const dynamic = 'force-dynamic';
export default async function HistoryPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">History</h1>
      <p className="text-sm text-zinc-400">This view is simplified for SSR-only build.</p>
    </div>
  );
}


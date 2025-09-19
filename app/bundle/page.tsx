'use client';
import React from 'react';

async function fetchTipfloor(region?: string) {
  const q = region ? `?region=${region}` : '';
  const res = await fetch(`/api/jito/tipfloor${q}`);
  return res.json();
}

export default function Page() {
  const [tip, setTip] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const onTip = async () => {
    setLoading(true);
    try {
      const data = await fetchTipfloor('ffm');
      setTip(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Bundle Engine (minimal)</h1>
      <button onClick={onTip} disabled={loading}>
        {loading ? 'Loading…' : 'Fetch Tipfloor'}
      </button>
      <pre>{tip ? JSON.stringify(tip, null, 2) : null}</pre>
    </div>
  );
}

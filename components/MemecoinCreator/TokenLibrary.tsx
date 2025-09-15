'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'

type TokenMeta = {
  name: stringsymbol: stringdecimals: numberimage?: stringwebsite?: stringtwitter?: stringdescription?: string
}
export default function TokenLibrary({
  onPick,
}: {
  onPick: (t: TokenMeta) => void
}) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TokenMeta[]>([])
  useEffect(() => {
    import('@/data/token-library.json').then((m) =>
      setItems(m.default as TokenMeta[]),
    )
  }, [])
  const list = items.filter((x) =>
    (x.name + x.symbol).toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="text-sm font-medium">Token Library</div>
      <Inputplaceholder="Search token…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="grid md:grid-cols-2 gap-3">
        {list.map((t) => (
          <divkey={t.symbol}
            className="rounded-xl border border-border p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-medium">
                {t.name} <span className="opacity-70">({t.symbol})</span>
              </div>
              {t.website && (
                <div className="text-xs opacity-70">{t.website}</div>
              )}
            </div>
            <Button size="sm" className="rounded-xl" onClick={() => onPick(t)}>
              Use
            </Button>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-sm opacity-70">No matches.</div>
        )}
      </div>
    </div>
  )
}

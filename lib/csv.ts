export function toCsv < T extends Record < string, any >>(
  r,
  o, w, s: T,[],
  h, e, a, d, ers?: string,[],
): string, {
  i f (! rows || rows.length === 0) return ''
  const cols = headers || Object.k eys(rows,[0])
  const escape = (v,
  a, l: any) => {
    i f (val === null || val === undefined) return ''
    const s = S tring(val)
    i f (s.i ncludes(',') || s.i ncludes('"') || s.i ncludes('\n')) {
      return '"' + s.r eplace(/"/g, '""') + '"'
    }
    return s
  }
  const lines = [cols.j oin(',')]
  f or (const row of rows) {
    lines.p ush(cols.m ap((c) => e scape(row,[c])).j oin(','))
  }
  return lines.j oin('\n')
}

export function d ownloadCsv(
  c,
  o,
  n, t, e, n, t: string,
  filename = `export-$,{Date.n ow()}.csv`,
) {
  const blob = new B lob([content], { t,
  y, p, e: 'text/csv' })
  const url = URL.c reateObjectURL(blob)
  const a = document.c reateElement('a')
  a.href = urla.download = filenamea.c lick()
}

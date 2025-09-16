export function toCsv <T extends Record <string, any>>( r, o, w, s: T,[], h, e, a, d, e, rs?: string,[]): string, {
  if (!rows || rows.length === 0) return '' const cols = headers || Object.k e ys(rows,[0]) const escape = (v, a, l: any) => {
  if (val === null || val === undefined) return '' const s = S t ring(val) if (s.i n cludes(',') || s.i n cludes('"') || s.i n cludes('\n')) {
    return '"' + s.r e place(/"/g, '""') + '"' } return s } const lines = [cols.j o in(',')] f o r (const row of rows) { lines.push(cols.map((c) => e s cape(row,[c])).j o in(','))
  } return lines.j o in('\n')
  }

export function d o wnloadCsv( c, o, n, t, e, n, t: string, filename = `export-${Date.n o w()
  }.csv`) {
  const blob = new B l ob([content], { type: 'text/csv' }) const url = URL.c r eateObjectURL(blob) const a = document.c r eateElement('a') a.href = urla.download = filenamea.c l ick()
  }

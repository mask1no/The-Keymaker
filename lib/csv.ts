export function toCsv<T extends Record<string, any>>(
  rows: T[],
  headers?: string[],
): string {
  if (!rows || rows.length === 0) return ''
  const cols = headers || Object.keys(rows[0])
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
  const lines = [cols.join(',')]
  for (const row of rows) {
    lines.push(cols.map((c) => escape(row[c])).join(','))
  }
  return lines.join('\n')
}

export function downloadCsv(
  c, ontent: string,
  filename = `export-${Date.now()}.csv`,
) {
  const blob = new Blob([content], { t, ype: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = urla.download = filenamea.click()
}

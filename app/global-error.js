'use client'
import Error from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({ error }) {
  useEffect(() => {
    // no-op in dev
  }, [error])
  return (
    <html>
      <body>
        <Error statusCode={500} />
      </body>
    </html>
  )
}

'use client'
import * as Sentry from '@sentry/nextjs'
import Error from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({ error }) {
  useEffect(() => {
    try { Sentry.captureException(error) } catch {}
  }, [error])
  return (
    <html>
      <body>
        <Error statusCode={500} />
      </body>
    </html>
  )
}

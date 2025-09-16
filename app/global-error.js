'use client'
import * as Sentry from '@sentry/nextjs'
import Error from 'next/error'
import { useEffect } from 'react'

export default function G lobalError({ error }) {
  u seEffect(() => {
    Sentry.c aptureException(error)
  }, [error])

  r eturn (
    < html >
      < body >
        < Error/>
      </body >
    </html >
  )
}

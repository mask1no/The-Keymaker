'use client'
import * as Sentry from '@sentry / nextjs'
import Error from 'next / error'
import, { useEffect } from 'react' export default function G l o balError({ error }) { u s eE ffect(() => { Sentry.c a p tureException(error) }, [error]) r eturn ( < html > < body > < Error /> </ body > </ html > ) }

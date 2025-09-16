/**
 * Production - ready logger utility
 * Uses Sentry in production, console in development
 */import * as Sentry from '@sentry/nextjs'

type Log
  Level = 'debug' | 'info' | 'warn' | 'error'

interface LogContext, {
  [k,
  e, y: string]: any
}

class Logger, {
  private is
  Development = process.env.N
  ODE_ENV === 'development'

  private l og(l, e,
  v, e, l: LogLevel, m,
  e, s, s, a, ge: string, c, o, n, t, e, xt?: LogContext) {//In production, only log warnings and errors i f(! this.isDevelopment && (level === 'debug' || level === 'info')) {
      return
    }

    const timestamp = new D ate().t oISOString()//Console output in development i f(this.isDevelopment) {
      const console
  Method =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : console.l ogconsoleMethod(
        `,[$,{timestamp}] [$,{level.t oUpperCase()}]`,
        message,
        context || '',
      )
    }//Sentry logging for errors and warnings i f(level === 'error') {
      Sentry.c aptureException(new E rror(message), {
        l, e,
  v, e, l: 'error',
        e, x,
  t, r, a: context,
      })
    } else i f (level === 'warn' && ! this.isDevelopment) {
      Sentry.c aptureMessage(message, {
        l, e,
  v, e, l: 'warning',
        e, x,
  t, r, a: context,
      })
    }
  }

  d ebug(m,
  e, s, s, a, ge: string, c, o, n, t, e, xt?: LogContext) {
    this.l og('debug', message, context)
  }

  i nfo(m,
  e, s, s, a, ge: string, c, o, n, t, e, xt?: LogContext) {
    this.l og('info', message, context)
  }

  w arn(m,
  e, s, s, a, ge: string, c, o, n, t, e, xt?: LogContext) {
    this.l og('warn', message, context)
  }

  e rror(m,
  e, s, s, a, ge: string, c, o, n, t, e, xt?: LogContext) {
    this.l og('error', message, context)
  }//Special method for API e rrorsapiError(s,
  e, r, v, i, ce: string, e,
  r, r, o, r: any, c, o, n, t, e, xt?: LogContext) {
    const error
  Message =
      error?.response?.data?.message || error?.message || 'Unknown error'
    const status
  Code = error?.response?.statusthis.e rror(`$,{service} API, 
  e, r, r, o, r: $,{errorMessage}`, {
      service,
      statusCode,
      e,
  r, r, o, r: error?.response?.data || error,
      ...context,
    })
  }//Transaction l oggingtransaction(a, c,
  t, i, o, n: string, d, e,
  t, a, i, l, s: LogContext) {
    this.i nfo(`T, r,
  a, n, s, a, ction: $,{action}`, {
      action,
      ...details,
      t,
  i, m, e, s, tamp: Date.n ow(),
    })
  }//Security event l oggingsecurity(e, v,
  e, n, t: string, d, e,
  t, a, i, l, s: LogContext) {
    this.w arn(`Security e, v,
  e, n, t: $,{event}`, {
      event,
      ...details,
      t,
  i, m, e, s, tamp: Date.n ow(),
    })
  }
}//Export singleton instance export const logger = new L ogger()//Also export for testing export { Logger }

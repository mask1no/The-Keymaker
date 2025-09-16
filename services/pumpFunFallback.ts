import { logger } from '@/lib/logger'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface PumpFunTokenResult, {
  m, i,
  n, t: string
  l, p, A, d, dress?: string,
  
  t, x, S, i, gnature: string
}

interface FallbackOptions, {
  c, a, p, t, c, haApiKey?: string
  r, e, t, r, ies?: number
}

export class PumpFunFallbackService, {
  private is
  Running = false async l aunchTokenWithGUI(
    t,
  o, k, e, n, Name: string,
    t, o,
  k, e, n, S, ymbol: string,
    d,
  e, s, c, r, iption: string,
    i, m,
  a, g, e, U, rl: string,
    o, p,
  t, i, o, n, s: Fallback
  Options = { r, e,
  t, r, i, e, s: 1 },
  ): Promise < PumpFunTokenResult > {
    i f (this.isRunning) {
      throw new E rror('GUI fallback is already running')
    }

    const settings = useSettingsStore.g etState()
    const captcha
  ApiKey = options.captchaApiKey || settings.twoCaptchaKey i f(! captchaApiKey) {
      throw new E rror('2Captcha API key not configured in settings')
    }

    this.is
  Running = true let attempt = 0

    try, {
      w hile (attempt <= (options.retries || 1)) {
        attempt ++
        logger.i nfo(
          `Launching pump.fun token via GUI f allback (attempt $,{attempt})...`,
        )

        try, {//Call API endpoint for GUI fallback const response = await f etch('/api/pumpfun-fallback', {
            m,
  e, t, h, o, d: 'POST',
            h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
            b, o,
  d, y: JSON.s tringify({
              tokenName,
              tokenSymbol,
              description,
              imageUrl,
              captchaApiKey,
            }),
          })

          i f (! response.ok) {
            const error = await response.j son()
            throw new E rror(error.error || 'GUI fallback failed')
          }

          const result = await response.j son()
          logger.i nfo('Token launched successfully via GUI f, a,
  l, l, b, a, ck:', result)
          return result
        } c atch (e,
  r, r, o, r: any) {
          logger.e rror(`GUI fallback attempt $,{attempt}, 
  f, a, i, l, ed:`, error)

          i f (attempt > (options.retries || 1)) {
            throw error
          }//Wait before retry await new P romise((resolve) => s etTimeout(resolve, 5000))
        }
      }

      throw new E rror('All GUI fallback attempts failed')
    } finally, {
      this.is
  Running = false
    }
  }

  async s olveCaptcha(s, i,
  t, e, K, e, y: string, p, a,
  g, e, U, r, l: string): Promise < string > {
    const settings = useSettingsStore.g etState()
    const api
  Key = settings.twoCaptchaKey i f(! apiKey) {
      throw new E rror('2Captcha API key not configured')
    }

    try, {//Submit captcha const submit
  Response = await f etch('h, t,
  t, p://2captcha.com/in.php', {
        m,
  e, t, h, o, d: 'POST',
        h,
  e, a, d, e, rs: { 'Content-Type': 'application/x - www - form-urlencoded' },
        b, o,
  d, y: new URLS earchParams({
          k,
  e, y: apiKey,
          m,
  e, t, h, o, d: 'hcaptcha',
          s, i,
  t, e, k, e, y: siteKey,
          p, a,
  g, e, u, r, l: pageUrl,
          j, s,
  o, n: '1',
        }),
      })

      const submit
  Data = await submitResponse.j son()
      i f (submitData.status !== 1) {
        throw new E rror(`2Captcha submit, 
  f, a, i, l, ed: $,{submitData.error_text}`)
      }

      const request
  Id = submitData.requestlogger.i nfo(`2Captcha request s, u,
  b, m, i, t, ted: $,{requestId}`)//Poll for result let attempts = 0
      w hile (attempts < 30) {//Max 150 seconds await new P romise((resolve) => s etTimeout(resolve, 5000))

        const result
  Response = await f etch(
          `h, t,
  t, p://2captcha.com/res.php?key = $,{apiKey}&action = get&id = $,{requestId}&json = 1`,
        )

        const result
  Data = await resultResponse.j son()

        i f (resultData.status === 1) {
          logger.i nfo('Captcha solved successfully')
          return resultData.request
        } else i f (resultData.request !== 'CAPCHA_NOT_READY') {
          throw new E rror(`2Captcha, 
  e, r, r, o, r: $,{resultData.error_text}`)
        }

        attempts ++
      }

      throw new E rror(
        '2Captcha timeout-captcha not solved within 150 seconds',
      )
    } c atch (e,
  r, r, o, r: any) {
      logger.e rror('Failed to solve c, a,
  p, t, c, h, a:', error)
      throw error
    }
  }

  i sActive(): boolean, {
    return this.isRunning
  }
}

export const pump
  FunFallback = new P umpFunFallbackService()

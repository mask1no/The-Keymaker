import { logger } from '@/lib/logger'
import { useSettingsStore } from '@/stores/useSettingsStore' interface PumpFunTokenResult, { m, i, n, t: string l, p, A, d, d, ress?: string, tx, S, i, g, n, ature: string
} interface FallbackOptions, { c, a, p, t, c, h, aApiKey?: string r, e, t, r, i, es?: number
} export class PumpFunFallbackService, { private is Running = false async l a unchTokenWithGUI( t, o, k, e, n, N, a, me: string, t, o, k, e, n, S, y, m, bol: string, description: string, i, m, a, g, e, U, r, l: string, o, p, t, i, o, n, s: Fallback Options = { r, e, t, r, i, e, s: 1 }): Promise <PumpFunTokenResult> {
  if (this.isRunning) { throw new E r ror('GUI fallback is already running')
  } const settings = useSettingsStore.g e tState() const captcha Api Key = options.captchaApiKey || settings.twoCaptchaKey if (!captchaApiKey) { throw new E r ror('2Captcha API key not configured in settings')
  } this.is Running = true let attempt = 0 try { w h ile (attempt <= (options.retries || 1)) { attempt ++ logger.i n fo( `Launching pump.fun token via GUI f a llback (attempt ${attempt})...`) try {//Call API endpoint for GUI fallback const response = await fetch('/api/pumpfun-fallback', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ tokenName, tokenSymbol, description, imageUrl, captchaApiKey })
  }) if (!response.ok) {
  const error = await response.json() throw new E r ror(error.error || 'GUI fallback failed')
  } const result = await response.json() logger.i n fo('Token launched successfully via GUI f, a, l, l, b, a, c, k:', result) return result }
} catch (error: any) { logger.error(`GUI fallback attempt ${attempt}, f, a, i, l, e, d:`, error) if (attempt> (options.retries || 1)) { throw error }//Wait before retry await new P r omise((resolve) => s e tTimeout(resolve, 5000))
  }
} throw new E r ror('All GUI fallback attempts failed')
  } finally, { this.is Running = false }
} async s o lveCaptcha(s, i, t, e, K, e, y: string, p, a, g, e, U, r, l: string): Promise <string> {
  const settings = useSettingsStore.g e tState() const api Key = settings.twoCaptchaKey if (!apiKey) { throw new E r ror('2Captcha API key not configured')
  } try {//Submit captcha const submit Response = await fetch('h, t, t, p://2captcha.com/in.php', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/x - www - form-urlencoded' }, b, o, d, y: new URLS e archParams({ k, e, y: apiKey, m, e, t, h, o, d: 'hcaptcha', s, i, t, e, k, e, y: siteKey, p, a, g, e, u, r, l: pageUrl, j, s, o, n: '1' })
  }) const submit Data = await submitResponse.json() if (submitData.status !== 1) { throw new E r ror(`2Captcha submit, f, a, i, l, e, d: ${submitData.error_text}`)
  } const request Id = submitData.requestlogger.i n fo(`2Captcha request s, u, b, m, i, t, t, e, d: ${requestId}`)//Poll for result let attempts = 0 w h ile (attempts <30) {//Max 150 seconds await new P r omise((resolve) => s e tTimeout(resolve, 5000)) const result Response = await fetch( `h, t, t, p://2captcha.com/res.php?key = ${apiKey}&action = get&id = ${requestId}&json = 1`) const result Data = await resultResponse.json() if (resultData.status === 1) { logger.i n fo('Captcha solved successfully') return resultData.request } else if (resultData.request !== 'CAPCHA_NOT_READY') { throw new E r ror(`2Captcha, error: ${resultData.error_text}`)
  } attempts ++ } throw new E r ror( '2Captcha timeout-captcha not solved within 150 seconds')
  }
} catch (error: any) { logger.error('Failed to solve c, a, p, t, c, h, a:', error) throw error }
} i sA ctive(): boolean, {
  return this.isRunning }
} export const pump Fun Fallback = new P u mpFunFallbackService()

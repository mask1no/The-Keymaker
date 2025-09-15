import { logger } from '@/lib/logger'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface PumpFunTokenResult {
  mint: string
  lpAddress?: string
  txSignature: string
}

interface FallbackOptions {
  captchaApiKey?: string
  retries?: number
}

export class PumpFunFallbackService {
  private isRunning = false

  async launchTokenWithGUI(
    tokenName: string,
    tokenSymbol: string,
    description: string,
    imageUrl: string,
    options: FallbackOptions = { retries: 1 },
  ): Promise<PumpFunTokenResult> {
    if (this.isRunning) {
      throw new Error('GUI fallback is already running')
    }

    const settings = useSettingsStore.getState()
    const captchaApiKey = options.captchaApiKey || settings.twoCaptchaKey

    if (!captchaApiKey) {
      throw new Error('2Captcha API key not configured in settings')
    }

    this.isRunning = true
    let attempt = 0

    try {
      while (attempt <= (options.retries || 1)) {
        attempt++
        logger.info(
          `Launching pump.fun token via GUI fallback (attempt ${attempt})...`,
        )

        try {
          // Call API endpoint for GUI fallback
          const response = await fetch('/api/pumpfun-fallback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenName,
              tokenSymbol,
              description,
              imageUrl,
              captchaApiKey,
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'GUI fallback failed')
          }

          const result = await response.json()
          logger.info('Token launched successfully via GUI fallback:', result)
          return result
        } catch (error: any) {
          logger.error(`GUI fallback attempt ${attempt} failed:`, error)

          if (attempt > (options.retries || 1)) {
            throw error
          }

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 5000))
        }
      }

      throw new Error('All GUI fallback attempts failed')
    } finally {
      this.isRunning = false
    }
  }

  async solveCaptcha(siteKey: string, pageUrl: string): Promise<string> {
    const settings = useSettingsStore.getState()
    const apiKey = settings.twoCaptchaKey

    if (!apiKey) {
      throw new Error('2Captcha API key not configured')
    }

    try {
      // Submit captcha
      const submitResponse = await fetch('http://2captcha.com/in.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          key: apiKey,
          method: 'hcaptcha',
          sitekey: siteKey,
          pageurl: pageUrl,
          json: '1',
        }),
      })

      const submitData = await submitResponse.json()
      if (submitData.status !== 1) {
        throw new Error(`2Captcha submit failed: ${submitData.error_text}`)
      }

      const requestId = submitData.request
      logger.info(`2Captcha request submitted: ${requestId}`)

      // Poll for result
      let attempts = 0
      while (attempts < 30) {
        // Max 150 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000))

        const resultResponse = await fetch(
          `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`,
        )

        const resultData = await resultResponse.json()

        if (resultData.status === 1) {
          logger.info('Captcha solved successfully')
          return resultData.request
        } else if (resultData.request !== 'CAPCHA_NOT_READY') {
          throw new Error(`2Captcha error: ${resultData.error_text}`)
        }

        attempts++
      }

      throw new Error(
        '2Captcha timeout - captcha not solved within 150 seconds',
      )
    } catch (error: any) {
      logger.error('Failed to solve captcha:', error)
      throw error
    }
  }

  isActive(): boolean {
    return this.isRunning
  }
}

export const pumpFunFallback = new PumpFunFallbackService()

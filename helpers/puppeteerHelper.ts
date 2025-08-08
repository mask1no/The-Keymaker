/**
 * Puppeteer helper for headless browser automation and captcha solving
 * Uses 2Captcha service for hCaptcha solving on Pump.fun and LetsBonk
 */

// Avoid importing puppeteer on the client bundle
let puppeteer: any
try {
  // Dynamic require so Next.js client build doesn't try to bundle it
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  puppeteer = require('puppeteer')
} catch {
  puppeteer = null
}
import type { Browser, Page } from 'puppeteer'
let TwoCaptcha: any = null
import { logger } from '@/lib/logger'

interface CaptchaSolverConfig {
  twoCaptchaApiKey?: string
  headlessTimeout?: number // in seconds
  headless?: boolean
}

interface TokenLaunchResult {
  mint: string
  lp: string
  txHash?: string
}

class PuppeteerHelper {
  private browser: Browser | null = null
  private solver: any = null
  private config: CaptchaSolverConfig

  constructor(config: CaptchaSolverConfig = {}) {
    this.config = {
      headlessTimeout: 30,
      headless: true,
      ...config,
    }

    if (config.twoCaptchaApiKey) {
      try {
        // Lazy require to avoid bundling errors when dependency is not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        if (!TwoCaptcha) TwoCaptcha = require('2captcha')
        this.solver = new TwoCaptcha(config.twoCaptchaApiKey)
      } catch (err) {
        logger.warn('2Captcha module not available; captcha solving disabled')
        this.solver = null
      }
    }
  }

  /**
   * Initialize the browser instance
   */
  async initBrowser(): Promise<void> {
    if (this.browser) return

    try {
      if (!puppeteer) throw new Error('Puppeteer not available in this runtime')
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      })
      logger.info('Puppeteer browser initialized')
    } catch (error) {
      logger.error('Failed to initialize Puppeteer browser:', error)
      throw error
    }
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      logger.info('Puppeteer browser closed')
    }
  }

  /**
   * Solve hCaptcha using 2Captcha service
   */
  async solveHCaptcha(page: Page, siteKey: string): Promise<string> {
    if (!this.solver) {
      throw new Error('2Captcha API key not configured')
    }

    const pageUrl = page.url()
    logger.info(`Solving hCaptcha for ${pageUrl}`)

    try {
      // Request captcha solution from 2Captcha
      const result = await this.solver.hcaptcha(siteKey, pageUrl)

      if (result.data) {
        logger.info('hCaptcha solved successfully')
        return result.data
      } else {
        throw new Error('Failed to solve hCaptcha')
      }
    } catch (error) {
      logger.error('Error solving hCaptcha:', error)
      throw error
    }
  }

  /**
   * Launch token on Pump.fun with captcha bypass
   */
  async launchTokenOnPumpFun(
    tokenData: {
      name: string
      symbol: string
      description: string
      imageUrl?: string
      twitter?: string
      telegram?: string
      website?: string
    },
    _walletPrivateKey: string, // TODO: Implement wallet signing
  ): Promise<TokenLaunchResult> {
    await this.initBrowser()
    const page = await this.browser!.newPage()

    try {
      // Set timeout
      page.setDefaultTimeout(this.config.headlessTimeout! * 1000)

      // Navigate to Pump.fun
      await page.goto('https://pump.fun/create', { waitUntil: 'networkidle2' })

      // Fill in token details
      await page.type('#token-name', tokenData.name)
      await page.type('#token-symbol', tokenData.symbol)
      await page.type('#token-description', tokenData.description)

      if (tokenData.imageUrl) {
        await page.type('#token-image', tokenData.imageUrl)
      }

      // Add social links if provided
      if (tokenData.twitter) {
        await page.type('#twitter', tokenData.twitter)
      }
      if (tokenData.telegram) {
        await page.type('#telegram', tokenData.telegram)
      }
      if (tokenData.website) {
        await page.type('#website', tokenData.website)
      }

      // Click create button
      await page.click('#create-token-button')

      // Wait for hCaptcha to appear
      const hcaptchaFrame = await page
        .waitForSelector('iframe[src*="hcaptcha.com"]', {
          timeout: 5000,
        })
        .catch(() => null)

      if (hcaptchaFrame) {
        // Extract site key
        const frameSrc = await hcaptchaFrame.evaluate((el) =>
          el.getAttribute('src'),
        )
        const siteKeyMatch = frameSrc?.match(/sitekey=([^&]+)/)

        if (siteKeyMatch) {
          const siteKey = siteKeyMatch[1]
          const captchaResponse = await this.solveHCaptcha(page, siteKey)

          // Inject captcha response
          await page.evaluate((response) => {
            (window as any).hcaptcha.setResponse(response)
          }, captchaResponse)

          // Submit form again
          await page.click('#create-token-button')
        }
      }

      // Wait for success and extract token details
      await page.waitForSelector('.success-message', { timeout: 30000 })

      const mint = await page.$eval(
        '.token-mint',
        (el) => el.textContent?.trim() || '',
      )
      const lp = await page.$eval(
        '.liquidity-pool',
        (el) => el.textContent?.trim() || '',
      )

      logger.info(`Token launched successfully: ${mint}`)

      return { mint, lp }
    } catch (error) {
      logger.error('Error launching token on Pump.fun:', error)
      throw error
    } finally {
      await page.close()
    }
  }

  /**
   * Launch token on LetsBonk with captcha bypass
   */
  async launchLetsBonk(
    tokenData: {
      name: string
      symbol: string
      description: string
      imageUrl?: string
      twitter?: string
      telegram?: string
      website?: string
    },
    _walletPrivateKey: string, // TODO: Implement wallet signing
  ): Promise<TokenLaunchResult> {
    await this.initBrowser()
    const page = await this.browser!.newPage()

    try {
      // Set timeout
      page.setDefaultTimeout(this.config.headlessTimeout! * 1000)

      // Navigate to LetsBonk create page
      await page.goto('https://letsbonk.fun/create', {
        waitUntil: 'networkidle2',
      })

      // Fill in token details
      await page.type('#token-name', tokenData.name)
      await page.type('#token-symbol', tokenData.symbol)
      await page.type('#token-description', tokenData.description)

      if (tokenData.imageUrl) {
        await page.type('#token-image', tokenData.imageUrl)
      }

      // Add social links if provided
      if (tokenData.twitter) {
        await page.type('#twitter', tokenData.twitter)
      }
      if (tokenData.telegram) {
        await page.type('#telegram', tokenData.telegram)
      }
      if (tokenData.website) {
        await page.type('#website', tokenData.website)
      }

      // Click create button
      await page.click('#create-token-button')

      // Wait for hCaptcha to appear
      const hcaptchaFrame = await page
        .waitForSelector('iframe[src*="hcaptcha.com"]', {
          timeout: 5000,
        })
        .catch(() => null)

      if (hcaptchaFrame) {
        // Extract site key
        const frameSrc = await hcaptchaFrame.evaluate((el) =>
          el.getAttribute('src'),
        )
        const siteKeyMatch = frameSrc?.match(/sitekey=([^&]+)/)

        if (siteKeyMatch) {
          const siteKey = siteKeyMatch[1]
          const captchaResponse = await this.solveHCaptcha(page, siteKey)

          // Inject captcha response
          await page.evaluate((response) => {
            (window as any).hcaptcha.setResponse(response)
          }, captchaResponse)

          // Submit form again
          await page.click('#create-token-button')
        }
      }

      // Wait for success and extract token details
      await page.waitForSelector('.success-message', { timeout: 30000 })

      const mint = await page.$eval(
        '.token-mint',
        (el) => el.textContent?.trim() || '',
      )
      const lp = await page.$eval(
        '.liquidity-pool',
        (el) => el.textContent?.trim() || '',
      )

      logger.info(`Token launched successfully on LetsBonk: ${mint}`)

      return { mint, lp }
    } catch (error) {
      logger.error('Error launching token on LetsBonk:', error)
      throw error
    } finally {
      await page.close()
    }
  }

  /**
   * Buy token on LetsBonk with captcha bypass
   */
  async buyTokenOnLetsBonk(
    tokenAddress: string,
    amountSol: number,
    _walletPrivateKey: string, // TODO: Implement wallet signing
  ): Promise<string> {
    await this.initBrowser()
    const page = await this.browser!.newPage()

    try {
      // Set timeout
      page.setDefaultTimeout(this.config.headlessTimeout! * 1000)

      // Navigate to LetsBonk trade page
      await page.goto(`https://letsbonk.io/trade/${tokenAddress}`, {
        waitUntil: 'networkidle2',
      })

      // Input buy amount
      await page.type('#buy-amount', amountSol.toString())

      // Click buy button
      await page.click('#buy-button')

      // Handle potential captcha
      const hcaptchaFrame = await page
        .waitForSelector('iframe[src*="hcaptcha.com"]', {
          timeout: 5000,
        })
        .catch(() => null)

      if (hcaptchaFrame) {
        const frameSrc = await hcaptchaFrame.evaluate((el) =>
          el.getAttribute('src'),
        )
        const siteKeyMatch = frameSrc?.match(/sitekey=([^&]+)/)

        if (siteKeyMatch) {
          const siteKey = siteKeyMatch[1]
          const captchaResponse = await this.solveHCaptcha(page, siteKey)

        await page.evaluate((response) => {
          (window as any).hcaptcha.setResponse(response)
        }, captchaResponse)

          await page.click('#buy-button')
        }
      }

      // Wait for transaction hash
      const txHash = await page
        .waitForSelector('.tx-hash', { timeout: 30000 })
        .then((el) => el?.evaluate((el) => el.textContent?.trim() || ''))

      logger.info(`Token bought successfully: ${txHash}`)

      return txHash || ''
    } catch (error) {
      logger.error('Error buying token on LetsBonk:', error)
      throw error
    } finally {
      await page.close()
    }
  }

  /**
   * Test if Puppeteer is working correctly
   */
  async testPuppeteer(): Promise<boolean> {
    try {
      await this.initBrowser()
      const page = await this.browser!.newPage()
      await page.goto('https://example.com', { waitUntil: 'domcontentloaded' })
      const title = await page.title()
      await page.close()
      return title === 'Example Domain'
    } catch (error) {
      logger.error('Puppeteer test failed:', error)
      return false
    }
  }
}

// Export singleton instance
let puppeteerHelper: PuppeteerHelper | null = null

export function getPuppeteerHelper(
  config?: CaptchaSolverConfig,
): PuppeteerHelper {
  if (!puppeteerHelper) {
    puppeteerHelper = new PuppeteerHelper(config)
  }
  return puppeteerHelper
}

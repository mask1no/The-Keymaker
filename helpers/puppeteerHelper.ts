import puppeteer from 'puppeteer';
import { Solver } from '2captcha';
import { logger } from '@/lib/logger';
import { getSettings } from '@/services/settingsService';

interface PumpFunResult {
  txHash: string;
  mintAddress: string;
}

export async function solvePumpFunCaptcha(
  tokenName: string,
  tokenSymbol: string,
  description: string,
  imageUrl: string,
  supply: string
): Promise<PumpFunResult> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
    (process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined);
    
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate to pump.fun create page
    logger.info('Navigating to pump.fun create page');
    await page.goto('https://pump.fun/create', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for form to load
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });

    // Fill the form
    logger.info('Filling token creation form');
    await page.type('input[name="name"]', tokenName);
    await page.type('input[name="symbol"]', tokenSymbol);
    await page.type('textarea[name="description"]', description);
    await page.type('input[name="supply"]', supply);
    
    // Handle image URL if provided
    if (imageUrl) {
      const imageInput = await page.$('input[name="imageUrl"]');
      if (imageInput) {
        await imageInput.type(imageUrl);
      }
    }

    // Check for hCaptcha
    const captchaFrame = await page.$('iframe[src*="hcaptcha.com"]');
    if (captchaFrame) {
      logger.info('hCaptcha detected, solving...');
      
      // Get 2captcha API key from settings
      const settings = await getSettings();
      const apiKey = settings?.apiKeys?.twoCaptchaApiKey;
      
      if (!apiKey) {
        throw new Error('2Captcha API key not configured in settings');
      }

      // Initialize 2captcha solver
      const solver = new Solver(apiKey);
      
      // Get the site key
      const siteKey = await page.evaluate(() => {
        const iframe = document.querySelector('iframe[src*="hcaptcha.com"]');
        if (iframe) {
          const src = iframe.getAttribute('src');
          const match = src?.match(/sitekey=([^&]+)/);
          return match ? match[1] : null;
        }
        return null;
      });

      if (!siteKey) {
        throw new Error('Could not extract hCaptcha site key');
      }

      // Solve captcha using 2captcha
      try {
        const result = await solver.hcaptcha(siteKey, page.url());
        
        // Inject captcha solution
        await page.evaluate((token) => {
          // @ts-ignore
          window.hcaptcha?.setResponse(token);
          // Also try setting it directly on the textarea
          const responseTextarea = document.querySelector('textarea[name="h-captcha-response"]');
          if (responseTextarea) {
            responseTextarea.value = token;
          }
          // Trigger the callback if it exists
          // @ts-ignore
          if (window.hcaptchaCallback) {
            // @ts-ignore
            window.hcaptchaCallback(token);
          }
        }, result.data);
        
        logger.info('Captcha solved successfully');
      } catch (error) {
        logger.error('Failed to solve captcha:', error);
        throw new Error('Captcha solving failed');
      }
    }

    // Set up console log listener for txHash
    const txHashPromise = new Promise<string>((resolve) => {
      page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes('window.txHash')) {
          const match = text.match(/window\.txHash[:\s]*([A-Za-z0-9]+)/);
          if (match) {
            resolve(match[1]);
          }
        }
      });
    });

    // Click create button
    logger.info('Clicking create button');
    const createButton = await page.$('button:has-text("Create")') || 
                       await page.$('button[type="submit"]');
    if (!createButton) {
      throw new Error('Create button not found');
    }
    
    await createButton.click();

    // Wait for transaction hash with timeout
    const txHash = await Promise.race([
      txHashPromise,
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout waiting for transaction hash')), 60000)
      )
    ]);

    // Try to extract mint address from the page
    const mintAddress = await page.evaluate(() => {
      // Check various possible locations
      const possibleSelectors = [
        'a[href*="/token/"]',
        'span:has-text("Token:")',
        'div:has-text("Mint:")'
      ];
      
      for (const selector of possibleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const href = element.getAttribute('href');
          if (href) {
            const match = href.match(/\/token\/([A-Za-z0-9]+)/);
            if (match) return match[1];
          }
          const text = element.textContent;
          if (text) {
            const match = text.match(/[A-Za-z0-9]{43,44}/);
            if (match) return match[0];
          }
        }
      }
      
      // Fallback: look for any base58 string that looks like a mint
      const allText = document.body.textContent || '';
      const match = allText.match(/[1-9A-HJ-NP-Za-km-z]{43,44}/);
      return match ? match[0] : '';
    });

    logger.info(`Token created successfully - TX: ${txHash}, Mint: ${mintAddress}`);
    
    return {
      txHash,
      mintAddress: mintAddress || txHash // Use txHash as fallback if mint not found
    };
    
  } catch (error) {
    logger.error('Puppeteer helper error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}
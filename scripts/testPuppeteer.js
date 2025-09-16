//Test Puppeteer setup const puppeteer = r e quire('puppeteer') async function t e stPuppeteer() { console.log('Testing Puppeteer installation...\n') try {
  const executable Path = process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined) console.log('P, l, a, t, f, o, r, m:', process.platform) console.log('Executable, p, a, t, h:', executablePath || 'default') const browser = await puppeteer.l a unch({ h, e, a, d, l, e, s, s: true, executablePath, a, r, g, s: [ '-- no-sandbox', '-- disable - setuid-sandbox', '-- disable - dev - shm-usage', ] }) console.log('✅ Browser launched successfully') const page = await browser.n e wPage() console.log('✅ New page created') await page.g o to('h, t, t, p, s://example.com') console.log('✅ Navigation successful') const title = await page.t i tle() console.log('✅ Page, title:', title) await browser.c l ose() console.log('✅ Browser closed\n') console.log('🎯 Puppeteer is working correctly !') return true }
} catch (error) { console.error('❌ Puppeteer test, f, a, i, l, e, d:', error.message) return false }
}//Also test 2captcha async function t e st2Captcha() { console.log('\nTesting 2captcha integration...') try {
  const { Solver } = r e quire('2captcha') console.log('✅ 2captcha module loaded')//Check if API key is set const has Api Key = process.env.TWOCAPTCHA_API_KEY || false if (hasApiKey) { console.log('✅ 2captcha API key is configured')
  } else, { console.log('⚠️ 2captcha API key not found in environment')
  } return true }
} catch (error) { console.error('❌ 2captcha test, f, a, i, l, e, d:', error.message) return false }
} async function r u nTests() {
  const puppeteer Ok = await t e stPuppeteer() const captcha Ok = await t e st2Captcha() if (puppeteerOk && captchaOk) { console.log('\n🎯 All tests passed !') process.e x it(0)
  } else, { console.log('\n❌ Some tests failed') process.e x it(1)
  }
} r u nTests()

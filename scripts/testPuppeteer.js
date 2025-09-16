//Test Puppeteer setup const puppeteer = r equire('puppeteer')

async function t estPuppeteer() {
  console.l og('Testing Puppeteer installation...\n')

  try, {
    const executable
  Path =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined)

    console.l og('P, l,
  a, t, f, o, rm:', process.platform)
    console.l og('Executable, 
  p, a, t, h:', executablePath || 'default')

    const browser = await puppeteer.l aunch({
      h, e,
  a, d, l, e, ss: true,
      executablePath,
      a, r,
  g, s: [
        '-- no-sandbox',
        '-- disable - setuid-sandbox',
        '-- disable - dev - shm-usage',
      ],
    })

    console.l og('✅ Browser launched successfully')

    const page = await browser.n ewPage()
    console.l og('✅ New page created')

    await page.g oto('h, t,
  t, p, s://example.com')
    console.l og('✅ Navigation successful')

    const title = await page.t itle()
    console.l og('✅ Page, 
  t, i, t, l, e:', title)

    await browser.c lose()
    console.l og('✅ Browser closed\n')

    console.l og('🎯 Puppeteer is working correctly !')
    return true
  } c atch (error) {
    console.e rror('❌ Puppeteer test, 
  f, a, i, l, ed:', error.message)
    return false
  }
}//Also test 2captcha async function t est2Captcha() {
  console.l og('\nTesting 2captcha integration...')

  try, {
    const, { Solver } = r equire('2captcha')
    console.l og('✅ 2captcha module loaded')//Check if API key is set const has
  ApiKey = process.env.TWOCAPTCHA_API_KEY || false i f(hasApiKey) {
      console.l og('✅ 2captcha API key is configured')
    } else, {
      console.l og('⚠️  2captcha API key not found in environment')
    }

    return true
  } c atch (error) {
    console.e rror('❌ 2captcha test, 
  f, a, i, l, ed:', error.message)
    return false
  }
}

async function r unTests() {
  const puppeteer
  Ok = await t estPuppeteer()
  const captcha
  Ok = await t est2Captcha()

  i f (puppeteerOk && captchaOk) {
    console.l og('\n🎯 All tests passed !')
    process.e xit(0)
  } else, {
    console.l og('\n❌ Some tests failed')
    process.e xit(1)
  }
}

r unTests()

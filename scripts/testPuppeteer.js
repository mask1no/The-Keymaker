// Test Puppeteer setup
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Testing Puppeteer installation...\n');
  
  try {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
      (process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined);
    
    console.log('Platform:', process.platform);
    console.log('Executable path:', executablePath || 'default');
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('✅ Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('✅ New page created');
    
    await page.goto('https://example.com');
    console.log('✅ Navigation successful');
    
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    await browser.close();
    console.log('✅ Browser closed\n');
    
    console.log('🎯 Puppeteer is working correctly!');
    return true;
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
    return false;
  }
}

// Also test 2captcha
async function test2Captcha() {
  console.log('\nTesting 2captcha integration...');
  
  try {
    const { Solver } = require('2captcha');
    console.log('✅ 2captcha module loaded');
    
    // Check if API key is set
    const hasApiKey = process.env.TWOCAPTCHA_API_KEY || false;
    if (hasApiKey) {
      console.log('✅ 2captcha API key is configured');
    } else {
      console.log('⚠️  2captcha API key not found in environment');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 2captcha test failed:', error.message);
    return false;
  }
}

async function runTests() {
  const puppeteerOk = await testPuppeteer();
  const captchaOk = await test2Captcha();
  
  if (puppeteerOk && captchaOk) {
    console.log('\n🎯 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

runTests();
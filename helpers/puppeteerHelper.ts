// server-safe no-op helper to avoid bundling puppeteer on client

// Minimal no-op helper to satisfy imports without bundling puppeteer into client.
export function getPuppeteerHelper() {
  return {
    initBrowser: async () => {},
    closeBrowser: async () => {},
    solveHCaptcha: async () => '',
    launchTokenOnPumpFun: async () => ({ mint: '', lp: '', txHash: '' }),
    launchLetsBonk: async () => ({ mint: '', lp: '', txHash: '' }),
    buyTokenOnLetsBonk: async () => '',
    testPuppeteer: async () => false,
  };
}

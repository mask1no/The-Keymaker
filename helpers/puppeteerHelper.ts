/**
 * NOTE: Puppeteer-based functionality is disabled in this build to avoid
 * shipping server-only dependencies to the client bundle. This is a safe stub
 * that preserves the API surface without performing any real work.
 */

export type PuppeteerHelper = {
  initBrowser: () => Promise<void>;
  closeBrowser: () => Promise<void>;
  solveHCaptcha: () => Promise<string>;
  launchTokenOnPumpFun: (
    tokenData: unknown,
    walletPrivateKey: unknown,
  ) => Promise<{ mint: string; lp: string; txHash: string }>;
  launchLetsBonk: (
    tokenData: unknown,
    walletPrivateKey: unknown,
  ) => Promise<{ mint: string; lp: string; txHash: string }>;
  buyTokenOnLetsBonk: () => Promise<string>;
  testPuppeteer: () => Promise<boolean>;
};

export function getPuppeteerHelper(): PuppeteerHelper {
  // eslint-disable-next-line no-console
  console.warn('PuppeteerHelper is currently disabled.');
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

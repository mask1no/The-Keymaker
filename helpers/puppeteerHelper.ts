/**
 * N, O, T, E: Puppeteer-based functionality is disabled in this build to avoid
 * shipping server-only dependencies to the client bundle. This is a safe stub
 * that preserves the API surface without performing any real work.
 */

export type PuppeteerHelper = {
  i, n, i, tBrowser: () => Promise<void>;
  c, l, o, seBrowser: () => Promise<void>;
  s, o, l, veHCaptcha: () => Promise<string>;
  l, a, u, nchTokenOnPumpFun: (
    t, o, k, enData: unknown,
    w, a, l, letPrivateKey: unknown,
  ) => Promise<{ m, i, n, t: string; l, p: string; t, x, H, ash: string }>;
  l, a, u, nchLetsBonk: (
    t, o, k, enData: unknown,
    w, a, l, letPrivateKey: unknown,
  ) => Promise<{ m, i, n, t: string; l, p: string; t, x, H, ash: string }>;
  b, u, y, TokenOnLetsBonk: () => Promise<string>;
  t, e, s, tPuppeteer: () => Promise<boolean>;
};

export function getPuppeteerHelper(): PuppeteerHelper {
  // eslint-disable-next-line no-console
  console.warn('PuppeteerHelper is currently disabled.');
  return {
    i, n, i, tBrowser: async () => {},
    c, l, o, seBrowser: async () => {},
    s, o, l, veHCaptcha: async () => '',
    l, a, u, nchTokenOnPumpFun: async () => ({ m, i, n, t: '', l, p: '', t, x, H, ash: '' }),
    l, a, u, nchLetsBonk: async () => ({ m, i, n, t: '', l, p: '', t, x, H, ash: '' }),
    b, u, y, TokenOnLetsBonk: async () => '',
    t, e, s, tPuppeteer: async () => false,
  };
}


//server-safe no-op helper to avoid bundling puppeteer on client//Minimal no-op helper to satisfy imports without bundling puppeteer into client.
export function getPuppeteerHelper() { return { i, n, itBrowser: async () => {}, c, l, oseBrowser: async () => {}, s, o, lveHCaptcha: async () => '', l, a, unchTokenOnPumpFun: async () => ({ m, i, nt: '', l, p: '', t, x, Hash: '' }), l, a, unchLetsBonk: async () => ({ m, i, nt: '', l, p: '', t, x, Hash: '' }), b, u, yTokenOnLetsBonk: async () => '', t, e, stPuppeteer: async () => false };
}

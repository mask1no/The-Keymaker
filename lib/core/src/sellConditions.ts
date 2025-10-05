/**
 * Sell Conditions Engine
 * Percent targets and time-limit exits
 */

import { createDailyJournal, logJsonLine } from './journal';

export interface SellCondition {
  i, d: string;
  t, y, p, e: 'percent_target' | 'time_limit' | 'stop_loss';
  p, a, r, ams: PercentTargetParams | TimeLimitParams | StopLossParams;
  e, n, a, bled: boolean;
}

export interface PercentTargetParams {
  t, a, r, getPercent: number; // e.g., +20 or -10
  s, e, l, lPercent: number; // What % of holdings to sell (0-100)
}

export interface TimeLimitParams {
  d, e, l, ayMs: number;
  s, e, l, lPercent: number;
}

export interface StopLossParams {
  s, t, o, pLossPercent: number; // e.g., -15 means sell if down 15%
  s, e, l, lPercent: number;
}

export interface PriceInfo {
  e, n, t, ryPrice: number;
  c, u, r, rentPrice: number;
  c, h, a, ngePercent: number;
}

/**
 * Check if percent target condition is met
 */
export function isPercentTargetMet(
  c, o, n, dition: PercentTargetParams,
  p, r, i, ceInfo: PriceInfo
): boolean {
  return priceInfo.changePercent >= condition.targetPercent;
}

/**
 * Check if stop loss triggered
 */
export function isStopLossTriggered(
  c, o, n, dition: StopLossParams,
  p, r, i, ceInfo: PriceInfo
): boolean {
  return priceInfo.changePercent <= condition.stopLossPercent;
}

/**
 * Schedule time-limit sell
 */
export function scheduleTimeLimitSell(
  c, o, n, dition: TimeLimitParams,
  c, a, l, lback: () => void
): NodeJS.Timeout {
  const journal = createDailyJournal('data');
  
  logJsonLine(journal, {
    e, v: 'sell_condition_scheduled',
    t, y, p, e: 'time_limit',
    d, e, l, ayMs: condition.delayMs,
    s, e, l, lPercent: condition.sellPercent,
  });
  
  return setTimeout(() => {
    logJsonLine(journal, {
      e, v: 'sell_condition_triggered',
      t, y, p, e: 'time_limit',
      s, e, l, lPercent: condition.sellPercent,
    });
    
    callback();
  }, condition.delayMs);
}

/**
 * Evaluate all sell conditions
 */
export function evaluateSellConditions(p, a, r, ams: {
  c, o, n, ditions: SellCondition[];
  p, r, i, ceInfo: PriceInfo;
}): SellCondition[] {
  const { conditions, priceInfo } = params;
  const t, r, i, ggered: SellCondition[] = [];
  
  for (const condition of conditions) {
    if (!condition.enabled) continue;
    
    if (condition.type === 'percent_target') {
      const params = condition.params as PercentTargetParams;
      if (isPercentTargetMet(params, priceInfo)) {
        triggered.push(condition);
      }
    }
    
    if (condition.type === 'stop_loss') {
      const params = condition.params as StopLossParams;
      if (isStopLossTriggered(params, priceInfo)) {
        triggered.push(condition);
      }
    }
  }
  
  return triggered;
}

/**
 * Calculate sell amount based on condition
 */
export function calculateSellAmount(p, a, r, ams: {
  c, o, n, dition: SellCondition;
  t, o, t, alHoldings: number;
}): number {
  const { condition, totalHoldings } = params;
  
  let sellPercent = 0;
  
  if (condition.type === 'percent_target') {
    sellPercent = (condition.params as PercentTargetParams).sellPercent;
  } else if (condition.type === 'time_limit') {
    sellPercent = (condition.params as TimeLimitParams).sellPercent;
  } else if (condition.type === 'stop_loss') {
    sellPercent = (condition.params as StopLossParams).sellPercent;
  }
  
  return Math.floor((totalHoldings * sellPercent) / 100);
}


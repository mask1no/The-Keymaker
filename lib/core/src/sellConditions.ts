/**
 * Sell Conditions Engine
 * Percent targets and time-limit exits
 */

import { createDailyJournal, logJsonLine } from './journal';

export interface SellCondition {
  id: string;
  type: 'percent_target' | 'time_limit' | 'stop_loss';
  params: PercentTargetParams | TimeLimitParams | StopLossParams;
  enabled: boolean;
}

export interface PercentTargetParams {
  targetPercent: number; // e.g., +20 or -10
  sellPercent: number; // What % of holdings to sell (0-100)
}

export interface TimeLimitParams {
  delayMs: number;
  sellPercent: number;
}

export interface StopLossParams {
  stopLossPercent: number; // e.g., -15 means sell if down 15%
  sellPercent: number;
}

export interface PriceInfo {
  entryPrice: number;
  currentPrice: number;
  changePercent: number;
}

/**
 * Check if percent target condition is met
 */
export function isPercentTargetMet(
  condition: PercentTargetParams,
  priceInfo: PriceInfo
): boolean {
  return priceInfo.changePercent >= condition.targetPercent;
}

/**
 * Check if stop loss triggered
 */
export function isStopLossTriggered(
  condition: StopLossParams,
  priceInfo: PriceInfo
): boolean {
  return priceInfo.changePercent <= condition.stopLossPercent;
}

/**
 * Schedule time-limit sell
 */
export function scheduleTimeLimitSell(
  condition: TimeLimitParams,
  callback: () => void
): NodeJS.Timeout {
  const journal = createDailyJournal('data');
  
  logJsonLine(journal, {
    ev: 'sell_condition_scheduled',
    type: 'time_limit',
    delayMs: condition.delayMs,
    sellPercent: condition.sellPercent,
  });
  
  return setTimeout(() => {
    logJsonLine(journal, {
      ev: 'sell_condition_triggered',
      type: 'time_limit',
      sellPercent: condition.sellPercent,
    });
    
    callback();
  }, condition.delayMs);
}

/**
 * Evaluate all sell conditions
 */
export function evaluateSellConditions(params: {
  conditions: SellCondition[];
  priceInfo: PriceInfo;
}): SellCondition[] {
  const { conditions, priceInfo } = params;
  const triggered: SellCondition[] = [];
  
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
export function calculateSellAmount(params: {
  condition: SellCondition;
  totalHoldings: number;
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


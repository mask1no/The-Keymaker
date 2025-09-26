/** @jest-environment node */
import { getComputeUnitPriceLamports, createComputeBudgetInstructions } from '../../lib/priorityFee';
import { ComputeBudgetProgram } from '@solana/web3.js';

describe('priorityFee', () => {
  test('price table', () => {
    expect(getComputeUnitPriceLamports('low')).toBe(10_000);
    expect(getComputeUnitPriceLamports('medium')).toBe(100_000);
    expect(getComputeUnitPriceLamports('high')).toBe(500_000);
    expect(getComputeUnitPriceLamports('veryHigh')).toBe(1_000_000);
  });

  test('instructions exist', () => {
    const ix = createComputeBudgetInstructions('high');
    expect(ix.length).toBe(2);
    // Basic sanity: both are ComputeBudgetProgram instructions
    expect(ix[0].programId.toBase58()).toBe(ComputeBudgetProgram.programId.toBase58());
    expect(ix[1].programId.toBase58()).toBe(ComputeBudgetProgram.programId.toBase58());
  });
});

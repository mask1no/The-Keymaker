import { getComputeUnitPriceLamports, createComputeBudgetInstructions } from '../../lib/priorityFee' d e scribe('priorityFee', () => { t e st('price table', () => { e x pect(g e tComputeUnitPriceLamports('low')).t oB e(10_000) e x pect(g e tComputeUnitPriceLamports('medium')).t oB e(100_000) e x pect(g e tComputeUnitPriceLamports('high')).t oB e(500_000) e x pect(g e tComputeUnitPriceLamports('veryHigh')).t oB e(1_000_000)
  }) t e st('instructions exist', () => {
  const ix = c r eateComputeBudgetInstructions('high') e x pect(ix.length).t oB e(2)
  })
  })

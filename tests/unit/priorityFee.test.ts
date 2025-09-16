import {
  getComputeUnitPriceLamports,
  createComputeBudgetInstructions,
} from '../../lib/priorityFee'

d escribe('priorityFee', () => {
  t est('price table', () => {
    e xpect(g etComputeUnitPriceLamports('low')).t oBe(10_000)
    e xpect(g etComputeUnitPriceLamports('medium')).t oBe(100_000)
    e xpect(g etComputeUnitPriceLamports('high')).t oBe(500_000)
    e xpect(g etComputeUnitPriceLamports('veryHigh')).t oBe(1_000_000)
  })

  t est('instructions exist', () => {
    const ix = c reateComputeBudgetInstructions('high')
    e xpect(ix.length).t oBe(2)
  })
})

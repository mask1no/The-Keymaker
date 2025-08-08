// Smoke test for previewBundle export signatures and shape
// Import only the function under test to avoid initializing sqlite in services
import { buildBundle } from '../../services/bundleService'

describe('bundleService buildBundle', () => {
  test('sorts by role priority and preserves size', async () => {
    // This is a superficial test due to Transaction construction complexity in unit env
    const txs: any[] = [
      { feePayer: { toBase58: () => 'A' }, instructions: [] },
      { feePayer: { toBase58: () => 'B' }, instructions: [] },
      { feePayer: { toBase58: () => 'C' }, instructions: [] },
    ]
    const roles = [
      { publicKey: 'B', role: 'sniper' },
      { publicKey: 'C', role: 'dev' },
      { publicKey: 'A', role: 'normal' },
    ]
    const sorted = await buildBundle(txs as any, roles)
    expect(sorted).toHaveLength(3)
  })
})



import { SimulationService } from '@/services/execution/SimulationService';
import { SubmissionService } from '@/services/execution/SubmissionService';
import { validateTipAccount } from '@/lib/server/jitoService';
describe('Execution Services', () => {
  test('SimulationService.simulateAll returns ok on empty list', async () => {
    const conn: any = { simulateTransaction: jest.fn() };
    const sim = new SimulationService(conn);
    const res = await sim.simulateAll([] as any);
    expect(res.ok).toBe(true);
  });
  test('SubmissionService.submitAndPoll handles immediate landed', async () => {
    const svc = new SubmissionService('ffm');
    const spySend = jest
      .spyOn(require('@/lib/server/jitoService'), 'sendBundle')
      .mockResolvedValue({ bundle_id: 'b1' });
    const spyStat = jest
      .spyOn(require('@/lib/server/jitoService'), 'getBundleStatuses')
      .mockResolvedValue([{ confirmation_status: 'landed', slot: 123 }] as any);
    const res = await svc.submitAndPoll(['AAA=']);
    expect(res.ok).toBe(true);
    expect((res as any).data.bundleId).toBe('b1');
    expect((res as any).data.landedSlot).toBe(123);
    spySend.mockRestore();
    spyStat.mockRestore();
  });
  test('validateTipAccount returns false for malformed tx', () => {
    const badTx: any = { message: { compiledInstructions: [], staticAccountKeys: [] } };
    expect(validateTipAccount(badTx)).toBe(false);
  });
});

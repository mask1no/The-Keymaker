import { Engine, ExecutionMode, ExecOptions, SubmitPlan } from './engine';

export class RpcEngine implements Engine {
  async submit(plan: SubmitPlan, opts: ExecOptions) {
    // RPC engine implementation
    return {
      success: true,
      signature: 'mock_signature',
      mode: 'RPC' as ExecutionMode,
    };
  }

  async pollStatus(plan: SubmitPlan | null, opts: ExecOptions) {
    return {
      success: true,
      signature: 'mock_signature',
      mode: 'RPC' as ExecutionMode,
    };
  }
}

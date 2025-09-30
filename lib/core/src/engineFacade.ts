import { Engine, ExecutionMode, ExecOptions, SubmitPlan } from './engine';
import { JitoEngine } from './engineJito';
import { RpcEngine } from './engineRpc';
import { MockEngine } from './engineMock';

// Use mock engine in DRY_RUN mode, real engines otherwise
const useMock = process.env.DRY_RUN === 'true' || process.env.NODE_ENV === 'development';

const engines: Record<ExecutionMode, Engine> = {
  JITO_BUNDLE: useMock ? new MockEngine() : new JitoEngine(),
  RPC_FANOUT: useMock ? new MockEngine() : new RpcEngine(),
};

console.log('[EngineFactory] Initialized engines:', {
  mode: useMock ? 'MOCK' : 'REAL',
  DRY_RUN: process.env.DRY_RUN,
  NODE_ENV: process.env.NODE_ENV,
});

export function getEngine(mode: ExecutionMode): Engine {
  return engines[mode];
}

export async function engineSubmit(plan: SubmitPlan, opts: ExecOptions) {
  return engines[opts.mode].submit(plan, opts);
}

export async function enginePoll(plan: SubmitPlan | null, opts: ExecOptions) {
  return engines[opts.mode].pollStatus(plan, opts);
}

export async function submitViaJito(plan: SubmitPlan, opts: ExecOptions) {
  const nextOpts: ExecOptions = { ...opts, mode: 'JITO_BUNDLE' } as ExecOptions;
  return engines.JITO_BUNDLE.submit(plan, nextOpts);
}

export async function submitViaRpc(plan: SubmitPlan, opts: ExecOptions) {
  const nextOpts: ExecOptions = { ...opts, mode: 'RPC_FANOUT' } as ExecOptions;
  return engines.RPC_FANOUT.submit(plan, nextOpts);
}

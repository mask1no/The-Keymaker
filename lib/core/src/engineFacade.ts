import { Engine, ExecutionMode, ExecOptions, SubmitPlan } from './engine';
import { JitoEngine } from './engineJito';
import { RpcEngine } from './engineRpc';

const engines: Record<ExecutionMode, Engine> = {
  JITO_BUNDLE: new JitoEngine(),
  RPC_FANOUT: new RpcEngine(),
};

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

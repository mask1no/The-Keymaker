import { Engine, ExecutionMode, ExecOptions, SubmitPlan } from './engine';
import { JitoEngine } from './engineJito';
import { RpcEngine } from './engineRpc';

const engines: Record<ExecutionMode, Engine> = {
  RPC: new JitoEngine(),
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

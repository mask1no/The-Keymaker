let RUN_ENABLED = true;
const taskWallets = new Map<string, string[]>();
let LISTENER_ACTIVE = false;
let RPC_DEGRADED = false;

export function setRunEnabled(b: boolean) { RUN_ENABLED = b; }
export function getRunEnabled() { return RUN_ENABLED; }

export function setTaskWallets(taskId: string, wallets: string[]) {
  taskWallets.set(taskId, wallets);
}
export function getTaskWallets(taskId: string): string[] {
  return taskWallets.get(taskId) || [];
}

export function setListenerActive(b: boolean) { LISTENER_ACTIVE = b; }
export function getListenerActive(): boolean { return LISTENER_ACTIVE; }

export function setRpcDegraded(b: boolean) { RPC_DEGRADED = b; }
export function getRpcDegraded(): boolean { return RPC_DEGRADED; }



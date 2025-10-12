export type TaskKind = "SNIPE" | "MM";

export type SnipeParams = {
  walletFolderId: string;
  walletCount: number;
  maxSolPerWallet: number;
  slippageBps: number;
  delayMsRange: [number, number];
  jitoTipLamports?: number;
  region?: "NY"|"AMS"|"FRA"|"SFO"|"TOK";
};

export type MMParams = {
  walletFolderId: string;
  walletCount: number;
  minOrderSol: number;
  maxOrderSol: number;
  slippageBps: number;
  delayMsRange: [number, number];
  maxTxPerMin: number;
  maxSessionSol: number;
  jitoTipLamports?: number;
  region?: "NY"|"AMS"|"FRA"|"SFO"|"TOK";
};

export type TaskCreateMsg = {
  kind: "TASK_CREATE";
  payload: { mode: TaskKind; ca: string; params: SnipeParams | MMParams };
  meta?: { masterWallet?: string; signedNonce?: string };
};

export type WsOut =
  | { kind: "TASK_ACCEPTED"; id: string }
  | { kind: "TASK_EVENT"; id: string; state: string; info?: any }
  | { kind: "ERROR"; error: string }
  | { kind: "HEALTH"; rpcOk: boolean; jitoOk: boolean; pingMs: number };



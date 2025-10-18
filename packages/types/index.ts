export type ExecMode = "RPC_SPRAY" | "STEALTH_STRETCH" | "JITO_LITE";

export type TaskKind = "SNIPE" | "MM";

export type SnipeParams = {
  walletFolderId: string; walletCount: number;
  maxSolPerWallet: number; slippageBps: number;
  execMode: ExecMode;
  jitterMs: [number, number];
  tipLamports?: [number, number];
  cuPrice?: [number, number];
};

export type MMParams = {
  walletFolderId: string; walletCount: number;
  minOrderSol: number; maxOrderSol: number;
  slippageBps: number;
  maxTxPerMin: number; maxSessionSol: number;
  execMode: ExecMode; jitterMs: [number, number];
  tipLamports?: [number, number]; cuPrice?: [number, number];
};

export type TaskCreateMsg = {
  kind: "TASK_CREATE";
  payload: { kind: TaskKind; ca: string; params: SnipeParams | MMParams };
  meta?: { masterWallet?: string; signedNonce?: string };
};

export type WsOut =
  | { kind: "TASK_ACCEPTED"; id: string }
  | { kind: "TASK_EVENT"; id: string; state: string; info?: any }
  | { kind: "ERROR"; error: string }
  | { kind: "HEALTH"; rpcOk: boolean; jitoOk: boolean; pingMs: number };

// --- Phase 2: Shared WebSocket message types ---

// Requests from Web -> Daemon
export type ClientMsg =
  | { kind: "AUTH_CHALLENGE" }
  | { kind: "AUTH_PROVE"; payload: { pubkey: string; signature: string; nonce: string } }
  | { kind: "FOLDER_CREATE"; payload: { id: string; name: string } }
  | { kind: "FOLDER_RENAME"; payload: { id: string; name: string } }
  | { kind: "FOLDER_LIST" }
  | { kind: "FOLDER_DELETE_PREVIEW"; payload: { id: string } }
  | { kind: "FOLDER_DELETE"; payload: { id: string; masterPubkey: string } }
  | { kind: "WALLET_CREATE"; payload: { folderId: string } }
  | { kind: "WALLET_IMPORT"; payload: { folderId: string; secretBase58: string } }
  | { kind: "FOLDER_WALLETS"; payload: { folderId: string } }
  | { kind: "FUND_WALLETS"; payload: { folderId: string; totalSol: number; masterPubkey: string } }
  | { kind: "TASK_CREATE"; payload: { kind: TaskKind; ca: string; params: any }; meta?: { masterWallet?: string } }
  | { kind: "TASK_KILL"; payload: { id: string } }
  | { kind: "TASK_LIST" }
  | { kind: "KILL_SWITCH"; payload: { enabled: boolean } }
  // NEW coin ops
  | { kind: "COIN_CREATE_SPL"; payload: { name: string; symbol: string; decimals: 6|9; metadataUri: string; payerFolderId: string; payerWalletPubkey?: string } }
  | { kind: "COIN_PUBLISH_PUMPFUN"; payload: { mint: string; payerFolderId: string; payerWalletPubkey?: string } };

// Outgoing daemon -> web
export type ServerMsg =
  | { kind: "AUTH_NONCE"; nonce: string }
  | { kind: "AUTH_OK"; masterPubkey: string }
  | { kind: "ERR"; error: string; ref?: string }
  | { kind: "ACK"; ref: string }
  | { kind: "FOLDERS"; folders: Array<{ id: string; name: string; count: number }> }
  | { kind: "WALLETS"; folderId: string; wallets: Array<{ id: string; pubkey: string; role: string }> }
  | { kind: "FUND_RESULT"; folderId: string; signatures: string[] }
  | { kind: "TASK_ACCEPTED"; id: string }
  | { kind: "TASK_EVENT"; id: string; state: string; info?: any }
  | { kind: "TASKS"; items: Array<{ id: string; kind: TaskKind; ca: string; state: string; created_at: number; updated_at: number }> }
  | { kind: "HEALTH"; rpcOk: boolean; jitoOk: boolean; pingMs: number }
  // NEW coin ops
  | { kind: "COIN_CREATED"; mint: string; sig: string }
  | { kind: "COIN_PUBLISHED"; mint: string; sig: string }
  // Folder delete preview/sweep
  | { kind: "FOLDER_DELETE_PLAN"; id: string; wallets: Array<{ pubkey: string; solLamports: number; tokens: Array<{ mint: string; amount: string }> }>; estFeesLamports: number }
  | { kind: "SWEEP_PROGRESS"; id: string; step: "SENT"|"VERIFY"|"DONE"; info?: { pubkey?: string; sig?: string } }
  | { kind: "SWEEP_DONE"; id: string; signatures: string[] };



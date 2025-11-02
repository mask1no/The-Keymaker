export type ExecMode = "RPC_SPRAY" | "STEALTH_STRETCH" | "JITO_LITE" | "JITO_BUNDLE";

export type TaskKind = "SNIPE" | "SELL" | "MM";

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

export type SellParams = {
  walletFolderId: string; walletCount: number;
  percent: number; // 1..100 of token balance
  slippageBps: number;
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
  | { kind: "TASK_LIST"; payload?: { ca?: string } }
  | { kind: "KILL_SWITCH"; payload: { enabled: boolean } }
  | { kind: "SETTINGS_GET" }
  | { kind: "SETTINGS_SET"; payload: { entries: Array<{ key: string; value: string }> } }
  | { kind: "UPLOAD_METADATA"; payload: { imageUri?: string; metadataUri?: string; imageBase64?: string; name?: string; symbol?: string; description?: string; attributes?: any[] } }
  // NEW coin ops
  | { kind: "COIN_CREATE_SPL"; payload: { name: string; symbol: string; decimals: 6|9; metadataUri: string; payerFolderId: string; payerWalletPubkey?: string } }
  | { kind: "COIN_PUBLISH_PUMPFUN"; payload: { mint: string; payerFolderId: string; payerWalletPubkey?: string } }
  | { kind: "CA_INSPECT"; payload: { ca: string } }
  | { kind: "MARKET_ORDER"; payload: { ca: string; side: "BUY"|"SELL"; folderId: string; walletMode: "ONE"|"ALL"; amountSol?: number; amountTokens?: number; percentTokens?: number; slippageBps?: number } };

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
  | { kind: "TASKS"; items: Array<{ id: string; kind: TaskKind; ca: string; state: string; created_at: number; updated_at: number; last_event?: string }> }
  | { kind: "HEALTH"; rpcOk: boolean; jitoOk: boolean; pingMs: number }
  | { kind: "SETTINGS"; settings: { RPC_URL: string; GRPC_ENDPOINT: string; JITO_BLOCK_ENGINE: string; RUN_ENABLED: boolean } }
  | { kind: "METADATA_UPLOADED"; imageUri: string; metadataUri: string }
  // NEW coin ops
  | { kind: "COIN_CREATED"; mint: string; sig: string }
  | { kind: "COIN_PUBLISHED"; mint: string; sig: string }
  | { kind: "CA_STATUS"; ca: string; ammReady: boolean; decimals?: number; name?: string; symbol?: string }
  | { kind: "ORDER_EVENT"; state: "PREP"|"BUILD"|"SUBMIT"|"CONFIRM"|"DONE"|"FAIL"; walletPubkey: string; sig?: string; error?: string }
  // Live activity streams
  | { kind: "PUMP_EVENT"; mint: string; ca: string; slot: number; sig: string }
  // Folder delete preview/sweep
  | { kind: "FOLDER_DELETE_PLAN"; id: string; wallets: { pubkey: string; solLamports: number; tokens: { mint: string; amount: string }[] }[]; estFeesLamports: number }
  | { kind: "SWEEP_PROGRESS"; id: string; step: "SENT"|"VERIFY"|"DONE"; info?: { pubkey?: string; sig?: string } }
  | { kind: "SWEEP_DONE"; id: string; signatures: string[] };



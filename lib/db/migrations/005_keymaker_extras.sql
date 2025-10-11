-- idempotency table must have a unique index on msg_hash
CREATE TABLE IF NOT EXISTS tx_dedupe(
  msg_hash TEXT PRIMARY KEY,
  first_seen_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'sent'|'landed'|'error'
  signature TEXT,
  slot INTEGER
);

-- developer wallet per mint
CREATE TABLE IF NOT EXISTS dev_mints(
  mint TEXT PRIMARY KEY,
  dev_pubkey TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- wallet selection presets
CREATE TABLE IF NOT EXISTS wallet_selection_presets(
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  wallet_pubkeys TEXT NOT NULL, -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wsp_group ON wallet_selection_presets(group_id);

-- funding presets
CREATE TABLE IF NOT EXISTS funding_presets(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('equal','per_wallet','target','volume_stipend')),
  json TEXT NOT NULL, -- strategy payload
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- volume profiles & runs
CREATE TABLE IF NOT EXISTS volume_profiles(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS volume_runs(
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running','stopping','stopped','completed','error')),
  started_at INTEGER NOT NULL,
  stopped_at INTEGER,
  stats_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_vruns_status ON volume_runs(status);

-- optional advisory last action timestamps per mint (for crash recovery of mint lock)
CREATE TABLE IF NOT EXISTS mint_activity(
  mint TEXT PRIMARY KEY,
  last_action_ts INTEGER NOT NULL
);



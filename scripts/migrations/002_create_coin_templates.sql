-- Create coin_templates table
CREATE TABLE IF NOT EXISTS coin_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    tags TEXT DEFAULT '[]', -- JSON array of tags
    supply INTEGER DEFAULT 1000000000,
    decimals INTEGER DEFAULT 9,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, name, symbol)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coin_templates_user_id ON coin_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_templates_category ON coin_templates(category);
CREATE INDEX IF NOT EXISTS idx_coin_templates_name ON coin_templates(name);
CREATE INDEX IF NOT EXISTS idx_coin_templates_symbol ON coin_templates(symbol);
CREATE INDEX IF NOT EXISTS idx_coin_templates_created_at ON coin_templates(created_at);

-- Create token_creations table for tracking token creation attempts
CREATE TABLE IF NOT EXISTS token_creations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    metadata_uri TEXT DEFAULT '',
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    transaction_hash TEXT DEFAULT '',
    mint_address TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create indexes for token_creations
CREATE INDEX IF NOT EXISTS idx_token_creations_user_id ON token_creations(user_id);
CREATE INDEX IF NOT EXISTS idx_token_creations_status ON token_creations(status);
CREATE INDEX IF NOT EXISTS idx_token_creations_created_at ON token_creations(created_at);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'buy', 'sell', 'transfer', 'create'
    from_wallet TEXT,
    to_wallet TEXT,
    token_mint TEXT,
    token_symbol TEXT,
    amount REAL,
    price REAL,
    sol_amount REAL,
    transaction_hash TEXT,
    volume_task_id INTEGER,
    metadata TEXT DEFAULT '{}', -- JSON metadata
    created_at TEXT NOT NULL,
    FOREIGN KEY (volume_task_id) REFERENCES volume_tasks (id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_action ON transactions(action);
CREATE INDEX IF NOT EXISTS idx_transactions_from_wallet ON transactions(from_wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet ON transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_token_mint ON transactions(token_mint);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_volume_task_id ON transactions(volume_task_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_hash ON transactions(transaction_hash);

-- Create transaction_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS transaction_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    token_mint TEXT,
    total_buy_amount REAL DEFAULT 0,
    total_sell_amount REAL DEFAULT 0,
    total_buy_sol REAL DEFAULT 0,
    total_sell_sol REAL DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, date, token_mint)
);

-- Create indexes for transaction_stats
CREATE INDEX IF NOT EXISTS idx_transaction_stats_user_id ON transaction_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_stats_date ON transaction_stats(date);
CREATE INDEX IF NOT EXISTS idx_transaction_stats_token_mint ON transaction_stats(token_mint);

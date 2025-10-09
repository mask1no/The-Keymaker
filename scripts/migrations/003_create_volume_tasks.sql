-- Create volume_tasks table
CREATE TABLE IF NOT EXISTS volume_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mint TEXT NOT NULL,
    wallet_group TEXT NOT NULL,
    buy_amount REAL NOT NULL,
    sell_amount REAL NOT NULL,
    buy_sell_ratio REAL NOT NULL,
    delay_min INTEGER NOT NULL,
    delay_max INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_volume_tasks_user_id ON volume_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_volume_tasks_is_active ON volume_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_volume_tasks_mint ON volume_tasks(mint);
CREATE INDEX IF NOT EXISTS idx_volume_tasks_created_at ON volume_tasks(created_at);

-- Create volume_task_logs table for tracking task execution
CREATE TABLE IF NOT EXISTS volume_task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'buy', 'sell', 'start', 'stop', 'error'
    amount REAL DEFAULT 0,
    price REAL DEFAULT 0,
    transaction_hash TEXT DEFAULT '',
    error_message TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES volume_tasks (id) ON DELETE CASCADE
);

-- Create indexes for volume_task_logs
CREATE INDEX IF NOT EXISTS idx_volume_task_logs_task_id ON volume_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_volume_task_logs_action ON volume_task_logs(action);
CREATE INDEX IF NOT EXISTS idx_volume_task_logs_created_at ON volume_task_logs(created_at);

-- Migration: Add gas_fee and jito_tip columns for fee-aware PnL tracking

-- Add new columns to pnl_tracking table
ALTER TABLE pnl_tracking ADD COLUMN gas_fee REAL DEFAULT 0;
ALTER TABLE pnl_tracking ADD COLUMN jito_tip REAL DEFAULT 0;

-- Add new columns to trades table  
ALTER TABLE trades ADD COLUMN gas_fee REAL DEFAULT 0;
ALTER TABLE trades ADD COLUMN jito_tip REAL DEFAULT 0;

-- Update existing rows to split fees (assuming 50/50 split for historical data)
UPDATE pnl_tracking SET gas_fee = fees * 0.5, jito_tip = fees * 0.5 WHERE fees > 0;
UPDATE trades SET gas_fee = fees * 0.5, jito_tip = fees * 0.5 WHERE fees > 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pnl_fees ON pnl_tracking(gas_fee, jito_tip);
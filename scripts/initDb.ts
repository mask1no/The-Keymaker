import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function initializeDatabase() {
  console.log('🗄️  Initializing database...');
  
  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
  }

  // Open database connection
  const db = await open({
    filename: path.join(dataDir, 'keymaker.db'),
    driver: sqlite3.Database
  });

  // Check if tables exist
  const tables = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  
  const tableNames = tables.map(t => t.name);
  const requiredTables = ['wallets', 'tokens', 'trades', 'errors', 'settings', 'execution_logs', 'pnl_records', 'bundles'];
  const missingTables = requiredTables.filter(t => !tableNames.includes(t));

  if (missingTables.length === 0) {
    console.log('✅ All tables already exist');
    await db.close();
    return;
  }

  console.log(`📝 Creating ${missingTables.length} missing tables...`);

  // Read and execute init.sql
  const initSqlPath = path.join(process.cwd(), 'init.sql');
  if (!fs.existsSync(initSqlPath)) {
    console.error('❌ init.sql file not found!');
    process.exit(1);
  }

  const initSql = fs.readFileSync(initSqlPath, 'utf-8');
  
  // Split SQL statements and execute them
  const statements = initSql
    .split(';')
    .filter(stmt => stmt.trim())
    .map(stmt => stmt.trim() + ';');

  for (const statement of statements) {
    try {
      await db.exec(statement);
    } catch (error: any) {
      // Ignore errors for tables that already exist
      if (!error.message.includes('already exists')) {
        console.error(`❌ Error executing SQL: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
      }
    }
  }

  // Verify tables were created
  const newTables = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  
  console.log('✅ Database initialized successfully');
  console.log(`📊 Tables: ${newTables.map(t => t.name).join(', ')}`);

  await db.close();
}

// Run if called directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

export { initializeDatabase }; 
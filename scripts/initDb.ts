import fs from 'fs';
import path from 'path';
import { getDb } from '../lib/db/sqlite';

export async function initializeDatabase() {
  console.log('Initializing database...');
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory');
  }
  
  const db = getDb();
  const tables = db.all("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.map((t: any) => t.name as string);
  
  console.log('Database initialized successfully');
  console.log(`Tables: ${tableNames.join(', ')}`);
  
  // Apply migrations if any
  const migrationsDir = path.join(process.cwd(), 'scripts', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    console.log('Applying migrations...');
    const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of migrationFiles) {
      console.log(`-> Applying ${file}...`);
      try {
        const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        const migrationStatements = migrationSql
          .split(';')
          .filter((stmt) => stmt.trim())
          .map((stmt) => stmt.trim() + ';');
        for (const stmt of migrationStatements) {
          try {
            db.exec(stmt);
          } catch (error: any) {
            if (!String(error?.message || '').includes('duplicate column')) {
              console.error(`Migration warning: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to apply migration ${file}:`, error);
      }
    }
  }
}

if (require.main === module) {
  initializeDatabase().catch(console.error);
}
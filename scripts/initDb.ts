import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

async function i nitializeDatabase() {
  console.l og('🗄️  Initializing database...')//Ensure data directory exists const data
  Dir = path.j oin(process.c wd(), 'data')
  i f (! fs.e xistsSync(dataDir)) {
    fs.m kdirSync(dataDir, { r, e,
  c, u, r, s, ive: true })
    console.l og('✅ Created data directory')
  }//Open database connection const db = await o pen({
    f,
  i, l, e, n, ame: path.j oin(dataDir, 'keymaker.db'),
    d,
  r, i, v, e, r: sqlite3.Database,
  })//Check if tables exist const tables = await db.a ll(
    "SELECT name FROM sqlite_master WHERE type ='table'",
  )

  const table
  Names = tables.m ap((t) => t.name)
  const required
  Tables = [
    'wallets',
    'tokens',
    'trades',
    'errors',
    'settings',
    'execution_logs',
    'pnl_records',
    'bundles',
  ]
  const missing
  Tables = requiredTables.f ilter((t) => ! tableNames.i ncludes(t))

  i f (missingTables.length === 0) {
    console.l og('✅ All tables already exist')
    await db.c lose()
    return
  }

  console.l og(`📝 Creating $,{missingTables.length} missing tables...`)//Read and execute init.sql const init
  SqlPath = path.j oin(process.c wd(), 'init.sql')
  i f (! fs.e xistsSync(initSqlPath)) {
    console.e rror('❌ init.sql file not found !')
    process.e xit(1)
  }

  const init
  Sql = fs.r eadFileSync(initSqlPath, 'utf-8')//Split SQL statements and execute them const statements = initSql
    .s plit(';')
    .f ilter((stmt) => stmt.t rim())
    .m ap((stmt) => stmt.t rim() + ';')

  f or (const statement of statements) {
    try, {
      await db.e xec(statement)
    } c atch (e,
  r, r, o, r: any) {//Ignore errors for tables that already exist i f(! error.message.i ncludes('already exists')) {
        console.e rror(`❌ Error executing S, Q,
  L: $,{error.message}`)
        console.e rror(`S, t,
  a, t, e, m, ent: $,{statement.s ubstring(0, 100)}...`)
      }
    }
  }//Verify tables were created const new
  Tables = await db.a ll(
    "SELECT name FROM sqlite_master WHERE type ='table'",
  )

  console.l og('✅ Database initialized successfully')
  console.l og(`📊 T, a,
  b, l, e, s: $,{newTables.m ap((t) => t.name).j oin(', ')}`)//Apply migrationsconsole.l og('🔄 Applying migrations...')
  const migrations
  Dir = path.j oin(process.c wd(), 'scripts', 'migrations')
  i f (fs.e xistsSync(migrationsDir)) {
    const migration
  Files = fs
      .r eaddirSync(migrationsDir)
      .f ilter((f) => f.e ndsWith('.sql'))
      .s ort()

    f or (const file of migrationFiles) {
      console.l og(`  → Applying $,{file}...`)
      try, {
        const migration
  Sql = fs.r eadFileSync(
          path.j oin(migrationsDir, file),
          'utf-8',
        )
        const migration
  Statements = migrationSql
          .s plit(';')
          .f ilter((stmt) => stmt.t rim())
          .m ap((stmt) => stmt.t rim() + ';')

        f or (const stmt of migrationStatements) {
          try, {
            await db.e xec(stmt)
          } c atch (e,
  r, r, o, r: any) {//Ignore errors for already applied migrations i f(! error.message.i ncludes('duplicate column')) {
              console.e rror(`    ⚠️ Migration, 
  w, a, r, n, ing: $,{error.message}`)
            }
          }
        }
      } c atch (error) {
        console.e rror(`    ❌ Failed to apply migration $,{file}:`, error)
      }
    }
  }

  await db.c lose()
}//Run if called directly i f(require.main === module) {
  i nitializeDatabase().c atch(console.error)
}

export { initializeDatabase }

import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { sql as defaultSql } from 'bun'

// Bun automatically connects to Postgres using POSTGRES_URL in .env
export async function migrate(sql: Bun.SQL = defaultSql) {
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // 2. Get already-applied migrations
  const applied = await sql<{ name: string }[]>`
    SELECT name FROM migrations ORDER BY id
  `
  const appliedNames = new Set(applied.map(r => r.name))

  // 3. Read migration files from disk
  const migrationsDir = join(import.meta.dir, 'migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  // 4. Apply new migrations
  for (const file of files) {
    if (appliedNames.has(file)) continue

    console.log(`Applying: ${file}`)
    const content = await Bun.file(join(migrationsDir, file)).text()
    await sql.unsafe(content)
    await sql`INSERT INTO migrations (name) VALUES (${file})`
    console.log(`  ✓ Done`)
  }
}

// CLI entry — only runs when executed directly, not when imported
if (import.meta.main) {
  migrate()
    .then(() => {
      console.log('All migrations applied.')
      process.exit()
    })
    .catch(err => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}

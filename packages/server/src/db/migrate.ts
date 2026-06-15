import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { sql } from 'bun'

// Bun automatically connects to Postgres using POSTGRES_URL in .env
async function migrate() {
  // 1. Create tracking table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // 2. Get already-applied migrations
  const applied = await sql<
    { name: string }[]
  >`SELECT name FROM migrations ORDER BY id`
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

  console.log('All migrations applied.')
  process.exit()
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

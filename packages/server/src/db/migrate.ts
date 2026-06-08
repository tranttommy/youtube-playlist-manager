import { sql } from 'bun'

// Bun automatically connects to Postgres using POSTGRES_URL in .env
async function migrate() {
  const result = await sql`SELECT NOW() as time`

  console.log(result)
}


migrate()

/**
 * Database migration runner — tracks applied migrations via schema_migrations table.
 * Each migration file runs EXACTLY ONCE, even across restarts.
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'smartstore',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const migrate = async () => {
  const client = await pool.connect();
  try {
    // ── 1. Create tracking table if it doesn't exist ─────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    VARCHAR(255) PRIMARY KEY,
        applied_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    // ── 2. Find which migrations have already been applied ────────────────
    const appliedResult = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(appliedResult.rows.map((r) => r.filename));

    // ── 3. Read all .sql files in order ───────────────────────────────────
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`⏭  Skipping (already applied): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`▶  Running migration: ${file}`);
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      console.log(`✅ Done: ${file}`);
      ran++;
    }

    if (ran === 0) {
      console.log('✨ No new migrations to run.');
    } else {
      console.log(`\n🎉 ${ran} migration(s) applied successfully!`);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();

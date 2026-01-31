/**
 * Direct PostgreSQL Migration Runner
 * Run with: node scripts/apply-migrations-direct.js
 */

const { Client } = require('pg');

require('dotenv').config({ path: '/home/dev/projects/campsite/apps/campsite-backend/.env' });

// Parse DATABASE_URL to get connection details
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

// Parse postgres://user:password@host:port/database
const match = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, , user, password, host, port, database] = match;

const client = new Client({
  host,
  port: parseInt(port),
  database,
  user,
  password,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
});

const migrations = [
  {
    name: 'Create ENUMs',
    sql: `
      DO $$ BEGIN
        CREATE TYPE sync_status AS ENUM ('pending', 'processing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE import_candidate_status AS ENUM ('pending', 'approved', 'rejected', 'imported');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
  },
  {
    name: 'Create google_places_raw table',
    sql: `
      CREATE TABLE IF NOT EXISTS google_places_raw (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        place_id TEXT NOT NULL UNIQUE,
        place_hash TEXT UNIQUE,
        raw_data JSONB NOT NULL,
        data_fetched_at TIMESTAMPTZ DEFAULT NOW(),
        sync_status sync_status DEFAULT 'pending',
        processed_at TIMESTAMPTZ,
        is_imported BOOLEAN DEFAULT FALSE,
        imported_to_campsite_id UUID REFERENCES campsites(id) ON DELETE SET NULL,
        imported_at TIMESTAMPTZ,
        has_photos BOOLEAN DEFAULT FALSE,
        photo_count INT DEFAULT 0,
        has_reviews BOOLEAN DEFAULT FALSE,
        review_count INT DEFAULT 0,
        rating DECIMAL(2,1),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_google_places_raw_place_id ON google_places_raw(place_id);
      CREATE INDEX IF NOT EXISTS idx_google_places_raw_status ON google_places_raw(sync_status);
    `
  },
  {
    name: 'Create google_places_import_candidates table',
    sql: `
      CREATE TABLE IF NOT EXISTS google_places_import_candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_place_raw_id UUID NOT NULL REFERENCES google_places_raw(id) ON DELETE CASCADE,
        confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
        is_duplicate BOOLEAN DEFAULT FALSE,
        duplicate_of_campsite_id UUID REFERENCES campsites(id) ON DELETE SET NULL,
        processed_data JSONB NOT NULL,
        suggested_province_id INT REFERENCES provinces(id),
        suggested_type_id INT REFERENCES campsite_types(id),
        suggested_status campsite_status DEFAULT 'pending',
        validation_warnings JSONB DEFAULT '[]',
        missing_fields TEXT[] DEFAULT '{}',
        status import_candidate_status DEFAULT 'pending',
        reviewed_by UUID REFERENCES profiles(id),
        reviewed_at TIMESTAMPTZ,
        imported_to_campsite_id UUID REFERENCES campsites(id) ON DELETE SET NULL,
        imported_at TIMESTAMPTZ,
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_import_candidates_status ON google_places_import_candidates(status);
    `
  },
  {
    name: 'Create sync_logs table',
    sql: `
      CREATE TABLE IF NOT EXISTS sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sync_type TEXT NOT NULL DEFAULT 'google_places',
        triggered_by TEXT DEFAULT 'system',
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        duration_seconds INT,
        status sync_status NOT NULL DEFAULT 'processing',
        places_found INT DEFAULT 0,
        places_updated INT DEFAULT 0,
        photos_downloaded INT DEFAULT 0,
        reviews_fetched INT DEFAULT 0,
        api_requests_made INT DEFAULT 0,
        estimated_cost_usd DECIMAL(10,2),
        error_message TEXT,
        error_details JSONB,
        config_snapshot JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);
    `
  }
];

async function applyMigrations() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const migration of migrations) {
      try {
        console.log(`Applying: ${migration.name}...`);
        await client.query(migration.sql);
        console.log(`✅ ${migration.name}\n`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Skipped (already exists): ${migration.name}\n`);
        } else {
          console.error(`❌ Failed: ${migration.name}`);
          console.error(error.message);
          console.log('');
        }
      }
    }

    // Verify tables
    console.log('Verifying tables...');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'google_places_%' OR table_name = 'sync_logs'
      ORDER BY table_name;
    `);

    console.log('✅ Tables created:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✅ All migrations applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();

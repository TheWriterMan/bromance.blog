import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_URL || '';

if (!databaseUrl) {
  console.warn("WARNING: DATABASE_URL is not set. Database connections will fail.");
}

// Connection pool sized for serverless concurrency.
// Supabase transaction pooler requires prepare: false.
// max: 10 allows parallel queries within a single serverless invocation
// without exhausting Supabase's default 60-connection limit across instances.
export const sql = postgres(databaseUrl || 'postgresql://postgres:postgres@localhost:5432/fake', {
  prepare: false,
  max: 10,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 15,
  max_lifetime: 60 * 5, // 5 min max connection lifetime to prevent stale pooler connections
});

export const db = drizzle(sql, { schema });

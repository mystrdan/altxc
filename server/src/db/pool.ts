import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  // Fail fast - a missing DB connection string is a config error, not
  // something we want to silently limp along without.
  console.warn('DATABASE_URL is not set. Set it in server/.env before starting the app.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

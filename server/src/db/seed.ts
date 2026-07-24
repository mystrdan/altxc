/**
 * Seeds baseline data: supported markets + a default admin account.
 * Safe to re-run (uses ON CONFLICT / existence checks).
 * Run with: npm run db:seed
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './pool';

dotenv.config();

const MARKETS = [
  { name: 'Verus', symbol: 'VRSC', logo_url: '/logos/vrsc.svg' },
  { name: 'Kaspa', symbol: 'KAS', logo_url: '/logos/kas.svg' },
  { name: 'Dogecoin', symbol: 'DOGE', logo_url: '/logos/doge.svg' },
  { name: 'Litecoin', symbol: 'LTC', logo_url: '/logos/ltc.svg' },
  { name: 'Bitcoin', symbol: 'BTC', logo_url: '/logos/btc.svg' },
];

async function seedMarkets() {
  for (const m of MARKETS) {
    await pool.query(
      `INSERT INTO markets (name, symbol, logo_url, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (symbol) DO NOTHING`,
      [m.name, m.symbol, m.logo_url]
    );
  }
  console.log(`Seeded ${MARKETS.length} markets.`);
}

async function seedAdmin() {
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
  if (existing.rows.length > 0) {
    console.log('Admin user already exists, skipping.');
    return;
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash('ChangeMe123!', saltRounds);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin') RETURNING id`,
    ['admin', 'admin@altxc.local', passwordHash]
  );

  await pool.query(
    `INSERT INTO profiles (user_id) VALUES ($1)`,
    [result.rows[0].id]
  );

  console.log('Seeded default admin user -> username: admin / password: ChangeMe123!');
  console.log('CHANGE THIS PASSWORD before deploying anywhere real.');
}

async function seed() {
  await seedMarkets();
  await seedAdmin();
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

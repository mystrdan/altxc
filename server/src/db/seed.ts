import dotenv from 'dotenv';
import { pool } from './pool';

dotenv.config();

const MARKETS = [
  { name: 'Verus', symbol: 'VRSC', logoUrl: '/logos/vrsc.svg' },
  { name: 'Kaspa', symbol: 'KAS', logoUrl: '/logos/kas.svg' },
  { name: 'Dogecoin', symbol: 'DOGE', logoUrl: '/logos/doge.svg' },
  { name: 'Litecoin', symbol: 'LTC', logoUrl: '/logos/ltc.svg' },
  { name: 'Bitcoin', symbol: 'BTC', logoUrl: '/logos/btc.svg' },
];

async function seedMarkets() {
  for (const m of MARKETS) {
    await pool.query(
      `INSERT INTO markets (name, symbol, logo_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (symbol) DO NOTHING`,
      [m.name, m.symbol, m.logoUrl]
    );
  }
  console.log(`Seeded ${MARKETS.length} markets.`);
}

async function seedAdmin() {
  const existing = await pool.query(
    `SELECT id FROM users WHERE username = 'admin' LIMIT 1`
  );
  if (existing.rowCount && existing.rowCount > 0) {
    console.log('Admin user already exists, skipping.');
    return;
  }

  const bcrypt = await import('bcryptjs');
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash('ChangeMe123!', saltRounds);

  const userResult = await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ('admin', 'admin@altxc.local', $1, 'admin')
     RETURNING id`,
    [passwordHash]
  );

  await pool.query(
    `INSERT INTO profiles (user_id) VALUES ($1)`,
    [userResult.rows[0].id]
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
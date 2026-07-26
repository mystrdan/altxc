import dotenv from 'dotenv';
import { prisma } from '../db/prisma';

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
    await prisma.market.upsert({
      where: { symbol: m.symbol },
      update: {},
      create: m,
    });
  }
  console.log(`Seeded ${MARKETS.length} markets.`);
}

async function seedAdmin() {
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (existing) {
    console.log('Admin user already exists, skipping.');
    return;
  }

  const bcrypt = await import('bcryptjs');
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash('ChangeMe123!', saltRounds);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@altxc.local',
      passwordHash,
      role: 'admin',
      profile: { create: {} },
    },
  });

  console.log('Seeded default admin user -> username: admin / password: ChangeMe123!');
  console.log('CHANGE THIS PASSWORD before deploying anywhere real.');
}

async function seed() {
  await seedMarkets();
  await seedAdmin();
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
</arg_value>
</write_to_file></tool_call>
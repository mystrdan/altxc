# ALTXC

A secure peer-to-peer escrow marketplace for altcoins. **This is not a
cryptocurrency exchange** — there is no order book, spot/futures/margin
trading, staking, or swap engine. ALTXC connects two trading parties around a
public trust profile; escrow execution, wallets, and on-chain settlement are
future work built on top of this foundation.

## Project structure

```
altxc/
├── client/   React + Vite + TypeScript + Tailwind CSS frontend
├── server/   Node.js + Express + TypeScript REST API (PostgreSQL + Prisma)
├── prisma/   Prisma schema and migrations
├── docs/     Documentation (API reference, etc.)
└── README.md This file
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local install or a hosted instance)

## 1. Database

Create a database and user:

```sql
CREATE DATABASE altxc;
CREATE USER altxc_user WITH ENCRYPTED PASSWORD 'altxc_pass';
GRANT ALL PRIVILEGES ON DATABASE altxc TO altxc_user;
```

## 2. Server setup

```bash
cd server
cp .env.example .env   # then edit DATABASE_URL / JWT_SECRET
npm install
npm run db:generate    # generates the Prisma client
npm run db:migrate     # applies all migrations
npm run db:seed        # seeds markets (VRSC, KAS, DOGE, LTC, BTC) + a default admin
npm run dev             # starts the API on http://localhost:4000
```

The seed script creates an admin account:
- username: `admin`
- password: `ChangeMe123!`

**Change this password (or delete/replace the admin user) before deploying anywhere real.**

## 3. Client setup

```bash
cd client
cp .env.example .env   # VITE_API_URL defaults to http://localhost:4000/api/v1
npm install
npm run dev              # starts the app on http://localhost:5173
```

## API overview

All routes are versioned under `/api/v1`. Every response follows the same
envelope: `{ "success": true, "data": ... }` or
`{ "success": false, "error": { "message": ..., "details"?: ... } }`.

| Method | Path                              | Auth        | Description                     |
|--------|------------------------------------|-------------|----------------------------------|
| POST   | `/api/v1/auth/register`            | —           | Create an account                |
| POST   | `/api/v1/auth/login`               | —           | Log in (username or email)       |
| POST   | `/api/v1/auth/refresh`             | —           | Refresh access token             |
| POST   | `/api/v1/auth/logout`              | Bearer JWT  | Revoke refresh token             |
| POST   | `/api/v1/auth/logout-all`          | Bearer JWT  | Revoke all sessions              |
| GET    | `/api/v1/auth/me`                  | Bearer JWT  | Current authenticated user       |
| POST   | `/api/v1/auth/forgot-password`     | —           | Password reset skeleton          |
| POST   | `/api/v1/auth/reset-password`      | —           | Password reset skeleton          |
| GET    | `/api/v1/dashboard`                | Bearer JWT  | Own dashboard summary            |
| GET    | `/api/v1/profile/:username`        | —           | Public profile                   |
| PUT    | `/api/v1/profile`                  | Bearer JWT  | Update own profile               |
| POST   | `/api/v1/reports`                  | Bearer JWT  | Report a user                    |
| GET    | `/api/v1/markets`                  | —           | List supported markets           |
| GET    | `/api/v1/markets/:symbol`          | —           | Single market detail             |
| GET    | `/api/v1/listings`                 | —           | List all listings (with filters) |
| GET    | `/api/v1/listings/my`              | Bearer JWT  | Current user's listings          |
| GET    | `/api/v1/listings/:id`             | —           | Single listing detail            |
| POST   | `/api/v1/listings`                 | Bearer JWT  | Create a listing                 |
| PUT    | `/api/v1/listings/:id`             | Bearer JWT  | Update a listing (owner)         |
| DELETE | `/api/v1/listings/:id`             | Bearer JWT  | Close a listing (owner)          |
| POST   | `/api/v1/trades/request`           | Bearer JWT  | Send a trade request             |
| GET    | `/api/v1/trades/requests`          | Bearer JWT  | Get trade requests               |
| PATCH  | `/api/v1/trades/requests/:id`      | Bearer JWT  | Accept/decline a request         |
| PATCH  | `/api/v1/trades/requests/:id/cancel` | Bearer JWT | Cancel a request (buyer)        |
| GET    | `/api/v1/trades`                   | Bearer JWT  | Get user's trades                |
| GET    | `/api/v1/trades/:id`               | Bearer JWT  | Trade room details               |
| POST   | `/api/v1/trades/:id/messages`      | Bearer JWT  | Send a message                   |
| PATCH  | `/api/v1/trades/:id/status`        | Bearer JWT  | Update trade status              |
| GET    | `/api/v1/status`                   | —           | Health check                     |
| GET    | `/api/v1/admin/users`              | Admin JWT   | List users                       |
| PATCH  | `/api/v1/admin/users/:id/role`     | Admin JWT   | Change a user's role             |
| POST   | `/api/v1/admin/markets`            | Admin JWT   | Create a market                  |
| PATCH  | `/api/v1/admin/markets/:id`        | Admin JWT   | Update a market                  |
| DELETE | `/api/v1/admin/markets/:id`        | Admin JWT   | Delete a market                  |
| GET    | `/api/v1/admin/listings`           | Admin JWT   | List all listings                |
| GET    | `/api/v1/admin/reports`            | Admin JWT   | List reports                     |
| PATCH  | `/api/v1/admin/reports/:id/status` | Admin JWT   | Update a report's status         |
| GET    | `/api/v1/admin/settings`           | Admin JWT   | Placeholder platform settings    |

See [docs/API.md](docs/API.md) for full request/response examples.

## Database schema

Built with Prisma ORM on PostgreSQL. All primary keys are UUIDs.

- **users** — identity + auth (`username`, `email`, `password_hash`, `role`)
- **profiles** — 1:1 with `users`; public trading reputation (`display_name`, `trust_score`, `completed_trades`, `trade_volume_usd`, `supported_markets`, `bio`)
- **markets** — supported altcoins (`name`, `symbol`, `logo_url`, `status`)
- **listings** — buy/sell marketplace listings (`type`, `coin`, `amount`, `price`, `payment_currency`, `status`, `seller_id`, `market_id`)
- **trade_requests** — trade requests from buyers to sellers (`status`, `message`, `buyer_id`, `seller_id`, `listing_id`)
- **trades** — trade records and status (`status`, `amount`, `price`, `total_usd`, `coin`, `buyer_id`, `seller_id`, `listing_id`)
- **messages** — chat messages inside trade rooms (`content`, `sender_id`, `trade_id`)
- **reports** — user-filed reports (`reason`, `status`, `reporter_id`, `reported_user_id`)
- **sessions** — session management for auth (`refresh_token`, `expires_at`, `user_id`)

See `prisma/schema.prisma` for the full schema and `prisma/migrations/` for migrations.

## Security

- All request bodies validated with `zod` before touching the database
- Passwords hashed with bcrypt (12 salt rounds by default, configurable via `BCRYPT_SALT_ROUNDS`)
- JWT access tokens (15 min expiry by default) + refresh token rotation (30 days)
- Rate limiting on auth endpoints (20 requests per 15 minutes)
- Protected routes use JWT middleware; admin routes require the `admin` role
- CORS, helmet, and input sanitization applied

## Deployment

The project is designed for deployment on **pxxl.app**. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## Extending this foundation

The schema and API are deliberately scoped so that escrow, wallets, and
blockchain integration can be layered in later without reshaping what's
already here:

- Add escrow tables referencing `users` and `markets`, plus a matching
  `escrow.routes.ts` / `escrow.controller.ts` pair under `/api/v1/escrows`.
- Wallet balances/addresses can live in their own table keyed by `user_id`
  and `market_id`, joined in the same style as `profiles`.
- The "Trade" button on a profile is the intended entry point for the
  future trading/escrow flow.
</arg_value>
</write_to_file></tool_call>
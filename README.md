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
└── server/   Node.js + Express + TypeScript REST API (PostgreSQL)
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local install or a hosted instance)

## 1. Database

Create a database and user (adjust names/passwords as you like):

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
npm run db:migrate     # creates users, profiles, markets, reports tables
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
| POST   | `/api/v1/register`                 | —           | Create an account                |
| POST   | `/api/v1/login`                    | —           | Log in (username or email)       |
| POST   | `/api/v1/logout`                   | Bearer JWT  | Stateless logout (client discards token) |
| GET    | `/api/v1/me`                       | Bearer JWT  | Current authenticated user       |
| GET    | `/api/v1/dashboard`                | Bearer JWT  | Own dashboard summary            |
| GET    | `/api/v1/profile/:username`        | —           | Public profile                   |
| POST   | `/api/v1/reports`                  | Bearer JWT  | Report a user                    |
| GET    | `/api/v1/markets`                  | —           | List supported markets           |
| GET    | `/api/v1/markets/:symbol`          | —           | Single market detail             |
| GET    | `/api/v1/status`                   | —           | Health check                     |
| GET    | `/api/v1/admin/users`              | Admin JWT   | List users                       |
| PATCH  | `/api/v1/admin/users/:id/role`     | Admin JWT   | Change a user's role             |
| POST   | `/api/v1/admin/markets`            | Admin JWT   | Create a market                  |
| PATCH  | `/api/v1/admin/markets/:id`        | Admin JWT   | Update a market                  |
| DELETE | `/api/v1/admin/markets/:id`        | Admin JWT   | Delete a market                  |
| GET    | `/api/v1/admin/reports`            | Admin JWT   | List reports                     |
| PATCH  | `/api/v1/admin/reports/:id/status` | Admin JWT   | Update a report's status         |
| GET    | `/api/v1/admin/settings`           | Admin JWT   | Placeholder platform settings    |

## Database schema

Only four tables, intentionally normalized and minimal:

- **users** — identity + auth (`username`, `email`, `password_hash`, `role`)
- **profiles** — 1:1 with `users`; public trading reputation (`trust_score`, `completed_trades`, `trade_volume_usd`, `supported_markets`, `bio`)
- **markets** — supported altcoins (`name`, `symbol`, `logo_url`, `status`)
- **reports** — user-filed reports against other users (`reason`, `status`)

See `server/src/db/schema.sql` for the full DDL.

## Design notes

- Dark mode is the default; a light theme is available via the toggle in the navbar.
- The "Trade" button on a profile is intentionally a stub — it shows
  **"Trading module coming soon."** — since escrow/wallet logic is out of
  scope for this MVP.
- Passwords are hashed with bcrypt (12 salt rounds by default, configurable
  via `BCRYPT_SALT_ROUNDS`). JWTs are signed with `JWT_SECRET` and expire
  after `JWT_EXPIRES_IN` (7 days by default).
- All request bodies are validated with `zod` before touching the database.

## Extending this foundation

The schema and API are deliberately scoped so that escrow, wallets, and
blockchain integration can be layered in later without reshaping what's
already here:

- Add an `escrows` table referencing `users` and `markets`, plus a matching
  `escrow.routes.ts` / `escrow.controller.ts` pair under `/api/v1/escrows`.
- Wallet balances/addresses can live in their own table keyed by `user_id`
  and `market_id`, joined in the same style as `profiles`.
- The "Trade" button in `client/src/pages/Profile.tsx` is the intended entry
  point for the future trading/escrow flow — swap its placeholder notice for
  a real modal or route once that API exists.

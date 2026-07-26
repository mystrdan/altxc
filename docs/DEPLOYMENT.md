# Deployment Guide

This guide covers deploying ALTXC to **pxxl.app** with a PostgreSQL database.

## Prerequisites

- A pxxl.app account
- A PostgreSQL database (pxxl.app managed or external)

## 1. Database setup

### Option A: pxxl.app managed PostgreSQL

Create a PostgreSQL database through the pxxl.app dashboard or CLI:

```bash
npx create-db
```

This provisions a managed PostgreSQL instance and provides a `DATABASE_URL`.

### Option B: External PostgreSQL

Use any PostgreSQL 14+ provider (Supabase, Neon, AWS RDS, etc.) and obtain
a connection string.

## 2. Server deployment

### Environment variables

Set the following environment variables on your pxxl.app service:

```
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<generate-a-long-random-string>
JWT_REFRESH_SECRET=<generate-a-different-long-random-string>
JWT_EXPIRES_IN=15m
BCRYPT_SALT_ROUNDS=12
CLIENT_ORIGIN=https://<your-frontend-domain>
NODE_ENV=production
PORT=4000
```

Generate strong secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Build and deploy

```bash
cd server
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm start
```

On pxxl.app, the service will auto-detect the Node.js server and deploy it.
Ensure the service is configured to run `npm start` and listen on the
assigned `PORT`.

## 3. Client deployment

### Environment variables

Create a `.env` file or set environment variables:

```
VITE_API_URL=https://<your-backend-domain>/api/v1
```

### Build and deploy

```bash
cd client
npm install
npm run build
```

Deploy the `dist/` directory to any static hosting provider (Vercel, Netlify,
pxxl.app static hosting, etc.).

## 4. Post-deployment

1. Log in with the seeded admin account (`admin` / `ChangeMe123!`)
2. **Immediately change the admin password**
3. Verify all endpoints are responding: `GET /api/v1/status`
4. Test the full flow: register → create listing → send trade request → accept → message

## HTTPS

pxxl.app provides automatic HTTPS via Let's Encrypt. Ensure your
`CLIENT_ORIGIN` uses `https://` in production.
</arg_value>
</write_to_file></tool_call>
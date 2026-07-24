-- ALTXC database schema
-- Only the tables required for the MVP: users, profiles, markets, reports.
-- Kept intentionally normalized/minimal so escrow, wallets, and trading
-- tables can be added later via new migrations without reshaping these.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- Enumerated types -----------------------------------------------------

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'merchant', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE market_status AS ENUM ('active', 'paused', 'delisted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- users ------------------------------------------------------------------
-- Core identity + auth record. One row per account.

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       VARCHAR(30)  NOT NULL UNIQUE,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  TEXT         NOT NULL,
  role           user_role    NOT NULL DEFAULT 'user',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  last_seen_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- profiles ---------------------------------------------------------------
-- Public-facing trading reputation data, 1:1 with users.
-- Kept separate from `users` so auth data never has to be exposed
-- alongside public profile data.

CREATE TABLE IF NOT EXISTS profiles (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trust_score        NUMERIC(5,2) NOT NULL DEFAULT 0.00, -- 0.00 - 100.00
  completed_trades   INTEGER      NOT NULL DEFAULT 0,
  trade_volume_usd   NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  supported_markets  TEXT[]       NOT NULL DEFAULT '{}', -- array of market symbols
  bio                VARCHAR(280) NOT NULL DEFAULT '',
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- markets ------------------------------------------------------------------
-- Supported altcoins. No order-book / trading data - listing only.

CREATE TABLE IF NOT EXISTS markets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL,
  symbol      VARCHAR(10) NOT NULL UNIQUE,
  logo_url    TEXT,               -- placeholder URL/path until real assets exist
  status      market_status NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reports ------------------------------------------------------------------
-- Users reporting other users. No dispute workflow yet - just intake.

CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason           VARCHAR(500) NOT NULL,
  status           report_status NOT NULL DEFAULT 'open',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ,

  CONSTRAINT chk_no_self_report CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports (reported_user_id);

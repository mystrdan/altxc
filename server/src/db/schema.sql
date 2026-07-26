-- ALTXC database schema
-- Complete schema for the P2P altcoin escrow marketplace.
-- Includes all 9 models: users, profiles, markets, listings, trade_requests,
-- trades, messages, reports, sessions.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- Enumerated types -----------------------------------------------------

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'merchant', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE market_status AS ENUM ('active', 'paused', 'delisted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('buy', 'sell');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trade_request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trade_status AS ENUM ('pending', 'in_escrow', 'completed', 'cancelled', 'disputed');
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
  display_name       VARCHAR(255) NOT NULL DEFAULT '',
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

-- listings ----------------------------------------------------------------
-- Buy/sell listings created by users for a specific market/coin.

CREATE TABLE IF NOT EXISTS listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              listing_type NOT NULL,
  coin              VARCHAR(10) NOT NULL,
  amount            NUMERIC(18,8) NOT NULL,
  price             NUMERIC(18,2) NOT NULL,
  payment_currency  VARCHAR(10) NOT NULL DEFAULT 'USDT',
  status            listing_status NOT NULL DEFAULT 'open',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  seller_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings (type);
CREATE INDEX IF NOT EXISTS idx_listings_coin ON listings (coin);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_market_id ON listings (market_id);

-- trade_requests ----------------------------------------------------------
-- A buyer's request to trade against a specific listing.

CREATE TABLE IF NOT EXISTS trade_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status      trade_request_status NOT NULL DEFAULT 'pending',
  message     VARCHAR(500) NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  buyer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trade_requests_buyer_id ON trade_requests (buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_seller_id ON trade_requests (seller_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_listing_id ON trade_requests (listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON trade_requests (status);

-- trades ------------------------------------------------------------------
-- An accepted trade between buyer and seller for a listing.

CREATE TABLE IF NOT EXISTS trades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status        trade_status NOT NULL DEFAULT 'pending',
  amount        NUMERIC(18,8) NOT NULL,
  price         NUMERIC(18,2) NOT NULL,
  total_usd     NUMERIC(18,2) NOT NULL,
  coin          VARCHAR(10) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,

  buyer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id    UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON trades (buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON trades (seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_listing_id ON trades (listing_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status);

-- messages ----------------------------------------------------------------
-- Chat messages within a trade room.

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     VARCHAR(2000) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id    UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_trade_id ON messages (trade_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);

-- reports ------------------------------------------------------------------
-- Users reporting other users. No dispute workflow yet - just intake.

CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason           VARCHAR(500) NOT NULL,
  status           report_status NOT NULL DEFAULT 'open',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ,

  reporter_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT chk_no_self_report CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports (reported_user_id);

-- sessions ----------------------------------------------------------------
-- Refresh token sessions for JWT auth.

CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refresh_token  TEXT NOT NULL UNIQUE,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions (refresh_token);
export type UserRole = 'user' | 'merchant' | 'admin';
export type MarketStatus = 'active' | 'paused' | 'delisted';
export type ListingType = 'buy' | 'sell';
export type ListingStatus = 'open' | 'closed';
export type TradeRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type TradeStatus = 'pending' | 'in_escrow' | 'completed' | 'cancelled' | 'disputed';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

// ─── Raw database row types (snake_case, as stored in Postgres) ────────

export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  last_seen_at: string;
}

export interface ProfileRow {
  user_id: string;
  display_name: string;
  trust_score: string;
  completed_trades: number;
  trade_volume_usd: string;
  supported_markets: string[];
  bio: string;
  updated_at: string;
}

export interface MarketRow {
  id: string;
  name: string;
  symbol: string;
  logo_url: string | null;
  status: MarketStatus;
  created_at: string;
}

export interface ListingRow {
  id: string;
  type: ListingType;
  coin: string;
  amount: string;
  price: string;
  payment_currency: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  seller_id: string;
  market_id: string;
}

export interface TradeRequestRow {
  id: string;
  status: TradeRequestStatus;
  message: string;
  created_at: string;
  updated_at: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
}

export interface TradeRow {
  id: string;
  status: TradeStatus;
  amount: string;
  price: string;
  total_usd: string;
  coin: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
}

export interface MessageRow {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  trade_id: string;
}

export interface ReportRow {
  id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  reporter_id: string;
  reported_user_id: string;
}

export interface SessionRow {
  id: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  user_id: string;
}

// ─── Joined / response row types ───────────────────────────────────────

export interface ListingWithRelations extends ListingRow {
  seller_username: string;
  seller_role: UserRole;
  market_name: string;
  market_symbol: string;
  trade_request_count?: number;
}

export interface TradeRequestWithRelations extends TradeRequestRow {
  buyer_username: string;
  buyer_role: UserRole;
  seller_username: string;
  seller_role: UserRole;
  listing_type: ListingType;
  listing_coin: string;
  listing_amount: string;
  listing_price: string;
  market_name: string;
  market_symbol: string;
}

export interface TradeWithRelations extends TradeRow {
  buyer_username: string;
  seller_username: string;
  listing_type: ListingType;
  listing_coin: string;
  listing_amount: string;
  listing_price: string;
  market_name?: string;
  market_symbol?: string;
  message_count?: number;
}

export interface MessageWithSender extends MessageRow {
  sender_username: string;
}

// Shape attached to req.user by the auth middleware after verifying a JWT.
export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: UserRole;
}

// Every API response follows this envelope for consistency.
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
}
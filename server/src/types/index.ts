export type UserRole = 'user' | 'merchant' | 'admin';
export type MarketStatus = 'active' | 'paused' | 'delisted';
export type ListingType = 'buy' | 'sell';
export type ListingStatus = 'open' | 'closed';
export type TradeRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type TradeStatus = 'pending' | 'in_escrow' | 'completed' | 'cancelled' | 'disputed';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

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

export interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
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

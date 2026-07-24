export type UserRole = 'user' | 'merchant' | 'admin';
export type MarketStatus = 'active' | 'paused' | 'delisted';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface PublicProfile {
  username: string;
  status: UserRole;
  join_date: string;
  last_seen: string;
  trust_score: string;
  completed_trades: number;
  trade_volume_usd: string;
  supported_markets: string[];
  bio: string;
}

export interface DashboardData {
  profile: PublicProfile & { id: string; email: string };
  accountStatus: string;
  recentActivity: { type: string; message: string; timestamp: string }[];
}

export interface Market {
  id: string;
  name: string;
  symbol: string;
  logo_url: string | null;
  status: MarketStatus;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_seen_at: string;
  trust_score: string;
  completed_trades: number;
}

export interface AdminReport {
  id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  reporter_username: string;
  reported_username: string;
}

export interface ApiErrorShape {
  success: false;
  error: { message: string; details?: unknown };
}

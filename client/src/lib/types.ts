export type UserRole = 'user' | 'merchant' | 'admin';
export type MarketStatus = 'active' | 'paused' | 'delisted';
export type ListingType = 'buy' | 'sell';
export type ListingStatus = 'open' | 'closed';
export type TradeRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type TradeStatus = 'pending' | 'in_escrow' | 'completed' | 'cancelled' | 'disputed';
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface PublicProfile {
  username: string;
  displayName: string;
  status: UserRole;
  joinDate: string;
  lastSeen: string;
  trustScore: string;
  completedTrades: number;
  tradeVolumeUsd: string;
  supportedMarkets: string[];
  bio: string;
}

export interface DashboardData {
  profile: PublicProfile & { id: string; email: string };
  accountStatus: string;
  myListingsCount: number;
  pendingRequestsCount: number;
  sentRequestsCount: number;
  recentActivity: { type: string; message: string; timestamp: string }[];
}

export interface Market {
  id: string;
  name: string;
  symbol: string;
  logoUrl: string | null;
  status: MarketStatus;
  activeListings: number;
  buyerCount: number;
  sellerCount: number;
  avgMerchantRating: number | null;
  createdAt: string;
}

export interface Listing {
  id: string;
  type: ListingType;
  coin: string;
  amount: string;
  price: string;
  paymentCurrency: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  seller: { id: string; username: string; role: UserRole };
  market: { id: string; name: string; symbol: string };
  _count?: { tradeRequests: number };
}

export interface TradeRequest {
  id: string;
  status: TradeRequestStatus;
  message: string;
  createdAt: string;
  updatedAt: string;
  buyer: { id: string; username: string; role: UserRole };
  seller: { id: string; username: string; role: UserRole };
  listing: {
    id: string;
    type: ListingType;
    coin: string;
    amount: string;
    price: string;
    status: ListingStatus;
    market: { id: string; name: string; symbol: string };
  };
}

export interface Trade {
  id: string;
  status: TradeStatus;
  amount: string;
  price: string;
  totalUsd: string;
  coin: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  buyer: { id: string; username: string };
  seller: { id: string; username: string };
  listing: { id: string; type: ListingType; coin: string; amount: string; price: string };
  _count?: { messages: number };
  messages?: TradeMessage[];
}

export interface TradeMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string };
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  lastSeenAt: string;
  trustScore: string;
  completedTrades: number;
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
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { Listing, Market } from '../lib/types';
import { Badge } from '../components/Badge';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

function statusTone(status: string) {
  if (status === 'open') return 'mint' as const;
  return 'neutral' as const;
}

function typeTone(type: string) {
  if (type === 'buy') return 'amber' as const;
  return 'mint' as const;
}

export default function Listings() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);

  const typeFilter = searchParams.get('type') || '';
  const coinFilter = searchParams.get('coin') || '';
  const marketFilter = searchParams.get('marketId') || '';

  useEffect(() => {
    apiFetch<{ markets: Market[] }>('/markets')
      .then((data) => setMarkets(data.markets))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (coinFilter) params.set('coin', coinFilter);
    if (marketFilter) params.set('marketId', marketFilter);
    params.set('status', 'open');

    apiFetch<{ listings: Listing[] }>(`/listings?${params.toString()}`)
      .then((data) => setListings(data.listings))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load listings'));
  }, [typeFilter, coinFilter, marketFilter]);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Listings</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Browse open buy and sell offers from the community.
          </p>
        </div>
        {user && (
          <Link
            to="/listings/new"
            className="rounded-md bg-[color:var(--color-mint)] px-4 py-2 text-sm font-semibold text-[#08110D] hover:opacity-90 transition-opacity"
          >
            Create listing
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setFilter('type', e.target.value)}
          className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <select
          value={marketFilter}
          onChange={(e) => setFilter('marketId', e.target.value)}
          className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-sm"
        >
          <option value="">All markets</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>{m.symbol}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by coin (e.g. VRSC)"
          value={coinFilter}
          onChange={(e) => setFilter('coin', e.target.value)}
          className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-sm w-40"
        />
      </div>

      {error && <p className="mt-6 text-sm text-[color:var(--color-danger)]">{error}</p>}

      {!listings && !error && (
        <div className="mt-10 flex justify-center">
          <LogoMark className="h-8 w-8 animate-pulse" />
        </div>
      )}

      {listings && listings.length === 0 && (
        <div className="mt-10 text-center">
          <p className="text-sm text-[color:var(--color-text-muted)]">No listings found.</p>
          {user && (
            <Link
              to="/listings/new"
              className="mt-3 inline-block text-sm text-[color:var(--color-mint)] hover:underline"
            >
              Create the first listing →
            </Link>
          )}
        </div>
      )}

      {listings && listings.length > 0 && (
        <div className="mt-6 space-y-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              to={`/listings/${listing.id}`}
              className="block rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 hover:border-[color:var(--color-mint)]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge tone={typeTone(listing.type)}>{listing.type.toUpperCase()}</Badge>
                  <div>
                    <p className="font-display text-sm font-semibold">
                      {listing.type === 'sell' ? 'Selling' : 'Buying'} {listing.amount} {listing.coin}
                    </p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      {listing.price} {listing.paymentCurrency} per {listing.coin} &middot; {listing.market.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-xs text-[color:var(--color-text-muted)]">Seller</p>
                    <p className="text-sm font-mono">@{listing.seller.username}</p>
                  </div>
                  <Badge tone={statusTone(listing.status)}>{listing.status}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
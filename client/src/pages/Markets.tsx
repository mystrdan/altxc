import { useEffect, useState } from 'react';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { Market } from '../lib/types';
import { Badge, marketStatusTone } from '../components/Badge';
import { LogoMark } from '../components/Logo';

export default function Markets() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ markets: Market[] }>('/markets')
      .then((data) => setMarkets(data.markets))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load markets'));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Markets</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
        Altcoins currently supported for peer-to-peer escrow trades.
      </p>

      {error && <p className="mt-6 text-sm text-[color:var(--color-danger)]">{error}</p>}

      {!markets && !error && (
        <div className="mt-10 flex justify-center">
          <LogoMark className="h-8 w-8 animate-pulse" />
        </div>
      )}

      {markets && markets.length === 0 && (
        <p className="mt-6 text-sm text-[color:var(--color-text-muted)]">
          No markets are listed yet.
        </p>
      )}

      {markets && markets.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <div
              key={market.id}
              className="flex items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
            >
              <div className="flex items-center gap-3">
                {/* Logo placeholder: a lettered tile until real assets exist */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] font-mono text-xs font-semibold text-[color:var(--color-text-muted)]">
                  {market.symbol.slice(0, 3)}
                </div>
                <div>
                  <p className="font-display text-sm font-semibold">{market.name}</p>
                  <p className="font-mono text-xs text-[color:var(--color-text-faint)]">
                    {market.symbol}
                  </p>
                </div>
              </div>
              <Badge tone={marketStatusTone(market.status)}>{market.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

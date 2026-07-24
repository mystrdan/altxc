import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch, ApiRequestError } from '../../lib/api';
import type { Market, MarketStatus } from '../../lib/types';
import { Badge, marketStatusTone } from '../../components/Badge';

const STATUSES: MarketStatus[] = ['active', 'paused', 'delisted'];

export function AdminMarkets() {
  const [markets, setMarkets] = useState<Market[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    apiFetch<{ markets: Market[] }>('/markets')
      .then((data) => setMarkets(data.markets))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load markets'));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/admin/markets', {
        method: 'POST',
        body: JSON.stringify({ name, symbol }),
      });
      setName('');
      setSymbol('');
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to create market');
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(id: string, status: MarketStatus) {
    try {
      await apiFetch(`/admin/markets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update market');
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/admin/markets/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to delete market');
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[color:var(--color-text-muted)]" htmlFor="market-name">
            Name
          </label>
          <input
            id="market-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[color:var(--color-text-muted)]" htmlFor="market-symbol">
            Symbol
          </label>
          <input
            id="market-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
            className="w-24 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-1.5 text-sm uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-[color:var(--color-mint)] px-4 py-1.5 text-sm font-semibold text-[#08110D] disabled:opacity-50"
        >
          {creating ? 'Adding…' : 'Add market'}
        </button>
      </form>

      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}

      {!markets ? (
        <p className="text-sm text-[color:var(--color-text-muted)]">Loading markets…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[color:var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--color-surface-2)] text-xs uppercase text-[color:var(--color-text-faint)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr key={m.id} className="border-t border-[color:var(--color-border)]">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 font-mono">{m.symbol}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={m.status}
                        onChange={(e) => handleStatusChange(m.id, e.target.value as MarketStatus)}
                        className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Badge tone={marketStatusTone(m.status)}>{m.status}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs text-[color:var(--color-danger)] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { TradeRequest } from '../lib/types';
import { Badge } from '../components/Badge';
import { LogoMark } from '../components/Logo';

function statusTone(s: string) {
  if (s === 'pending') return 'amber' as const;
  if (s === 'accepted') return 'mint' as const;
  if (s === 'declined' || s === 'cancelled') return 'danger' as const;
  return 'neutral' as const;
}

export default function TradeRequests() {
  const [requests, setRequests] = useState<TradeRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  function load() {
    apiFetch<{ requests: TradeRequest[] }>(`/trades/requests?direction=${activeTab}`)
      .then((data) => setRequests(data.requests))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load requests'));
  }

  useEffect(load, [activeTab]);

  async function handleAction(id: string, action: 'accepted' | 'declined') {
    try {
      const res = await apiFetch<{ trade?: any; tradeRequest?: any; message?: string }>(`/trades/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      if (res.trade) {
        // Navigate to trade room
        window.location.href = `/trades/${res.trade.id}`;
      } else {
        load();
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to respond');
    }
  }

  async function handleCancel(id: string) {
    try {
      await apiFetch(`/trades/requests/${id}/cancel`, { method: 'PATCH' });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to cancel');
    }
  }

  if (error) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><p className="text-sm text-[color:var(--color-danger)]">{error}</p></div>;
  if (!requests) return <div className="flex min-h-[50vh] items-center justify-center"><LogoMark className="h-8 w-8 animate-pulse" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Trade Requests</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">Manage your trade requests.</p>

      <div className="mt-6 flex gap-1 border-b border-[color:var(--color-border)]">
        <button onClick={() => setActiveTab('received')} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${activeTab === 'received' ? 'border-[color:var(--color-mint)] text-[color:var(--color-text-primary)]' : 'border-transparent text-[color:var(--color-text-muted)]'}`}>Received</button>
        <button onClick={() => setActiveTab('sent')} className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${activeTab === 'sent' ? 'border-[color:var(--color-mint)] text-[color:var(--color-text-primary)]' : 'border-transparent text-[color:var(--color-text-muted)]'}`}>Sent</button>
      </div>

      {requests.length === 0 ? (
        <p className="mt-8 text-sm text-[color:var(--color-text-muted)]">No {activeTab} requests.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">@{r.buyer.username}</span>
                    {activeTab === 'received' && <span> → </span>}
                    {activeTab === 'received' && <span className="font-medium">@{r.seller.username}</span>}
                    <span className="mx-2 text-[color:var(--color-text-faint)]">·</span>
                    <span className="font-mono text-xs">{r.listing.coin} {r.listing.amount}</span>
                  </p>
                  {r.message && <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">"{r.message}"</p>}
                </div>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--color-text-faint)]">
                <span>{new Date(r.createdAt).toLocaleString()}</span>
                {r.status === 'pending' && activeTab === 'received' && (
                  <>
                    <button onClick={() => handleAction(r.id, 'accepted')} className="ml-auto rounded-md bg-[color:var(--color-mint)]/10 px-2 py-1 text-[color:var(--color-mint)] hover:underline">Accept</button>
                    <button onClick={() => handleAction(r.id, 'declined')} className="rounded-md bg-[color:var(--color-danger)]/10 px-2 py-1 text-[color:var(--color-danger)] hover:underline">Decline</button>
                  </>
                )}
                {r.status === 'pending' && activeTab === 'sent' && (
                  <button onClick={() => handleCancel(r.id)} className="ml-auto rounded-md bg-[color:var(--color-danger)]/10 px-2 py-1 text-[color:var(--color-danger)] hover:underline">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
</arg_value>
</write_to_file>
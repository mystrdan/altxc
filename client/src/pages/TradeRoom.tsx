import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { Trade, TradeMessage } from '../lib/types';
import { Badge } from '../components/Badge';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

function statusTone(s: string) {
  if (s === 'pending' || s === 'in_escrow') return 'amber' as const;
  if (s === 'completed') return 'mint' as const;
  if (s === 'disputed') return 'danger' as const;
  return 'neutral' as const;
}

export default function TradeRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function load() {
    if (!id) return;
    apiFetch<{ trade: Trade }>(`/trades/${id}`)
      .then((data) => setTrade(data.trade))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load trade'));
  }

  useEffect(load, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trade?.messages]);

  async function handleSend() {
    if (!id || !message.trim()) return;
    setSending(true);
    try {
      await apiFetch('/trades/' + id + '/messages', {
        method: 'POST',
        body: JSON.stringify({ content: message }),
      });
      setMessage('');
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!id) return;
    try {
      await apiFetch(`/trades/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update status');
    }
  }

  if (error) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><p className="text-sm text-[color:var(--color-danger)]">{error}</p></div>;
  if (!trade) return <div className="flex min-h-[50vh] items-center justify-center"><LogoMark className="h-8 w-8 animate-pulse" /></div>;

  const isBuyer = user?.id === trade.buyer.id;
  const isSeller = user?.id === trade.seller.id;
  const counterparty = isBuyer ? trade.seller : trade.buyer;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link to="/trades" className="text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-mint)]">← Back to trades</Link>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Trade Room</h1>
        <Badge tone={statusTone(trade.status)}>{trade.status}</Badge>
      </div>

      <div className="mt-6 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-[color:var(--color-text-muted)]">Buyer</dt><dd className="font-mono">@{trade.buyer.username}</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Seller</dt><dd className="font-mono">@{trade.seller.username}</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Coin</dt><dd className="font-mono">{trade.coin}</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Amount</dt><dd className="font-mono">{trade.amount} {trade.coin}</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Price</dt><dd className="font-mono">{trade.price} USDT</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Total</dt><dd className="font-mono">${Number(trade.totalUsd).toFixed(2)}</dd></div>
        </div>
      </div>

      {/* Status actions */}
      <div className="mt-4 flex gap-2">
        {trade.status === 'pending' && (
          <>
            <button onClick={() => handleStatusChange('in_escrow')} className="rounded-md bg-[color:var(--color-amber)]/10 px-3 py-1.5 text-xs font-medium text-[color:var(--color-amber)] hover:underline">Move to escrow</button>
            <button onClick={() => handleStatusChange('cancelled')} className="rounded-md bg-[color:var(--color-danger)]/10 px-3 py-1.5 text-xs font-medium text-[color:var(--color-danger)] hover:underline">Cancel trade</button>
          </>
        )}
        {trade.status === 'in_escrow' && (
          <>
            <button onClick={() => handleStatusChange('completed')} className="rounded-md bg-[color:var(--color-mint)]/10 px-3 py-1.5 text-xs font-medium text-[color:var(--color-mint)] hover:underline">Mark complete</button>
            <button onClick={() => handleStatusChange('disputed')} className="rounded-md bg-[color:var(--color-danger)]/10 px-3 py-1.5 text-xs font-medium text-[color:var(--color-danger)] hover:underline">Dispute</button>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="mt-6 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
        <h2 className="font-display text-sm font-semibold">Messages</h2>
        <div className="mt-3 h-64 space-y-2 overflow-y-auto">
          {trade.messages && trade.messages.length > 0 ? (
            trade.messages.map((msg) => (
              <div key={msg.id} className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.sender.id === user?.id ? 'ml-auto bg-[color:var(--color-mint)]/10' : 'bg-[color:var(--color-surface-2)]'}`}>
                <p className="font-mono text-xs text-[color:var(--color-text-muted)]">{msg.sender.username}</p>
                <p className="mt-1">{msg.content}</p>
                <p className="mt-1 text-xs text-[color:var(--color-text-faint)]">{new Date(msg.createdAt).toLocaleTimeString()}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--color-text-muted)]">No messages yet.</p>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-mint)]"
          />
          <button onClick={handleSend} disabled={sending || !message.trim()} className="rounded-md bg-[color:var(--color-mint)] px-4 py-2 text-sm font-semibold text-[#08110D] disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  );
}
</arg_value>
</write_to_file>
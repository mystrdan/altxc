import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { Market } from '../lib/types';
import { Field } from '../components/Field';
import { ApiRequestError as ApiErr } from '../lib/api';

export default function CreateListing() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [type, setType] = useState<'buy' | 'sell'>('sell');
  const [coin, setCoin] = useState('');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [marketId, setMarketId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<{ markets: Market[] }>('/markets')
      .then((data) => setMarkets(data.markets))
      .catch(() => {});
    if (isEdit && id) {
      apiFetch<{ listing: any }>(`/listings/${id}`)
        .then((data) => {
          const l = data.listing;
          setType(l.type);
          setCoin(l.coin);
          setAmount(String(l.amount));
          setPrice(String(l.price));
          setMarketId(l.marketId);
        })
        .catch(() => {});
    }
  }, [id, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const body = { type, coin: coin.toUpperCase(), amount: Number(amount), price: Number(price), marketId };
      if (isEdit && id) {
        await apiFetch(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/listings', { method: 'POST', body: JSON.stringify(body) });
      }
      navigate('/listings');
    } catch (err) {
      if (err instanceof ApiErr) {
        setError(err.message);
        if (Array.isArray(err.details)) {
          const mapped: Record<string, string> = {};
          for (const d of err.details as { field: string; message: string }[]) { mapped[d.field] = d.message; }
          setFieldErrors(mapped);
        }
      } else { setError('Failed to save listing'); }
    } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link to="/listings" className="text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-mint)]">← Back to listings</Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">{isEdit ? 'Edit listing' : 'Create listing'}</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <div>
          <label className="text-sm font-medium">Type</label>
          <div className="mt-1 flex gap-3">
            <button type="button" onClick={() => setType('buy')} className={`px-4 py-2 rounded-md border text-sm ${type === 'buy' ? 'border-[color:var(--color-amber)] bg-[color:var(--color-amber)]/10' : 'border-[color:var(--color-border)]'}`}>Buy</button>
            <button type="button" onClick={() => setType('sell')} className={`px-4 py-2 rounded-md border text-sm ${type === 'sell' ? 'border-[color:var(--color-mint)] bg-[color:var(--color-mint)]/10' : 'border-[color:var(--color-border)]'}`}>Sell</button>
          </div>
        </div>
        <Field label="Coin" name="coin" value={coin} onChange={(e) => setCoin(e.target.value)} error={fieldErrors.coin} required />
        <Field label="Amount" name="amount" type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} error={fieldErrors.amount} required />
        <Field label="Price (USDT per coin)" name="price" type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} error={fieldErrors.price} required />
        <div>
          <label className="text-sm font-medium text-[color:var(--color-text-primary)]">Market</label>
          <select value={marketId} onChange={(e) => setMarketId(e.target.value)} className="mt-1 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm" required>
            <option value="">Select a market</option>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.symbol} - {m.name}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
        <button type="submit" disabled={submitting} className="rounded-md bg-[color:var(--color-mint)] px-4 py-2.5 text-sm font-semibold text-[#08110D] disabled:opacity-50">{submitting ? 'Saving…' : isEdit ? 'Update listing' : 'Create listing'}</button>
      </form>
    </div>
  );
}
</arg_value>
</write_to_file>
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { Listing, Market } from '../lib/types';
import { Badge } from '../components/Badge';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

function typeTone(type: string) {
  return type === 'buy' ? 'amber' as const : 'mint' as const;
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ listing: Listing }>(`/listings/${id}`)
      .then((data) => setListing(data.listing))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load listing'));
  }, [id]);

  async function handleSendRequest() {
    if (!id) return;
    setSubmitting(true);
    try {
      await apiFetch('/trades/request', {
        method: 'POST',
        body: JSON.stringify({ listingId: id, message }),
      });
      setShowRequestForm(false);
      setMessage('');
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><p className="text-sm text-[color:var(--color-danger)]">{error}</p></div>;
  if (!listing) return <div className="flex min-h-[50vh] items-center justify-center"><LogoMark className="h-8 w-8 animate-pulse" /></div>;

  const isMyListing = user?.id === listing.seller.id;
  const totalUsd = Number(listing.amount) * Number(listing.price);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/listings" className="text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-mint)]">← Back to listings</Link>
      <div className="mt-6 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge tone={typeTone(listing.type)}>{listing.type.toUpperCase()}</Badge>
            <h1 className="font-display text-xl font-semibold">
              {listing.type === 'sell' ? 'Selling' : 'Buying'} {listing.amount} {listing.coin}
            </h1>
          </div>
          <Badge tone="neutral">{listing.status}</Badge>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-[color:var(--color-text-muted)]">Price</dt><dd className="font-mono">{listing.price} {listing.paymentCurrency}</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Amount</dt><dd className="font-mono">{listing.amount} {listing.coin}</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Total (USD)</dt><dd className="font-mono">${totalUsd.toFixed(2)}</dd></div>
          <div><dt className="text-[color:var(--color-text-muted)]">Market</dt><dd className="font-mono">{listing.market.symbol}</dd></div>
        </div>
        <div className="mt-6 border-t border-[color:var(--color-border)] pt-4">
          <p className="text-xs text-[color:var(--color-text-muted)]">Seller</p>
          <Link to={`/profile/${listing.seller.username}`} className="text-lg font-medium text-[color:var(--color-text-primary)] hover:text-[color:var(--color-mint)]">@{listing.seller.username}</Link>
        </div>
        {!isMyListing && listing.status === 'open' && (
          <div className="mt-6">
            {!showRequestForm ? (
              <button onClick={() => setShowRequestForm(true)} className="w-full rounded-md bg-[color:var(--color-mint)] px-4 py-2.5 text-sm font-semibold text-[#08110D] hover:opacity-90">Send trade request</button>
            ) : (
              <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4">
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional message to the seller" maxLength={500} rows={3} className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-mint)]" />
                <div className="mt-3 flex gap-2">
                  <button onClick={handleSendRequest} disabled={submitting} className="rounded-md bg-[color:var(--color-mint)] px-4 py-2 text-sm font-semibold text-[#08110D] disabled:opacity-50">{submitting ? 'Sending…' : 'Send request'}</button>
                  <button onClick={() => setShowRequestForm(false)} className="rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
        {isMyListing && listing.status === 'open' && (
          <button onClick={() => navigate(`/listings/${listing.id}/edit`)} className="mt-6 w-full rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[color:var(--color-mint)]/40">Edit listing</button>
        )}
      </div>
    </div>
  );
}
</arg_value>
</write_to_file>
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { PublicProfile } from '../lib/types';
import { Badge, roleTone } from '../components/Badge';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTradeNotice, setShowTradeNotice] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reason, setReason] = useState('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    setProfile(null);
    setError(null);
    apiFetch<{ profile: PublicProfile }>(`/profile/${username}`)
      .then((data) => setProfile(data.profile))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load profile'));
  }, [username]);

  async function handleReportSubmit(e: FormEvent) {
    e.preventDefault();
    setReportStatus('submitting');
    setReportError(null);
    try {
      await apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({ reportedUsername: username, reason }),
      });
      setReportStatus('sent');
      setReason('');
    } catch (err) {
      setReportStatus('error');
      setReportError(err instanceof ApiRequestError ? err.message : 'Failed to submit report');
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LogoMark className="h-8 w-8 animate-pulse" />
      </div>
    );
  }

  const isOwnProfile = user?.username.toLowerCase() === profile.username.toLowerCase();

  const stats = [
    { label: 'Trust score', value: `${Number(profile.trust_score).toFixed(1)} / 100` },
    { label: 'Completed trades', value: profile.completed_trades.toLocaleString() },
    { label: 'Trade volume', value: `$${Number(profile.trade_volume_usd).toLocaleString()}` },
    { label: 'Join date', value: formatDate(profile.join_date) },
    { label: 'Last seen', value: formatDate(profile.last_seen) },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] font-display text-lg font-semibold">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">@{profile.username}</h1>
              <Badge tone={roleTone(profile.status)}>{profile.status}</Badge>
            </div>
          </div>
        </div>

        {!isOwnProfile && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowTradeNotice(true)}
              className="rounded-md bg-[color:var(--color-mint)] px-4 py-2 text-sm font-semibold text-[#08110D] transition-opacity hover:opacity-90"
            >
              Trade
            </button>
            <button
              onClick={() => setShowReportForm((v) => !v)}
              className="rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text-primary)] transition-colors hover:border-[color:var(--color-danger)]/50 hover:text-[color:var(--color-danger)]"
            >
              Report
            </button>
          </div>
        )}
      </div>

      {showTradeNotice && (
        <p className="mt-4 rounded-md border border-[color:var(--color-amber)]/30 bg-[color:var(--color-amber)]/10 px-4 py-3 text-sm text-[color:var(--color-amber)]">
          Trading module coming soon.
        </p>
      )}

      {/* Stat grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
          >
            <p className="text-xs text-[color:var(--color-text-faint)]">{s.label}</p>
            <p className="mt-1 font-mono text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Supported markets */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[color:var(--color-text-primary)]">
          Supported markets
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.supported_markets.length > 0 ? (
            profile.supported_markets.map((m) => (
              <Badge key={m} tone="mint">
                {m}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-[color:var(--color-text-faint)]">
              No markets configured yet.
            </p>
          )}
        </div>
      </div>

      {/* Report form */}
      {showReportForm && (
        <form
          onSubmit={handleReportSubmit}
          className="mt-8 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
        >
          <h2 className="font-display text-sm font-semibold">Report @{profile.username}</h2>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={10}
            maxLength={500}
            rows={4}
            placeholder="Describe the issue (at least 10 characters)"
            className="mt-3 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-mint)]"
          />
          {reportStatus === 'error' && (
            <p className="mt-2 text-sm text-[color:var(--color-danger)]">{reportError}</p>
          )}
          {reportStatus === 'sent' ? (
            <p className="mt-3 text-sm text-[color:var(--color-mint)]">
              Report submitted. Our moderation team will review it.
            </p>
          ) : (
            <button
              type="submit"
              disabled={reportStatus === 'submitting'}
              className="mt-3 rounded-md bg-[color:var(--color-danger)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {reportStatus === 'submitting' ? 'Submitting…' : 'Submit report'}
            </button>
          )}
        </form>
      )}
    </div>
  );
}

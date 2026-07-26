import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiRequestError } from '../lib/api';
import type { DashboardData } from '../lib/types';
import { Badge, roleTone } from '../components/Badge';
import { LogoMark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>('/dashboard')
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load dashboard'));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-[color:var(--color-danger)]">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LogoMark className="h-8 w-8 animate-pulse" />
      </div>
    );
  }

  const profile = data.profile;
  const displayName = profile.displayName || profile.username;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Welcome back, {displayName}</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
        Here's a snapshot of your ALTXC account.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Profile summary */}
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 lg:col-span-1">
          <h2 className="font-display text-sm font-semibold">Profile summary</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-border)] font-display text-sm font-semibold">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">@{profile.username}</p>
              <Badge tone={roleTone(profile.status)}>{profile.status}</Badge>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[color:var(--color-text-muted)]">Trust score</dt>
              <dd className="font-mono">{Number(profile.trustScore).toFixed(1)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[color:var(--color-text-muted)]">Completed trades</dt>
              <dd className="font-mono">{profile.completedTrades}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[color:var(--color-text-muted)]">Trade volume</dt>
              <dd className="font-mono">${Number(profile.tradeVolumeUsd).toLocaleString()}</dd>
            </div>
          </dl>
          <Link
            to={`/profile/${profile.username}`}
            className="mt-5 inline-block text-sm text-[color:var(--color-mint)] hover:underline"
          >
            View public profile →
          </Link>
        </div>

        {/* Activity & Stats */}
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Account status</h2>
            <Badge tone="mint">{data.accountStatus}</Badge>
          </div>

          {/* Stats grid */}
          <div className="mt-5 grid grid-cols-3 gap-4">
            <Link
              to="/listings"
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-center hover:border-[color:var(--color-mint)]/40 transition-colors"
            >
              <p className="font-display text-xl font-semibold text-[color:var(--color-mint)]">
                {data.myListingsCount}
              </p>
              <p className="text-xs text-[color:var(--color-text-muted)]">My Listings</p>
            </Link>
            <Link
              to="/trades/requests"
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-center hover:border-[color:var(--color-amber)]/40 transition-colors"
            >
              <p className="font-display text-xl font-semibold text-[color:var(--color-amber)]">
                {data.pendingRequestsCount}
              </p>
              <p className="text-xs text-[color:var(--color-text-muted)]">Pending Requests</p>
            </Link>
            <Link
              to="/trades"
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-center hover:border-[color:var(--color-mint)]/40 transition-colors"
            >
              <p className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
                {data.sentRequestsCount}
              </p>
              <p className="text-xs text-[color:var(--color-text-muted)]">Sent Requests</p>
            </Link>
          </div>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-faint)]">
            Recent activity
          </h3>
          <ul className="mt-3 space-y-3">
            {data.recentActivity.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-b border-[color:var(--color-border)] pb-3 text-sm last:border-none last:pb-0"
              >
                <span>{item.message}</span>
                <span className="font-mono text-xs text-[color:var(--color-text-faint)]">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/listings/new"
              className="rounded-md bg-[color:var(--color-mint)] px-4 py-2 text-sm font-semibold text-[#08110D] hover:opacity-90 transition-opacity"
            >
              Create listing
            </Link>
            <Link
              to="/listings"
              className="rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[color:var(--color-mint)]/40"
            >
              Browse listings
            </Link>
            <Link
              to="/markets"
              className="rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[color:var(--color-mint)]/40"
            >
              Markets
            </Link>
            <Link
              to="/settings"
              className="rounded-md border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[color:var(--color-mint)]/40"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
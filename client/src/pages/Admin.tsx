import { useState } from 'react';
import { AdminUsers } from './admin/AdminUsers';
import { AdminMarkets } from './admin/AdminMarkets';
import { AdminReports } from './admin/AdminReports';
import { AdminSettingsTab } from './admin/AdminSettingsTab';

type Tab = 'users' | 'markets' | 'reports' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'users', label: 'Users' },
  { id: 'markets', label: 'Markets' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>('users');

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Admin</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
        Manage users, markets, and reports.
      </p>

      <div className="mt-6 flex gap-1 border-b border-[color:var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-[color:var(--color-mint)] text-[color:var(--color-text-primary)]'
                : 'border-transparent text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'users' && <AdminUsers />}
        {tab === 'markets' && <AdminMarkets />}
        {tab === 'reports' && <AdminReports />}
        {tab === 'settings' && <AdminSettingsTab />}
      </div>
    </div>
  );
}

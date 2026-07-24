import { useEffect, useState } from 'react';
import { apiFetch, ApiRequestError } from '../../lib/api';

interface PlatformSettings {
  platformName: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  note: string;
}

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ settings: PlatformSettings }>('/admin/settings')
      .then((data) => setSettings(data.settings))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load settings'));
  }, []);

  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (!settings) return <p className="text-sm text-[color:var(--color-text-muted)]">Loading settings…</p>;

  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-[color:var(--color-text-muted)]">Platform name</dt>
          <dd className="font-mono">{settings.platformName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[color:var(--color-text-muted)]">Maintenance mode</dt>
          <dd className="font-mono">{settings.maintenanceMode ? 'On' : 'Off'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[color:var(--color-text-muted)]">Registration open</dt>
          <dd className="font-mono">{settings.registrationOpen ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
      <p className="mt-5 text-xs text-[color:var(--color-text-faint)]">{settings.note}</p>
    </div>
  );
}

import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
        Account settings for @{user?.username}.
      </p>

      <div className="mt-8 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-text-muted)]">Username</dt>
            <dd className="font-mono">{user?.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-text-muted)]">Email</dt>
            <dd className="font-mono">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[color:var(--color-text-muted)]">Account type</dt>
            <dd className="font-mono">{user?.role}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-[color:var(--color-text-faint)]">
          Editable settings (password change, notification preferences, security) are planned
          for a future release.
        </p>
      </div>
    </div>
  );
}

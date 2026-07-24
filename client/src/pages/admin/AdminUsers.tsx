import { useEffect, useState } from 'react';
import { apiFetch, ApiRequestError } from '../../lib/api';
import type { AdminUser, UserRole } from '../../lib/types';

const ROLES: UserRole[] = ['user', 'merchant', 'admin'];

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    apiFetch<{ users: AdminUser[] }>('/admin/users')
      .then((data) => setUsers(data.users))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load users'));
  }

  useEffect(load, []);

  async function handleRoleChange(id: string, role: UserRole) {
    setUpdatingId(id);
    try {
      await apiFetch(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  }

  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (!users) return <p className="text-sm text-[color:var(--color-text-muted)]">Loading users…</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--color-border)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[color:var(--color-surface-2)] text-xs uppercase text-[color:var(--color-text-faint)]">
          <tr>
            <th className="px-4 py-3 font-medium">Username</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Trust score</th>
            <th className="px-4 py-3 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-[color:var(--color-border)]">
              <td className="px-4 py-3 font-medium">@{u.username}</td>
              <td className="px-4 py-3 font-mono text-xs text-[color:var(--color-text-muted)]">
                {u.email}
              </td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  disabled={updatingId === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                  className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 text-xs"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 font-mono">{Number(u.trust_score).toFixed(1)}</td>
              <td className="px-4 py-3 text-[color:var(--color-text-muted)]">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

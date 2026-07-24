import { useEffect, useState } from 'react';
import { apiFetch, ApiRequestError } from '../../lib/api';
import type { AdminReport, ReportStatus } from '../../lib/types';
import { Badge } from '../../components/Badge';

const STATUSES: ReportStatus[] = ['open', 'reviewing', 'resolved', 'dismissed'];

function statusTone(status: ReportStatus) {
  if (status === 'open') return 'danger' as const;
  if (status === 'reviewing') return 'amber' as const;
  if (status === 'resolved') return 'mint' as const;
  return 'neutral' as const;
}

export function AdminReports() {
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiFetch<{ reports: AdminReport[] }>('/admin/reports')
      .then((data) => setReports(data.reports))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Failed to load reports'));
  }

  useEffect(load, []);

  async function handleStatusChange(id: string, status: ReportStatus) {
    try {
      await apiFetch(`/admin/reports/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Failed to update report');
    }
  }

  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (!reports) return <p className="text-sm text-[color:var(--color-text-muted)]">Loading reports…</p>;
  if (reports.length === 0)
    return <p className="text-sm text-[color:var(--color-text-muted)]">No reports filed yet.</p>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              <span className="font-medium">@{r.reporter_username}</span>{' '}
              <span className="text-[color:var(--color-text-muted)]">reported</span>{' '}
              <span className="font-medium">@{r.reported_username}</span>
            </p>
            <Badge tone={statusTone(r.status)}>{r.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">{r.reason}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-xs text-[color:var(--color-text-faint)]">
              {new Date(r.created_at).toLocaleString()}
            </span>
            <select
              value={r.status}
              onChange={(e) => handleStatusChange(r.id, e.target.value as ReportStatus)}
              className="ml-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

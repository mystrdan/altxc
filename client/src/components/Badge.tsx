import type { ReactNode } from 'react';

type Tone = 'mint' | 'amber' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  mint: 'bg-[color:var(--color-mint)]/10 text-[color:var(--color-mint)] border-[color:var(--color-mint)]/30',
  amber: 'bg-[color:var(--color-amber)]/10 text-[color:var(--color-amber)] border-[color:var(--color-amber)]/30',
  danger: 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] border-[color:var(--color-danger)]/30',
  neutral:
    'bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)] border-[color:var(--color-border)]',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function roleTone(role: string): Tone {
  if (role === 'admin') return 'amber';
  if (role === 'merchant') return 'mint';
  return 'neutral';
}

export function marketStatusTone(status: string): Tone {
  if (status === 'active') return 'mint';
  if (status === 'paused') return 'amber';
  return 'danger';
}

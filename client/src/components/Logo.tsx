/**
 * ALTXC's signature mark: two nodes (the two trading parties) joined by a
 * link with a lock at the midpoint (the escrow holding the trade). This
 * shape recurs as the loading/empty-state motif throughout the app.
 */
export function LogoMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="6" cy="16" r="4" stroke="var(--color-mint)" strokeWidth="2" />
      <circle cx="26" cy="16" r="4" stroke="var(--color-mint)" strokeWidth="2" />
      <line x1="10" y1="16" x2="12.5" y2="16" stroke="var(--color-text-faint)" strokeWidth="2" />
      <line x1="19.5" y1="16" x2="22" y2="16" stroke="var(--color-text-faint)" strokeWidth="2" />
      <rect x="12.5" y="12.5" width="7" height="7" rx="1.5" fill="var(--color-amber)" />
      <rect x="14.5" y="10.5" width="3" height="4" rx="1.5" stroke="var(--color-amber)" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-display font-semibold tracking-tight text-[color:var(--color-text-primary)]">
        ALTXC
      </span>
    </span>
  );
}

import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Logo';

const steps = [
  {
    label: 'Match',
    detail: 'Find a counterparty by market, reputation, and trade history.',
  },
  {
    label: 'Hold',
    detail: 'Funds are held by escrow while both sides confirm the terms.',
  },
  {
    label: 'Release',
    detail: 'Once both sides confirm, the trade settles and reputations update.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-mono text-[color:var(--color-text-muted)]">
            <LogoMark className="h-3.5 w-3.5" />
            Peer-to-peer. Escrow-held. Not an exchange.
          </div>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Trade altcoins directly with people you can{' '}
            <span className="text-[color:var(--color-mint)]">verify</span>.
          </h1>
          <p className="max-w-xl text-base text-[color:var(--color-text-muted)] sm:text-lg">
            ALTXC connects two parties, holds the trade in escrow, and settles it once both
            sides confirm — no order book, no spot engine, just a trust layer for altcoin
            trades.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-md bg-[color:var(--color-mint)] px-5 py-2.5 text-sm font-semibold text-[#08110D] transition-opacity hover:opacity-90"
            >
              Create an account
            </Link>
            <Link
              to="/markets"
              className="rounded-md border border-[color:var(--color-border)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-text-primary)] transition-colors hover:border-[color:var(--color-mint)]/40"
            >
              Browse markets
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-xl font-semibold">How a trade is held</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.label}
                className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-5"
              >
                <span className="font-mono text-xs text-[color:var(--color-amber)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 font-display text-base font-semibold">{step.label}</h3>
                <p className="mt-1.5 text-sm text-[color:var(--color-text-muted)]">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[color:var(--color-text-faint)]">
            Escrow execution, wallets, and on-chain settlement are on the roadmap — this MVP
            covers accounts, profiles, and market listings.
          </p>
        </div>
      </section>

      {/* Trust signal strip */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-semibold text-[color:var(--color-mint)]">
              Trust score
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Every profile carries a public trust score built from completed trade history.
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-[color:var(--color-amber)]">
              Escrow-first
            </p>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Funds sit with a neutral third party until both sides confirm — never a
              handshake deal.
            </p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold">Reportable</p>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Bad actors can be flagged from any profile, feeding directly into moderation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

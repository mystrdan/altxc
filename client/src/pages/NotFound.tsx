import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <LogoMark className="h-10 w-10 opacity-50" />
      <h1 className="font-display text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-[color:var(--color-text-muted)]">
        The link doesn&apos;t match anything with an active connection.
      </p>
      <Link
        to="/"
        className="rounded-md bg-[color:var(--color-mint)] px-4 py-2 text-sm font-semibold text-[#08110D] hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}

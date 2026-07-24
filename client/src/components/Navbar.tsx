import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-[color:var(--color-text-primary)]'
      : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]'
  }`;

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="ALTXC home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/markets" className={navLinkClass}>
            Markets
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={`/profile/${user.username}`}
                className="hidden text-sm font-mono text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] sm:inline"
              >
                @{user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors hover:border-[color:var(--color-danger)]/50 hover:text-[color:var(--color-danger)]"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-2)]"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-[color:var(--color-mint)] px-3 py-1.5 text-sm font-semibold text-[#08110D] transition-opacity hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

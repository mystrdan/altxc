import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field } from '../components/Field';
import { ApiRequestError } from '../lib/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        if (Array.isArray(err.details)) {
          const mapped: Record<string, string> = {};
          for (const d of err.details as { field: string; message: string }[]) {
            mapped[d.field] = d.message;
          }
          setFieldErrors(mapped);
        }
      } else {
        setError('Unable to register');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
        Join ALTXC to browse markets and build a trade reputation.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        <Field
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={fieldErrors.username}
          required
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />
        <p className="-mt-3 text-xs text-[color:var(--color-text-faint)]">
          At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>

        {error && (
          <p role="alert" className="text-sm text-[color:var(--color-danger)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[color:var(--color-mint)] px-4 py-2.5 text-sm font-semibold text-[#08110D] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[color:var(--color-text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[color:var(--color-mint)] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

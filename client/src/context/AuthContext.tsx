import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, getToken, setToken, clearToken, getRefreshToken, setRefreshToken, clearRefreshToken } from '../lib/api';
import type { AuthUser } from '../lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch<{ user: AuthUser }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => {
        clearToken();
        clearRefreshToken();
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const data = await apiFetch<{ token: string; refreshToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  }

  async function register(username: string, email: string, password: string) {
    const data = await apiFetch<{ token: string; refreshToken: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    const refreshToken = getRefreshToken();
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore errors on logout
    } finally {
      clearToken();
      clearRefreshToken();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
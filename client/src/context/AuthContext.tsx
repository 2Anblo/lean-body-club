import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api';
import type { SignUpInput, User, UserPatch } from '../types';

type Status = 'loading' | 'signedIn' | 'signedOut';

interface AuthValue {
  user: User | null;
  status: Status;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<void>;
  signOut(): Promise<void>;
  updateUser(patch: UserPatch): Promise<User>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>(() => (getToken() ? 'loading' : 'signedOut'));

  // Restore the session after a page refresh.
  useEffect(() => {
    if (!getToken()) return;
    let alive = true;
    api
      .me()
      .then((u) => {
        if (!alive) return;
        setUser(u);
        setStatus('signedIn');
      })
      .catch(() => {
        clearToken();
        if (!alive) return;
        setUser(null);
        setStatus('signedOut');
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      status,
      async signIn(email, password) {
        const session = await api.signIn(email, password);
        setToken(session.token);
        setUser(session.user);
        setStatus('signedIn');
      },
      async signUp(input) {
        const session = await api.signUp(input);
        setToken(session.token);
        setUser(session.user);
        setStatus('signedIn');
      },
      async signOut() {
        try {
          await api.signOut();
        } catch {
          /* sign out locally even if the server call fails */
        } finally {
          clearToken();
          setUser(null);
          setStatus('signedOut');
        }
      },
      async updateUser(patch) {
        const updated = await api.updateMe(patch);
        setUser(updated);
        return updated;
      },
    }),
    [user, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

/** For pages behind <RequireAuth>, where a user always exists. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useCurrentUser called without a signed-in user');
  return user;
}

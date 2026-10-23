import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, type Session } from '../api/client';

const KEY = 'losode.session';

/** "Remember me" keeps the session in localStorage; otherwise it ends with the browser tab. */
function readSession(): Session | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch {
      // Storage can be blocked (private mode, disabled cookies); fall through to signed out.
    }
  }
  return null;
}

function writeSession(session: Session | null, remember = false) {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      storage.removeItem(KEY);
    } catch {
      // Ignore blocked storage.
    }
  }
  if (!session) return;
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
  } catch {
    // The session still lives in memory for this visit.
  }
}

interface AuthValue {
  session: Session | null;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signInWith: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const s = await api.signIn(email, password);
    writeSession(s, remember);
    setSession(s);
  }, []);

  const signInWith = useCallback(async (provider: 'google' | 'apple') => {
    const s = await api.signInWith(provider);
    writeSession(s, true);
    setSession(s);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, signIn, signInWith, signOut }), [session, signIn, signInWith, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Sends signed-out visitors to /login, remembering where they were going. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

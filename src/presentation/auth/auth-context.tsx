import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Actor } from '../../domain/models/actor';
import { BecomeProviderResult, BecomeProviderUseCase } from '../../application/use-cases/become-provider';
import { RestoreSessionUseCase } from '../../application/use-cases/restore-session';
import { SignInResult, SignInUseCase } from '../../application/use-cases/sign-in';
import { SignOutUseCase } from '../../application/use-cases/sign-out';
import { SignUpResult, SignUpUseCase } from '../../application/use-cases/sign-up';
import { AuthApiGateway } from '../../infrastructure/api/auth-api-gateway';
import { SecureSessionStorage } from '../../infrastructure/storage/secure-session-storage';

// 'loading' is its own state, not `actor === null`, because "don't know yet" and "signed out"
// need different UI: the first shows a splash screen, the second shows the login form. This
// is the state that prevents the login flicker Cerca.md calls out.
type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  actor: Actor | null;
  // Nothing read this before US-03: every earlier screen only ever called *public* endpoints.
  // Publishing needs `Authorization: Bearer <accessToken>`, so this is the first thing exposing
  // it — deliberately just the current token, not a refresh interceptor (the access token is
  // short-lived, 15 min; a 401 mid-wizard surfaces as "vuelve a iniciar sesión", not a silent
  // retry — see US-03-PUBLISH-LISTING.md for why that's a documented gap, not an oversight).
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  becomeProvider: () => Promise<BecomeProviderResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Composition root: the one spot allowed to know that AuthGateway is really HTTP and
// SessionStorage is really SecureStore. Use cases and domain never import from
// infrastructure directly — this function is what wires the concrete pieces together.
function createAuthUseCases() {
  const authGateway = new AuthApiGateway();
  const sessionStorage = new SecureSessionStorage();
  return {
    sessionStorage,
    signIn: new SignInUseCase(authGateway, sessionStorage),
    signUp: new SignUpUseCase(authGateway, sessionStorage),
    restoreSession: new RestoreSessionUseCase(sessionStorage),
    signOut: new SignOutUseCase(authGateway, sessionStorage),
    becomeProvider: new BecomeProviderUseCase(authGateway, sessionStorage),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const useCases = useMemo(createAuthUseCases, []);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [actor, setActor] = useState<Actor | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Runs exactly once, on mount, before the app shows any route. Whatever this finds decides
  // whether the first screen the user sees is the home tab or the sign-in form.
  useEffect(() => {
    let cancelled = false;
    useCases.restoreSession.execute().then((session) => {
      if (cancelled) return;
      setActor(session?.actor ?? null);
      setAccessToken(session?.accessToken ?? null);
      setStatus(session ? 'signedIn' : 'signedOut');
    });
    return () => {
      cancelled = true;
    };
  }, [useCases]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      actor,
      accessToken,
      async signIn(email, password) {
        const result = await useCases.signIn.execute(email, password);
        if (result.ok) {
          setActor(result.actor);
          // SignInUseCase already persisted the session; re-reading it here is the cheapest
          // way to get the token into state without changing SignInResult's shape (nothing
          // else that already depends on it needs to know a token exists).
          const session = await useCases.sessionStorage.load();
          setAccessToken(session?.accessToken ?? null);
          setStatus('signedIn');
        }
        return result;
      },
      async signUp(email, password, displayName) {
        const result = await useCases.signUp.execute(email, password, displayName);
        if (result.ok) {
          setActor(result.actor);
          const session = await useCases.sessionStorage.load();
          setAccessToken(session?.accessToken ?? null);
          setStatus('signedIn');
        }
        return result;
      },
      async signOut() {
        await useCases.signOut.execute();
        setActor(null);
        setAccessToken(null);
        setStatus('signedOut');
      },
      async becomeProvider() {
        const result = await useCases.becomeProvider.execute();
        if (result.ok) {
          setActor(result.actor);
          // BecomeProviderUseCase already rotated the session (the old access token's
          // capacities claim is stale the moment the new one is granted) — pick up the fresh
          // token here the same way signIn/signUp do, or the very next authenticated call
          // would still carry the pre-provider token.
          const session = await useCases.sessionStorage.load();
          setAccessToken(session?.accessToken ?? null);
        }
        return result;
      },
    }),
    [status, actor, accessToken, useCases],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be called from a component rendered inside <AuthProvider>.');
  }
  return context;
}

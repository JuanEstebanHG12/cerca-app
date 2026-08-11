import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Actor } from '../../domain/models/actor';
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
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Composition root: the one spot allowed to know that AuthGateway is really HTTP and
// SessionStorage is really SecureStore. Use cases and domain never import from
// infrastructure directly — this function is what wires the concrete pieces together.
function createAuthUseCases() {
  const authGateway = new AuthApiGateway();
  const sessionStorage = new SecureSessionStorage();
  return {
    signIn: new SignInUseCase(authGateway, sessionStorage),
    signUp: new SignUpUseCase(authGateway, sessionStorage),
    restoreSession: new RestoreSessionUseCase(sessionStorage),
    signOut: new SignOutUseCase(authGateway, sessionStorage),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const useCases = useMemo(createAuthUseCases, []);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [actor, setActor] = useState<Actor | null>(null);

  // Runs exactly once, on mount, before the app shows any route. Whatever this finds decides
  // whether the first screen the user sees is the home tab or the sign-in form.
  useEffect(() => {
    let cancelled = false;
    useCases.restoreSession.execute().then((session) => {
      if (cancelled) return;
      setActor(session?.actor ?? null);
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
      async signIn(email, password) {
        const result = await useCases.signIn.execute(email, password);
        if (result.ok) {
          setActor(result.actor);
          setStatus('signedIn');
        }
        return result;
      },
      async signUp(email, password, displayName) {
        const result = await useCases.signUp.execute(email, password, displayName);
        if (result.ok) {
          setActor(result.actor);
          setStatus('signedIn');
        }
        return result;
      },
      async signOut() {
        await useCases.signOut.execute();
        setActor(null);
        setStatus('signedOut');
      },
    }),
    [status, actor, useCases],
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

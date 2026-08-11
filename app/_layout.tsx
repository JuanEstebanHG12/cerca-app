import { useEffect } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../src/presentation/auth/auth-context';

// Keep the native splash screen up until we know whether a session exists. Without this, the
// very first frame would render before RestoreSessionUseCase resolves — the "parpadeo de
// login" Cerca.md explicitly calls out as a bug, not a nitpick.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    // The native splash screen is still covering the app; there's nothing to draw underneath.
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Stack.Protected mounts exactly one of these groups depending on the guard — this
          is the single place that decides "no session → login" for every route at once,
          instead of every screen checking auth state on its own. */}
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

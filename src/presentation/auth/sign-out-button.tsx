import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useAuth } from './auth-context';
import { Button } from '../components/button';

export function SignOutButton() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handlePress() {
    setIsSigningOut(true);
    await signOut();
    // No `finally` reset: once signOut resolves, Stack.Protected unmounts this screen anyway.
  }

  return (
    <Button
      label="Cerrar sesión"
      onPress={handlePress}
      loading={isSigningOut}
      variant="secondary"
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 12, minWidth: 160 },
});

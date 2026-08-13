import * as SecureStore from 'expo-secure-store';
import { SessionStorage } from '../../application/ports/session-storage';
import { StoredSession, storedSessionSchema } from '../../domain/models/session';

// SecureStore is backed by Keystore on Android and Keychain on iOS — encrypted, sandboxed to
// this app, and NOT readable by extracting the app bundle. AsyncStorage is plain unencrypted
// disk, fine for UI preferences, never for tokens (Cerca.md: "en el móvil no hay secretos").
const SESSION_KEY = 'cerca.session';

export class SecureSessionStorage implements SessionStorage {
  async save(session: StoredSession): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  }

  async load(): Promise<StoredSession | null> {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (raw === null) return null;

    // Defensive: validate what comes back from disk too. If a previous app version wrote a
    // different shape — e.g. one saved before `email` was added here — treat it as "no
    // session" instead of crashing the whole app at boot; the person just signs in again.
    const parsed = storedSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  }

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

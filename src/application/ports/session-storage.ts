import { StoredSession } from '../../domain/models/session';

// Port: speaks in domain terms ("save/load/clear a session"), not in storage terms
// ("get/set a string by key"). If the port were `get(key): string`, every use case that
// touched it would need to know the storage key name and do its own JSON.parse — a leaky
// abstraction. The adapter (SecureSessionStorage) hides expo-secure-store and serialization
// behind this interface, so swapping storage later never touches application or domain code.
export interface SessionStorage {
  save(session: StoredSession): Promise<void>;
  load(): Promise<StoredSession | null>;
  clear(): Promise<void>;
}

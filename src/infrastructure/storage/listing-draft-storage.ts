import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { DraftStorage } from '../../application/ports/listing-draft-storage';

const DRAFT_KEY = 'cerca.publish-draft';

// AsyncStorage, not SecureStore: a draft is unsaved form input, not the session token — plain
// unencrypted disk is the right tier for it (Cerca.md's secrecy rule is about credentials,
// not every persisted value).
export class ListingDraftStorage<T> implements DraftStorage<T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  async save(draft: T): Promise<void> {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  async load(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (raw === null) return null;

    // Defensive, same as SecureSessionStorage: a draft shape from a previous app version
    // shouldn't crash the wizard, just look like "no draft".
    const parsed = this.schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(DRAFT_KEY);
  }
}

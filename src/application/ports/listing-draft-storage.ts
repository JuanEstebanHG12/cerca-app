// Port over the device's non-secret local storage. A publish draft is form-in-progress data,
// not a secret (unlike Session — that's SecureStore, this deliberately isn't): losing it on
// reinstall is fine, but surviving an app close/reopen mid-wizard is the whole point (Cerca.md
// US-03: "el borrador se puede retomar"). Generic over T so this port isn't listing-specific
// plumbing repeated for every future draftable form.
export interface DraftStorage<T> {
  load(): Promise<T | null>;
  save(draft: T): Promise<void>;
  clear(): Promise<void>;
}

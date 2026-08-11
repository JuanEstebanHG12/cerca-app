import { Session } from '../../domain/models/session';
import { SessionStorage } from '../ports/session-storage';

// Runs once, at app boot, before anything is rendered. This is what makes "session survives
// a restart" true: read what's on disk and let the caller decide the initial route from it.
export class RestoreSessionUseCase {
  constructor(private readonly sessionStorage: SessionStorage) {}

  execute(): Promise<Session | null> {
    return this.sessionStorage.load();
  }
}

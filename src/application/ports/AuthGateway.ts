import { Actor, Capacity } from '../../domain/actor';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  actor: Actor;
}

export interface AuthGateway {
  signUp(email: string, name: string): Promise<AuthResponse>;
  signIn(email: string): Promise<AuthResponse>;
  refreshToken(token: string): Promise<AuthResponse>;
  signOut(): Promise<void>;
  getMe(): Promise<Actor>;
  addProviderCapacity(): Promise<Actor>;
  toggleCapacity(capacity: Capacity): Promise<Actor>;
}

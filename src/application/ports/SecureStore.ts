// Este es el PUERTO: Solo un contrato que dice QUÉ se necesita hacer.
export interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}
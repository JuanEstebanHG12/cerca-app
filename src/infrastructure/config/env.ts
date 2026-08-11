// Only EXPO_PUBLIC_* variables get inlined into the JS bundle by Expo; anything else in
// .env is invisible to the app at runtime. That's fine here — a base URL isn't a secret,
// unlike the tokens in Session, which never touch an env var or AsyncStorage.
//
// "localhost" means different things depending on where the app runs:
//   - iOS simulator: localhost IS the host machine, works as-is.
//   - Android emulator: localhost is the emulator itself, not your PC. Use 10.0.2.2 instead.
//   - Physical device (Expo Go / dev build): needs your machine's LAN IP, e.g. 192.168.1.23.
// Override per environment with a gitignored .env.local instead of editing this file.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3333/v1';

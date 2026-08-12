# Cerca — mobile app

React Native / Expo client for Cerca, a two-sided local-services marketplace. This repo is
consumption-only: it talks to the existing Cerca API, it does not implement it.

## Setup

```bash
pnpm install
pnpm start        # expo start
pnpm android       # expo run:android
pnpm ios           # expo run:ios
```

### Environment variables

| Variable | Default | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:3333/v1` | Only `EXPO_PUBLIC_*` vars are inlined into the bundle. Android emulator: use `10.0.2.2` instead of `localhost`. Physical device: use your machine's LAN IP. Override via a gitignored `.env.local`. |

### Backend data

The Home/search screen has nothing to show against an empty database. From `cerca-api`, run:

```bash
pnpm db:seed
```

This **truncates and reseeds** `cerca-api`'s database: 40 categories, ~14 users, and 2000
listings scattered around five Colombian cities (Bogotá, Medellín, Cali, Barranquilla,
Cartagena). It also wipes any existing session/user — sign back in with one of the seeded
accounts (password `Password123!` for all of them):

- `customer@cerca.app`
- `provider@cerca.app`
- `moderator@cerca.app`
- `admin@cerca.app`

Search only returns results near those five cities; testing from elsewhere legitimately shows
the empty state, not an error.

## Architecture

Clean Architecture, dependencies point inward, enforced by `eslint.config.js`
(`import/no-restricted-paths`):

```
app/                    # Expo Router routes (thin — compose src/presentation)
src/
├── domain/              # entities, zod schemas, pure errors — no React, no fetch
├── application/         # use cases + ports (interfaces domain/infra talk through)
├── infrastructure/       # AuthApiGateway, ListingApiGateway, ExpoLocationProvider, SecureStore — implement the ports
└── presentation/         # screens, components, hooks, theme, navigation
```

Each feature wires its own composition root (e.g. `AuthProvider`, `use-search-listings.ts`)
that constructs the concrete gateway/storage implementations and hands the use case to the UI.

## State management

- **Server state:** TanStack Query. Cache keys are hierarchical
  (`src/presentation/listings/listing-keys.ts`); geolocated search keys snap coordinates to a
  ~1km grid (`snapToGrid`) before they enter the key, so panning slightly reuses the cached
  page instead of triggering a refetch.
- **Auth/session state:** React context (`src/presentation/auth/auth-context.tsx`), session
  persisted via `expo-secure-store`, restored once at boot before any route renders.
- **Local UI state:** plain `useState`/`useEffect` — no global client-state library, on
  purpose, since so far there's nothing that needs one.

## Features

| Screen | Status | Notes |
|---|---|---|
| Sign in / sign up | Done (US-01) | Session persists across restarts; no login flicker on boot. |
| Home / search | Done (US-02) | Geolocated `GET /listings`, debounced text query, category + radius filters, cursor pagination via `useInfiniteQuery`, virtualized `FlatList`. Four states covered: loading skeleton, error + retry, empty-initial (widen radius), empty-by-filter (clear filters / widen radius). Verified on a physical Android device (Expo Go SDK 57) against seeded data. |

### Known gaps (tracked, not silently dropped)

- **No interactive map.** The search is location + list only; there's no draggable map view
  yet (would need `react-native-maps` + a Google Maps API key on Android). The cache-key
  design (`snapToGrid`) is already map-ready — a map view can reuse `useSearchListings` as-is.
- **Location permission denied** currently shows an inline retry, not the city-picker fallback
  (that's US-08, out of scope for this task).
- **No listing detail screen yet** (`app/(app)/listings/[id].tsx` from the target route tree)
  — cards are display-only for now.
- **No i18n library wired in yet.** UI copy is hardcoded Spanish, consistent with the existing
  auth screens; `Intl` is used directly for money/rating/distance formatting.
- **`cerca-app` hand-mirrors `@cerca/contract` instead of importing it.** The two repos aren't a
  monorepo, so the search-result Zod schema (`src/domain/models/listing.ts`, `money.ts`) is a
  manually kept copy of the backend's real contract, not a shared import. It already drifted
  once — see [US-02-HOME-SEARCH.md §6](US-02-HOME-SEARCH.md#6-incidente-post-entrega-el-schema-del-front-no-coincidía-con-el-contrato-real)
  — and can drift again silently since nothing enforces the two staying in sync.

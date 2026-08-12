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

### Publishing a listing

Requires the 'provider' capacity, which the app grants in-flow (tap "Publicar" → "Convertirme
en proveedor" if you signed in as a plain customer) — `provider@cerca.app` already has it from
the seed. Access tokens bake in capacities at issue time (see
[US-03-PUBLISH-LISTING.md §2](US-03-PUBLISH-LISTING.md#2-el-contrato-real-verificado-dos-veces)),
so becoming a provider triggers a token refresh automatically; nothing to do manually.

There's no photo upload — the backend doesn't implement `photos:presign` yet (verified against
the real `cerca-api` source, not assumed from the product doc). The wizard is 3 steps, not 4.

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
| Publish a listing | Done (US-03), no photos | 3-step wizard (basics → pricing → location), single RHF form, resumable local draft, `POST /listings` + `POST /listings/:id/publish`. "Become a provider" flow included (`POST /me/capacities/provider` + token refresh — see [US-03-PUBLISH-LISTING.md §2](US-03-PUBLISH-LISTING.md#2-el-contrato-real-verificado-dos-veces)). Verified end-to-end against the real API (all three pricing models); not yet tested on a physical device. |
| Locale-aware price & distance | Done (US-07) | `formatMoney`/`formatDistance` driven by the device locale (`expo-localization`'s `useLocales()`, reactive to an OS language change mid-session), wired into the real listing card (not just a demo) plus a standalone `/locale-preview` screen that renders the same `Money`/distance side by side in `es-MX`, `en-US`, `de-DE`. Distance switches to miles for the US/Liberia/Myanmar region set. |
| Location fallback | Done (US-08) | `useSearchOrigin` wraps the existing `useLocation`/`GetCurrentLocationUseCase` (no second expo-location wrapper) and adds a `needs-city` phase: denying the permission (or no GPS fix) replaces the search results with `<CityPicker>` over six seeded cities, and picking one searches from that city's centroid instead of a blank screen. Also reachable standalone at `/location-demo`. |

### Known gaps (tracked, not silently dropped)

- **No interactive map.** The search is location + list only; there's no draggable map view
  yet (would need `react-native-maps` + a Google Maps API key on Android). The cache-key
  design (`snapToGrid`) is already map-ready — a map view can reuse `useSearchListings` as-is.
- **No listing detail screen yet** (`app/(app)/listings/[id].tsx` from the target route tree)
  — cards are display-only for now.
- **No photo upload.** `cerca-api` has a `ListingPhoto` table but no route/use-case that uses
  it — no `photos:presign`, nothing. The publish wizard is 3 steps, not 4, until that exists.
- **No "My Listings" screen.** Resuming a draft is local (the in-progress form autosaves to
  `AsyncStorage` and restores on reopen) — there's no server-backed listing management screen
  yet; that's US-04's scope (editing your own listings).
- **No silent access-token refresh.** The app reads the current access token once per
  sign-in/sign-up/become-provider and holds it in memory; a request made after the 15-minute
  token TTL expires surfaces as a session error, not a transparent retry. The one place this
  was actually load-bearing (right after becoming a provider) is handled explicitly — see
  [US-03-PUBLISH-LISTING.md §4.3](US-03-PUBLISH-LISTING.md#43-becomeprovider-no-es-una-llamada-son-dos).
- **No i18n library wired in yet.** UI copy is hardcoded Spanish, consistent with the existing
  auth screens; `Intl` is used directly for money/rating/distance formatting.
- **`cerca-app` hand-mirrors `@cerca/contract` instead of importing it.** The two repos aren't a
  monorepo, so the search-result Zod schema (`src/domain/models/listing.ts`, `money.ts`) is a
  manually kept copy of the backend's real contract, not a shared import. It already drifted
  once — see [US-02-HOME-SEARCH.md §6](US-02-HOME-SEARCH.md#6-incidente-post-entrega-el-schema-del-front-no-coincidía-con-el-contrato-real)
  — and can drift again silently since nothing enforces the two staying in sync.

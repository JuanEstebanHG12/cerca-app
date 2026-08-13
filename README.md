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
[US-03-PUBLISH-LISTING.md §2](US-03-PUBLISH-LISTING.md#2-el-contrato-real-verificado-tres-veces)),
so becoming a provider triggers a token refresh automatically; nothing to do manually.

The wizard is 4 steps, including photos (picker, local preview, remove). Photo **upload** itself
still can't complete — the backend doesn't implement `photos:presign` yet (verified against the
real `cerca-api` source, not assumed from the product doc). Uploading is best-effort: a listing
still publishes even if its photos fail to attach, and the wizard says so explicitly instead of
navigating away in silence.

### Editing your own listing

Tap any card from search to open its detail screen. The "Editar" button only renders when
`actor.id === listing.ownerId` — that's UX, not the real gate. The server (`canEditListing` /
`canChangePrice` in `@cerca/contract`) is what actually enforces it, verified live with two test
accounts: a foreign token against someone else's listing gets `403` with a machine-readable
`reason` (`not_owner`, `no_capacity`, …) before the app ever shows anything. The edit form only
PATCHes fields you actually changed (React Hook Form's `dirtyFields`) — resending an untouched
price would incorrectly trip the backend's "no price changes while a booking is accepted" rule.

### Requesting a booking

From a listing that isn't your own and is published, tap "Solicitar reserva" on its detail
screen. `POST /bookings` requires an `Idempotency-Key` header — generated once per screen visit
(`expo-crypto`'s `randomUUID()`), reused for any retry of that same attempt. Verified live
against a real race condition, not just read from the code: two truly concurrent requests with
the same key got one `201` and one `409 IDEMPOTENCY_IN_PROGRESS`, never two bookings. The button
disables itself while the request is in flight — that's the defense that actually stops a normal
double-tap; the idempotency key is the backend's own safety net for whatever gets past that.
Success navigates to `/bookings/[id]`, which always refetches rather than trusting a cached
"requested" that might be stale by the time you look again.

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
| Publish a listing | Done (US-03), photo upload blocked | 4-step wizard (basics → pricing → location → photos), single RHF form, resumable local draft (including picked photos), `POST /listings` + `POST /listings/:id/publish`. "Become a provider" flow included (`POST /me/capacities/provider` + token refresh — see [US-03-PUBLISH-LISTING.md §2](US-03-PUBLISH-LISTING.md#2-el-contrato-real-verificado-tres-veces)). Photo upload is best-effort behind a `PhotoGateway` port; it can't succeed until `cerca-api` ships `photos:presign`. Verified end-to-end against the real API (all three pricing models) and on a physical device, including the photo-upload failure path. |
| Listing detail + edit own listing | Done (US-04) | `GET /listings/:id` detail screen (tap any search card), with an "Editar" button gated on `actor.id === listing.ownerId`. Edit form (title/description/pricing) PATCHes only changed fields. Server-side ownership (`canEditListing`/`canChangePrice`, `@cerca/contract`) verified live with two accounts — a non-owner's token is rejected with `403 {reason: 'not_owner'}` regardless of what the client shows. See [US-04-EDIT-LISTING.md](US-04-EDIT-LISTING.md). |
| Request a booking | Done (US-05) | `POST /bookings` with a per-screen `Idempotency-Key` (`expo-crypto`), button disabled while pending. Verified live with a real concurrent race (two simultaneous requests, same key → one `201`, one `409 IDEMPOTENCY_IN_PROGRESS`, never two bookings), plus self-booking rejection (`403 {reason: 'own_listing'}`) and the booking-detail BOLA check (404, not 403, for a non-participant). New `/bookings/[id]` screen always refetches. See [US-05-REQUEST-BOOKING.md](US-05-REQUEST-BOOKING.md). |

### Known gaps (tracked, not silently dropped)

- **No interactive map.** The search is location + list only; there's no draggable map view
  yet (would need `react-native-maps` + a Google Maps API key on Android). The cache-key
  design (`snapToGrid`) is already map-ready — a map view can reuse `useSearchListings` as-is.
- **Location permission denied** currently shows an inline retry, not the city-picker fallback
  (that's US-08, out of scope for this task).
- **No photo upload.** `cerca-api` has a `ListingPhoto` table but no route/use-case that uses
  it — no `photos:presign`, nothing. The publish wizard's photo step (picker, preview, best-effort
  upload attempt) is built and ready; only the server side of the call is missing.
- **No "My Listings" screen.** `GET /me/listings` exists in `cerca-api` but nothing in the app
  calls it yet. Not blocking: editing (US-04) works from any listing's detail screen (reached via
  search), and a freshly published listing shows up in the owner's own nearby search results.
  Resuming a draft is separately local (`AsyncStorage`), unaffected by this gap.
- **Editing can't touch category or location.** `PATCH /listings/:id` (`updateListingSchema`,
  `@cerca/contract`) only accepts `title`/`description`/`pricing` — the backend doesn't allow
  the other two to change after creation, not a client omission.
- **No "My Bookings" screen.** `GET /bookings?role=customer|provider` exists in `cerca-api` but
  nothing calls it yet — requesting a booking navigates straight to that one booking's detail
  screen, which is enough to demonstrate US-05's acceptance criterion without a list view.
- **No accept/decline/complete/cancel flow.** Those are their own endpoints
  (`booking:accept`, propiedad del anuncio) — out of scope for US-05, which is specifically
  about requesting.
- **No booking note.** `POST /bookings` accepts an optional `note`, but the request screen
  doesn't collect one — not part of the acceptance criterion, and adding it wouldn't change the
  mutation/idempotency behavior the story is actually about.
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

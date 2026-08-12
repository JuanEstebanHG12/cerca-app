# US-02 — Buscar servicios cerca de mí, con filtros

> Documento de decisiones técnicas para la pantalla Home (búsqueda geolocalizada). Acompaña al
> código, no lo reemplaza: cada sección enlaza a los archivos reales para que se pueda leer el
> "por qué" aquí y el "qué" directamente en la fuente.

**Criterio de aceptación (Cerca.md, US-02):** los resultados salen ordenados por distancia;
mover el mapa un poco no recarga; hay carga, error, vacío inicial y vacío por filtro.

---

## 1. Qué se decidió antes de escribir código

Antes de tocar un archivo se resolvieron dos preguntas abiertas con el usuario, porque cambiaban
la arquitectura y no eran mías para decidir en silencio:

### 1.1 ¿Mapa interactivo o solo lista?

El criterio "mover el mapa un poco no recarga" sugiere un mapa arrastrable. Añadir uno real
(`react-native-maps`) exige una API key de Google Maps para Android y cambios de configuración
nativa que nadie tenía a mano en este momento. **Se decidió: sin mapa por ahora.** La pantalla
es geolocalización + lista virtualizada. La clave de caché (ver §3) ya está preparada para un
mapa futuro: cuando se añada, puede reusar `useSearchListings` sin tocarlo.

### 1.2 ¿npm o pnpm?

El repo tenía **dos lockfiles** al empezar: `package-lock.json` (rastreado en git) y
`pnpm-lock.yaml` / `pnpm-workspace.yaml` (sin rastrear). Pero `node_modules` ya estaba instalado
con pnpm (`node_modules/.pnpm` existía). Se preguntó y el usuario confirmó **pnpm**. Toda
dependencia nueva de esta tarea se instaló con `pnpm add`.

---

## 2. Arquitectura: por qué estos archivos y no otros

El proyecto ya tenía Clean Architecture con cuatro capas (`domain` → `application` →
`infrastructure` → `presentation`) y un linter (`eslint.config.js`,
`import/no-restricted-paths`) que impide que el dominio importe de fuera. La tarea siguió
exactamente ese molde en vez de inventar uno nuevo, porque US-01 (auth) ya demostraba el patrón
y mezclar dos estilos en el mismo repo es peor que repetir uno que funciona.

```
src/domain/models/          coords.ts, money.ts, pricing.ts, listing.ts, category.ts, search-filters.ts
src/domain/errors/          location-errors.ts

src/application/ports/      listing-gateway.ts, location-provider.ts, category-gateway.ts
src/application/use-cases/  search-listings.ts, get-current-location.ts, list-categories.ts

src/infrastructure/api/     listing-api-gateway.ts, category-api-gateway.ts
src/infrastructure/location/ expo-location-provider.ts

src/presentation/listings/  listing-keys.ts, use-search-listings.ts, use-categories.ts,
                             listing-card.tsx, listing-card-skeleton.tsx, empty-state.tsx,
                             filters-sheet.tsx, format-listing.ts
src/presentation/location/  use-location.ts
src/presentation/query/     query-client.ts

app/(app)/index.tsx         la pantalla en sí (Home = búsqueda)
```

Cada capa solo conoce la de adentro. `search-listings.ts` (application) no sabe que existe
`fetch`; `listing-api-gateway.ts` (infrastructure) es el único archivo que sabe que hay un HTTP
GET detrás de "buscar anuncios".

---

## 3. Decisiones de código, una por una

### 3.1 `snapToGrid` — la clave de caché es la pieza central

**Archivo:** [`src/domain/models/coords.ts`](src/domain/models/coords.ts)

```ts
export function snapToGrid(coords: Coords): Coords {
  return {
    lat: Math.round(coords.lat * 100) / 100,
    lng: Math.round(coords.lng * 100) / 100,
  };
}
```

**Por qué:** dos lecturas de GPS un metro distintas producen dos claves de React Query distintas
si se usan las coordenadas crudas — cada micro-movimiento parecería una búsqueda nueva. Redondear
a ~1 km de precisión *antes* de construir la clave es lo que hace que "mover el mapa un poco no
recarga" sea cierto sin necesidad de un mapa real: la misma mecánica sirve para el GPS de hoy y
para un mapa arrastrable el día que se añada.

Se usa en [`listing-keys.ts`](src/presentation/listings/listing-keys.ts):

```ts
export const listingKeys = {
  all: () => ['listings'] as const,
  searches: () => [...listingKeys.all(), 'search'] as const,
  search: (filters: SearchFilters) =>
    [...listingKeys.searches(), { ...filters, coords: snapToGrid(filters.coords) }] as const,
  categories: () => ['categories'] as const,
};
```

Claves jerárquicas, no planas: invalidar `listingKeys.searches()` borra todas las búsquedas
cacheadas sin tocar `listingKeys.categories()`. Es el mismo patrón que Cerca.md muestra para
favoritos, aplicado aquí a búsquedas.

### 3.2 `Money` y `Pricing` — uniones discriminadas, no campos opcionales

**Archivos:** [`money.ts`](src/domain/models/money.ts), [`pricing.ts`](src/domain/models/pricing.ts)

```ts
export const pricingSchema = z.discriminatedUnion('model', [
  z.object({ model: z.literal('fixed'), price: moneySchema }),
  z.object({ model: z.literal('hourly'), hourlyRate: moneySchema, minimumHours: z.number().positive() }),
  z.object({ model: z.literal('quote'), startingFrom: moneySchema.optional() }),
]);
```

**Por qué:** con campos opcionales sería posible representar un anuncio "por hora" sin
`minimumHours`, un estado que no debería existir. Con la unión discriminada, TypeScript obliga a
manejar los tres casos (`fixed` / `hourly` / `quote`) en cada `switch`, y un cuarto modelo que el
backend añadiera en el futuro rompería la compilación exactamente donde hay que tocar código —
no en producción.

`Money.amountMinor` es siempre un entero (nunca un `float`), y `formatMoney` usa `Intl` en vez de
dividir por 100 a mano, porque no todas las monedas tienen 2 decimales (el yen tiene 0, el dinar
kuwaití tiene 3).

**`pricingSchema` no es lo que viaja en `GET /listings`.** `Pricing` (con su discriminación
`fixed`/`hourly`/`quote`) es la forma completa que solo existe en el detalle de un anuncio
(`GET /listings/:id`, aún sin construir — §4). Los resultados de búsqueda mandan un campo mucho
más simple, `priceFrom: Money | null`, y `ListingSearchResult` usa ese campo, no `pricing` — ver
§3.3 y §6 para la historia de por qué el schema del front tuvo que corregirse para reflejar esto.

**`currencyCodeSchema` también tuvo el mismo bug.** Estaba fijado a `z.enum(['MXN', 'USD',
'EUR'])`, una lista inventada a mano. El contrato real (`@cerca/contract`, `money.ts`) valida
cualquier código ISO-4217 de 3 letras mayúsculas, y los datos sembrados usan `COP` — que el
enum rechazaba. Se corrigió a `z.string().length(3).regex(/^[A-Z]{3}$/)`, igual que el backend.

### 3.3 `ListingStatus` — enum plano, no unión discriminada (corregido, ver §6)

**Archivo:** [`listing.ts`](src/domain/models/listing.ts)

La primera versión de este schema modelaba `status` como una unión discriminada de cinco
variantes, cada una con los campos que ese estado necesitaría en una vista de detalle
(`{ kind: 'published', publishedAt }`, `{ kind: 'removed', removedBy, reason }`, etc.). Sonaba
bien por el mismo razonamiento que `Pricing` (§3.2), pero **`GET /listings` nunca mandó esa
forma**: el contrato real (`@cerca/contract`, `listingSearchItemSchema`) manda `status` como un
string plano — `'draft' | 'published' | 'paused' | 'under_review' | 'removed'` — sin los campos
extra, porque esos solo existen en `GET /listings/:id`. El fix fue reemplazar la unión
discriminada por `z.enum([...])`, que es lo que realmente viaja por la red. Detalle completo del
bug y cómo se encontró: §6.

`distanceMeters` (no `distanceKm`) vive en `ListingSearchResult`, no en un `Listing` genérico,
porque la distancia solo tiene sentido en el contexto de una búsqueda geolocalizada — no es una
propiedad del anuncio en sí. `formatDistance` (§3.9) recibe metros y convierte a km solo para
mostrarlos, sin renombrar el campo que viaja por la red.

### 3.4 Resultado con motivo, no booleano — el mismo patrón que `SignInResult`

**Archivo:** [`get-current-location.ts`](src/application/use-cases/get-current-location.ts)

```ts
export type GetCurrentLocationResult = { ok: true; coords: Coords } | { ok: false; reason: LocationFailureReason };
```

**Por qué:** que el usuario niegue el permiso de ubicación es un resultado esperado, no un bug.
Con un `boolean` la pantalla no podría explicar *por qué* no hay resultados. Con un `reason`
tipado (`'permission_denied' | 'position_unavailable' | 'unexpected_error'`), el hook
[`use-location.ts`](src/presentation/location/use-location.ts) puede decidir exactamente qué
mostrar. Es el mismo patrón que ya existía en `SignInResult` para US-01 — reutilizado
deliberadamente, no reinventado.

### 3.5 `useSearchListings` — `useInfiniteQuery` sobre el caso de uso, no sobre `fetch`

**Archivo:** [`use-search-listings.ts`](src/presentation/listings/use-search-listings.ts)

```ts
export function useSearchListings(filters: SearchFilters | null) {
  return useInfiniteQuery({
    queryKey: filters ? listingKeys.search(filters) : listingKeys.searches(),
    queryFn: ({ pageParam }) => searchListings.execute(filters!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: filters !== null,
  });
}
```

**Por qué `enabled: filters !== null`:** no hay coordenadas hasta que `useLocation` resuelve, y
no tiene sentido buscar "en ningún sitio". Mientras `filters` es `null`, React Query nunca llama
a `queryFn`, así que el `filters!` (non-null assertion) de adentro es seguro en la práctica —
pero es una costura frágil, ver §5.

### 3.6 Orden explícito de los cuatro estados, no ternarios en paralelo

**Archivo:** [`app/(app)/index.tsx`](<app/(app)/index.tsx>)

La primera versión de este archivo encadenaba ternarios así:

```ts
const isInitialLoading = location.status === 'loading' || search.status === 'pending';
// ...
{isInitialLoading ? <Skeleton /> : location.status === 'denied' ? <Denied /> : ...}
```

Esto tenía un bug: cuando `location.status === 'denied'`, `filters` es `null`, la query queda
`enabled: false`, y en React Query v5 una query deshabilitada se queda en `status: 'pending'`
para siempre — nunca pasa a `'success'` ni `'error'`. Como `isInitialLoading` incluía
`search.status === 'pending'`, la pantalla se quedaba mostrando el skeleton de carga
**para siempre** en vez de llegar al mensaje de "sin ubicación". Se corrigió reescribiendo la
lógica como una función `renderBody()` con `if` explícitos en el orden correcto:

```ts
function renderBody() {
  if (location.status === 'loading') return <ListingListSkeleton />;
  if (location.status === 'denied') return <EmptyState ... />;   // ← gana antes de mirar `search`
  if (search.status === 'pending') return <ListingListSkeleton />;
  if (search.status === 'error') return <EmptyState ... />;
  if (items.length === 0 && hasActiveFilters) return <EmptyState ... />;  // vacío por filtro
  if (items.length === 0) return <EmptyState ... />;                      // vacío inicial
  return <FlatList ... />;
}
```

Este es el ejemplo más concreto de "decisión de código" de toda la tarea: cuatro estados que
Cerca.md pide como si fueran independientes en realidad tienen una dependencia de orden, y
escribirlos como `if` secuenciales en vez de ternarios anidados es lo que hace ese orden legible
y a prueba de este bug específico.

### 3.7 Virtualización: `getItemLayout` + las tres estabilizaciones

**Archivos:** [`listing-card.tsx`](src/presentation/listings/listing-card.tsx),
[`app/(app)/index.tsx`](<app/(app)/index.tsx>)

```ts
export const LISTING_CARD_HEIGHT = 112;   // altura fija, exportada — la usa el FlatList y el skeleton

export const ListingCard = memo(function ListingCard({ listing }: ListingCardProps) { ... });
```

```ts
const renderItem = useCallback(({ item }) => <ListingCard listing={item} />, []);
const keyExtractor = useCallback((item) => item.id, []);
const getItemLayout = useCallback(
  (_, index) => ({ length: LISTING_CARD_HEIGHT, offset: LISTING_CARD_HEIGHT * index, index }),
  [],
);
```

**Por qué:** Cerca.md es explícito en que `memo()` en la tarjeta no sirve de nada si
`renderItem` o el handler del padre se recrean en cada render — las tres estabilizaciones o
ninguna. `getItemLayout` con una altura fija le permite a `FlatList` calcular el scroll sin medir
cada celda, que es lo que hace viable 5.000 tarjetas en un dispositivo de gama media.

### 3.8 Accesibilidad: una tarjeta, una parada del lector

**Archivo:** [`listing-card.tsx`](src/presentation/listings/listing-card.tsx)

```tsx
const accessibilityLabel = [listing.title, price.amount, price.context, ratingSummary, distance, badge]
  .filter(Boolean)
  .join(', ');

<View style={styles.card} accessible accessibilityLabel={accessibilityLabel}>
```

**Por qué:** sin `accessible` agrupando el nodo, VoiceOver/TalkBack se detiene en la imagen, el
título, el precio y el meta-row por separado — 200 resultados serían 1.400 paradas en vez de
200. El `accessibilityLabel` compone todo el contenido relevante en una sola frase leída de una
vez.

El badge de estado (`statusBadgeLabel` en
[`format-listing.ts`](src/presentation/listings/format-listing.ts)) siempre lleva texto
("Pausado", "En revisión", "Retirado"), nunca solo color — un anuncio pausado no se comunica con
un punto gris.

### 3.9 Plurales y formato con `Intl`, sin librería de i18n

**Archivo:** [`format-listing.ts`](src/presentation/listings/format-listing.ts)

```ts
export function formatRatingSummary(ratingAvg: number, ratingCount: number): string {
  if (ratingCount === 0) return 'Sin reseñas todavía';
  const stars = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(ratingAvg);
  const reviews = ratingCount === 1 ? '1 reseña' : `${ratingCount} reseñas`;
  return `${stars} · ${reviews}`;
}
```

(`ratingAvg`/`ratingCount`, no un `rating` nullable combinado con `reviewCount` — otro campo
renombrado por el mismo bug de contrato, §6.)

**Por qué sin i18next:** las pantallas de auth (US-01) ya solo usan strings en español
embebidos, no i18next, a pesar de que Cerca.md lo prescribe como stack objetivo. Introducir
i18next a mitad de esta tarea habría sido una decisión de infraestructura mayor tomada sin
pedir permiso, así que se siguió el mismo precedente ya establecido en el código existente. Se
dejó explícito como pendiente en el README y en Senior Engineer Notes, no se ocultó.

`formatMoney` y `formatDistance` sí usan `Intl` directamente (sin locale explícito, así que
usan el idioma del dispositivo) — eso es barato y correcto independientemente de si más adelante
se añade i18next para el resto de los textos.

### 3.10 `EmptyState` — un componente, cuatro llamadas distintas

**Archivo:** [`empty-state.tsx`](src/presentation/listings/empty-state.tsx)

Un solo componente con `primaryAction`/`secondaryAction` opcionales cubre error, vacío inicial y
vacío por filtro. La razón de tener *dos* acciones en el caso "vacío por filtro" es literal de
Cerca.md: *"un botón de 'ampliar a 20 km' convierte un callejón sin salida en una acción"* — así
que ese estado ofrece tanto "Limpiar filtros" como "Ampliar a 20 km", no solo uno.

### 3.11 `FiltersSheet` — borrador local, aplicado solo al confirmar

**Archivo:** [`filters-sheet.tsx`](src/presentation/listings/filters-sheet.tsx)

El modal mantiene su propio estado (`draft`) inicializado desde los filtros actuales cuando se
abre, y solo llama a `onApply(draft)` cuando el usuario toca "Aplicar". **Por qué:** cambiar de
categoría o radio no debería disparar una búsqueda por cada toque — solo cuando el usuario dice
que terminó de elegir. El texto de búsqueda libre, en cambio, vive en la pantalla principal con
debounce de 400 ms (`app/(app)/index.tsx`), porque ahí sí tiene sentido una respuesta progresiva
mientras se escribe.

### 3.12 `query-client.ts` — no reintentar un permiso denegado

**Archivo:** [`query-client.ts`](src/presentation/query/query-client.ts)

```ts
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
  return failureCount < 2;
}
```

Cerca.md lo dice explícitamente: reintentar un 401/403 tres veces es un antipatrón, porque un
permiso denegado no empieza a funcionar en el segundo intento. El resto de errores (red, 5xx) sí
se reintentan.

---

## 4. Lo que NO se construyó, y por qué

| Pendiente | Por qué se dejó fuera |
|---|---|
| Mapa interactivo (`react-native-maps`) | Necesita API key de Google Maps + config nativa — decisión del usuario, ver §1.1 |
| Selector de ciudad al negar ubicación | Es US-08 en Cerca.md, una historia separada con su propio criterio de aceptación |
| Pantalla de detalle (`listings/[id].tsx`) | No estaba en el alcance de US-02; las tarjetas son solo de lectura por ahora |
| i18next | Sigue el precedente ya existente en el código de auth (US-01); ver §3.9 |
| Consumir `@cerca/contract` directamente en vez de mirror manual en Zod | `cerca-app` y `cerca-api` son repos separados sin monorepo compartido; el schema del front ya drifteó una vez del contrato real — ver §6 |

---

## 5. Verificación hecha

- `npx tsc --noEmit` → sin errores
- `npx eslint .` → sin errores (incluye la regla de arquitectura `import/no-restricted-paths`)
- `npx expo export --platform android` → el bundle compila (1.422 módulos) sin errores de
  importación ni de sintaxis
- **Probado en dispositivo físico** (Android, Expo Go SDK 57) tras el fix de §6: con la base de
  `cerca-api` sembrada (`pnpm db:seed`), la búsqueda geolocalizada muestra resultados reales de
  las cinco ciudades sembradas, con paginación, filtros y los cuatro estados (carga, error,
  vacío inicial, vacío por filtro) funcionando end-to-end contra la API real, no solo contra
  mocks.

---

## 6. Incidente post-entrega: el schema del front no coincidía con el contrato real

**Síntoma reportado:** con sesión iniciada y permiso de ubicación concedido, la pantalla Home
mostraba siempre "No pudimos cargar los servicios" en un dispositivo físico.

**Lo que NO era la causa** (descartado con evidencia antes de tocar código):
- Red/firewall: se confirmó una conexión TCP real del celular al puerto de `cerca-api`, y una
  petición manual desde el navegador del celular devolvía `200 OK`.
- El endpoint en sí: `curl` contra `GET /listings` respondía bien.
- Auth: `GET /listings` es `@Public()`, no requiere sesión.

**La causa real, en dos capas, ambas con el mismo patrón:**

1. **`listingSearchResultSchema` (`src/domain/models/listing.ts`) no coincidía con
   `listingSearchItemSchema` de `@cerca/contract`.** El schema del front era una copia escrita a
   mano, no un import del contrato real, y había divergido en cuatro puntos:

   | Campo del front (antes) | Campo real de la API | Problema |
   |---|---|---|
   | `status: { kind, publishedAt?, ... }` | `status: 'draft'\|'published'\|...` (string) | forma completamente distinta |
   | `pricing: Pricing` (modelo completo) | `priceFrom: Money \| null` | nombre y forma distintos |
   | `distanceKm: number` | `distanceMeters: number` | nombre y unidad distintos |
   | `rating: number \| null`, `reviewCount` | `ratingAvg: number`, `ratingCount: number` | nombres distintos |
   | `photoUrl: string \| null` | *(no existe en la respuesta)* | campo inventado |

   `listing-api-gateway.ts` valida cada respuesta con `listingSearchPageSchema.parse(raw)` (por
   diseño — Cerca.md: *"el límite con la red se valida, no se promete"*). Con **cualquier**
   resultado no vacío, `.parse()` lanzaba `ZodError`; React Query lo capturaba como
   `status: 'error'`, y la pantalla mostraba el mensaje genérico de "no pudimos cargar".

2. **Por qué no se detectó al construir la pantalla:** en ese momento la base de datos de
   `cerca-api` estaba vacía (sin seed). Un `items: []` nunca ejecuta la validación de cada item
   — el bug solo se manifiesta con resultados reales, y no había ninguno.

3. **Segundo bug, mismo patrón, encontrado al verificar el fix contra datos reales:**
   `currencyCodeSchema` (`money.ts`) estaba fijado a `z.enum(['MXN', 'USD', 'EUR'])` en vez del
   `z.string().regex(/^[A-Z]{3}$/)` genérico que usa el backend. Los datos sembrados usan `COP`
   (las cinco ciudades del seed son colombianas), que el enum rechazaba — el mismo `ZodError`
   volvía a aparecer incluso después de corregir `listing.ts`.

**Fix aplicado:** se reescribieron `src/domain/models/listing.ts` y `money.ts` campo a campo
contra el contrato real (`packages/contract/src/listing/listing.schemas.ts` y `money/money.ts`
en `cerca-api`), y se actualizaron los cuatro consumidores downstream (`format-listing.ts`,
`listing-card.tsx`) a los nombres/formas nuevos. La tarjeta de foto quedó como placeholder fijo,
porque `GET /listings` no manda ninguna URL de imagen todavía.

**Verificación del fix:** se parseó el schema nuevo contra una respuesta sintética con la forma
exacta de `toSearchItem()` (backend) y luego contra respuestas reales en vivo de las cinco
ciudades sembradas — ambas sin lanzar error. Confirmado además en dispositivo físico (§5).

**Riesgo abierto:** nada impide que esto vuelva a pasar — el front sigue sin importar
`@cerca/contract`, solo lo imita a mano. Ver fila correspondiente en §4.

# Cerca — App móvil

**Marketplace de servicios locales · cliente móvil (solo consumo de API)**

> Este documento describe **el frontend**: la app de React Native + Expo que la gente lleva en el bolsillo. No van a construir el servidor ni la base de datos — eso vive en el gist del backend. Aquí el contrato de la API es su única fuente de verdad: todo lo que reciben, lo validan; todo lo que muestran, sale de ahí.

---

## El encargo

Una plataforma los contrató para construir la app de **Cerca**, un mercado de dos caras donde la gente encuentra y ofrece servicios locales: un fontanero, una profesora de guitarra, alguien que pasea perros.

La app tiene que funcionar en un teléfono real, en dos idiomas, con dinero de varias monedas, y con búsquedas que devuelven miles de resultados sin que el móvil se ahogue. El backend ya existe y expone una API REST versionada; ustedes la consumen.

Cuando terminen, alguien que nunca vio la app tiene que poder instalarla desde un enlace, buscar un servicio cerca de sí, publicar el suyo en cuatro pasos, reservar, y dejar una reseña — y todo eso sin que la app se rompa cuando le nieguen la ubicación, se caiga la red, o el sistema esté en alemán.

---

## Las cuatro restricciones que definen su arquitectura

Consumir una API no es lo difícil. Lo difícil es hacerlo bajo estas cuatro condiciones, que son las de cualquier app móvil de producto real.

### El servidor es la única autoridad

La app **oculta y deshabilita** botones según lo que una cuenta puede hacer. Eso es experiencia de usuario, no seguridad. Si alguien manipula el estado del cliente y hace aparecer un botón que no le corresponde, no pasa nada: el servidor rechaza la petición.

Esto los obliga a separar dos cosas que se confunden siempre: la lógica que decide *qué se pinta* (vive en el cliente, para que la experiencia sea buena) y la lógica que decide *qué se permite* (vive en el servidor, y el cliente solo la refleja). Nunca escriban una comprobación de permiso en el cliente pensando que protege algo. No protege nada.

### En el móvil no hay secretos

Todo lo que empaquetan en el binario es visible. Una clave en una variable `EXPO_PUBLIC_*` se lee abriendo el bundle con un editor de texto.

Esto significa que ninguna credencial sensible vive en la app. El único secreto que la app maneja es el **token de sesión del usuario**, y va en almacenamiento seguro del dispositivo, no en `AsyncStorage`. Toda operación privilegiada la hace el servidor con las credenciales del servidor, jamás la app.

### La red es lenta, cara e intermitente

El usuario está en el metro, con una barra de señal. La app tiene que sentirse instantánea cuando la red no lo es: mostrar datos en caché mientras revalida, aplicar cambios de forma optimista y revertirlos si el servidor dice que no, y no pedir la misma cosa dos veces.

Esto los obliga a tratar el estado del servidor como lo que es —una copia local que puede estar vieja— y no como variables de estado normales. Es el trabajo de la capa de datos, y las decisiones sobre las claves de caché las toman al principio, no cuando la app ya parpadea.

### El teléfono es un dispositivo físico con límites

Un Android de gama media tiene poca memoria y una pantalla que la mitad de la gente ve al 200% de tamaño de fuente. Una lista de miles de tarjetas con foto no se pinta con un `map`: se virtualiza. Una imagen de 4000×3000 para una tarjeta de 120 píxeles descomprime unos 48 MB en memoria, y en una lista eso es un crash.

Esto significa que el rendimiento y la accesibilidad no son un pulido final: son restricciones de diseño desde la primera pantalla.

---

## El giro que hace este proyecto distinto

Un marketplace de dos caras tiene una propiedad que casi ninguna app de práctica tiene: **los permisos no se resuelven con un rol.**

Marta publica clases de guitarra y contrata a un fontanero. No es "cliente" ni "proveedora": es las dos a la vez. Así que la pregunta *"¿qué rol tiene este usuario?"* está mal planteada. La pregunta correcta es siempre *"¿este usuario puede hacer **esto** con **este** recurso?"*.

Una cuenta tiene un conjunto de **capacidades** (`customer`, `provider` — puede tener las dos) y, por separado, un **rol de plataforma** (`user`, `moderator`, `admin`). Un moderador también contrata servicios como cualquiera; por eso el rol de plataforma va en un campo aparte, no mezclado con las capacidades.

```ts
// @cerca/contract · src/auth/actor.ts  (paquete compartido con el backend)
export type Capacity = 'customer' | 'provider';
export type PlatformRole = 'user' | 'moderator' | 'admin';

export interface Actor {
  readonly id: UserId;
  readonly capacities: readonly Capacity[];   // puede tener las dos
  readonly platformRole: PlatformRole;
}

export const has = (a: Actor, c: Capacity) => a.capacities.includes(c);

export function can(a: Actor, p: Permission): boolean {
  const fromCapacities = a.capacities.some((c) => CAPACITY_PERMISSIONS[c].includes(p));
  const fromRole = PLATFORM_PERMISSIONS[a.platformRole].includes(p);
  return fromCapacities || fromRole;
}
```

**El error que van a cometer:** modelar `role: 'customer' | 'provider'`. Con eso Marta no cabe, y la solución que se les ocurre —`role: 'both'`— no escala a una tercera capacidad. "Mis anuncios" solo aparece si tienes la capacidad de proveedora, y hacerse proveedora es una acción dentro de la app (`POST /me/capacities/provider`), no un registro distinto.

---

## Las cuatro capas de autorización

Todo permiso de este proyecto se descompone en cuatro capas. La primera sirve para pintar el menú; las otras tres solo se pueden evaluar cuando tienes el recurso delante.

```
1. CAPACIDAD      can(actor, 'listing:update')     ¿en general?
2. PROPIEDAD      listing.ownerId === actor.id      ¿es mío?
3. RELACIÓN       soy parte de esta reserva         ¿participo?
4. ESTADO/TIEMPO  status === completed, plazo       ¿ahora se puede?
```

En el cliente, estas capas deciden **cómo se ve** un control, y hay una distinción que casi nadie hace:

- **Sin capacidad → oculta el botón.** No le interesa y no lo va a conseguir. Mostrarlo solo confunde.
- **Bloqueado por una política (2, 3 o 4) → deshabilita y explica.** "Ya reseñaste esta reserva" enseña la regla. Un botón que desaparece deja al usuario preguntándose qué pasó.

En el servidor, estas capas deciden **qué se permite**, y son la autoridad. El cliente nunca las sustituye; las refleja.

### La matriz de permisos

Es el contrato que la app comparte con el backend. Se dibuja antes de escribir una pantalla.

| Permiso | customer | provider | moderator | admin | Capa extra |
|---|:--:|:--:|:--:|:--:|---|
| `listing:read` | ✅ | ✅ | ✅ | ✅ | — |
| `listing:create` | — | ✅ | — | ✅ | — |
| `listing:update` | — | ✅ | — | ✅ | **propiedad** |
| `listing:moderate` | — | — | ✅ | ✅ | — |
| `booking:request` | ✅ | ✅ | ✅ | ✅ | **no tu anuncio** |
| `booking:accept` | — | ✅ | — | — | **propiedad** |
| `review:write` | ✅ | ✅ | ✅ | ✅ | **relación + estado + plazo** |
| `review:moderate` | — | — | ✅ | ✅ | **no ser el autor** |
| `report:resolve` | — | — | ✅ | ✅ | — |
| `user:suspend` | — | — | — | ✅ | — |

La mitad de las filas tienen capa extra. Ahí vive la dificultad real, y ahí es donde las apps de verdad tienen agujeros.

---

## La función estrella

La regla más difícil del producto: **no puedes reseñar un servicio si no eres tú quien lo contrató (relación), si la reserva no está completada (estado), si ya la reseñaste (unicidad), o si han pasado más de 30 días (tiempo).** Cuatro condiciones de cuatro tipos distintos, y ningún rol las resuelve.

Vive en el paquete compartido, y el servidor importa **exactamente este archivo**. Un sitio define la regla, dos la aplican.

```ts
// @cerca/contract · src/review/review.policy.ts
export type ReviewBlockedReason =
  | 'not_your_booking' | 'not_completed' | 'already_reviewed' | 'window_closed';

export type ReviewEligibility = { ok: true } | { ok: false; reason: ReviewBlockedReason };

export const REVIEW_WINDOW_DAYS = 30;

export function canReviewBooking(actor: Actor, booking: Booking, now: Date): ReviewEligibility {
  if (booking.customerId !== actor.id)          return { ok: false, reason: 'not_your_booking' };
  if (booking.status.kind !== 'completed')      return { ok: false, reason: 'not_completed' };
  if (booking.reviewId !== null)                return { ok: false, reason: 'already_reviewed' };
  if (daysBetween(booking.status.completedAt, now) > REVIEW_WINDOW_DAYS)
                                                return { ok: false, reason: 'window_closed' };
  return { ok: true };
}
```

Tres decisiones que tienen consecuencias directas en la app:

1. **Devuelve un motivo, no un booleano.** Con `false` no pueden decirle al usuario *por qué*, y acaban duplicando la lógica en la pantalla para poder mostrar el mensaje.
2. **El motivo es una clave de i18n.** La pantalla hace `t(\`review.blocked.${reason}\`)`. El dominio no sabe en qué idioma se muestra.
3. **`now` es un parámetro, no `new Date()` por dentro.** La función es pura y el test de "ventana cerrada" no necesita simular relojes.

Esa línea —`t(\`review.blocked.${reason}\`)`— es la simbiosis de todo el proyecto: dominio puro → clave de i18n → mensaje exacto, sin duplicar una sola comprobación.

---

## El dominio: entidades, estados y dinero

El backend les entrega estas formas. Las validan al recibirlas y las tipan con TypeScript.

### Estados como uniones discriminadas

Un anuncio y una reserva son máquinas de estados. Modelarlos con campos opcionales permite estados imposibles (una reserva "completada" sin fecha de finalización, o "rechazada" con fecha de aceptación). Con una unión discriminada, esos estados no existen ni compilan.

```ts
export type ListingStatus =
  | { kind: 'draft' }
  | { kind: 'published'; publishedAt: string }
  | { kind: 'paused' }
  | { kind: 'under_review'; reportId: ReportId }
  | { kind: 'removed'; removedBy: UserId; reason: RemovalReason };

export type BookingStatus =
  | { kind: 'requested'; requestedAt: string }
  | { kind: 'accepted'; acceptedAt: string; scheduledFor: string }
  | { kind: 'declined'; reason: DeclineReason }
  | { kind: 'completed'; completedAt: string }
  | { kind: 'cancelled'; cancelledBy: UserId; at: string };
```

Al consumirlas, un `switch` sobre `status.kind` con un `default: assertNever(status)` obliga a cubrir todos los casos: si el backend añade una variante, la app deja de compilar señalando los sitios exactos que hay que tocar.

### El modelo de precio dirige el formulario

`Pricing` es una unión discriminada de negocio, y es el corazón del formulario de publicación. Si el modelo es "presupuesto", el precio ni existe — ni en el tipo, ni en la pantalla.

```ts
export type Pricing =
  | { model: 'fixed'; price: Money }
  | { model: 'hourly'; hourlyRate: Money; minimumHours: number }
  | { model: 'quote'; startingFrom?: Money };
```

### El dinero: enteros, monedas y locales

Este es el mejor ejercicio de i18n del proyecto, porque un anuncio en pesos mexicanos, visto por alguien con el móvil en alemán, rompe casi todas las implementaciones ingenuas.

```ts
export interface Money {
  readonly amountMinor: number;    // 129990, nunca un float
  readonly currency: CurrencyCode; // 'MXN'
}

export function formatMoney(m: Money, locale: string): string {
  const digits = minorUnitDigits(m.currency);   // JPY 0 · MXN 2 · KWD 3
  return new Intl.NumberFormat(locale, { style: 'currency', currency: m.currency })
    .format(m.amountMinor / 10 ** digits);
}
```

Tres cosas que hay que interiorizar:

- **Nunca un `float`.** `0.1 + 0.2 !== 0.3`. El dinero son enteros en unidades menores.
- **Dividir entre 100 está mal en general.** El yen no tiene decimales; el dinar kuwaití tiene tres. De ahí `minorUnitDigits`.
- **Moneda ≠ locale.** La moneda es un dato del anuncio (la fija quien publica). El formato es preferencia de quien mira. `MXN 129990` se ve `$1,299.90` en `es-MX`, `MX$1,299.90` en `en-US` y `1.299,90 MX$` en `de-DE`. La distancia es igual: "a 3 km" no se traduce, se reformatea a millas en un locale imperial.

Escríbanlo en `AGENTS.md`: **prohibido un `number` que represente dinero fuera de `Money`.**

---

## El contrato con el backend: la API que consumen

Esta es la superficie completa que la app toca. El detalle de request/response vive en el paquete `@cerca/contract` como schemas de Zod, y **cada respuesta se valida con `parse` en el límite** — nunca con `as`.

**Base:** `http://localhost:3000/v1` (dev) · `https://api.cerca.app/v1` (prod)
**Autenticación:** `Authorization: Bearer <accessToken>` en toda ruta privada.
**Errores:** `application/problem+json` (RFC 9457). Los 403/409 de dominio traen un campo `reason` legible por máquina que coincide con los motivos de las políticas (`already_reviewed`, `window_closed`, `not_owner`, `has_pending_bookings`, …).
**Paginación:** por cursor. `?cursor=&limit=`; respuesta `{ items, nextCursor }`.
**Idempotencia:** cabecera `Idempotency-Key` en `POST /bookings` y `POST /bookings/{id}/review`.

| Método y ruta | Para qué | Permiso / capa |
|---|---|---|
| `POST /auth/sign-up` | Crear cuenta | público |
| `POST /auth/sign-in` | Iniciar sesión → `{ accessToken, refreshToken, actor }` | público |
| `POST /auth/refresh` | Rotar tokens | refresh token |
| `POST /auth/sign-out` | Cerrar sesión | sesión |
| `GET /me` | La cuenta actual (`Actor`) | sesión |
| `POST /me/capacities/provider` | Hacerse proveedor | sesión |
| `GET /categories` | Catálogo de categorías | público |
| `GET /listings?query=&categoryId=&lat=&lng=&radiusKm=&cursor=` | **Búsqueda geolocalizada**, ordenada por distancia | público |
| `GET /listings/{id}` | Detalle de un anuncio | público |
| `GET /me/listings` | Mis anuncios | `listing:read` + propiedad |
| `POST /listings` | Publicar un anuncio | `listing:create` |
| `PATCH /listings/{id}` | Editar un anuncio | `listing:update` + **propiedad** |
| `POST /listings/{id}/publish` · `/pause` | Cambiar estado | propiedad |
| `POST /listings/{id}/photos:presign` | Pedir URL de subida directa → `{ uploadUrl, key }` | propiedad |
| `POST /listings/{id}/favorite` · `DELETE …/favorite` | Guardar/quitar favorito | sesión |
| `POST /listings/{id}/report` | Denunciar un anuncio | sesión |
| `POST /listings/{id}/moderate` | Poner `under_review`/`removed` (pantalla de moderación) | `listing:moderate` |
| `POST /bookings` | Solicitar una reserva | `booking:request` + **no tu anuncio** |
| `GET /bookings?role=customer\|provider` | Mis reservas por lado | relación |
| `GET /bookings/{id}` | Detalle de una reserva | relación |
| `POST /bookings/{id}/accept` · `/decline` · `/complete` | Gestionar reserva | propiedad del anuncio |
| `POST /bookings/{id}/cancel` | Cancelar | relación + estado |
| `POST /bookings/{id}/review` | **Reseñar** (aplica `canReviewBooking`) | relación + estado + unicidad + plazo |
| `GET /listings/{id}/reviews` | Reseñas de un anuncio | público |
| `POST /reviews/{id}/moderate` | Moderar una reseña | `review:moderate` + **no ser el autor** |
| `GET /reports` · `POST /reports/{id}/resolve` | Cola de moderación | `report:resolve` |
| `POST /users/{id}/suspend` | Suspender una cuenta | `user:suspend` |

### El límite con la red se valida, no se promete

```ts
// infrastructure/api/listing.gateway.ts
const raw: unknown = await http.get(`/listings/${id}`);
return listingDetailSchema.parse(raw);   // no `as ListingDetail`
```

> **`as` es una promesa que le hacen al compilador y que nadie verifica. `parse` es una comprobación real.** Si el backend cambia un campo obligatorio, se enteran aquí, con un mensaje claro, y no tres pantallas después.

---

## Casos de uso

Cada historia trae su criterio de aceptación: una frase que se convierte en un test o en un clic. "Que sea rápido" o "que quede bonito" no lo son.

| ID | Como… quiero… | Criterio de aceptación | Enseña |
|---|---|---|---|
| **US-01** | Como usuario quiero iniciar sesión y que mi sesión sobreviva a un reinicio | Tras cerrar y reabrir la app, sigo dentro; sin sesión, cualquier ruta redirige a login sin parpadeo | `expo-secure-store`, arranque limpio |
| **US-02** | Como usuario quiero buscar servicios cerca de mí con filtros | Los resultados salen ordenados por distancia; mover el mapa un poco no recarga; hay carga, error, vacío inicial y vacío por filtro | Geolocalización, virtualización, claves de caché |
| **US-03** | Como proveedor quiero publicar un anuncio en 4 pasos | Elegir "por hora" pide horas mínimas; "presupuesto" no pide precio; las fotos suben; el borrador se puede retomar | RHF multipaso, `Pricing`, subida de fotos |
| **US-04** | Como proveedor quiero editar solo mis propios anuncios | El botón de editar no aparece en el anuncio de otro; si fuerzo la petición, el servidor la rechaza | Propiedad (capa 2) |
| **US-05** | Como cliente quiero solicitar una reserva | La solicitud se envía una sola vez aunque pulse dos; el estado se refleja al volver atrás | Mutación, estados, idempotencia |
| **US-06** | Como cliente quiero reseñar una reserva completada, una sola vez | Reseñar dos veces muestra "ya reseñaste esta reserva"; fuera de plazo muestra su propio mensaje | La política estrella |
| **US-07** | Como usuario quiero ver los precios en el formato de mi locale | El mismo precio se ve bien en `es-MX`, `en-US` y `de-DE`; la distancia en km o millas según locale | `Intl`, `Money` |
| **US-08** | Como usuario quiero que la app funcione sin permiso de ubicación | Al negar la ubicación, la app ofrece un selector de ciudad en vez de quedarse en blanco | Degradación elegante |
| **US-09** | Como moderador quiero retirar un anuncio denunciado | Desde la cola de moderación puedo poner un anuncio `under_review` o `removed` | Rol de plataforma, moderación |
| **US-10** | Como equipo queremos instalar una build de QA desde un enlace | Existe un enlace de `preview` que otra persona instala y abre | EAS |
| **US-11** | *(fuera de alcance)* Chat en tiempo real entre las partes | — | Alcance declarado |
| **US-12** | *(fuera de alcance)* Pagos y liquidaciones | — | Alcance declarado |

Las dos últimas existen **para aprender a dejarlas fuera y decirlo**. Saber decir "esto no entra" es parte del trabajo.

---

## Las pantallas y los cuatro estados

Toda pantalla que muestra datos tiene cuatro caminos, no uno. En un buscador, el estado vacío no es un caso raro: es lo que ve la mitad de la gente que filtra demasiado.

| Estado | Qué se muestra |
|---|---|
| **Carga** | Skeleton con la forma de las tarjetas reales, no un spinner centrado. El spinner no informa; el skeleton comunica qué va a aparecer. |
| **Error** | Lenguaje llano y un botón de reintento. "No pudimos cargar los servicios", no "Error 500". |
| **Vacío inicial** | "Todavía no hay servicios en tu zona", con opción de **ampliar el radio**. |
| **Vacío por filtro** | "Ningún servicio coincide con estos filtros", con botón de **limpiarlos**. Un botón de "ampliar a 20 km" convierte un callejón sin salida en una acción. |

**La tarjeta de anuncio** tiene tres niveles de jerarquía, no uno: título semibold, precio en su propio nivel tipográfico (en un marketplace el precio es información de primer orden), y distancia y valoración atenuadas. El estado nunca se comunica solo por color: un anuncio pausado lleva badge con texto, no solo gris. El precio lleva su contexto: "$450 / hora · mínimo 2 h", no "$450". La valoración lleva su recuento: "4,8 · 200 reseñas", con plural correcto.

El árbol de navegación usa grupos por capacidad (los paréntesis agrupan sin aparecer en la URL), la guarda de cada grupo vive en su `_layout` (un solo sitio protege todas las rutas que cuelgan), y el detalle de un anuncio es una ruta dinámica con **deep link** — compartir un anuncio por WhatsApp es una función central del producto, no un extra.

```
app/
├── _layout.tsx              # providers + guardas + estado de carga inicial
├── (auth)/                  # sin sesión: sign-in, sign-up
├── (app)/                   # con sesión: <Tabs>
│   ├── search/              # /search + filters (modal)
│   ├── listings/[id].tsx    # detalle + deep link cerca://listing/abc
│   └── bookings/[id]/review.tsx
└── (provider)/              # requiere la capacidad de proveedor
    ├── my-listings.tsx
    └── listings/new.tsx     # publicar (4 pasos)
```

**El parpadeo de login:** mientras leen el token de `expo-secure-store` no saben si hay sesión. Sin un estado de carga inicial, la app enseña el login 200 ms y parece un bug.

---

## La capa de datos: caché, claves y optimismo

El estado del servidor es una copia local que puede estar vieja. La app lo gestiona con React Query (TanStack Query), y dos decisiones concentran casi todo el valor.

### La clave de caché es una decisión de diseño

Con ocho filtros y coordenadas continuas, una clave ingenua genera una entrada nueva por cada píxel que se mueve el mapa. La solución es redondear las coordenadas **antes** de la clave.

```ts
export const listingKeys = {
  all: ['listings'] as const,
  searches: () => [...listingKeys.all, 'search'] as const,
  search: (f: SearchFilters) => [...listingKeys.searches(), f] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: ListingId) => [...listingKeys.details(), id] as const,
  mine: () => [...listingKeys.all, 'mine'] as const,
} as const;

// 19.432608, -99.133209  →  clave A
// 19.432611, -99.133210  →  clave B   ← una entrada de caché por micromovimiento
export const snapToGrid = (c: Coords) => ({
  lat: Math.round(c.lat * 100) / 100,   // ~1 km
  lng: Math.round(c.lng * 100) / 100,
});
```

### La mutación optimista con rollback

```ts
return useMutation({
  mutationFn: ({ id, next }) => api.setFavorite(id, next),
  onMutate: async ({ id, next }) => {
    await qc.cancelQueries({ queryKey: listingKeys.detail(id) });   // no es opcional
    const prev = qc.getQueryData(listingKeys.detail(id));
    qc.setQueryData(listingKeys.detail(id), (o) => (o ? { ...o, isFavorite: next } : o));
    return { prev };
  },
  onError: (_e, { id }, ctx) => {
    if (ctx?.prev) qc.setQueryData(listingKeys.detail(id), ctx.prev);
  },
  onSettled: (_d, _e, { id }) => {
    qc.invalidateQueries({ queryKey: listingKeys.detail(id) });
    qc.invalidateQueries({ queryKey: listingKeys.searches() });   // ← el olvido universal
  },
});
```

**El error que comete todo el mundo:** invalidar el detalle y olvidar las búsquedas, donde el corazón del favorito también se pinta. *Pregúntense siempre qué otras vistas muestran este dato.* Y `retry: false` para 401/403: reintentar un permiso denegado tres veces es un antipatrón.

---

## Rendimiento: una lista no se pinta con un `map`

Cada tarjeta es una jerarquía de ~7 vistas nativas más una imagen descodificada. Cinco mil tarjetas en una `ScrollView` son 35.000 vistas montadas y 5.000 imágenes en memoria: en gama baja, un crash. Virtualizar no es una optimización: es la forma correcta de renderizar una lista.

- **`FlatList` con `getItemLayout` y `keyExtractor` estable.** El índice nunca sirve como `key`.
- **Las tres estabilizaciones, o `memo()` no sirve de nada:** `memo` en la tarjeta, `useCallback` en `renderItem`, `useCallback` en el handler del padre. Si dejan una inline, las otras dos sobran. Compruébenlo con `console.count("ListingCard")` mientras teclean en el buscador: si el número se dispara, el `memo()` está muerto.
- **La causa nº 1 de crashes en este proyecto son las fotos.** `expo-image` con `cachePolicy: "memory-disk"` y blurhash. Una imagen de 4000×3000 para una tarjeta de 120 px descomprime ~48 MB.
- **Dos hilos:** si cae el FPS de JS, es su código; si cae el de UI, es layout, sombras o imágenes. Saber cuál cae es el 80% del diagnóstico.

**Presupuestos:** scroll ≥ 55 FPS con 5.000 tarjetas en gama media · respuesta a un toque < 100 ms · primeros resultados visibles < 400 ms. No optimicen sin medir, y midan en un dispositivo de gama media: el portátil y el emulador les mienten los dos.

---

## Estilos: el tema como contrato de diseño

NativeWind compila a `StyleSheet` en tiempo de build. No hay CSS, no hay cascada, no hay motor en runtime — por eso `grid`, `float`, `position: fixed` y `before:` no existen. El estilo se organiza así:

- **Colores semánticos, no descriptivos.** `text-status-removed` comunica intención; `text-red-500` solo comunica color. Cuando diseño cambie el rojo, tocan una línea. El precio tiene su propio nivel tipográfico y el área táctil mínima es un token con nombre (`min-h-touch`, 44 puntos).
- **`className` para lo declarativo, `StyleSheet`/`style` solo para números que se conocen en runtime.** Si ven `style={{ backgroundColor: '#fff' }}`, está mal: eso es `bg-surface`. El hexadecimal solo vive en el tema.
- **Reanimated obliga a `useAnimatedStyle`:** el worklet corre en el hilo de UI y necesita un objeto plano; `className` se resuelve en build y ahí no existe.
- **La trampa de Android:** sombra y `overflow: hidden` en el mismo nodo hacen desaparecer la sombra. Un contenedor exterior para la sombra, otro interior para el recorte.
- **`twMerge` + `cva`.** Concatenar strings de clases es el bug silencioso más común: dos paddings, gana el último, y no saben cuál es. `cva` con `VariantProps<typeof button>` deriva los tipos solos.
- **En móvil no hay `:hover`.** El equivalente útil es `active:`, y sí hay que usarlo: sin feedback al pulsar, la app se siente rota y la gente pulsa dos veces.

---

## i18n y accesibilidad

**i18n** con i18next para el texto e `Intl` para dinero, distancias y fechas. Los siete olvidos: plurales con `_one`/`_other`, interpolación, `Intl` para formatos, RTL con `ps-`/`pe-`, la expansión del alemán (el layout tiene que aguantar textos más largos), claves tipadas, y los metadatos de la app. Los mensajes de error de Zod son **claves**, no texto: el schema corre en el servidor, en un worker y en un test, donde no hay idioma.

**Accesibilidad y testing son el mismo trabajo:** si el test encuentra un botón con `getByRole`, VoiceOver también lo encuentra; si necesitan `testID`, ese botón tampoco es accesible.

- Una tarjeta = una parada del lector (`accessible` para agrupar). Sin agrupar, revisar 200 resultados son 1.400 paradas.
- Anunciar el primer error al enviar un formulario.
- `maxFontSizeMultiplier`, **nunca** `allowFontScaling={false}`. La app tiene que aguantar la fuente al 200% sin cortes.
- Ningún estado se comunica solo por color. Área táctil ≥ 44×44.

---

## El stack completo

| Capa | Herramienta | Por qué |
|---|---|---|
| Plataforma | **Expo SDK 57** (development build) | Ciclo de trabajo rápido; a partir del día 2 Expo Go no sirve porque hay código nativo de terceros |
| Lenguaje | **TypeScript** (estricto) | Uniones discriminadas, `satisfies`, tipos derivados de Zod |
| Navegación | **Expo Router** | Rutas por archivos, grupos por capacidad, rutas tipadas, deep links |
| Estilos | **NativeWind** (declarativo) + **StyleSheet**/**Reanimated** (runtime) | Frontera deliberada: `className` describe, `style` transporta números |
| Formularios | **React Hook Form + Zod** (`zodResolver`) | El schema es la única fuente de verdad; la unión discriminada dirige la UI |
| i18n / formato | **i18next + Intl** | Texto traducido y dinero/distancias/fechas por locale |
| Datos remotos | **TanStack Query (React Query)** | Caché, revalidación, mutaciones optimistas, claves jerárquicas |
| Contrato | **`@cerca/contract`** (paquete compartido) | Tipos, schemas de Zod, matriz de permisos y políticas puras, importadas también por el backend |
| Autorización (UX) | `useCan()` · `<Can>` · `withCapacity()` | Oculta o deshabilita; **nunca** es seguridad |
| Nativo distintivo | **expo-location** (con degradación), **expo-image**, **expo-secure-store** | Geolocalización, fotos y token de sesión |
| Listas | **FlatList** virtualizada | Memoria constante con miles de tarjetas |
| Calidad | **ESLint + Prettier + Husky + lint-staged**, `verify.sh` | Un commit con `any` no entra |
| Pruebas | **Vitest + Testing Library + `renderHook`**, Maestro (E2E) | Umbrales por capa; dominio al 100% |
| Entrega | **EAS Build / Update** | Build instalable por enlace; OTA para JS/estilos/traducciones |

---

## Estructura del proyecto

Clean Architecture, con la regla de dependencia protegida por el linter: **las dependencias apuntan hacia dentro; el dominio no sabe que existe React.**

```
apps/mobile/
├── app/                        # rutas finas de Expo Router
└── src/
    ├── domain/                 # entidades, políticas, schemas de Zod, errores. TS puro, cero imports de React
    ├── application/            # casos de uso, puertos (interfaces)
    ├── infrastructure/         # cliente de API, secure storage, expo-location — IMPLEMENTA los puertos
    └── presentation/           # screens, components, hooks de UI, navegación

packages/contract/              # @cerca/contract — compartido con apps/api
    └── src/                    # Actor, Permission, Money, pricingSchema, canReviewBooking, canEditListing…
```

La regla, ejecutable:

```js
// eslint.config.js
'import/no-restricted-paths': ['error', {
  zones: [
    { target: './src/domain', from: './src/presentation', message: 'Domain must not depend on UI.' },
    { target: './src/domain', from: './src/infrastructure' },
    { target: './src/domain', from: './src/application' },
    { target: './src/application', from: './src/presentation' },
  ],
}]
```

**La demostración de 60 segundos:** importen `View` de `react-native` dentro de `src/domain/` y miren caer el linter. Una regla de arquitectura que solo vive en un diagrama se rompe en dos semanas; una que vive en el linter y en CI, no.

---

## Reglas del juego

**El código en inglés, la app bilingüe.** Identificadores, archivos, ramas, commits, tests y claves de i18n en inglés. El texto que ve el usuario vive en `en.json` y `es.json`.

**Nada entra a `main` sin `verify.sh`.** Corre tipos, linter, formato y tests, el mismo archivo en su máquina y en CI. Los hooks tienen presupuesto (pre-commit < 5 s, pre-push < 60 s) porque un hook lento acaba en `--no-verify` y ahí perdieron.

**Si no lo pueden explicar, no lo entregan.** Examen oral aleatorio. No poder explicar una función propia línea a línea cuenta como no entregada, por bien que funcione la app.

**El contrato no se toca a la ligera.** Los schemas de `@cerca/contract` los comparten con el backend. Si cambian una forma, se coordina, porque de eso depende que las dos piezas encajen.

**En el móvil no hay secretos del lado del cliente.** Compilen y busquen `EXPO_PUBLIC_API_KEY` dentro del bundle: se ve. Toda operación privilegiada la hace el servidor.

---

## Fuera del alcance

No trabajen en esto, aunque les sobre tiempo:

- **Chat en tiempo real** entre las partes (US-11).
- **Pagos y liquidaciones** (US-12).
- Lógica de autorización que pretenda *proteger* algo desde el cliente. La autoridad es el servidor.
- Un backend propio. La API ya existe; ustedes la consumen.

Si terminan el alcance base, vayan hacia **profundidad, no hacia funciones nuevas**: más estados cubiertos, mejor accesibilidad, animaciones más pulidas, un buscador más robusto ante la red mala.

---

## Criterios de aceptación · Definition of Done

Parte del DoD es este checklist, verificado en un dispositivo físico.

```
FUNCIONAL
[ ] Los cuatro estados en búsqueda: carga, error, vacío inicial, vacío por filtro
[ ] El vacío por filtro ofrece ampliar el radio o limpiar filtros
[ ] Botón deshabilitado mientras la petición vuela
[ ] Volver atrás tras una mutación muestra el estado nuevo

PERMISOS (reflejo en UI; la autoridad es el servidor)
[ ] Un proveedor no ve editar en el anuncio de otro
[ ] Reseñar dos veces muestra el motivo, no un botón ausente
[ ] Reseñar fuera de plazo muestra su propio mensaje
[ ] Denegar la ubicación en Ajustes: la app ofrece selector de ciudad

DINERO E i18n
[ ] El mismo precio en es-MX, en-US y de-DE
[ ] Modelo de precio visible: "/hora · mínimo 2 h"
[ ] Distancia en km o millas según locale
[ ] Plurales correctos con 0, 1 y 2 reseñas
[ ] Layout intacto en alemán

ACCESIBILIDAD
[ ] Una tarjeta = una parada del lector
[ ] Errores anunciados al enviar
[ ] Fuente al 200% sin cortes
[ ] Ningún estado comunicado solo por color
[ ] Área táctil ≥ 44×44

RENDIMIENTO
[ ] Scroll ≥ 55 FPS con 5.000 tarjetas en gama media
[ ] Memoria estable al hacer scroll largo
[ ] Modo avión a mitad de una reserva: mensaje claro, sin pérdida

ENTREGA
[ ] Probado en dispositivo físico
[ ] Instalado desde una build de preview por alguien que no lo escribió
[ ] `./scripts/verify.sh` en verde y `main` protegido
```

---

## Cuándo está terminado

Al cierre, su equipo tiene que poder pararse frente a alguien que nunca vio la app, en un teléfono real, y mostrarle:

- que puede **buscar cerca de sí**, con filtros, entre miles de resultados, y abrir un detalle — con sus cuatro estados cubiertos;
- que puede **publicar un anuncio** en cuatro pasos, con precio y moneda, zona y fotos;
- que puede **reservar y reseñar**, y que reseñar dos veces o fuera de plazo muestra el motivo exacto, no un botón que desaparece;
- que **niegan la ubicación** y la app sigue siendo usable;
- que el **mismo precio** se ve bien en tres locales y la distancia se reformatea a millas;
- que **la lista de 5.000 tarjetas** va fluida y el lector de pantalla la recorre una tarjeta por parada;
- y que otra persona **instala la app desde un enlace** y la abre sin que ustedes toquen nada.

Lo que se llevan no es la app: es el criterio para consumir cualquier API con cabeza —validar el límite, separar experiencia de seguridad, tratar la caché como una copia que caduca— en el siguiente proyecto, con otro dominio y otras herramientas.
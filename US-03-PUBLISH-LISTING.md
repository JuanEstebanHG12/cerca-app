# US-03 — Publicar un anuncio en 3 pasos

> Documento de decisiones técnicas para el wizard de publicación. Acompaña al código, no lo
> reemplaza — cada sección enlaza a los archivos reales.

**Criterio de aceptación (Cerca.md, US-03):** elegir "por hora" pide horas mínimas; "presupuesto"
no pide precio; el borrador se puede retomar. (El criterio original también menciona "las fotos
suben" — ver §1.1: no se construyó, y por qué.)

---

## 1. Qué se decidió antes de escribir código

### 1.1 Fotos: el backend no las tiene implementadas

Antes de tocar un archivo se verificó el contrato real de `cerca-api` (no solo Cerca.md, que
describe `POST /listings/{id}/photos:presign` como si existiera). Búsqueda de `photo`/`Photo` en
todo `apps/api/src` y en `@cerca/contract`: **cero resultados**. Solo existe la tabla
`ListingPhoto` en Prisma, vacía, sin ningún endpoint que la use.

Se le preguntó al usuario cómo proceder, dado que el backend no se toca. Se decidió: **wizard de
3 pasos, sin paso de fotos**, documentado como gap conocido — igual que el mapa interactivo quedó
fuera de US-02. El día que exista `photos:presign`, se añade un cuarto paso sin tocar los tres
existentes.

### 1.2 La rama necesitaba el trabajo de US-02

`feature/publish-listing` se creó desde `develop`, que no tenía ninguno de los commits de
`feature/home-screen` (aún no fusionada). Sin ese trabajo, `Money`, `Pricing`, `Category` y el
wiring de React Query no existían en la rama — y este formulario los necesita todos. Se decidió
`git merge feature/home-screen` (operación 100% local, no depende del permiso de push que
todavía no existía) en vez de duplicar ese código o esperar a que se fusionara primero.

---

## 2. El contrato real, verificado dos veces

La lección de US-02 (§6 de ese documento) fue no confiar en Cerca.md sin verificar contra el
código real del backend. Esta tarea encontró **dos discrepancias más** de la misma clase, ambas
detectadas *antes* de escribir el schema del front, no después de un bug en producción:

1. **`ListingResponse.status` también es un string plano**, no la unión discriminada rica que
   Cerca.md sugiere (`{ kind: 'published', publishedAt }`, etc.). US-02 ya había encontrado esto
   para los resultados de búsqueda; esta tarea confirmó que **también aplica al detalle, a
   `POST /listings` y a `POST /listings/:id/publish`** — la unión rica no existe en ningún lado
   de `@cerca/contract`, ni siquiera en el endpoint de detalle. Ver
   [`listing.ts`](src/domain/models/listing.ts).

2. **Convertirse en proveedor no actualiza el token ya emitido.** `POST /me/capacities/provider`
   sí graba la nueva capacidad en la base de datos, pero el JWT de acceso es autocontenido — las
   `capacities` quedan fijas en el token desde el momento en que se firmó. Se comprobó
   directamente: pedir un anuncio con el token viejo después de `becomeProvider()` sigue dando
   `403 MISSING_CAPABILITY`, aunque el servidor ya concedió el permiso. La solución real es
   `POST /auth/refresh` justo después — se verificó decodificando el JWT nuevo, que sí trae
   `"capacities":["customer","provider"]`. Ver §4.3 y
   [`become-provider.ts`](src/application/use-cases/become-provider.ts).

Ambos hallazgos cambiaron el diseño antes de escribirlo, no después de que algo fallara en el
dispositivo.

---

## 3. Arquitectura: los archivos por capa

```
src/domain/models/       create-listing.ts (nuevo), listing.ts (+ listingSchema), money.ts (+ toMinorUnits), actor.ts (+ hasCapacity)
src/domain/errors/       listing-errors.ts (nuevo: CreateListingError, PublishListingError), auth-errors.ts (+ BecomeProviderError)

src/application/ports/   listing-gateway.ts (+ create, publish), auth-gateway.ts (+ becomeProvider, refresh), listing-draft-storage.ts (nuevo)
src/application/use-cases/  create-listing.ts, publish-listing.ts, become-provider.ts (nuevos)

src/infrastructure/api/       listing-api-gateway.ts (+ create, publish), auth-api-gateway.ts (+ becomeProvider, refresh)
src/infrastructure/storage/   listing-draft-storage.ts (nuevo, AsyncStorage)

src/presentation/publish/     publish-form-schema.ts, to-create-listing-input.ts, use-publish-draft.ts,
                               use-create-listing.ts, publish-step-basics.tsx, publish-step-pricing.tsx,
                               publish-step-location.tsx, become-provider-prompt.tsx, publish-wizard.tsx
src/presentation/components/  chip.tsx (nuevo, extraído de FiltersSheet)
src/presentation/auth/        auth-context.tsx (+ accessToken, becomeProvider)

app/(app)/listings/new.tsx    la ruta
app/(app)/index.tsx           + botón flotante "Publicar"
```

---

## 4. Decisiones de código, una por una

### 4.1 Un solo `useForm`, no tres — así es "RHF multipaso"

**Archivo:** [`publish-form-schema.ts`](src/presentation/publish/publish-form-schema.ts),
[`publish-wizard.tsx`](src/presentation/publish/publish-wizard.tsx)

Los tres pasos comparten una única instancia de React Hook Form. Cambiar de paso cambia qué
campos son *visibles*, no a quién pertenecen — así nada se pierde yendo hacia atrás y adelante.
`STEP_FIELDS` mapea cada paso a sus campos, y `form.trigger(STEP_FIELDS[step])` valida solo esos
antes de dejar avanzar con "Siguiente", en vez de bloquear con errores del paso 3 mientras el
usuario sigue en el paso 1.

### 4.2 El schema del borrador es más permisivo que el del formulario, a propósito

**Archivo:** [`publish-form-schema.ts`](src/presentation/publish/publish-form-schema.ts),
[`use-publish-draft.ts`](src/presentation/publish/use-publish-draft.ts)

`publishFormShapeSchema` (sin reglas cruzadas) y `publishFormSchema` (con `.superRefine` encima)
son schemas distintos a propósito. El borrador guardado en disco se valida contra el primero: un
borrador es, por definición, incompleto — es justo lo que "el borrador se puede retomar" quiere
decir. Si se validara contra el segundo (el que exige que "por hora" tenga horas mínimas, que
haya coordenadas, etc.), **cualquier borrador a medio llenar se descartaría silenciosamente al
recargarlo**, que es exactamente el bug que este criterio de aceptación pide evitar.

### 4.3 `becomeProvider()` no es una llamada, son dos

**Archivo:** [`become-provider.ts`](src/application/use-cases/become-provider.ts)

```ts
await this.authGateway.becomeProvider(session.accessToken);
const refreshed = await this.authGateway.refresh(session.refreshToken);
await this.sessionStorage.save(refreshed);
```

Ver §2.2 para el hallazgo. Sin el `refresh`, el flujo completo ("conviértete en proveedor" →
publicar) fallaría con 403 en el paso siguiente, con el usuario viendo un error que no tiene
explicación visible ("si el servidor ya me dejó ser proveedor, ¿por qué no puedo publicar?"). El
`AuthContext` reacciona igual que ante un `signIn`/`signUp`: relee la sesión de disco para
refrescar el `accessToken` expuesto, en vez de cambiar la forma de `BecomeProviderResult`.

### 4.4 `Pricing` dirige el formulario, no al revés

**Archivos:** [`publish-step-pricing.tsx`](src/presentation/publish/publish-step-pricing.tsx),
[`to-create-listing-input.ts`](src/presentation/publish/to-create-listing-input.ts)

Elegir el modelo cambia qué campos se pintan: "presupuesto" no muestra ningún campo de precio —
ni siquiera uno opcional, aunque el backend lo aceptaría (`startingFrom?: Money`). El criterio de
aceptación es literal ("'presupuesto' no pide precio"), así que `toPricing()` siempre manda
`startingFrom: undefined` para ese modelo, y `JSON.stringify` omite la clave por completo — no se
manda `null`, se manda *nada*, que es lo que un campo `.optional()` (no `.nullable()") espera.

"Por hora" exige horas mínimas como regla real, no solo como placeholder: `publishFormSchema`
rechaza el paso si `minimumHours` no es un número positivo, y el mensaje aparece bajo ese campo
específico.

### 4.5 `toMinorUnits` — la otra mitad de `formatMoney`

**Archivo:** [`money.ts`](src/domain/models/money.ts)

`formatMoney` ya dividía por `10 ** minorUnitDigits(currency)` para mostrar un precio. Este
formulario necesitaba la operación inversa — un proveedor escribe "450" y eso tiene que
convertirse en el entero `amountMinor` que `Money` exige — así que `toMinorUnits` reutiliza la
misma tabla de dígitos por moneda en vez de que exista una segunda conversión escrita a mano en
otro archivo, que es exactamente el tipo de bug que "dividir entre 100 a mano" ya es en
Cerca.md.

### 4.6 El punto de entrada nunca se oculta

**Archivo:** [`publish-wizard.tsx`](src/presentation/publish/publish-wizard.tsx),
[`become-provider-prompt.tsx`](src/presentation/publish/become-provider-prompt.tsx)

El botón flotante "Publicar" en Home es visible para cualquier sesión iniciada, tenga o no la
capacidad de proveedor — porque "hacerse proveedora es una acción dentro de la app, no un
registro distinto" (Cerca.md). `PublishWizard` decide *adentro* si mostrar el formulario o el
prompt de "conviértete en proveedor"; Home no necesita saber nada de capacidades. Es la
distinción de Cerca.md entre "sin capacidad → oculta el botón" (no aplica: cualquiera puede
llegar a ser proveedor) y "bloqueado por política → explica" (si aplica: el prompt explica qué
falta y cómo resolverlo, en vez de que el botón simplemente no lleve a ningún lado).

### 4.7 `CreateListingError` / `PublishListingError`, no *duck typing*

**Archivo:** [`listing-api-gateway.ts`](src/infrastructure/api/listing-api-gateway.ts)

`import/no-restricted-paths` prohíbe que `application` importe de `infrastructure` — así que los
casos de uso no pueden hacer `error instanceof ApiError` directamente (esa clase vive en
infraestructura). El gateway (que sí conoce `ApiError`/`NetworkError`) las traduce a errores de
dominio (`CreateListingError`, con un `reason` tipado) antes de lanzarlas, y el caso de uso solo
conoce esas — mismo patrón que `AuthApiGateway` ya usaba para `SignInError`.

---

## 5. Lo que NO se construyó, y por qué

| Pendiente | Por qué se dejó fuera |
|---|---|
| Subida de fotos | El backend no tiene `photos:presign` implementado — ver §1.1 |
| Pantalla "Mis anuncios" | No la pide el criterio de aceptación de US-03; retomar el borrador es local (RHF + AsyncStorage), no requiere listar anuncios del servidor |
| Refresco silencioso de token en segundo plano | Solo se resolvió el caso puntual de `becomeProvider` (§4.3). Un access token de 15 min que expira **durante** el wizard (posible si el usuario deja el borrador a medias varias horas) da un error de sesión expirada, no un reintento silencioso — construir eso es un interceptor de alcance mayor al de esta tarea |
| Consumir `@cerca/contract` en vez de mirror manual | Mismo gap heredado de US-02 §6 — sigue sin resolverse |

---

## 6. Verificación hecha

- `npx tsc --noEmit` → sin errores
- `npx eslint .` → sin errores
- **Verificación en vivo contra `cerca-api` real** (no solo revisión estática del contrato):
  - `sign-in` → `POST /me/capacities/provider` → `POST /auth/refresh` → JWT decodificado a mano,
    confirmando que el nuevo token trae `"capacities":["customer","provider"]`.
  - `POST /listings` + `POST /listings/:id/publish` para los tres modelos de precio (`fixed`,
    `hourly`, `quote`), con las respuestas reales parseadas por `listingSchema` sin error.
  - El caso `quote` confirmado explícitamente: la respuesta real trae `"pricing":{"model":"quote"}`
    sin `startingFrom`, tal como lo manda `toCreateListingInput`.
- **No probado en un dispositivo físico** — el wizard en sí (navegación entre pasos, teclado,
  persistencia del borrador tras cerrar y reabrir la app) solo se verificó por lectura de código
  y por el contrato de red real, no interactuando con la UI en un teléfono.

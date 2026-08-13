# US-03 — Publicar un anuncio en 4 pasos

> Documento de decisiones técnicas para el wizard de publicación. Acompaña al código, no lo
> reemplaza — cada sección enlaza a los archivos reales.

**Criterio de aceptación (Cerca.md, US-03):** elegir "por hora" pide horas mínimas; "presupuesto"
no pide precio; el borrador se puede retomar; las fotos suben. Los tres primeros están completos
y verificados en vivo. El cuarto tiene la mitad construida — el picker, el preview y el intento
real de subida existen — pero **la subida en sí no puede completarse porque el backend no tiene
el endpoint** (ver §1.1 y §1.3). Es un gap conocido, documentado, no una omisión silenciosa.

---

## 1. Qué se decidió antes de escribir código

### 1.1 Fotos: el backend no las tiene implementadas

Antes de tocar un archivo se verificó el contrato real de `cerca-api` (no solo Cerca.md, que
describe `POST /listings/{id}/photos:presign` como si existiera). Búsqueda de `photo`/`Photo` en
todo `apps/api/src` y en `@cerca/contract`: **cero resultados** en el flujo real (ni en el
controller, ni en el use-case de creación, ni en el presenter). Solo existe la tabla
`ListingPhoto` en Prisma (`listingId`, `key`, `blurhash`), sin ningún endpoint que la use.

### 1.2 La rama necesitaba el trabajo de US-02

`feature/publish-listing` se creó desde `develop`, que no tenía ninguno de los commits de
`feature/home-screen` (aún no fusionada). Sin ese trabajo, `Money`, `Pricing`, `Category` y el
wiring de React Query no existían en la rama — y este formulario los necesita todos. Se decidió
`git merge feature/home-screen` (operación 100% local, no depende del permiso de push que
todavía no existía) en vez de duplicar ese código o esperar a que se fusionara primero.

### 1.3 Fotos, segunda vuelta: construir la UI real detrás de un puerto

La decisión original (§1.1) fue dejar el wizard en 3 pasos y documentar el gap, igual que el mapa
interactivo quedó fuera de US-02. Se reconsideró: no tener el endpoint no significa que no haya
trabajo real de cliente por hacer. Se construyó el cuarto paso completo —selección múltiple,
preview local, quitar foto, todo con `expo-image-picker`— detrás de un `PhotoGateway` (puerto +
implementación, mismo patrón que `ListingGateway`, ver §3.8) que apunta exactamente al endpoint
que Cerca.md documenta.

Dos reglas gobernaron esta decisión:

1. **El archivo que hoy no tiene con quién hablar debe ser el único que cambie el día que el
   backend exista.** `photo-api-gateway.ts` es ese archivo; nada más en la app sabe que la
   subida está rota.
2. **Nunca simular éxito.** La subida es *best-effort*: si falla (hoy, siempre, porque el
   endpoint no existe), el anuncio se publica igual —no depende de las fotos— pero el wizard no
   navega en silencio. Muestra explícitamente cuántas fotos no se subieron antes de volver. Una
   foto por defecto fingiendo que la subida funcionó nunca fue una opción — ver §3.8.

### 1.4 El contrato real, verificado tres veces

La lección de US-02 (§6 de ese documento) fue no confiar en Cerca.md sin verificar contra el
código real del backend. Esta tarea encontró **tres discrepancias más** de la misma clase — dos
detectadas por lectura del contrato antes de escribir el schema del front, la tercera por una
prueba real en dispositivo que sí llegó a romperse:

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
   `"capacities":["customer","provider"]`. Ver §3.3 y
   [`become-provider.ts`](src/application/use-cases/become-provider.ts).

3. **`minimumHours` exige entero entre 1 y 12 — y el cliente no lo comprobaba.** Este no se
   encontró leyendo el contrato primero: se encontró probando el wizard completo en un
   dispositivo real, publicando con el modelo "por hora", y viendo `POST /listings` responder
   400 con un mensaje genérico ("Revisa los datos del formulario e intenta de nuevo") sin decir
   qué campo falló. `pricing.ts` en `@cerca/contract` exige
   `minimumHours: z.number().int().min(1).max(12)`; el cliente solo validaba `> 0`, y el
   `TextInput` ni siquiera impedía escribir decimales (`keyboardType="decimal-pad"`). Corregido en
   ambas puntas: la regla del schema ahora exige entero 1–12 (mismo mensaje que el backend
   rechazaría), el teclado pasó a `number-pad`, y el error real del servidor ya no se descarta —
   ver §3.9.

Las tres cambiaron el diseño o el código antes de que el problema volviera a aparecer en otro
lado, pero la tercera es un recordatorio de que la lectura estática del contrato no sustituye
probar el flujo completo: el mismatch de tipos era invisible hasta que alguien llenó el
formulario con un valor real.

---

## 2. Arquitectura: los archivos por capa

```
src/domain/models/       create-listing.ts, listing.ts (+ listingSchema), money.ts (+ toMinorUnits, currencyDisplay: 'code'),
                          actor.ts (+ hasCapacity), listing-photo.ts (nuevo: LocalPhoto, PhotoUploadTarget)
src/domain/errors/       listing-errors.ts (CreateListingError, PublishListingError), auth-errors.ts (+ BecomeProviderError),
                          photo-errors.ts (nuevo: PhotoUploadError)

src/application/ports/   listing-gateway.ts (+ create, publish), auth-gateway.ts (+ becomeProvider, refresh),
                          listing-draft-storage.ts, photo-gateway.ts (nuevo: presign, upload)
src/application/use-cases/  create-listing.ts, publish-listing.ts, become-provider.ts,
                             upload-listing-photos.ts (nuevo: best-effort, reporta {uploaded, failed})

src/infrastructure/api/       listing-api-gateway.ts (+ create, publish, + log de detalle real en __DEV__),
                               auth-api-gateway.ts (+ becomeProvider, refresh),
                               photo-api-gateway.ts (nuevo: presign vía POST, upload vía PUT directo a la URL firmada)
src/infrastructure/storage/   listing-draft-storage.ts (AsyncStorage)

src/presentation/publish/     publish-form-schema.ts (+ photos, minimumHours entero 1-12), to-create-listing-input.ts,
                               use-publish-draft.ts, use-create-listing.ts (+ sube fotos entre create y publish),
                               publish-step-basics.tsx, publish-step-pricing.tsx (+ number-pad),
                               publish-step-location.tsx, publish-step-photos.tsx (nuevo, paso 4),
                               become-provider-prompt.tsx, publish-wizard.tsx (+ paso 4, + aviso si fallan fotos)
src/presentation/components/  chip.tsx (extraído de FiltersSheet)
src/presentation/auth/        auth-context.tsx (+ accessToken, becomeProvider)

app/(app)/listings/new.tsx    la ruta
app/(app)/index.tsx           + botón flotante "Publicar"
app.json                      + plugin expo-image-picker (permiso de fotos)
```

---

## 3. Decisiones de código, una por una

### 3.1 Un solo `useForm`, no cuatro — así es "RHF multipaso"

**Archivo:** [`publish-form-schema.ts`](src/presentation/publish/publish-form-schema.ts),
[`publish-wizard.tsx`](src/presentation/publish/publish-wizard.tsx)

Los cuatro pasos comparten una única instancia de React Hook Form. Cambiar de paso cambia qué
campos son *visibles*, no a quién pertenecen — así nada se pierde yendo hacia atrás y adelante.
`STEP_FIELDS` mapea cada paso a sus campos, y `form.trigger(STEP_FIELDS[step])` valida solo esos
antes de dejar avanzar con "Siguiente", en vez de bloquear con errores de un paso posterior
mientras el usuario sigue atrás. `photos` está en `STEP_FIELDS[3]` sin ninguna regla asociada —
el campo es opcional, pero la entrada queda para que `STEP_FIELDS` siga documentando cada paso
completo, no solo los que validan algo.

### 3.2 El schema del borrador es más permisivo que el del formulario, a propósito

**Archivo:** [`publish-form-schema.ts`](src/presentation/publish/publish-form-schema.ts),
[`use-publish-draft.ts`](src/presentation/publish/use-publish-draft.ts)

`publishFormShapeSchema` (sin reglas cruzadas) y `publishFormSchema` (con `.superRefine` encima)
son schemas distintos a propósito. El borrador guardado en disco se valida contra el primero: un
borrador es, por definición, incompleto — es justo lo que "el borrador se puede retomar" quiere
decir. Si se validara contra el segundo (el que exige que "por hora" tenga horas mínimas válidas,
que haya coordenadas, etc.), **cualquier borrador a medio llenar se descartaría silenciosamente
al recargarlo**, que es exactamente el bug que este criterio de aceptación pide evitar. `photos`
sigue esa misma regla: viaja en ambos schemas como un array simple, sin `.default()` (ver nota en
el propio archivo — `.default()` rompía los genéricos de `zodResolver` por la divergencia entre
tipo de entrada y de salida), así que las fotos elegidas también sobreviven a cerrar la app a
mitad del wizard.

### 3.3 `becomeProvider()` no es una llamada, son dos

**Archivo:** [`become-provider.ts`](src/application/use-cases/become-provider.ts)

```ts
await this.authGateway.becomeProvider(session.accessToken);
const refreshed = await this.authGateway.refresh(session.refreshToken);
await this.sessionStorage.save(refreshed);
```

Ver §1.4 (hallazgo 2). Sin el `refresh`, el flujo completo ("conviértete en proveedor" → publicar)
fallaría con 403 en el paso siguiente, con el usuario viendo un error que no tiene explicación
visible ("si el servidor ya me dejó ser proveedor, ¿por qué no puedo publicar?"). El
`AuthContext` reacciona igual que ante un `signIn`/`signUp`: relee la sesión de disco para
refrescar el `accessToken` expuesto, en vez de cambiar la forma de `BecomeProviderResult`.

### 3.4 `Pricing` dirige el formulario, no al revés

**Archivos:** [`publish-step-pricing.tsx`](src/presentation/publish/publish-step-pricing.tsx),
[`to-create-listing-input.ts`](src/presentation/publish/to-create-listing-input.ts)

Elegir el modelo cambia qué campos se pintan: "presupuesto" no muestra ningún campo de precio —
ni siquiera uno opcional, aunque el backend lo aceptaría (`startingFrom?: Money`). El criterio de
aceptación es literal ("'presupuesto' no pide precio"), así que `toPricing()` siempre manda
`startingFrom: undefined` para ese modelo, y `JSON.stringify` omite la clave por completo — no se
manda `null`, se manda *nada*, que es lo que un campo `.optional()` (no `.nullable()`) espera.
Desde US-04, `toPricing` vive exportada (junto con el tipo `PricingFormValues` que solo pide los
cinco campos de precio, no el formulario completo) para que el formulario de edición la reutilice
sin duplicar esta lógica — ver US-04-EDIT-LISTING.md §3.

"Por hora" exige horas mínimas como regla real, no solo como placeholder — y desde el hallazgo 3
de §1.4, exige específicamente un entero entre 1 y 12, igual que el backend: `publishFormSchema`
rechaza el paso si `minimumHours` no cumple eso, con un mensaje bajo ese campo específico
("Ingresa un número entero de 1 a 12"), y el teclado (`number-pad`) ya no deja escribir un
decimal que de todos modos sería rechazado después.

### 3.5 `toMinorUnits` — la otra mitad de `formatMoney`

**Archivo:** [`money.ts`](src/domain/models/money.ts)

`formatMoney` ya dividía por `10 ** minorUnitDigits(currency)` para mostrar un precio. Este
formulario necesitaba la operación inversa — un proveedor escribe "450" y eso tiene que
convertirse en el entero `amountMinor` que `Money` exige — así que `toMinorUnits` reutiliza la
misma tabla de dígitos por moneda en vez de que exista una segunda conversión escrita a mano en
otro archivo, que es exactamente el tipo de bug que "dividir entre 100 a mano" ya es en
Cerca.md.

*Nota aparte, fuera del alcance de US-03 pero en el mismo archivo:* se corrigió también
`formatMoney` para que siempre muestre el código ISO de la moneda (`currencyDisplay: 'code'`) en
vez del símbolo por defecto de `Intl`. COP, MXN y USD comparten el mismo glifo "$", y ese símbolo
solo se desambigua según el locale del dispositivo, no según la moneda real del anuncio — con el
comportamiento anterior, el mismo "$" podía significar tres cosas distintas dependiendo de quién
mirara. Esto es terreno de US-07, no de esta historia, pero se arregló aquí porque el bug se
detectó publicando anuncios en monedas distintas durante las pruebas de este wizard.

### 3.6 El punto de entrada nunca se oculta

**Archivo:** [`publish-wizard.tsx`](src/presentation/publish/publish-wizard.tsx),
[`become-provider-prompt.tsx`](src/presentation/publish/become-provider-prompt.tsx)

El botón flotante "Publicar" en Home es visible para cualquier sesión iniciada, tenga o no la
capacidad de proveedor — porque "hacerse proveedora es una acción dentro de la app, no un
registro distinto" (Cerca.md). `PublishWizard` decide *adentro* si mostrar el formulario o el
prompt de "conviértete en proveedor"; Home no necesita saber nada de capacidades. Es la
distinción de Cerca.md entre "sin capacidad → oculta el botón" (no aplica: cualquiera puede
llegar a ser proveedor) y "bloqueado por política → explica" (sí aplica: el prompt explica qué
falta y cómo resolverlo, en vez de que el botón simplemente no lleve a ningún lado).

### 3.7 `CreateListingError` / `PublishListingError`, no *duck typing*

**Archivo:** [`listing-api-gateway.ts`](src/infrastructure/api/listing-api-gateway.ts)

`import/no-restricted-paths` prohíbe que `application` importe de `infrastructure` — así que los
casos de uso no pueden hacer `error instanceof ApiError` directamente (esa clase vive en
infraestructura). El gateway (que sí conoce `ApiError`/`NetworkError`) las traduce a errores de
dominio (`CreateListingError`, con un `reason` tipado) antes de lanzarlas, y el caso de uso solo
conoce esas — mismo patrón que `AuthApiGateway` ya usaba para `SignInError`. Desde US-04,
`ApiError` también carga el campo `reason` del `problem+json` (antes se descartaba) — ver
US-04-EDIT-LISTING.md §3 para por qué eso importaba para editar.

### 3.8 Fotos: subida *best-effort*, nunca una foto falsa

**Archivos:** [`photo-gateway.ts`](src/application/ports/photo-gateway.ts),
[`upload-listing-photos.ts`](src/application/use-cases/upload-listing-photos.ts),
[`photo-api-gateway.ts`](src/infrastructure/api/photo-api-gateway.ts),
[`use-create-listing.ts`](src/presentation/publish/use-create-listing.ts)

`UploadListingPhotosUseCase` sube una foto a la vez (`presign` + `upload`), y si una falla,
sigue con las siguientes en vez de abortar — reporta `{uploaded, failed}` en vez de lanzar. La
subida ocurre **después de `create` y antes de `publish`**, porque `photos:presign` necesita un
`listingId` real (el anuncio nace como borrador, así que ya existe cuando se intenta subir).

`PhotoApiGateway.presign()` llama al endpoint documentado; hoy siempre responde 404 porque no
existe, y ese 404 se mapea a `PhotoUploadError('not_available', …)` — una razón distinta de un
error real, para no confundir "la funcionalidad no está desplegada" con "algo se rompió".
`upload()` hace un `PUT` directo a la URL firmada (no pasa por `httpClient`, que siempre antepone
`API_BASE_URL` y siempre manda JSON — una URL firmada de S3 no es ninguna de las dos cosas).

En `PublishWizard`, si `photosFailed > 0` tras publicar, el wizard **no navega hacia atrás en
silencio**: muestra "Publicamos tu anuncio, pero N foto(s) no se pudieron subir" y exige un toque
explícito en "Volver". El anuncio ya está publicado (eso no depende de las fotos), pero el estado
real de las fotos nunca se esconde detrás de una navegación automática.

### 3.9 El detalle real del servidor no se descarta en `__DEV__`

**Archivo:** [`listing-api-gateway.ts`](src/infrastructure/api/listing-api-gateway.ts)

`toCreateListingError` mapeaba cualquier 400/422 a `reason: 'validation_error'`, y la pantalla
solo muestra el texto genérico mapeado a ese `reason` — correcto para el usuario final (Cerca.md:
los mensajes de error son claves, no texto de servidor), pero eso hacía invisible durante
desarrollo *cuál* campo rechazó el backend (ver hallazgo 3 de §1.4, que costó una prueba manual
completa para diagnosticar). Ahora, solo si `__DEV__` es verdadero, se hace
`console.warn('[create-listing] server rejected the payload:', error.message)` con el `detail`
real de la respuesta RFC 9457 — nunca llega a un build de release, y el usuario final sigue
viendo únicamente el mensaje mapeado.

---

## 4. Lo que NO se construyó, y por qué

| Pendiente | Por qué se dejó fuera |
|---|---|
| Confirmación real de la subida de fotos | El backend no tiene `photos:presign` implementado — el picker, el preview y el intento de subida sí existen (§1.3, §3.8); lo que falta es que el otro lado de la llamada exista |
| Pantalla "Mis anuncios" | No la pide el criterio de aceptación de US-03 ni US-04 (ver US-04-EDIT-LISTING.md §4) — retomar el borrador es local (RHF + AsyncStorage), no requiere listar anuncios del servidor |
| Refresco silencioso de token en segundo plano | Solo se resolvió el caso puntual de `becomeProvider` (§3.3). Un access token de 15 min que expira **durante** el wizard (posible si el usuario deja el borrador a medias varias horas) da un error de sesión expirada, no un reintento silencioso — construir eso es un interceptor de alcance mayor al de esta tarea |
| Consumir `@cerca/contract` en vez de mirror manual | Mismo gap heredado de US-02 §6 — sigue sin resolverse |
| i18n real para `formatMoney` (locale del dispositivo) | `formatMoney` sigue sin recibir un `locale` explícito en ninguna pantalla — el separador de miles/decimales depende del locale por defecto del motor JS, no del idioma real leído del dispositivo. Es US-07 (`i18next` aún no está conectado en el proyecto), no esta historia |

---

## 5. Verificación hecha

- `npx tsc --noEmit` → sin errores
- `npx eslint .` → sin errores
- **Verificación en vivo contra `cerca-api` real** (no solo revisión estática del contrato):
  - `sign-in` → `POST /me/capacities/provider` → `POST /auth/refresh` → JWT decodificado a mano,
    confirmando que el nuevo token trae `"capacities":["customer","provider"]`.
  - `POST /listings` + `POST /listings/:id/publish` para los tres modelos de precio (`fixed`,
    `hourly`, `quote`), con las respuestas reales parseadas por `listingSchema` sin error.
  - El caso `quote` confirmado explícitamente: la respuesta real trae `"pricing":{"model":"quote"}`
    sin `startingFrom`, tal como lo manda `toCreateListingInput`.
  - El paso de fotos se probó en dispositivo real: seleccionar, previsualizar y quitar fotos
    funciona; el intento de subida falla como se espera (404, `photos:presign` no existe), el
    anuncio se publica igual, y el aviso "N foto(s) no se pudieron subir" aparece antes de volver
    — el camino de falla también quedó verificado, no solo el camino feliz.
  - El bug de `minimumHours` (hallazgo 3, §1.4) se encontró publicando con el modelo "por hora" en
    dispositivo real, no por lectura de código — el 400 genérico del servidor fue lo que llevó a
    comparar el schema del cliente contra `pricing.ts` del backend.
- **No probado:** cierre y reapertura completa de la app a mitad del wizard con fotos ya
  seleccionadas (persistencia del borrador incluyendo `photos`) — el mecanismo es el mismo que ya
  se probó para el resto de los campos (§3.2), pero no se repitió la prueba manual específica con
  fotos en el borrador.

---

## 6. Incidente: este documento se perdió una vez

La primera actualización de este archivo (agregando §1.3, el hallazgo 3 de §1.4, y §3.8/§3.9) se
escribió en disco pero nunca se comiteó. Un cambio de rama posterior (`git checkout develop` →
recrear `feature/edit-own-listings` desde `origin/feature/publish-listing`) restauró la versión
vieja del archivo y la actualización se perdió silenciosamente hasta notarlo durante US-04. Este
archivo es la reconstrucción de esa actualización. Lección operativa: un documento sin comitear
no sobrevive un cambio de rama, igual que cualquier otro archivo del repo — trátenlo con la misma
disciplina de commit que el código.

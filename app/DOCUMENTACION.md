# Panel Operativo Furor — documentación técnica

App interna de Furor Marketing: agenda, tareas, chat, clientes, contenido, ads de clientes, prospectos y una parte privada de Dirección (finanzas) que solo ve el administrador.

- **App:** https://furormarketing.github.io/furor-web/app/
- **Dueño:** Marcelo Carrizo (admin), isaiascarrizo123@gmail.com
- **Código:** este repositorio, carpeta `app/`. El resto del repo es el sitio web público de Furor.
- **Datos:** proyecto de Supabase `wiotdoxqaymchwzaxdrj` (Postgres, Auth, Storage, Realtime y una Edge Function).

> El repositorio es **público**. Acá no va ninguna clave secreta. La seguridad de los datos depende de las políticas RLS de Supabase (ver más abajo). La `anon key` de `config.js` es pública por diseño.

---

## 1. Arquitectura en una línea

Página estática (HTML + JS sin frameworks) servida por GitHub Pages, que habla directo con Supabase a través de `supabase-js`. No hay servidor propio: todo el control de acceso está en la base (RLS).

```
Celular / compu ──► GitHub Pages (app/) ──► Supabase
                                             ├─ Auth (login con mail)
                                             ├─ Postgres + RLS (datos)
                                             ├─ Realtime (cambios en vivo)
                                             ├─ Storage (archivos)
                                             ├─ pg_net + Edge Function "notificar" (push)
                                             └─ pg_cron (resumen diario 8:30)
```

## 2. Archivos

| Archivo | Qué es |
|---|---|
| `app/index.html` | Contenedor. Carga fuentes, `styles.css?v=N`, supabase-js 2.45.4 (UMD), `config.js` y `app.js?v=N`. |
| `app/config.js` | URL de Supabase, anon key y clave pública VAPID para push. Solo datos públicos. |
| `app/app.js` | Toda la app del equipo (~2.000 líneas). Estado global `S`, `render()` repinta la vista actual. |
| `app/direccion.js` | Sub-app privada de Dirección. Se descarga solo cuando entra el admin (`#direccion`). Expone `window.DIR`. |
| `app/styles.css` | Estilos. Variables de color al principio (`--brand` = verde Furor `#185638`). Responsive con `@media (max-width:900px)`. |
| `app/sw.js` | Service worker: red primero (`cache: "no-cache"`), recibe notificaciones push y abre la app al tocarlas. |
| `app/manifest.webmanifest` | Para instalar como app (iPhone: Safari → Compartir → Agregar a inicio). |
| `app/img/logo-furor.png` | Logo original de Furor. **No modificar, recortar ni recrear.** |
| `app/_db/schema.sql` | Esquema inicial (histórico; los cambios posteriores se aplicaron como migraciones en Supabase). |
| `app/_db/functions/notificar/index.ts` | Código de la Edge Function de notificaciones (copia de lo desplegado). |

## 3. Cómo publicar un cambio

1. Editar `app/app.js`, `app/styles.css` o `app/direccion.js`.
2. **Subir el número de versión** en `app/index.html` (`app.js?v=N` y/o `styles.css?v=N`). Si se tocó `direccion.js`, subir también `direccion.js?v=N` dentro de `app.js` (función `vDireccion`).
3. `git commit` + `git push` a `main`. GitHub Pages publica en ~1 minuto.
4. Los usuarios ven el aviso **"Hay una versión nueva de la app · Actualizar"**: la app compara su `app.js?v=` con el del `index.html` publicado cada 3 minutos y al volver a abrirla.

Sin build, sin dependencias, sin `npm`. Es copiar archivos.

## 4. Cómo está armado `app.js`

- **Estado:** objeto `S` (usuario, tablas cargadas, filtros en `S.f`, vista actual).
- **Rutas:** por hash (`#inicio`, `#agenda`, `#clientes`, `#cliente-<id>`, `#tarea-<id>`, `#contenido`, `#publicados` → pestaña de Contenido, `#ads`, `#prospectos`, `#direccion`…). Función `route()`.
- **Menú:** constante `NAV` (id, nombre, ícono, grupo). En celular, `MOBILE_NAV` define la barra de abajo y el resto va a "Más".
- **Vistas:** funciones `vInicio`, `vAgenda`, `vTareas`, `vChat`, `vClientes`, `vContenido`, `vAds`, `vProspectos`, `vPlantillas`, `vMaterial`, `vNovedades`, `vEquipo`, `vDireccion`. Mapa `views` dentro de `render()`.
- **Datos:** `TABLES` lista las tablas que se cargan al entrar (`loadTable`) y a las que se suscribe Realtime (`subscribe`). Cada cambio llega por `applyChange(tabla, payload)`, que actualiza `S` de forma incremental y repinta.
- **Guardar:** patrón "optimista": se cambia `S`, se repinta, se manda a Supabase y si falla se revierte y se muestra `toast(...)`.
- **Íconos:** objeto `ICONS` (SVG propios) y función `icon(nombre)`.
- **Montos:** `parseMonto()` acepta "$1.575", "1.575,50", "1575". `montoVal()` los muestra con puntos. Los inputs de plata usan `${MONTO_IN}` (texto, no `type=number`).
- **Modales:** `openModal(html)` / `closeModal()`. Borrado genérico: `askDel(tabla, id, "texto")`.

## 5. Secciones y reglas de negocio

| Sección | Notas |
|---|---|
| Agenda | Tocar un día abre "agregar rápido": Reunión, Llamada, Videollamada, Visita (con cliente), Tarea. Botón rojo "Feriado" marca/quita el feriado del día de un toque. |
| Clientes | Estado (Activo / Onboarding / En pausa / Baja) con un toque. Ficha con pestañas: Ficha, Entregas, Publicados, Ads, Chat, Pauta, Tareas y agenda. Un mismo titular puede tener varios negocios: cada negocio es un cliente aparte. |
| Pauta | Se marca con un toque y se guarda sola. `clientes.pauta` = `{lun:["Feed","Reel"],…}`. `pauta_desde` = desde cuándo cuenta para el calendario (al cargar la primera pauta, el lunes siguiente). |
| Contenido | Pestañas **Calendario** (sale de las pautas) y **Links publicados** (los carga la CM; botón "Ya lo envié" y envío por WhatsApp). |
| Ads clientes | Campañas por cliente (objetivo, inversión diaria, inicio/fin, estado), inversión cargada por el cliente (con "Usado / Sin usar") y **reporte para WhatsApp** con el formato de Marcelo. Cada reporte queda guardado. |
| Tareas | Pestañas **Mi semana** (solo admin: pizarra lunes a viernes + "para esta semana", tachar, pasar pendientes), **Mías** y **Todas** (tareas asignadas con estados). |
| Prospectos | Lista agrupada por mes de carga. Etapas: Contactado, Honorarios enviados, Llamada, Reunión, Cliente nuevo (`Ganado` en la base), Perdido. **Sin alertas de seguimiento** (pedido explícito). |
| Material | Separado por servicio: Sistemas MKT, Desarrollo web, Gestión Ads, General. Sin indicador de vigente. |
| Dirección (solo admin) | Resumen (cobrado, por cobrar, gastos + equipo, **Sueldo Marcelo**), Cobros, Visitas (filmaker; el pago a modelo lo abona el cliente y es solo registro), Gastos, Equipo, Comercial. Edición en línea. Meses pasados muestran solo lo registrado; mes actual suma clientes activos sin pago. |

## 6. Base de datos (Supabase)

### Tablas del equipo (todas con RLS `es_miembro()`)
`miembros`, `clientes`, `tareas`, `eventos` (tipo: Actividad, Reunión, Llamada, Videollamada, Visita, Feriado; `hecho` boolean: queda registrado y tachado, nunca se borra solo), `entregas`, `publicaciones` (lo marcado como publicado en el calendario), `publicados` (links; las Historias no cuentan como "sin enviar" y marcarlas en el calendario no pide link), `mensajes` (chat; `tarea_id` para chats de tareas, `adjuntos` jsonb para fotos/audios), `lecturas` (visto por canal), `novedades`, `config`, `material` (escritura solo admin), `plantillas` (escritura solo admin), `prospectos`, `ads_campanas`, `ads_saldos`, `ads_reportes`.

### Tabla personal
`notas_semana` (pizarra "Mi semana" de Tareas): RLS `miembro_id = mi_id()`, cada uno ve solo sus notas. Hoy la pestaña solo se muestra al admin.

### Tablas privadas (RLS `es_admin()`)
`fin_cuentas` (cliente de Dirección: pack, día de cobro, alta, activo, `cobro_con`), `fin_cobros` (estado: Pagado / Parcial / Pendiente; en Parcial el monto es lo que realmente entró), `fin_gastos`, `fin_equipo` (concepto "Retiro" = retiro de Marcelo, no cuenta como gasto), `fin_campanas`, `fin_visitas`.

### Solo servidor (sin políticas; las usa la Edge Function con service role)
`push_subs` (suscripciones push; cada uno ve solo las suyas), `push_config` (claves VAPID y secreto compartido). **Nunca exponer `push_config`.**

### Funciones clave
- `es_miembro()`, `es_admin()`, `mi_id()`: usadas por las políticas RLS.
- `validar_registro()` (trigger en `auth.users`): solo pueden crear cuenta los mails cargados en `miembros` (activos). Si no, `MAIL_NO_AUTORIZADO`. Confirma el mail automáticamente.
- `notificar(destinos, titulo, cuerpo, url, excluir)`: llama por `pg_net` a la Edge Function `notificar` con el header `x-furor-secret`.
- Triggers `trg_notif_*` en tareas, mensajes, eventos, prospectos, novedades y material.
- `resumen_diario()`: cron `furor-resumen-diario` (`30 11 * * 1-6` UTC = 8:30 Argentina, lunes a sábado).
- `prospectos_etapa_compat()`: traduce nombres de etapas viejos a los nuevos.

### Storage (buckets)
`entregas` (50 MB por archivo), `material` (escritura admin), `chat` (fotos y audios, 25 MB). Se accede con URLs firmadas.

### Para ver el estado completo de funciones, triggers, políticas y cron
Correr en el SQL editor de Supabase:
```sql
select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f';
select pg_get_triggerdef(oid) from pg_trigger where not tgisinternal;
select polname, polrelid::regclass, pg_get_expr(polqual, polrelid) from pg_policy;
select jobname, schedule, command from cron.job;
```

### Reglas al crear tablas nuevas
1. `enable row level security` + política (`es_miembro()` para el equipo, `es_admin()` para lo privado).
2. `grant select, insert, update, delete on ... to authenticated` (en este proyecto las tablas nuevas no traen permisos por defecto).
3. `alter publication supabase_realtime add table ...` si tiene que actualizarse en vivo.
4. Agregarla a `TABLES` (y a `ORDER` si necesita orden) en `app.js`, y su array vacío en `S`.

## 7. Usuarios y permisos

- Para sumar a alguien: Equipo → agregar integrante con su mail. Recién ahí puede crear cuenta en la app.
- Roles: `admin` (ve Dirección y puede editar material, plantillas e integrantes), `setter`, `cm`, `diseño`, etc.
- Las contraseñas de los clientes **no** se guardan en la app: solo un link al gestor de contraseñas.

## 8. Límites del plan gratis de Supabase

- 500 MB de base (hoy ~13 MB) y 1 GB de archivos: es capacidad total, no se renueva por mes. Los videos conviene dejarlos en Drive y guardar el link.
- 5 GB de transferencia y 2 millones de mensajes Realtime por mes.
- El proyecto se pausa tras 7 días sin actividad (con uso diario no pasa).
- **No incluye copias de seguridad.** Pendiente: copia semanal automática a Google Sheets.

## 9. Cómo probar sin tocar datos reales

Copiar `app/` a una carpeta aparte y, en esa copia de `index.html`, reemplazar el script de supabase-js por un `mock.js` que imite `supabase.createClient` con datos falsos. Abrir con Playwright o el navegador. No probar contra la base real con datos inventados.

## 10. Pendientes conocidos

- Copia de seguridad semanal a Google Sheets.
- Recordatorio de cobros (día de vencimiento y a los 3 días) y resumen de los lunes para el admin.
- "Pasar a cliente" desde un prospecto ganado que también cree la cuenta en Dirección (pack y día de cobro).
- Conexión con la API de Meta para completar solos los números del reporte de Ads.
- Novedades y Entregas casi sin uso: evaluar si se esconden.

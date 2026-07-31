# ey! — Menú Digital

Menú digital de **Ey! Bar y Copas** con panel de administración.
React + Vite + TypeScript, datos en Supabase.

---

## Puesta en marcha (desarrollo)

```bash
npm install
cp .env.example .env.local   # y completá los valores
npm run dev                  # http://localhost:5173
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Compila a `dist/` para publicar |
| `npm run preview` | Sirve `dist/` para probarlo antes de publicar |
| `npm run lint` | Revisa el código |
| `npm run images` | Regenera las imágenes optimizadas (ver abajo) |

---

## Estructura

```
src/
├─ lib/
│  ├─ env.ts          Claves de Supabase (sin SDK: lo usa el menú público)
│  ├─ publicApi.ts    Lecturas del menú con fetch, sin el SDK
│  ├─ supabase.ts     Cliente completo — SOLO para el panel
│  └─ defaults.ts     Textos por defecto del sitio
├─ types/menu.ts      Tipos que reflejan las tablas de la base
├─ hooks/             useMenu (público), useAdminData (panel), useAuth
├─ styles/            tokens.css (colores, fuentes) + global.css (fondo, reset)
├─ components/        Hero, QuickNav, Footer, BackToTop
├─ sections/          Un componente por tipo de sección del menú
├─ admin/             Login, panel y sus 4 pestañas
└─ pages/             MenuPage (/) y AdminPage (/admin)
```

### Por qué hay dos formas de hablar con Supabase

El menú público usa `publicApi.ts` (cinco `fetch` a la API REST) en lugar del SDK.
El SDK completo pesa ~55 KB comprimido y trae auth, realtime y storage que el
menú no necesita. Así el cliente que escanea el QR descarga bastante menos.

El panel sí usa el SDK (`supabase.ts`), porque necesita login y escrituras.
Vite lo separa en su propio archivo que solo se descarga al entrar a `/admin`.

**No importes `supabase.ts` desde componentes del menú público** o el SDK vuelve
a colarse en el bundle de todos.

---

## Imágenes

Los originales viven en `src/assets/originals/`. `npm run images` genera las
versiones AVIF y WebP en varios tamaños que usa el sitio.

Si cambiás el fondo o el logo: reemplazá el archivo en `originals/` (mismo
nombre) y corré `npm run images`.

> **El fondo actual mide 1376 × 768 px.** Alcanza para celulares y notebooks,
> pero en monitores grandes hay que agrandarlo y pierde nitidez (por eso el CSS
> le aplica un desenfoque suave arriba de 1600px, que lo disimula). Si conseguís
> una versión de al menos 2560px de ancho, ponela en `originals/fondo.png` y
> corré `npm run images`: el script genera los tamaños grandes solo.

---

## Base de datos

Los archivos SQL se pegan en **Supabase → SQL Editor → New query → Run**.

| Archivo | Cuándo |
| --- | --- |
| `sql/01-schema-inicial.sql` | Solo en un proyecto nuevo y vacío. **Borra todo** y carga el menú de ejemplo. |
| `sql/02-textos-y-seguridad.sql` | Ahora. Agrega los textos editables y endurece los permisos. No toca los datos. |

### Tablas

- **`sections`** — categorías del menú. `layout` decide cómo se dibuja:
  `cards` (con descripción), `list` (grupos desplegables), `combos`, `promos`.
- **`groups`** — subgrupos desplegables dentro de las secciones `list`.
- **`items`** — productos.
- **`promos`** — promos de la noche (se activan y desactivan desde el panel).
- **`site_settings`** — textos del sitio. Siempre una sola fila (`id = 1`).
- **`admins`** — quién puede editar. Ver abajo.

---

## Acceso al panel

El panel está en `/admin` y pide **solo una contraseña**.

Por debajo usa Supabase Auth, que necesita un email: es fijo y está en
`VITE_ADMIN_EMAIL`. El dueño nunca lo escribe. La sesión queda guardada en el
navegador y se renueva sola, así que entra una vez y sigue logueado.

### Crear o cambiar la contraseña del dueño

1. Supabase → **Authentication → Users → Add user → Create new user**
2. Email: el mismo que está en `VITE_ADMIN_EMAIL`
3. Contraseña: la que le vas a dar al dueño
4. Marcá **Auto Confirm User**
5. Corré la última parte de `sql/02-textos-y-seguridad.sql` para agregarlo a `admins`

Para cambiarla más adelante: Authentication → Users → los tres puntos →
*Reset password*.

### Cerrar el registro público

En Supabase → **Authentication → Sign In / Providers**:

- **Enable email provider**: ✅ prendido (si lo apagás, el dueño no puede entrar)
- **Allow new users to sign up**: ❌ apagado

Aunque quede prendido por error, la tabla `admins` impide que un usuario nuevo
edite nada: las políticas de escritura preguntan por `is_admin()`.

---

## Publicar

Funciona en Vercel o Netlify sin configuración extra (los archivos
`vercel.json` y `netlify.toml` ya están).

1. Subí el repo a GitHub.
2. Importalo en Vercel o Netlify.
3. Cargá las variables de entorno en el panel del hosting:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`.
4. Deploy. Cada `git push` publica solo.

> `.env.local` **no** se sube (está en `.gitignore`). Por eso las variables hay
> que cargarlas también en el hosting.

Las claves de Supabase son públicas por diseño: cualquiera puede verlas en el
código del navegador y no pasa nada. Lo que protege la base es el RLS —
todos pueden **leer** el menú, solo los `admins` pueden **escribir**.

---

## Preguntas frecuentes

**¿Cómo cambio un precio rápido?**
Panel → Productos → elegí la sección → ✎ → cambiá el precio → Guardar.

**¿Se cae el menú si Supabase falla?**
No. El navegador guarda una copia del último menú cargado y la muestra con un
aviso de "sin conexión".

**¿Cómo agrego una sección nueva?**
Panel → Secciones → Nueva sección. Elegís cómo se muestra y ya aparece en el
menú y en la barra de navegación. No hace falta tocar código.

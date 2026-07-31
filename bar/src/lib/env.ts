/**
 * Configuración de Supabase, separada del cliente.
 *
 * Importa esto (y no `supabase.ts`) desde el menú público: así el SDK completo
 * de Supabase queda solo en el bundle del panel y el cliente que escanea el QR
 * no lo descarga.
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copiá .env.example a .env.local y completá los valores del proyecto Supabase.',
  );
}

/**
 * Email fijo de la cuenta del dueño. El panel pide SOLO la contraseña:
 * Supabase Auth necesita un email, pero el dueño nunca lo escribe.
 *
 * Que quede visible en el código no es un problema: lo que protege el panel
 * es la contraseña (Supabase la guarda hasheada) y el RLS de la base.
 */
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@eybarycopas.com';

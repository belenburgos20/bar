import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

/**
 * Cliente completo de Supabase: login y escrituras del panel.
 *
 * Ojo: importar este archivo arrastra todo el SDK al bundle. El menú público
 * NO debe importarlo — usa `publicApi.ts`, que hace las lecturas con fetch.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // La sesión queda guardada en el navegador y se renueva sola: el dueño
    // entra una vez y sigue logueado hasta que cambie de dispositivo.
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'ey-admin-auth',
  },
});

export { ADMIN_EMAIL } from './env';

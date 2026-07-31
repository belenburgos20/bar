import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

export default defineConfig(({ mode }) => {
  /**
   * Si falta una variable, Vite la reemplaza por `undefined` y la página
   * termina en blanco sin ningún mensaje útil. Preferimos romper acá, en el
   * build, con un error que se entienda.
   *
   * Pasa sobre todo al publicar: `.env.local` no se sube a GitHub, así que
   * las variables hay que cargarlas también en Vercel / Netlify.
   */
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const missing = REQUIRED.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `\n\n  Faltan variables de entorno: ${missing.join(', ')}\n\n` +
        '  En tu compu:   copiá .env.example a .env.local y completalo.\n' +
        '  En Vercel:     Settings -> Environment Variables\n' +
        '  En Netlify:    Site configuration -> Environment variables\n',
    );
  }

  return {
    plugins: [react()],
  };
});

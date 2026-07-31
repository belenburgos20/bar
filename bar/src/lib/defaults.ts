import type { SiteSettings } from '../types/menu';

/**
 * Valores de arranque de los textos del sitio.
 * Se usan si todavía no se corrió la migración o si un campo quedó vacío,
 * así la página nunca muestra huecos.
 */
export const DEFAULT_SETTINGS: Omit<SiteSettings, 'id'> = {
  brand_name: 'Ey! Bar y Copas',
  slogan: 'Enfocado en lo que suma. Conectado con lo que importa.',
  address: 'Av. Italia y Saavedra, Rio Colorado',
  hours: 'Viernes, sábados y feriados · 21:00 – 06:00hs',
  phone: '2920 548412',
  instagram_user: '@eybarycopas',
  instagram_url: 'https://instagram.com/eybarycopas',
  tapa_label: 'Tapa Individual',
  tapa_price: 3200,
  footer_credit: 'Hecho por Belén Burgos. Todos los derechos reservados.',
};

/** Combina lo que hay en la base con los valores por defecto, campo por campo. */
export function withDefaults(settings: SiteSettings | null | undefined): Omit<SiteSettings, 'id'> {
  if (!settings) return DEFAULT_SETTINGS;

  const merged = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof typeof DEFAULT_SETTINGS)[]) {
    const value = settings[key];
    // Solo pisa el default si hay algo cargado de verdad.
    if (value !== null && value !== undefined && value !== '') {
      // @ts-expect-error las claves coinciden por construcción
      merged[key] = value;
    }
  }
  return merged;
}

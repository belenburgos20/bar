import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

/**
 * Lecturas del menú público, contra la API REST de Supabase (PostgREST) sin
 * el SDK. Son cinco GET simples y así el bundle que descarga el cliente pesa
 * bastante menos, que en el bar con señal floja se nota.
 *
 * La clave anon es pública por diseño: el RLS solo permite leer.
 */

const REST = `${SUPABASE_URL}/rest/v1`;

const headers: HeadersInit = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Accept: 'application/json',
};

async function get<T>(table: string, params: string, signal?: AbortSignal): Promise<T[]> {
  const res = await fetch(`${REST}/${table}?${params}`, { headers, signal });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`No se pudo leer "${table}" (${res.status}). ${detail}`.trim());
  }

  return (await res.json()) as T[];
}

/** Filas visibles de una tabla del menú, ordenadas como las dejó el dueño. */
export function selectVisible<T>(
  table: 'sections' | 'groups' | 'items',
  signal?: AbortSignal,
): Promise<T[]> {
  return get<T>(table, 'select=*&visible=is.true&order=sort_order.asc', signal);
}

/** Promos activas. */
export function selectActivePromos<T>(signal?: AbortSignal): Promise<T[]> {
  return get<T>('promos', 'select=*&active=is.true&order=sort_order.asc', signal);
}

/** Textos del sitio (fila única). Devuelve null si la tabla todavía no existe. */
export async function selectSettings<T>(signal?: AbortSignal): Promise<T | null> {
  try {
    const rows = await get<T>('site_settings', 'select=*&id=eq.1&limit=1', signal);
    return rows[0] ?? null;
  } catch (err) {
    // Si no corrieron la migración todavía, el menú igual tiene que funcionar
    // con los textos por defecto.
    if (err instanceof Error && !err.name.includes('Abort')) {
      console.warn('No se pudieron leer los textos del sitio:', err.message);
    }
    return null;
  }
}

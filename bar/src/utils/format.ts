/** Formatea un precio en pesos: 22000 -> "$22.000". Devuelve '' si no hay precio. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return '';
  if (Number.isNaN(value)) return '';
  return `$${value.toLocaleString('es-AR')}`;
}

/** Convierte lo que se tipea en un input de precio a número (o null si está vacío). */
export function parsePrice(raw: string): number | null {
  const clean = raw.replace(/[^\d]/g, '');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

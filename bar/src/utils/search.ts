/**
 * Búsqueda tolerante para el panel.
 *
 * Pensada para que el dueño encuentre un producto rápido desde el celular,
 * sin acordarse de cómo se escribe exactamente:
 *   - No distingue mayúsculas ni acentos:  "cognac" encuentra "Coñac"
 *   - Encuentra por pedazos:               "tonic" encuentra "Gin Tonic"
 *   - Ignora los espacios:                 "gintonic" encuentra "Gin Tonic"
 *   - Aguanta palabras sueltas y al revés: "cola fernet" encuentra "Fernet Cola"
 *   - Perdona errores de tipeo:            "fernt" encuentra "Fernet Cola"
 */

/** Pasa a minúsculas y saca los acentos: "Coñac Añejo" -> "conac anejo". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // NFD separa "ó" en "o" + tilde; acá se descarta la tilde suelta.
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Cuántas letras de diferencia se perdonan según el largo de la palabra.
 * En palabras cortas no se perdona nada, porque "vino" y "gin" pasarían
 * a encontrarse entre sí.
 */
function tolerance(length: number): number {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

/**
 * Distancia de Levenshtein: cuántas letras hay que agregar, sacar o cambiar
 * para convertir una palabra en la otra. Corta apenas se pasa de `max`, así
 * no se gasta tiempo comparando palabras que ya se sabe que no coinciden.
 */
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (current[j] < best) best = current[j];
    }

    if (best > max) return max + 1;
    previous = current;
  }

  return previous[b.length];
}

/**
 * Qué tan bien coincide `name` con lo que se escribió.
 * Devuelve un puntaje (más chico = mejor) o `null` si no coincide.
 */
export function searchScore(name: string, query: string): number | null {
  const q = normalize(query);
  if (!q) return 0;

  const n = normalize(name);

  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;

  // Sin espacios: "gintonic" tiene que encontrar "Gin Tonic".
  const flat = n.replace(/\s+/g, '');
  const flatQuery = q.replace(/\s+/g, '');
  if (flatQuery && flat.includes(flatQuery)) return 3;

  const tokens = q.split(/\s+/).filter(Boolean);
  const words = n.split(/\s+/).filter(Boolean);

  // Todas las palabras buscadas aparecen, en cualquier orden.
  if (tokens.every((token) => n.includes(token))) return 4;

  // Última chance: con tolerancia a errores de tipeo, palabra por palabra.
  const fuzzy = tokens.every((token) => {
    const max = tolerance(token.length);
    if (max === 0) return false;
    return words.some((word) => distance(token, word, max) <= max);
  });

  return fuzzy ? 5 : null;
}

interface Named {
  name: string;
}

/**
 * Filtra y ordena por relevancia. Con la búsqueda vacía devuelve la lista
 * tal cual, sin tocar el orden que definió el dueño.
 */
export function filterByName<T extends Named>(items: T[], query: string): T[] {
  if (!query.trim()) return items;

  return items
    .map((item, index) => ({ item, index, score: searchScore(item.name, query) }))
    .filter((row): row is { item: T; index: number; score: number } => row.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((row) => row.item);
}

import { useQuery } from '@tanstack/react-query';
import { selectActivePromos, selectSettings, selectVisible } from '../lib/publicApi';
import type {
  Group,
  GroupWithItems,
  Item,
  MenuData,
  Promo,
  Section,
  SectionWithContent,
  SiteSettings,
} from '../types/menu';

const CACHE_KEY = 'ey_menu_cache_v2';

export const menuQueryKey = ['menu'] as const;

interface RawMenu {
  sections: Section[];
  groups: Group[];
  items: Item[];
  promos: Promo[];
  settings: SiteSettings | null;
}

/**
 * Arma la estructura anidada que consumen los componentes.
 * Las secciones 'list' agrupan sus productos por grupo; el resto los usa sueltos.
 */
function assemble(raw: RawMenu): MenuData {
  const sections: SectionWithContent[] = raw.sections.map((section) => {
    const sectionItems = raw.items.filter((it) => it.section_id === section.id);

    const groups: GroupWithItems[] = raw.groups
      .filter((g) => g.section_id === section.id)
      .map((group) => ({
        ...group,
        items: sectionItems.filter((it) => it.group_id === group.id),
      }));

    return {
      ...section,
      groups,
      items: sectionItems.filter((it) => it.group_id === null),
    };
  });

  return { sections, promos: raw.promos, settings: raw.settings };
}

function readCache(): RawMenu | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? (JSON.parse(stored) as RawMenu) : null;
  } catch {
    return null;
  }
}

function writeCache(data: RawMenu) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* sin espacio o modo privado: no pasa nada */
  }
}

async function fetchMenu(signal?: AbortSignal): Promise<RawMenu> {
  const [sections, groups, items, promos, settings] = await Promise.all([
    selectVisible<Section>('sections', signal),
    selectVisible<Group>('groups', signal),
    selectVisible<Item>('items', signal),
    selectActivePromos<Promo>(signal),
    selectSettings<SiteSettings>(signal),
  ]);

  return { sections, groups, items, promos, settings };
}

/**
 * Menú público. Si Supabase falla (bar sin señal), cae en la última copia
 * guardada en el navegador en vez de mostrar una página vacía.
 */
export function useMenu() {
  const query = useQuery({
    queryKey: menuQueryKey,
    queryFn: async ({ signal }) => {
      const raw = await fetchMenu(signal);
      writeCache(raw);
      return assemble(raw);
    },
  });

  const cached = query.isError ? readCache() : null;

  return {
    ...query,
    data: query.data ?? (cached ? assemble(cached) : undefined),
    /** true cuando lo que se ve viene del caché y no de la red. */
    isStaleCache: query.isError && cached !== null,
  };
}

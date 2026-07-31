/**
 * Tipos que reflejan las tablas de schema.sql.
 * Si cambiás una columna en la base, actualizá acá también.
 */

/** Cómo se dibuja una sección. Cada valor tiene su componente en src/sections/. */
export type SectionLayout = 'cards' | 'list' | 'combos' | 'promos';

export const SECTION_LAYOUTS: SectionLayout[] = ['cards', 'list', 'combos', 'promos'];

export const LAYOUT_LABELS: Record<SectionLayout, string> = {
  cards: 'Tarjetas (con descripción)',
  list: 'Lista con grupos desplegables',
  combos: 'Combos (cantidad + precio)',
  promos: 'Promos de la noche',
};

export interface Section {
  id: string;
  slug: string;
  eyebrow: string | null;
  title: string;
  nav_label: string | null;
  layout: SectionLayout;
  alert: string | null;
  note: string | null;
  visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface Group {
  id: string;
  section_id: string;
  title: string;
  subtitle: string | null;
  open_by_default: boolean;
  visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface Item {
  id: string;
  section_id: string;
  group_id: string | null;
  name: string;
  /** En pesos, sin separadores (22000). Puede faltar. */
  price: number | null;
  /** Solo en secciones 'cards'. */
  description: string | null;
  /** "Marida con…", solo en secciones 'cards'. */
  pairing: string | null;
  /** Cantidad en combos (5 -> "×5"). */
  qty: number | null;
  premium: boolean;
  featured: boolean;
  visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface Promo {
  id: string;
  title: string;
  /** Texto libre: "$4.000", "Pagás 1 y tomás 2". */
  price: string | null;
  schedule: string | null;
  drinks: string[];
  active: boolean;
  sort_order: number;
  created_at: string;
}

/** Textos del sitio editables desde el panel. Siempre es una sola fila (id = 1). */
export interface SiteSettings {
  id: number;
  brand_name: string | null;
  slogan: string | null;
  address: string | null;
  hours: string | null;
  phone: string | null;
  instagram_user: string | null;
  instagram_url: string | null;
  /** Etiqueta del aviso de tapa: "Tapa Individual". */
  tapa_label: string | null;
  tapa_price: number | null;
  footer_credit: string | null;
}

/** Una sección con todo lo que necesita para dibujarse. */
export interface SectionWithContent extends Section {
  groups: GroupWithItems[];
  /** Productos sueltos (los que no van dentro de un grupo). */
  items: Item[];
}

export interface GroupWithItems extends Group {
  items: Item[];
}

/** Todo lo que el menú público necesita, en una sola estructura. */
export interface MenuData {
  sections: SectionWithContent[];
  promos: Promo[];
  settings: SiteSettings | null;
}

/** Campos que se pueden escribir (el resto los pone la base). */
export type SectionInput = Partial<Omit<Section, 'id' | 'created_at'>>;
export type GroupInput = Partial<Omit<Group, 'id' | 'created_at'>>;
export type ItemInput = Partial<Omit<Item, 'id' | 'created_at'>>;
export type PromoInput = Partial<Omit<Promo, 'id' | 'created_at'>>;
export type SiteSettingsInput = Partial<Omit<SiteSettings, 'id'>>;

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  Group,
  GroupInput,
  Item,
  ItemInput,
  Promo,
  PromoInput,
  Section,
  SectionInput,
  SiteSettings,
  SiteSettingsInput,
} from '../types/menu';

export const adminKeys = {
  all: ['admin'] as const,
  sections: ['admin', 'sections'] as const,
  groups: ['admin', 'groups'] as const,
  items: ['admin', 'items'] as const,
  promos: ['admin', 'promos'] as const,
  settings: ['admin', 'settings'] as const,
};

/** Convierte el error críptico de Postgres en algo que se entienda. */
function describe(error: { message: string; code?: string }): Error {
  if (error.code === '42501' || error.message.includes('row-level security')) {
    return new Error(
      'Tu usuario no tiene permiso para editar. Revisá que esté cargado en la tabla "admins" (ver sql/02-textos-y-seguridad.sql).',
    );
  }
  if (error.code === '23505') {
    return new Error('Ya existe otro registro con ese identificador (el slug tiene que ser único).');
  }
  if (error.code === '42P01') {
    return new Error('Falta una tabla en la base. ¿Corriste sql/02-textos-y-seguridad.sql?');
  }
  return new Error(error.message);
}

/* ══════════════════════════════════════════════════════════════
   LECTURAS
   A diferencia del menú público, acá traemos TODO (incluso lo
   oculto y las promos desactivadas): es lo que el dueño administra.
   ══════════════════════════════════════════════════════════════ */

export function useAdminSections() {
  return useQuery({
    queryKey: adminKeys.sections,
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select('*').order('sort_order');
      if (error) throw describe(error);
      return data as Section[];
    },
  });
}

export function useAdminGroups() {
  return useQuery({
    queryKey: adminKeys.groups,
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').order('sort_order');
      if (error) throw describe(error);
      return data as Group[];
    },
  });
}

export function useAdminItems() {
  return useQuery({
    queryKey: adminKeys.items,
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('*').order('sort_order');
      if (error) throw describe(error);
      return data as Item[];
    },
  });
}

export function useAdminPromos() {
  return useQuery({
    queryKey: adminKeys.promos,
    queryFn: async () => {
      const { data, error } = await supabase.from('promos').select('*').order('sort_order');
      if (error) throw describe(error);
      return data as Promo[];
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: adminKeys.settings,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw describe(error);
      return data as SiteSettings | null;
    },
  });
}

/* ══════════════════════════════════════════════════════════════
   ESCRITURAS
   ══════════════════════════════════════════════════════════════ */

type Table = 'sections' | 'groups' | 'items' | 'promos';

const KEY_BY_TABLE: Record<Table, readonly string[]> = {
  sections: adminKeys.sections,
  groups: adminKeys.groups,
  items: adminKeys.items,
  promos: adminKeys.promos,
};

/**
 * Crear / editar / borrar filas de cualquiera de las tablas del menú.
 * Al terminar refresca la lista y también el menú público.
 */
export function useSaveRow<T extends SectionInput | GroupInput | ItemInput | PromoInput>(
  table: Table,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: T }) => {
      if (id) {
        const { error } = await supabase.from(table).update(values).eq('id', id);
        if (error) throw describe(error);
      } else {
        const { error } = await supabase.from(table).insert(values);
        if (error) throw describe(error);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_BY_TABLE[table] });
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useDeleteRow(table: Table) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw describe(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_BY_TABLE[table] });
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

/**
 * Guarda el nuevo orden después de arrastrar.
 * Manda todas las filas juntas para que no queden números salteados.
 */
export function useReorder(table: Table) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from(table).update({ sort_order: index + 1 }).eq('id', id),
      );

      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw describe(failed.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_BY_TABLE[table] });
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (values: SiteSettingsInput) => {
      const { error } = await supabase.from('site_settings').update(values).eq('id', 1);
      if (error) throw describe(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

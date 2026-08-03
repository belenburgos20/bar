import { useMemo, useState } from 'react';
import Modal from './Modal';
import SortableList from './SortableList';
import { EditIcon, EyeIcon, EyeOffIcon, PlusIcon, TrashIcon } from './Icons';
import {
  useAdminGroups,
  useAdminItems,
  useAdminSections,
  useDeleteRow,
  useReorder,
  useSaveRow,
} from '../hooks/useAdminData';
import type { Item, ItemInput } from '../types/menu';
import { formatPrice, parsePrice } from '../utils/format';
import { filterByName } from '../utils/search';
import styles from './ui.module.css';

/** Estado del formulario. Todo texto: se convierte al guardar. */
interface FormState {
  name: string;
  price: string;
  description: string;
  pairing: string;
  qty: string;
  group_id: string;
  premium: boolean;
  featured: boolean;
  visible: boolean;
}

const EMPTY: FormState = {
  name: '',
  price: '',
  description: '',
  pairing: '',
  qty: '',
  group_id: '',
  premium: false,
  featured: false,
  visible: true,
};

function toForm(item: Item): FormState {
  return {
    name: item.name,
    price: item.price?.toString() ?? '',
    description: item.description ?? '',
    pairing: item.pairing ?? '',
    qty: item.qty?.toString() ?? '',
    group_id: item.group_id ?? '',
    premium: item.premium,
    featured: item.featured,
    visible: item.visible,
  };
}

export default function ItemsPanel() {
  const sections = useAdminSections();
  const groups = useAdminGroups();
  const items = useAdminItems();

  const save = useSaveRow<ItemInput>('items');
  const remove = useDeleteRow('items');
  const reorder = useReorder('items');

  const [sectionId, setSectionId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  // Primera sección por defecto, una vez que cargaron.
  const activeSectionId = sectionId || sections.data?.[0]?.id || '';
  const section = sections.data?.find((s) => s.id === activeSectionId);

  const sectionGroups = useMemo(
    () => (groups.data ?? []).filter((g) => g.section_id === activeSectionId),
    [groups.data, activeSectionId],
  );

  const sectionItems = useMemo(
    () =>
      (items.data ?? [])
        .filter((i) => i.section_id === activeSectionId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items.data, activeSectionId],
  );

  /* Resultados de la búsqueda, ordenados por relevancia.
     Con el buscador vacío devuelve la lista completa en el orden del menú. */
  const visibleItems = useMemo(() => filterByName(sectionItems, query), [sectionItems, query]);

  const searching = query.trim().length > 0;

  const isList = section?.layout === 'list';
  const isCards = section?.layout === 'cards';
  const isCombos = section?.layout === 'combos';

  function openCreate() {
    setForm({ ...EMPTY, group_id: sectionGroups[0]?.id ?? '' });
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function openEdit(item: Item) {
    setForm(toForm(item));
    setEditing(item);
    setCreating(false);
    setError(null);
  }

  function close() {
    setEditing(null);
    setCreating(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('El producto necesita un nombre.');
      return;
    }

    const values: ItemInput = {
      section_id: activeSectionId,
      // Los grupos solo existen en las secciones tipo lista.
      group_id: isList ? form.group_id || null : null,
      name: form.name.trim(),
      price: parsePrice(form.price),
      description: isCards ? form.description.trim() || null : null,
      pairing: isCards ? form.pairing.trim() || null : null,
      qty: isCombos ? parsePrice(form.qty) : null,
      premium: form.premium,
      featured: form.featured,
      visible: form.visible,
    };

    // Al crear, va último en la lista.
    if (!editing) values.sort_order = sectionItems.length + 1;

    try {
      await save.mutateAsync({ id: editing?.id, values });
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    }
  }

  async function toggleVisible(item: Item) {
    await save.mutateAsync({ id: item.id, values: { visible: !item.visible } });
  }

  async function handleDelete(item: Item) {
    if (!confirm(`¿Borrar "${item.name}"? No se puede deshacer.`)) return;
    await remove.mutateAsync(item.id);
  }

  if (sections.isPending || items.isPending || groups.isPending) {
    return <p className={styles.empty}>Cargando…</p>;
  }

  const loadError = sections.error ?? items.error ?? groups.error;
  if (loadError) {
    return <p className={styles.error}>{(loadError as Error).message}</p>;
  }

  /** Contenido de una fila de producto. Lo usan la lista normal y la filtrada. */
  function renderRow(item: Item) {
    return (
      <>
        <div className={`${styles.rowMain} ${item.visible ? '' : styles.hidden}`}>
          <span className={styles.rowTitle}>{item.name}</span>
          <span className={styles.rowMeta}>
            {formatPrice(item.price) || 'Sin precio'}
            {item.qty != null && ` · ×${item.qty}`}
            {isList &&
              item.group_id &&
              ` · ${sectionGroups.find((g) => g.id === item.group_id)?.title ?? 'Sin grupo'}`}
            {item.premium && ' · Destacado'}
            {item.featured && ' · Recomendado'}
            {!item.visible && ' · Oculto'}
          </span>
        </div>

        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => toggleVisible(item)}
            aria-label={item.visible ? `Ocultar ${item.name}` : `Mostrar ${item.name}`}
            title={item.visible ? 'Ocultar del menú' : 'Mostrar en el menú'}
          >
            {item.visible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => openEdit(item)}
            aria-label={`Editar ${item.name}`}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={() => handleDelete(item)}
            aria-label={`Borrar ${item.name}`}
          >
            <TrashIcon />
          </button>
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="section-picker">
          Sección
        </label>
        <select
          id="section-picker"
          className={styles.select}
          value={activeSectionId}
          onChange={(e) => {
            setSectionId(e.target.value);
            // Al cambiar de sección la búsqueda anterior ya no viene al caso.
            setQuery('');
          }}
        >
          {sections.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
              {!s.visible ? ' (oculta)' : ''}
            </option>
          ))}
        </select>
      </div>

      {sectionItems.length > 0 && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="item-search">
            Buscar producto
          </label>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              id="item-search"
              className={styles.searchInput}
              type="search"
              placeholder="Nombre del producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {searching && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setQuery('')}
                aria-label="Borrar búsqueda"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <span className={styles.hint}>
            No hace falta que sea exacto: ignora mayúsculas, acentos y errores de tipeo.
          </span>
        </div>
      )}

      {section?.layout === 'promos' && (
        <p className={styles.info}>
          Esta sección muestra las promos. Se administran en la pestaña <strong>Promos</strong>.
        </p>
      )}

      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
        <PlusIcon /> Agregar producto
      </button>

      {sectionItems.length === 0 ? (
        <p className={styles.empty}>Esta sección todavía no tiene productos.</p>
      ) : searching ? (
        /* Buscando: lista filtrada por relevancia, SIN arrastre.
           El orden que se ve acá no es el del menú, así que dejar arrastrar
           guardaría un orden equivocado en la base. */
        <>
          <div className={styles.searchNote}>
            <span className={styles.searchCount}>
              {visibleItems.length === 0
                ? 'Sin resultados'
                : `${visibleItems.length} de ${sectionItems.length}`}
            </span>
            <span>Borrá la búsqueda para poder reordenar.</span>
          </div>

          {visibleItems.length === 0 ? (
            <p className={styles.empty}>
              Ningún producto de esta sección coincide con «{query.trim()}».
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {visibleItems.map((item) => (
                <div key={item.id} className={styles.rowItem}>
                  {/* Hueco del ancho de la manija, para que las filas queden
                      alineadas con las de la lista normal. */}
                  <span className={styles.dragPlaceholder} aria-hidden="true" />
                  {renderRow(item)}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className={styles.hint}>
            Arrastrá desde ⠿ para cambiar el orden en que se ven en el menú.
          </p>

          <SortableList items={sectionItems} onReorder={(ids) => reorder.mutate(ids)}>
            {(item) => renderRow(item)}
          </SortableList>
        </>
      )}

      {(creating || editing) && (
        <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={close}>
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="item-name">
                Nombre
              </label>
              <input
                id="item-name"
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="item-price">
                  Precio
                </label>
                <input
                  id="item-price"
                  className={styles.input}
                  inputMode="numeric"
                  placeholder="9000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
                <span className={styles.hint}>Sin puntos ni $. Vacío = sin precio.</span>
              </div>

              {isCombos && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="item-qty">
                    Cantidad
                  </label>
                  <input
                    id="item-qty"
                    className={styles.input}
                    inputMode="numeric"
                    placeholder="5"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  />
                  <span className={styles.hint}>Se muestra como ×5.</span>
                </div>
              )}
            </div>

            {isList && sectionGroups.length > 0 && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="item-group">
                  Grupo
                </label>
                <select
                  id="item-group"
                  className={styles.select}
                  value={form.group_id}
                  onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                >
                  <option value="">Sin grupo</option>
                  {sectionGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isCards && (
              <>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="item-desc">
                    Descripción
                  </label>
                  <textarea
                    id="item-desc"
                    className={styles.textarea}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="item-pairing">
                    Marida con
                  </label>
                  <input
                    id="item-pairing"
                    className={styles.input}
                    placeholder="Fernet con Coca · Malbec"
                    value={form.pairing}
                    onChange={(e) => setForm({ ...form, pairing: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                />
                Visible en el menú
              </label>

              {isList && (
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.premium}
                    onChange={(e) => setForm({ ...form, premium: e.target.checked })}
                  />
                  Destacar el producto (fondo dorado)
                </label>
              )}

              {isCards && (
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Marcar como "Recomendada"
                </label>
              )}
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={close}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={save.isPending}
              >
                {save.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

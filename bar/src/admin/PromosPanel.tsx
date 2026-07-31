import { useState } from 'react';
import Modal from './Modal';
import SortableList from './SortableList';
import { EditIcon, EyeIcon, EyeOffIcon, PlusIcon, TrashIcon } from './Icons';
import { useAdminPromos, useDeleteRow, useReorder, useSaveRow } from '../hooks/useAdminData';
import type { Promo, PromoInput } from '../types/menu';
import styles from './ui.module.css';

interface FormState {
  title: string;
  price: string;
  schedule: string;
  /** Un trago por línea: más cómodo de tipear en el celular que separar por comas. */
  drinks: string;
  active: boolean;
}

const EMPTY: FormState = { title: '', price: '', schedule: '', drinks: '', active: false };

export default function PromosPanel() {
  const promos = useAdminPromos();
  const save = useSaveRow<PromoInput>('promos');
  const remove = useDeleteRow('promos');
  const reorder = useReorder('promos');

  const [editing, setEditing] = useState<Promo | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function openEdit(promo: Promo) {
    setForm({
      title: promo.title,
      price: promo.price ?? '',
      schedule: promo.schedule ?? '',
      drinks: promo.drinks.join('\n'),
      active: promo.active,
    });
    setEditing(promo);
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
    if (!form.title.trim()) {
      setError('La promo necesita un título.');
      return;
    }

    const values: PromoInput = {
      title: form.title.trim(),
      price: form.price.trim() || null,
      schedule: form.schedule.trim() || null,
      drinks: form.drinks
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean),
      active: form.active,
    };

    if (!editing) values.sort_order = (promos.data?.length ?? 0) + 1;

    try {
      await save.mutateAsync({ id: editing?.id, values });
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    }
  }

  async function handleDelete(promo: Promo) {
    if (!confirm(`¿Borrar la promo "${promo.title}"?`)) return;
    await remove.mutateAsync(promo.id);
  }

  if (promos.isPending) return <p className={styles.empty}>Cargando…</p>;
  if (promos.error) return <p className={styles.error}>{(promos.error as Error).message}</p>;

  const list = [...(promos.data ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const activeCount = list.filter((p) => p.active).length;

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <p className={styles.info}>
        Solo las promos <strong>activas</strong> se ven en el menú. Apagá el ojo para guardarlas
        sin publicarlas y reactivarlas cuando quieras.
        {activeCount === 0 && ' Ahora mismo no hay ninguna activa.'}
      </p>

      <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
        <PlusIcon /> Nueva promo
      </button>

      {list.length === 0 ? (
        <p className={styles.empty}>Todavía no hay promos cargadas.</p>
      ) : (
        <SortableList items={list} onReorder={(ids) => reorder.mutate(ids)}>
          {(promo) => (
            <>
              <div className={`${styles.rowMain} ${promo.active ? '' : styles.hidden}`}>
                <span className={styles.rowTitle}>{promo.title}</span>
                <span className={styles.rowMeta}>
                  {promo.price || 'Sin precio'}
                  {promo.drinks.length > 0 && ` · ${promo.drinks.length} tragos`}
                  {promo.active ? ' · Activa' : ' · Desactivada'}
                </span>
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => save.mutate({ id: promo.id, values: { active: !promo.active } })}
                  aria-label={promo.active ? `Desactivar ${promo.title}` : `Activar ${promo.title}`}
                  title={promo.active ? 'Sacar del menú' : 'Publicar en el menú'}
                >
                  {promo.active ? <EyeIcon /> : <EyeOffIcon />}
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => openEdit(promo)}
                  aria-label={`Editar ${promo.title}`}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => handleDelete(promo)}
                  aria-label={`Borrar ${promo.title}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </>
          )}
        </SortableList>
      )}

      {(creating || editing) && (
        <Modal title={editing ? 'Editar promo' : 'Nueva promo'} onClose={close}>
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="promo-title">
                Título
              </label>
              <input
                id="promo-title"
                className={styles.input}
                placeholder="2x1 en Tragos Clásicos"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="promo-price">
                Precio o condición
              </label>
              <input
                id="promo-price"
                className={styles.input}
                placeholder="Pagás 1 y tomás 2"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <span className={styles.hint}>Texto libre: "$4.000", "2x1", lo que quieras.</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="promo-schedule">
                Horario / vigencia
              </label>
              <input
                id="promo-schedule"
                className={styles.input}
                placeholder="Sábados de 00:00 a 02:00"
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="promo-drinks">
                Tragos incluidos
              </label>
              <textarea
                id="promo-drinks"
                className={styles.textarea}
                placeholder={'Mojito\nCaipirinha\nCuba Libre'}
                value={form.drinks}
                onChange={(e) => setForm({ ...form, drinks: e.target.value })}
              />
              <span className={styles.hint}>Uno por línea.</span>
            </div>

            <label className={styles.check}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Publicar esta promo en el menú
            </label>

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

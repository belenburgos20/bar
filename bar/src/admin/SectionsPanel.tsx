import { useState } from 'react';
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
import {
  LAYOUT_LABELS,
  SECTION_LAYOUTS,
  type Group,
  type GroupInput,
  type Section,
  type SectionInput,
  type SectionLayout,
} from '../types/menu';
import styles from './ui.module.css';

/** Convierte un título en un slug válido para el ancla (#bebidas). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // NFD separa "ó" en "o" + tilde; acá se descarta la tilde suelta.
    // Sin esto, "Bodegón" terminaría como "bodego-n".
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

interface SectionForm {
  title: string;
  slug: string;
  eyebrow: string;
  nav_label: string;
  layout: SectionLayout;
  alert: string;
  note: string;
  visible: boolean;
}

const EMPTY_SECTION: SectionForm = {
  title: '',
  slug: '',
  eyebrow: '',
  nav_label: '',
  layout: 'list',
  alert: '',
  note: '',
  visible: true,
};

interface GroupForm {
  title: string;
  subtitle: string;
  open_by_default: boolean;
  visible: boolean;
}

const EMPTY_GROUP: GroupForm = {
  title: '',
  subtitle: '',
  open_by_default: false,
  visible: true,
};

export default function SectionsPanel() {
  const sections = useAdminSections();
  const groups = useAdminGroups();
  const items = useAdminItems();

  const saveSection = useSaveRow<SectionInput>('sections');
  const removeSection = useDeleteRow('sections');
  const reorderSections = useReorder('sections');

  const saveGroup = useSaveRow<GroupInput>('groups');
  const removeGroup = useDeleteRow('groups');
  const reorderGroups = useReorder('groups');

  const [sectionModal, setSectionModal] = useState<{ editing: Section | null } | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionForm>(EMPTY_SECTION);

  const [groupModal, setGroupModal] = useState<{ sectionId: string; editing: Group | null } | null>(
    null,
  );
  const [groupForm, setGroupForm] = useState<GroupForm>(EMPTY_GROUP);

  const [error, setError] = useState<string | null>(null);

  /* ─── Secciones ─── */

  function openCreateSection() {
    setSectionForm(EMPTY_SECTION);
    setSectionModal({ editing: null });
    setError(null);
  }

  function openEditSection(section: Section) {
    setSectionForm({
      title: section.title,
      slug: section.slug,
      eyebrow: section.eyebrow ?? '',
      nav_label: section.nav_label ?? '',
      layout: section.layout,
      alert: section.alert ?? '',
      note: section.note ?? '',
      visible: section.visible,
    });
    setSectionModal({ editing: section });
    setError(null);
  }

  async function submitSection(event: React.FormEvent) {
    event.preventDefault();
    if (!sectionModal) return;

    const title = sectionForm.title.trim();
    if (!title) {
      setError('La sección necesita un título.');
      return;
    }

    const slug = slugify(sectionForm.slug || title);
    if (!slug) {
      setError('No se pudo generar el identificador. Probá con otro título.');
      return;
    }

    const values: SectionInput = {
      title,
      slug,
      eyebrow: sectionForm.eyebrow.trim() || null,
      nav_label: sectionForm.nav_label.trim() || null,
      layout: sectionForm.layout,
      alert: sectionForm.alert.trim() || null,
      note: sectionForm.note.trim() || null,
      visible: sectionForm.visible,
    };

    if (!sectionModal.editing) values.sort_order = (sections.data?.length ?? 0) + 1;

    try {
      await saveSection.mutateAsync({ id: sectionModal.editing?.id, values });
      setSectionModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    }
  }

  async function handleDeleteSection(section: Section) {
    const count = (items.data ?? []).filter((i) => i.section_id === section.id).length;
    const warning =
      count > 0
        ? `Se van a borrar también sus ${count} producto${count === 1 ? '' : 's'}.`
        : 'No tiene productos cargados.';

    if (!confirm(`¿Borrar la sección "${section.title}"?\n\n${warning}\nNo se puede deshacer.`)) {
      return;
    }
    await removeSection.mutateAsync(section.id);
  }

  /* ─── Grupos ─── */

  function openCreateGroup(sectionId: string) {
    setGroupForm(EMPTY_GROUP);
    setGroupModal({ sectionId, editing: null });
    setError(null);
  }

  function openEditGroup(group: Group) {
    setGroupForm({
      title: group.title,
      subtitle: group.subtitle ?? '',
      open_by_default: group.open_by_default,
      visible: group.visible,
    });
    setGroupModal({ sectionId: group.section_id, editing: group });
    setError(null);
  }

  async function submitGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!groupModal) return;

    if (!groupForm.title.trim()) {
      setError('El grupo necesita un título.');
      return;
    }

    const siblings = (groups.data ?? []).filter((g) => g.section_id === groupModal.sectionId);

    const values: GroupInput = {
      section_id: groupModal.sectionId,
      title: groupForm.title.trim(),
      subtitle: groupForm.subtitle.trim() || null,
      open_by_default: groupForm.open_by_default,
      visible: groupForm.visible,
    };

    if (!groupModal.editing) values.sort_order = siblings.length + 1;

    try {
      await saveGroup.mutateAsync({ id: groupModal.editing?.id, values });
      setGroupModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    }
  }

  async function handleDeleteGroup(group: Group) {
    const count = (items.data ?? []).filter((i) => i.group_id === group.id).length;
    const warning =
      count > 0 ? `Se van a borrar también sus ${count} producto(s).` : 'No tiene productos.';

    if (!confirm(`¿Borrar el grupo "${group.title}"?\n\n${warning}`)) return;
    await removeGroup.mutateAsync(group.id);
  }

  /* ─── Render ─── */

  if (sections.isPending || groups.isPending) return <p className={styles.empty}>Cargando…</p>;
  if (sections.error) return <p className={styles.error}>{(sections.error as Error).message}</p>;

  const list = [...(sections.data ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <p className={styles.info}>
        El orden de las secciones acá es el orden en que aparecen en el menú y en la barra de
        navegación de arriba.
      </p>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={openCreateSection}
      >
        <PlusIcon /> Nueva sección
      </button>

      <SortableList items={list} onReorder={(ids) => reorderSections.mutate(ids)}>
        {(section) => (
          <>
            <div className={`${styles.rowMain} ${section.visible ? '' : styles.hidden}`}>
              <span className={styles.rowTitle}>{section.title}</span>
              <span className={styles.rowMeta}>
                {LAYOUT_LABELS[section.layout]}
                {` · #${section.slug}`}
                {!section.visible && ' · Oculta'}
              </span>
            </div>

            <div className={styles.rowActions}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() =>
                  saveSection.mutate({ id: section.id, values: { visible: !section.visible } })
                }
                aria-label={section.visible ? `Ocultar ${section.title}` : `Mostrar ${section.title}`}
                title={section.visible ? 'Ocultar del menú' : 'Mostrar en el menú'}
              >
                {section.visible ? <EyeIcon /> : <EyeOffIcon />}
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => openEditSection(section)}
                aria-label={`Editar ${section.title}`}
              >
                <EditIcon />
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                onClick={() => handleDeleteSection(section)}
                aria-label={`Borrar ${section.title}`}
              >
                <TrashIcon />
              </button>
            </div>
          </>
        )}
      </SortableList>

      {/* ─── Grupos, solo para las secciones tipo lista ─── */}
      <h3 className={styles.label} style={{ marginTop: '1rem' }}>
        Grupos desplegables
      </h3>

      {list.filter((s) => s.layout === 'list').length === 0 ? (
        <p className={styles.empty}>Ninguna sección usa grupos por ahora.</p>
      ) : (
        list
          .filter((s) => s.layout === 'list')
          .map((section) => {
            const sectionGroups = (groups.data ?? [])
              .filter((g) => g.section_id === section.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <div key={section.id} className={styles.card} style={{ padding: '0.875rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: sectionGroups.length ? '0.75rem' : 0,
                  }}
                >
                  <strong style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{section.title}</strong>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => openCreateGroup(section.id)}
                  >
                    <PlusIcon /> Grupo
                  </button>
                </div>

                {sectionGroups.length > 0 && (
                  <SortableList
                    items={sectionGroups}
                    onReorder={(ids) => reorderGroups.mutate(ids)}
                  >
                    {(group) => (
                      <>
                        <div className={`${styles.rowMain} ${group.visible ? '' : styles.hidden}`}>
                          <span className={styles.rowTitle}>{group.title}</span>
                          <span className={styles.rowMeta}>
                            {group.subtitle || 'Sin subtítulo'}
                            {group.open_by_default && ' · Abierto por defecto'}
                            {!group.visible && ' · Oculto'}
                          </span>
                        </div>

                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() =>
                              saveGroup.mutate({
                                id: group.id,
                                values: { visible: !group.visible },
                              })
                            }
                            aria-label={group.visible ? 'Ocultar grupo' : 'Mostrar grupo'}
                          >
                            {group.visible ? <EyeIcon /> : <EyeOffIcon />}
                          </button>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => openEditGroup(group)}
                            aria-label={`Editar ${group.title}`}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDeleteGroup(group)}
                            aria-label={`Borrar ${group.title}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </>
                    )}
                  </SortableList>
                )}
              </div>
            );
          })
      )}

      {/* ─── Modal de sección ─── */}
      {sectionModal && (
        <Modal
          title={sectionModal.editing ? 'Editar sección' : 'Nueva sección'}
          onClose={() => setSectionModal(null)}
        >
          <form className={styles.modalForm} onSubmit={submitSection}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sec-title">
                Título
              </label>
              <input
                id="sec-title"
                className={styles.input}
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="sec-eyebrow">
                  Texto chico de arriba
                </label>
                <input
                  id="sec-eyebrow"
                  className={styles.input}
                  placeholder="Para compartir"
                  value={sectionForm.eyebrow}
                  onChange={(e) => setSectionForm({ ...sectionForm, eyebrow: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="sec-nav">
                  Nombre en la barra
                </label>
                <input
                  id="sec-nav"
                  className={styles.input}
                  placeholder="Tablas"
                  value={sectionForm.nav_label}
                  onChange={(e) => setSectionForm({ ...sectionForm, nav_label: e.target.value })}
                />
                <span className={styles.hint}>Corto. Si lo dejás vacío usa el título.</span>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sec-layout">
                Cómo se muestra
              </label>
              <select
                id="sec-layout"
                className={styles.select}
                value={sectionForm.layout}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, layout: e.target.value as SectionLayout })
                }
              >
                {SECTION_LAYOUTS.map((layout) => (
                  <option key={layout} value={layout}>
                    {LAYOUT_LABELS[layout]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sec-alert">
                Aviso al lado del título
              </label>
              <input
                id="sec-alert"
                className={styles.input}
                placeholder="Cada tabla rinde para dos personas."
                value={sectionForm.alert}
                onChange={(e) => setSectionForm({ ...sectionForm, alert: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="sec-note">
                Aviso al pie
              </label>
              <input
                id="sec-note"
                className={styles.input}
                placeholder="Consultar por opción vegetariana."
                value={sectionForm.note}
                onChange={(e) => setSectionForm({ ...sectionForm, note: e.target.value })}
              />
            </div>

            <label className={styles.check}>
              <input
                type="checkbox"
                checked={sectionForm.visible}
                onChange={(e) => setSectionForm({ ...sectionForm, visible: e.target.checked })}
              />
              Visible en el menú
            </label>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => setSectionModal(null)}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={saveSection.isPending}
              >
                {saveSection.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal de grupo ─── */}
      {groupModal && (
        <Modal
          title={groupModal.editing ? 'Editar grupo' : 'Nuevo grupo'}
          onClose={() => setGroupModal(null)}
        >
          <form className={styles.modalForm} onSubmit={submitGroup}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="grp-title">
                Título
              </label>
              <input
                id="grp-title"
                className={styles.input}
                placeholder="Aperitivos"
                value={groupForm.title}
                onChange={(e) => setGroupForm({ ...groupForm, title: e.target.value })}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="grp-sub">
                Subtítulo
              </label>
              <input
                id="grp-sub"
                className={styles.input}
                placeholder="Incluyen tapa"
                value={groupForm.subtitle}
                onChange={(e) => setGroupForm({ ...groupForm, subtitle: e.target.value })}
              />
            </div>

            <div>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={groupForm.open_by_default}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, open_by_default: e.target.checked })
                  }
                />
                Empezar desplegado
              </label>

              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={groupForm.visible}
                  onChange={(e) => setGroupForm({ ...groupForm, visible: e.target.checked })}
                />
                Visible en el menú
              </label>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => setGroupModal(null)}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={saveGroup.isPending}
              >
                {saveGroup.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

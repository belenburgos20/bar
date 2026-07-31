import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './ui.module.css';

interface HasId {
  id: string;
}

interface Props<T extends HasId> {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  children: (item: T) => React.ReactNode;
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${styles.rowItem} ${isDragging ? styles.dragging : ''}`}
    >
      {/* Solo la manija arrastra: así se puede tocar el resto de la fila
          sin que se dispare el drag sin querer. */}
      <span
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </span>
      {children}
    </div>
  );
}

/**
 * Lista reordenable con arrastrar y soltar.
 * También funciona con teclado: Tab hasta la manija, Espacio y flechas.
 */
export default function SortableList<T extends HasId>({ items, onReorder, children }: Props<T>) {
  const sensors = useSensors(
    // Un umbral de 6px evita que un toque para hacer scroll arranque el arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from === -1 || to === -1) return;

    onReorder(arrayMove(items, from, to).map((i) => i.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {children(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

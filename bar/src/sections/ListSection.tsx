import { useId, useState } from 'react';
import type { GroupWithItems, Item, SectionWithContent } from '../types/menu';
import { formatPrice } from '../utils/format';
import { SectionHeader, SectionNote } from './SectionBlock';
import styles from './ListSection.module.css';

function ItemRow({ item }: { item: Item }) {
  return (
    <li className={`${styles.item} ${item.premium ? styles.premium : ''}`}>
      <span className={styles.itemName}>{item.name}</span>
      {item.price != null && <span className={styles.itemPrice}>{formatPrice(item.price)}</span>}
    </li>
  );
}

function Accordion({ group }: { group: GroupWithItems }) {
  const [open, setOpen] = useState(group.open_by_default);
  const bodyId = useId();

  return (
    <div className={`${styles.accordion} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.groupTitle}>{group.title}</span>
        <span className={styles.groupSub}>{group.subtitle ?? ' '}</span>
        <span className={styles.icon} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      <div className={styles.body} id={bodyId} role="region">
        <div className={styles.bodyInner}>
          {group.items.length > 0 ? (
            <ul className={styles.itemList}>
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>Sin productos por ahora.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListSection({ section }: { section: SectionWithContent }) {
  return (
    <>
      <SectionHeader section={section} withAlert={false} />

      <div className={styles.groups}>
        {section.groups.map((group) => (
          <Accordion key={group.id} group={group} />
        ))}

        {/* Productos cargados en la sección pero fuera de todo grupo. */}
        {section.items.length > 0 && (
          <ul className={styles.itemList}>
            {section.items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>

      {section.note && <SectionNote note={section.note} />}
    </>
  );
}

import type { SectionWithContent } from '../types/menu';
import { formatPrice } from '../utils/format';
import { SectionHeader, SectionNote } from './SectionBlock';
import styles from './CombosSection.module.css';

export default function CombosSection({ section }: { section: SectionWithContent }) {
  return (
    <>
      <SectionHeader section={section} withAlert={false} />

      <div className={styles.grid}>
        {section.items.map((item) => (
          <article key={item.id} className={styles.card}>
            <h3 className={styles.name}>{item.name}</h3>
            {item.qty != null && <span className={styles.qty}>×{item.qty}</span>}
            {item.price != null && <span className={styles.price}>{formatPrice(item.price)}</span>}
          </article>
        ))}
      </div>

      {section.note && <SectionNote note={section.note} />}
    </>
  );
}

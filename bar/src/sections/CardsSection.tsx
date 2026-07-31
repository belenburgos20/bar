import type { SectionWithContent } from '../types/menu';
import { formatPrice } from '../utils/format';
import { SectionHeader, SectionNote } from './SectionBlock';
import styles from './CardsSection.module.css';

export default function CardsSection({ section }: { section: SectionWithContent }) {
  return (
    <>
      <SectionHeader section={section} withAlert />

      <div className={styles.grid}>
        {section.items.map((item) => (
          <article
            key={item.id}
            className={`${styles.card} ${item.featured ? styles.featured : ''}`}
          >
            {item.featured && <span className={styles.featuredBadge}>Recomendada</span>}

            <div className={styles.head}>
              <h3 className={styles.name}>{item.name}</h3>
              {item.price != null && (
                <span className={styles.price}>{formatPrice(item.price)}</span>
              )}
            </div>

            {item.description && <p className={styles.desc}>{item.description}</p>}

            {item.pairing && (
              <p className={styles.pairing}>
                <span className={styles.pairingLabel}>Marida con (Sugerencia)</span>
                {item.pairing}
              </p>
            )}
          </article>
        ))}
      </div>

      {section.note && <SectionNote note={section.note} />}
    </>
  );
}

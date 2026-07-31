import type { Promo, SectionWithContent } from '../types/menu';
import { SectionHeader, SectionNote } from './SectionBlock';
import styles from './PromosSection.module.css';

interface Props {
  section: SectionWithContent;
  promos: Promo[];
}

export default function PromosSection({ section, promos }: Props) {
  return (
    <>
      <SectionHeader section={section} withAlert={false} />

      <p className={styles.intro}>
        Consultá las promos vigentes y qué tragos entran en cada una.
      </p>

      {promos.length === 0 ? (
        <p className={styles.empty}>Esta noche no hay promos cargadas.</p>
      ) : (
        <div className={styles.grid} aria-live="polite">
          {promos.map((promo) => (
            <article key={promo.id} className={styles.card}>
              <div className={styles.head}>
                <h3 className={styles.title}>{promo.title || 'Promo especial'}</h3>
                {promo.price && <span className={styles.price}>{promo.price}</span>}
              </div>

              {promo.schedule && <p className={styles.meta}>{promo.schedule}</p>}

              <p className={styles.drinksLabel}>Tragos incluidos</p>
              <div className={styles.drinks}>
                {promo.drinks.length > 0 ? (
                  promo.drinks.map((drink) => (
                    <span key={drink} className={styles.drink}>
                      {drink}
                    </span>
                  ))
                ) : (
                  <span className={styles.drink}>Sin tragos definidos</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {section.note && <SectionNote note={section.note} />}
    </>
  );
}

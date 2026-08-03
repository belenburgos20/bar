import type { Promo } from '../types/menu';
import styles from './PromoCard.module.css';

/** Una promo con su precio, horario y los tragos que entran. */
export default function PromoCard({ promo }: { promo: Promo }) {
  return (
    <article className={styles.card}>
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
  );
}

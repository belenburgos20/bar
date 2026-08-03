import PromoCard from '../components/PromoCard';
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

      {/* Sin promos no se muestra ningún cartel: solo queda el texto de arriba. */}
      {promos.length > 0 && (
        <div className={styles.grid} aria-live="polite">
          {promos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      )}

      {section.note && <SectionNote note={section.note} />}
    </>
  );
}

import type { Promo, SectionWithContent } from '../types/menu';
import CardsSection from './CardsSection';
import CombosSection from './CombosSection';
import ListSection from './ListSection';
import PromosSection from './PromosSection';
import styles from './Section.module.css';

/** Layouts que en escritorio ocupan todo el ancho (tienen grilla propia). */
export const WIDE_LAYOUTS = new Set(['cards', 'combos', 'promos']);

interface Props {
  section: SectionWithContent;
  promos: Promo[];
  /** Clase extra que aporta la página (ej: ocupar toda la fila del grid). */
  className?: string;
}

export function SectionHeader({
  section,
  withAlert,
}: {
  section: SectionWithContent;
  withAlert: boolean;
}) {
  return (
    <div className={styles.header}>
      {section.eyebrow && <span className={styles.eyebrow}>{section.eyebrow}</span>}

      {withAlert && section.alert ? (
        <div className={styles.titleRow}>
          <h2 className={styles.title} id={`${section.slug}-title`}>
            {section.title}
          </h2>
          <p className={styles.alert}>
            <span className={styles.alertIcon} aria-hidden="true">
              ★
            </span>
            {section.alert}
          </p>
        </div>
      ) : (
        <h2 className={styles.title}>{section.title}</h2>
      )}
    </div>
  );
}

export function SectionNote({ note }: { note: string }) {
  return (
    <p className={`${styles.alert} ${styles.note}`}>
      <span className={styles.alertIcon} aria-hidden="true">
        ★
      </span>
      {note}
    </p>
  );
}

export default function SectionBlock({ section, promos, className = '' }: Props) {
  const isWide = WIDE_LAYOUTS.has(section.layout);

  return (
    <section
      id={section.slug}
      className={`${styles.section} ${isWide ? styles.wide : ''} ${className}`}
      aria-labelledby={`${section.slug}-title`}
    >
      {section.layout === 'cards' && <CardsSection section={section} />}
      {section.layout === 'combos' && <CombosSection section={section} />}
      {section.layout === 'promos' && <PromosSection section={section} promos={promos} />}
      {section.layout === 'list' && <ListSection section={section} />}
    </section>
  );
}

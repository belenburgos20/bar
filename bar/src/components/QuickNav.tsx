import { useActiveSection } from '../hooks/useActiveSection';
import type { SectionWithContent } from '../types/menu';
import styles from './QuickNav.module.css';

interface Props {
  sections: SectionWithContent[];
}

export default function QuickNav({ sections }: Props) {
  const active = useActiveSection(sections.map((s) => s.slug));

  /** Al tocar un botón, lo centra en la barra para que se vea dónde estás parado. */
  function centerButton(event: React.MouseEvent<HTMLAnchorElement>) {
    const btn = event.currentTarget;
    window.setTimeout(() => {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 80);
  }

  if (!sections.length) return null;

  return (
    <nav className={styles.nav} aria-label="Navegación rápida">
      <div className={styles.track}>
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.slug}`}
            className={`${styles.btn} ${active === section.slug ? styles.active : ''}`}
            aria-current={active === section.slug ? 'true' : undefined}
            onClick={centerButton}
          >
            {section.nav_label || section.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

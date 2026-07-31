import { useEffect } from 'react';
import BackToTop from '../components/BackToTop';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import QuickNav from '../components/QuickNav';
import { useMenu } from '../hooks/useMenu';
import { withDefaults } from '../lib/defaults';
import SectionBlock, { WIDE_LAYOUTS } from '../sections/SectionBlock';
import styles from './MenuPage.module.css';

export default function MenuPage() {
  const { data, isPending, isError, isStaleCache } = useMenu();
  const settings = withDefaults(data?.settings);

  useEffect(() => {
    document.title = `${settings.brand_name} — Menú`;
  }, [settings.brand_name]);

  const sections = data?.sections ?? [];

  return (
    <>
      <QuickNav sections={sections} />
      <Hero brandName={settings.brand_name ?? 'ey!'} slogan={settings.slogan ?? ''} />

      <main>
        {isStaleCache && (
          <p className={styles.offline}>
            Sin conexión: estás viendo la última versión guardada del menú.
          </p>
        )}

        {isPending && <p className={styles.status}>Cargando menú…</p>}

        {isError && !isStaleCache && (
          <p className={styles.status}>
            No pudimos cargar el menú. Revisá tu conexión e intentá de nuevo.
          </p>
        )}

        {!isPending && !isError && sections.length === 0 && (
          <p className={styles.status}>El menú está vacío por ahora.</p>
        )}

        {sections.length > 0 && (
          <div className={styles.menu}>
            {sections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                promos={data?.promos ?? []}
                className={WIDE_LAYOUTS.has(section.layout) ? styles.wide : ''}
              />
            ))}
          </div>
        )}
      </main>

      <Footer settings={settings} />
      <BackToTop />
    </>
  );
}

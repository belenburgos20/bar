import { useEffect, useState } from 'react';
import styles from './BackToTop.module.css';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`${styles.btn} ${visible ? styles.visible : ''}`}
      aria-label="Volver arriba"
      // Fuera de la vista no debe recibir foco con el teclado.
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}

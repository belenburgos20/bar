import { useEffect, useRef } from 'react';
import styles from './ui.module.css';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Ventana modal accesible: cierra con Escape o tocando fuera. */
export default function Modal({ title, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* El panel que abre este modal redefine su función `onClose` en cada render
     (o sea, en cada tecla que se escribe en el formulario). Guardándola en un
     ref, los efectos de abajo pueden montarse UNA sola vez y aun así llamar
     siempre a la versión actual. */
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Escape para cerrar + bloquear el scroll del fondo. Solo al abrir y cerrar.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current();
    }
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  /* Foco inicial, una sola vez.
     Busca solo campos de formulario: el botón de cerrar (✕) viene antes en el
     HTML, y si el foco cayera ahí, la próxima tecla de espacio o Enter
     cerraría el modal sin querer. */
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('input, textarea, select')?.focus();
  }, []);

  return (
    <div
      className={styles.modalBackdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} ref={panelRef}>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

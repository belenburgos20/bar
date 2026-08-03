import { useEffect, useRef } from "react";
import type { Promo, SectionWithContent } from "../types/menu";
import PromoCard from "./PromoCard";
import styles from "./PromosModal.module.css";

interface Props {
  /** La sección de promos del menú: de ahí salen el título y la nota. */
  section: SectionWithContent;
  promos: Promo[];
  onClose: () => void;
}

/**
 * Aviso que se abre al entrar al menú. Si hay promos activas las muestra;
 * si no, invita a preguntar por las del día. Se cierra y queda el menú entero.
 */
export default function PromosModal({ section, promos, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Quien tenía el foco antes de abrir, para devolvérselo al cerrar.
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // El tabulador no debe escaparse del aviso mientras está abierto.
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Bloquear el scroll del fondo mientras el aviso está abierto.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  const hasPromos = promos.length > 0;

  return (
    <div
      className={styles.overlay}
      // Tocar el fondo (no la tarjeta) cierra el aviso.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="promos-modal-title"
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Cerrar aviso"
        >
          ✕
        </button>

        {section.eyebrow && (
          <span className={styles.eyebrow}>{section.eyebrow}</span>
        )}

        <h2 className={styles.title} id="promos-modal-title">
          {section.title}
        </h2>

        <div className={styles.rule} aria-hidden="true" />

        <p className={styles.intro}>
          {hasPromos
            ? "Estas son las promos vigentes y qué tragos entran en cada una."
            : "Preguntale al personal si esta noche hay promos vigentes"}
        </p>

        {hasPromos && (
          <div className={styles.body}>
            <div className={styles.grid}>
              {promos.map((promo) => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </div>
          </div>
        )}

        {section.note && <p className={styles.note}>{section.note}</p>}

        <button type="button" className={styles.action} onClick={onClose}>
          Ver el menú
        </button>
      </div>
    </div>
  );
}

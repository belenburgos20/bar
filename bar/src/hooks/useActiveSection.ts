import { useEffect, useState } from 'react';

/**
 * Devuelve el slug de la sección que se está viendo, para resaltarla en la nav.
 * Usa IntersectionObserver con un margen que descuenta la barra fija de arriba.
 */
export function useActiveSection(slugs: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  // Clave estable: el efecto se re-arma solo si cambian las secciones de verdad.
  const key = slugs.join('|');

  useEffect(() => {
    if (!slugs.length) return;

    const navHeight =
      Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
        10,
      ) || 52;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: `-${navHeight + 10}px 0px -60% 0px`, threshold: 0 },
    );

    const observed = slugs
      .map((slug) => document.getElementById(slug))
      .filter((el): el is HTMLElement => el !== null);

    for (const el of observed) observer.observe(el);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return active;
}

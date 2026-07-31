import styles from './Hero.module.css';

import logoAvif from '../assets/logo-ey-360.avif';
import logoWebp from '../assets/logo-ey-360.webp';
import logoAvifSmall from '../assets/logo-ey-240.avif';
import logoWebpSmall from '../assets/logo-ey-240.webp';

interface Props {
  brandName: string;
  slogan: string;
}

export default function Hero({ brandName, slogan }: Props) {
  return (
    <header className={styles.hero} id="top">
      <div className={styles.inner}>
        <div className={styles.logoWrap}>
          <picture>
            <source
              type="image/avif"
              srcSet={`${logoAvifSmall} 240w, ${logoAvif} 360w`}
              sizes="(max-width: 30rem) 88px, 120px"
            />
            <source
              type="image/webp"
              srcSet={`${logoWebpSmall} 240w, ${logoWebp} 360w`}
              sizes="(max-width: 30rem) 88px, 120px"
            />
            <img
              src={logoWebp}
              alt={`Logo de ${brandName}`}
              className={styles.logo}
              width={360}
              height={360}
              /* El logo es lo primero que se ve: que no espere al lazy load. */
              fetchPriority="high"
            />
          </picture>
        </div>

        <p className={styles.slogan}>{slogan}</p>
      </div>
    </header>
  );
}

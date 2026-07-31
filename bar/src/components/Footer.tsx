import type { SiteSettings } from '../types/menu';
import { formatPrice } from '../utils/format';
import styles from './Footer.module.css';

interface Props {
  settings: Omit<SiteSettings, 'id'>;
}

export default function Footer({ settings }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {settings.tapa_price != null && (
        <div className={styles.tapaNote}>
          <span className={styles.tapaIcon} aria-hidden="true">
            ★
          </span>
          <span>
            {settings.tapa_label}: <strong>{formatPrice(settings.tapa_price)}</strong>
          </span>
        </div>
      )}

      <div className={styles.content}>
        <div>
          <span className={styles.brandName}>{settings.brand_name}</span>
          <span className={styles.tagline}>{settings.slogan}</span>
        </div>

        <div className={styles.info}>
          {settings.address && (
            <p>
              <span aria-hidden="true">📍</span>
              <span>{settings.address}</span>
            </p>
          )}
          {settings.hours && (
            <p>
              <span aria-hidden="true">🕗</span>
              <span>{settings.hours}</span>
            </p>
          )}
          {settings.phone && (
            <p>
              <span aria-hidden="true">📞</span>
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
            </p>
          )}
        </div>

        {settings.instagram_user && (
          <div className={styles.social}>
            <a
              href={settings.instagram_url ?? '#'}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              {settings.instagram_user}
            </a>
          </div>
        )}
      </div>

      {/* El panel no se enlaza desde acá a propósito: es para el dueño, no
          para los clientes. Se entra escribiendo /admin en el navegador. */}
      <div className={styles.legal}>
        © {year} {settings.footer_credit}
      </div>
    </footer>
  );
}

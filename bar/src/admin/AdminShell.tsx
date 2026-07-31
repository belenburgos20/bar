import { useState } from 'react';
import { Link } from 'react-router';
import logo from '../assets/logo-ey-240.webp';
import { ExternalIcon, LogoutIcon } from './Icons';
import ItemsPanel from './ItemsPanel';
import PromosPanel from './PromosPanel';
import SectionsPanel from './SectionsPanel';
import SettingsPanel from './SettingsPanel';
import styles from './AdminShell.module.css';
import ui from './ui.module.css';

const TABS = [
  { id: 'items', label: 'Productos', Panel: ItemsPanel },
  { id: 'promos', label: 'Promos', Panel: PromosPanel },
  { id: 'sections', label: 'Secciones', Panel: SectionsPanel },
  { id: 'settings', label: 'Textos del sitio', Panel: SettingsPanel },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminShell({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<TabId>('items');

  const Panel = TABS.find((t) => t.id === tab)?.Panel ?? ItemsPanel;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <img src={logo} alt="" className={styles.brandLogo} width={32} height={32} />
            <span className={styles.brandText}>Panel</span>
          </div>

          <div className={styles.headerActions}>
            <Link to="/" className={ui.btn} target="_blank" rel="noopener">
              <ExternalIcon /> Ver menú
            </Link>
            <button type="button" className={ui.btn} onClick={onSignOut}>
              <LogoutIcon /> Salir
            </button>
          </div>
        </div>

        <nav className={styles.tabs} aria-label="Secciones del panel">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        <Panel />
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAdminSettings, useSaveSettings } from '../hooks/useAdminData';
import { DEFAULT_SETTINGS } from '../lib/defaults';
import type { SiteSettingsInput } from '../types/menu';
import { parsePrice } from '../utils/format';
import styles from './ui.module.css';

interface FormState {
  brand_name: string;
  slogan: string;
  address: string;
  hours: string;
  phone: string;
  instagram_user: string;
  instagram_url: string;
  tapa_label: string;
  tapa_price: string;
  footer_credit: string;
}

const EMPTY: FormState = {
  brand_name: '',
  slogan: '',
  address: '',
  hours: '',
  phone: '',
  instagram_user: '',
  instagram_url: '',
  tapa_label: '',
  tapa_price: '',
  footer_credit: '',
};

export default function SettingsPanel() {
  const settings = useAdminSettings();
  const save = useSaveSettings();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Carga los valores guardados en el formulario cuando llegan de la base.
  useEffect(() => {
    if (!settings.data) return;
    const d = settings.data;
    setForm({
      brand_name: d.brand_name ?? '',
      slogan: d.slogan ?? '',
      address: d.address ?? '',
      hours: d.hours ?? '',
      phone: d.phone ?? '',
      instagram_user: d.instagram_user ?? '',
      instagram_url: d.instagram_url ?? '',
      tapa_label: d.tapa_label ?? '',
      tapa_price: d.tapa_price?.toString() ?? '',
      footer_credit: d.footer_credit ?? '',
    });
  }, [settings.data]);

  function update(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const values: SiteSettingsInput = {
      brand_name: form.brand_name.trim() || null,
      slogan: form.slogan.trim() || null,
      address: form.address.trim() || null,
      hours: form.hours.trim() || null,
      phone: form.phone.trim() || null,
      instagram_user: form.instagram_user.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      tapa_label: form.tapa_label.trim() || null,
      tapa_price: parsePrice(form.tapa_price),
      footer_credit: form.footer_credit.trim() || null,
    };

    try {
      await save.mutateAsync(values);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    }
  }

  if (settings.isPending) return <p className={styles.empty}>Cargando…</p>;

  if (settings.error) {
    return (
      <p className={styles.error}>
        {(settings.error as Error).message}
      </p>
    );
  }

  if (!settings.data) {
    return (
      <p className={styles.info}>
        Todavía no existe la fila de textos del sitio. Corré{' '}
        <strong>sql/02-textos-y-seguridad.sql</strong> en el editor SQL de Supabase.
      </p>
    );
  }

  return (
    <form className={styles.modalForm} onSubmit={handleSubmit}>
      <p className={styles.info}>
        Estos textos aparecen en el encabezado y el pie del menú. Si dejás un campo vacío se usa
        el valor por defecto.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-brand">
          Nombre del bar
        </label>
        <input
          id="set-brand"
          className={styles.input}
          value={form.brand_name}
          placeholder={DEFAULT_SETTINGS.brand_name ?? ''}
          onChange={(e) => update('brand_name', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-slogan">
          Slogan
        </label>
        <textarea
          id="set-slogan"
          className={styles.textarea}
          value={form.slogan}
          placeholder={DEFAULT_SETTINGS.slogan ?? ''}
          onChange={(e) => update('slogan', e.target.value)}
          style={{ minHeight: '4.5rem' }}
        />
        <span className={styles.hint}>Se ve grande abajo del logo y también en el pie.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-address">
          Dirección
        </label>
        <input
          id="set-address"
          className={styles.input}
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-hours">
          Días y horarios
        </label>
        <input
          id="set-hours"
          className={styles.input}
          value={form.hours}
          onChange={(e) => update('hours', e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-phone">
          Teléfono
        </label>
        <input
          id="set-phone"
          className={styles.input}
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
        <span className={styles.hint}>Se convierte en un link para llamar desde el celular.</span>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="set-ig-user">
            Usuario de Instagram
          </label>
          <input
            id="set-ig-user"
            className={styles.input}
            placeholder="@eybarycopas"
            value={form.instagram_user}
            onChange={(e) => update('instagram_user', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="set-ig-url">
            Link de Instagram
          </label>
          <input
            id="set-ig-url"
            className={styles.input}
            type="url"
            placeholder="https://instagram.com/eybarycopas"
            value={form.instagram_url}
            onChange={(e) => update('instagram_url', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="set-tapa-label">
            Aviso de tapa
          </label>
          <input
            id="set-tapa-label"
            className={styles.input}
            placeholder="Tapa Individual"
            value={form.tapa_label}
            onChange={(e) => update('tapa_label', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="set-tapa-price">
            Precio de la tapa
          </label>
          <input
            id="set-tapa-price"
            className={styles.input}
            inputMode="numeric"
            placeholder="3200"
            value={form.tapa_price}
            onChange={(e) => update('tapa_price', e.target.value)}
          />
          <span className={styles.hint}>Vacío: no se muestra el aviso.</span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="set-credit">
          Texto legal del pie
        </label>
        <input
          id="set-credit"
          className={styles.input}
          value={form.footer_credit}
          onChange={(e) => update('footer_credit', e.target.value)}
        />
        <span className={styles.hint}>El año se agrega solo adelante.</span>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {saved && (
        <p className={styles.success} role="status">
          Cambios guardados. Ya se ven en el menú.
        </p>
      )}

      <div className={styles.modalActions}>
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={save.isPending}
        >
          {save.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

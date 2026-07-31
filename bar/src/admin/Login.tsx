import { useState } from 'react';
import { Link } from 'react-router';
import logo from '../assets/logo-ey-240.webp';
import styles from './Login.module.css';

interface Props {
  onSubmit: (password: string) => Promise<void>;
}

export default function Login({ onSubmit }: Props) {
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !password) return;

    setBusy(true);
    setError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <img src={logo} alt="" className={styles.logo} width={72} height={72} />

        <h1 className={styles.title}>Panel de administración</h1>
        <p className={styles.subtitle}>Ingresá la contraseña para editar el menú.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="password">
            Contraseña
          </label>

          <div className={styles.inputWrap}>
            <input
              id="password"
              className={styles.input}
              type={reveal ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {reveal ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={styles.submit} disabled={busy || !password}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <Link to="/" className={styles.back}>
          ← Volver al menú
        </Link>
      </div>
    </div>
  );
}

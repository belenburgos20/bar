import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ADMIN_EMAIL, supabase } from '../lib/supabase';

/**
 * Sesión del panel. El dueño solo escribe la contraseña: el email es fijo
 * (ADMIN_EMAIL) porque Supabase Auth lo necesita, pero no se le pide.
 *
 * La sesión queda guardada en el navegador y se renueva sola, así que entra
 * una vez y sigue logueado.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error) {
      // No delatamos si el usuario existe o no: para el dueño el motivo real
      // siempre es el mismo (se equivocó de contraseña).
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Contraseña incorrecta.'
          : 'No pudimos iniciar sesión. Revisá tu conexión.',
      );
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, loading, signIn, signOut };
}

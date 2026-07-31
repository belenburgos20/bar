import { useEffect } from 'react';
import AdminShell from '../admin/AdminShell';
import Login from '../admin/Login';
import { useAuth } from '../hooks/useAuth';

export default function AdminPage() {
  const { session, loading, signIn, signOut } = useAuth();

  useEffect(() => {
    document.title = 'Panel · ey!';
  }, []);

  // Mientras se revisa si ya había sesión guardada, no mostramos nada:
  // así el dueño no ve el login parpadear si en realidad ya estaba adentro.
  if (loading) return null;

  if (!session) return <Login onSubmit={signIn} />;

  return <AdminShell onSignOut={signOut} />;
}

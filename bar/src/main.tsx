import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/* Fuentes autoalojadas: una petición menos a un servidor externo, que en
   conexiones móviles lentas se nota. Solo el subconjunto latino, que es el
   único que necesita el español (incluye á é í ó ú ñ ü). */
import '@fontsource/cormorant-garamond/latin-300.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/dm-sans/latin-300.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';

import './styles/global.css';
import MenuPage from './pages/MenuPage';

/* El panel se carga aparte: el cliente que escanea el QR no descarga
   el código de administración (formularios, drag & drop) que nunca va a usar. */
const AdminPage = lazy(() => import('./pages/AdminPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // El menú cambia poco: no hace falta recargar en cada foco de ventana.
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* Cualquier otra ruta cae en el menú. */}
            <Route path="*" element={<MenuPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

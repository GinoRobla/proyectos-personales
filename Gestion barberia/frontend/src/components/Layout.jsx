import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';

/**
 * Layout principal de la aplicación
 * Incluye navbar y el contenido de las páginas
 */

const Layout = () => {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';

  return (
    <div className="app-layout">
      <Navbar />
      {esAdmin && <AdminSidebar />}
      <main className={`main-content ${esAdmin ? 'with-sidebar' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

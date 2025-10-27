import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';
import Footer from './Footer';

/**
 * Layout principal de la aplicación
 * Incluye navbar, contenido de las páginas y footer
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
      {!esAdmin && <Footer />}
    </div>
  );
};

export default Layout;

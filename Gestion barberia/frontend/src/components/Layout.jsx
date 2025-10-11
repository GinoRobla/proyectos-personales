import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Layout principal de la aplicación
 * Incluye navbar y el contenido de las páginas
 */

const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

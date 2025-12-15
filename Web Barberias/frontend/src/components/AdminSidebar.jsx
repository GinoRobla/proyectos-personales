import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', label: 'Inicio' },
    { path: '/admin/barberos', label: 'Barberos' },
    { path: '/admin/servicios', label: 'Servicios' },
    { path: '/admin/disponibilidad', label: 'Disponibilidad' },
    { path: '/admin/configuracion', label: 'Configuración' },
    { path: '/admin/configuracion-senas', label: 'Señas y Pagos' },
    { path: '/admin/pagos', label: 'Gestión de Pagos' },
    { path: '/admin/estadisticas', label: 'Estadísticas' },
    { path: '/admin/perfil', label: 'Mi Perfil' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Barbería GR</h2>
        <p className="sidebar-rol">Administrador</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-item logout">
          <span className="sidebar-label">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;

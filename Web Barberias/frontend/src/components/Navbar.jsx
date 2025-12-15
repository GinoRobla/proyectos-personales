import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

/**
 * Navbar Mobile-First con Menú Hamburguesa
 * Navegación responsive optimizada para móvil
 */

const Navbar = () => {
  const { usuario, estaAutenticado, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cerrar menú automáticamente cuando cambia la ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuAbierto(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          Barbería GR
        </Link>

        {/* Menú Hamburguesa (Mobile) */}
        {estaAutenticado ? (
          <>
            <button
              className={`hamburger ${menuAbierto ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Menú"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            {/* Overlay */}
            {menuAbierto && (
              <div className="menu-overlay" onClick={cerrarMenu}></div>
            )}

            {/* Menú Horizontal (Desktop) */}
            <div className="navbar-menu-horizontal">
              {usuario?.rol === 'cliente' && (
                <div className="menu-items-group">
                  <Link to="/cliente" className="menu-item">
                    Inicio
                  </Link>
                  <Link to="/reservar" className="menu-item">
                    Reservar Turno
                  </Link>
                  <Link to="/cliente/turnos" className="menu-item">
                    Historial
                  </Link>
                  <Link to="/cliente/perfil" className="menu-item">
                    Mi Perfil
                  </Link>
                </div>
              )}

              {usuario?.rol === 'barbero' && (
                <div className="menu-items-group">
                  <Link to="/barbero" className="menu-item">
                    Inicio
                  </Link>
                  <Link to="/barbero/agenda" className="menu-item">
                    Mi Agenda
                  </Link>
                  <Link to="/barbero/estadisticas" className="menu-item">
                    Estadísticas
                  </Link>
                  <Link to="/barbero/perfil" className="menu-item">
                    Mi Perfil
                  </Link>
                </div>
              )}

              {usuario?.rol === 'admin' && (
                <div className="menu-items-group">
                  <Link to="/admin" className="menu-item">
                    Inicio
                  </Link>
                  <Link to="/admin/barberos" className="menu-item">
                    Barberos
                  </Link>
                  <Link to="/admin/servicios" className="menu-item">
                    Servicios
                  </Link>
                  <Link to="/admin/disponibilidad" className="menu-item">
                    Disponibilidad
                  </Link>
                  <Link to="/admin/configuracion" className="menu-item">
                    Configuración
                  </Link>
                  <Link to="/admin/configuracion-senas" className="menu-item">
                    Señas y Pagos
                  </Link>
                  <Link to="/admin/pagos" className="menu-item">
                    Gestión de Pagos
                  </Link>
                  <Link to="/admin/estadisticas" className="menu-item">
                    Estadísticas
                  </Link>
                  <Link to="/admin/perfil" className="menu-item">
                    Mi Perfil
                  </Link>
                </div>
              )}
            </div>

            {/* Logout separado a la derecha */}
            <div className="navbar-logout">
              <button onClick={handleLogout} className="menu-item logout">
                Cerrar Sesión
              </button>
            </div>

            {/* Menú Lateral (Mobile) */}
            <div className={`menu-lateral ${menuAbierto ? 'abierto' : ''}`}>
              <div className="menu-header">
                <div className="menu-usuario">
                  <div className="usuario-avatar">
                    {usuario?.nombre?.charAt(0)}{usuario?.apellido?.charAt(0)}
                  </div>
                  <div className="usuario-info">
                    <p className="usuario-nombre">{usuario?.nombre} {usuario?.apellido}</p>
                    <p className="usuario-rol">{usuario?.rol}</p>
                  </div>
                </div>
              </div>

              <div className="menu-items">
                {usuario?.rol === 'cliente' && (
                  <>
                    <Link to="/cliente" className="menu-item" onClick={cerrarMenu}>
                      <span>Inicio</span>
                    </Link>
                    <Link to="/reservar" className="menu-item" onClick={cerrarMenu}>
                      <span>Reservar Turno</span>
                    </Link>
                    <Link to="/cliente/turnos" className="menu-item" onClick={cerrarMenu}>
                      <span>Historial de Turnos</span>
                    </Link>
                    <Link to="/cliente/perfil" className="menu-item" onClick={cerrarMenu}>
                      <span>Mi Perfil</span>
                    </Link>
                  </>
                )}

                {usuario?.rol === 'barbero' && (
                  <>
                    <Link to="/barbero" className="menu-item" onClick={cerrarMenu}>
                      <span>Inicio</span>
                    </Link>
                    <Link to="/barbero/agenda" className="menu-item" onClick={cerrarMenu}>
                      <span>Mi Agenda</span>
                    </Link>
                    <Link to="/barbero/estadisticas" className="menu-item" onClick={cerrarMenu}>
                      <span>Estadísticas</span>
                    </Link>
                    <Link to="/barbero/perfil" className="menu-item" onClick={cerrarMenu}>
                      <span>Mi Perfil</span>
                    </Link>
                  </>
                )}

                {usuario?.rol === 'admin' && (
                  <>
                    <Link to="/admin" className="menu-item" onClick={cerrarMenu}>
                      <span>Inicio</span>
                    </Link>
                    <Link to="/admin/barberos" className="menu-item" onClick={cerrarMenu}>
                      <span>Barberos</span>
                    </Link>
                    <Link to="/admin/servicios" className="menu-item" onClick={cerrarMenu}>
                      <span>Servicios</span>
                    </Link>
                    <Link to="/admin/disponibilidad" className="menu-item" onClick={cerrarMenu}>
                      <span>Disponibilidad</span>
                    </Link>
                    <Link to="/admin/configuracion" className="menu-item" onClick={cerrarMenu}>
                      <span>Configuración</span>
                    </Link>
                    <Link to="/admin/configuracion-senas" className="menu-item" onClick={cerrarMenu}>
                      <span>Señas y Pagos</span>
                    </Link>
                    <Link to="/admin/pagos" className="menu-item" onClick={cerrarMenu}>
                      <span>Gestión de Pagos</span>
                    </Link>
                    <Link to="/admin/estadisticas" className="menu-item" onClick={cerrarMenu}>
                      <span>Estadísticas</span>
                    </Link>
                    <Link to="/admin/perfil" className="menu-item" onClick={cerrarMenu}>
                      <span>Mi Perfil</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="menu-footer">
                <button onClick={handleLogout} className="menu-item logout">
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Sin menú cuando no está autenticado */
          <div className="navbar-menu-simple">
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

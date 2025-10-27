// frontend/src/pages/admin/Dashboard.jsx

import { Link } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1 className="dashboard-title">Panel de Administración</h1>

        {/* Gestión Rápida */}
        <div className="admin-section">
          <div className="section-header">
            <h2>Gestión</h2>
          </div>
          <div className="gestion-grid">
            <Link to="/admin/servicios" className="gestion-card">
              <div className="gestion-header">
                <h3>Servicios</h3>
              </div>
              <p className="gestion-descripcion">
                Administrar servicios, precios y duraciones
              </p>
              <div className="gestion-footer">
                <span className="gestion-link">Gestionar →</span>
              </div>
            </Link>

            <Link to="/admin/barberos" className="gestion-card">
              <div className="gestion-header">
                <h3>Barberos</h3>
              </div>
              <p className="gestion-descripcion">
                Gestionar equipo de barberos y horarios
              </p>
              <div className="gestion-footer">
                <span className="gestion-link">Gestionar →</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="admin-section">
          <div className="section-header">
            <h2>Estadísticas</h2>
          </div>
          <Link to="/admin/estadisticas" className="estadisticas-card">
            <div className="estadisticas-content">
              <div className="estadisticas-info">
                <h3>Panel de Estadísticas</h3>
                <p>Ver métricas e indicadores de la barbería</p>
              </div>
            </div>
            <span className="estadisticas-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

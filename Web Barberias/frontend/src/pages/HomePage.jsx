import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

/**
 * Página principal - Mobile-First
 * Landing page optimizada para que clientes reserven desde móvil
 */

const HomePage = () => {
  const { usuario, estaAutenticado } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Reserva tu turno en segundos
          </h1>
          <p className="hero-subtitle">
            Elegí tu barbero, servicio y horario. Todo desde tu celular.
          </p>

          {!estaAutenticado ? (
            <div className="hero-actions">
              <Link to="/reservar" className="btn btn-primary">
                📅 Reservar Turno
              </Link>
              <Link to="/login" className="btn btn-outline">
                Iniciar Sesión
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/reservar" className="btn btn-primary">
                📅 Reservar Turno
              </Link>
              {usuario?.rol === 'cliente' && (
                <Link to="/cliente" className="btn btn-secondary">
                  Ver mis turnos
                </Link>
              )}
              {usuario?.rol === 'barbero' && (
                <Link to="/barbero" className="btn btn-secondary">
                  Mi agenda
                </Link>
              )}
              {usuario?.rol === 'admin' && (
                <Link to="/admin" className="btn btn-secondary">
                  Panel Admin
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Servicios Destacados */}
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Nuestros Servicios</h2>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">✂️</div>
              <h3>Corte Clásico</h3>
              <p>Corte tradicional con tijera y máquina</p>
              <span className="service-price">$5.000</span>
            </div>

            <div className="service-card">
              <div className="service-icon">🪒</div>
              <h3>Corte + Barba</h3>
              <p>Servicio completo con arreglo de barba</p>
              <span className="service-price">$7.500</span>
            </div>

            <div className="service-card">
              <div className="service-icon">🎨</div>
              <h3>Coloración</h3>
              <p>Tinte profesional de canas o cambio de color</p>
              <span className="service-price">$10.000</span>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">¿Por qué reservar online?</h2>

          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">⚡</div>
              <h3>Rápido y Fácil</h3>
              <p>Reserva en menos de 2 minutos</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">📱</div>
              <h3>Desde tu Celular</h3>
              <p>Sin necesidad de llamar</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">🔔</div>
              <h3>Recordatorios</h3>
              <p>Te avisamos 30 min antes</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">👨</div>
              <h3>Elegí tu Barbero</h3>
              <p>Seleccioná tu preferido</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-section">
        <div className="container text-center">
          <h2>¿Listo para tu próximo corte?</h2>
          <Link to="/reservar" className="btn btn-primary btn-lg">
            Reservar Ahora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

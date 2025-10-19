import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import turnoService from '../../services/turnoService';
import './BarberoDashboard.css';

/**
 * Dashboard del Barbero - Mobile-First
 * Vista general de turnos del día y estadísticas
 */

const BarberoDashboard = () => {
  const { usuario } = useAuth();
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    proximoTurno: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Obtener fecha local en formato YYYY-MM-DD
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      const fechaHoy = `${year}-${month}-${day}`;

      // Obtener turnos de hoy
      const response = await turnoService.obtenerMisTurnos({
        fecha: fechaHoy,
        limite: 20,
      });

      const turnos = response.datos || [];
      setTurnosHoy(turnos);

      // Calcular próximo turno
      const proximo = turnos
        .filter((t) => t.estado === 'reservado')
        .sort((a, b) => a.hora.localeCompare(b.hora))[0];

      setEstadisticas({
        proximoTurno: proximo,
      });
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarTurno = async (turnoId) => {
    if (!window.confirm('¿Marcar este turno como completado?')) {
      return;
    }

    try {
      await turnoService.actualizarEstado(turnoId, 'completado');
      cargarDatos();
    } catch (err) {
      alert('Error al completar el turno');
    }
  };

  const formatearHora = (hora) => {
    return hora.substring(0, 5); // HH:MM
  };

  // Limitar turnos a mostrar (máximo 3)
  const turnosMostrar = turnosHoy.slice(0, 3);
  const hayMasTurnos = turnosHoy.length > 3;

  return (
    <div className="barbero-dashboard">
      <div className="container">
        {/* Bienvenida */}
        <div className="bienvenida-card">
          <h1>Hola, {usuario?.nombre}</h1>
          <p>
            {new Date().toLocaleDateString('es-AR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Turnos de Hoy */}
        <div className="seccion">
          <div className="seccion-header">
            <h2>Turnos de hoy</h2>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Cargando turnos...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : turnosHoy.length === 0 ? (
            <div className="empty-state">
              <h3>No tienes turnos para hoy</h3>
              <p>Disfruta tu día libre</p>
            </div>
          ) : (
            <>
              <div className="turnos-lista">
                {turnosMostrar.map((turno) => (
                  <div
                    key={turno._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'white',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      border: '1px solid #e9ecef',
                    }}
                  >
                    {/* Info del turno */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      minWidth: 0,
                    }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        color: '#212529',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                      }}>
                        <span>{turno.servicio?.nombre}</span>
                        <span style={{ color: '#6c757d' }}>•</span>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {formatearHora(turno.hora)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6c757d',
                        display: 'flex',
                        gap: '0.5rem',
                      }}>
                        <span style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {turno.cliente?.nombre} {turno.cliente?.apellido}
                        </span>
                        <span>•</span>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {turno.cliente?.telefono}
                        </span>
                      </div>
                    </div>

                    {/* Estado */}
                    <div style={{
                      fontSize: '0.625rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      background:
                        turno.estado === 'completado' ? '#d4edda' :
                        turno.estado === 'reservado' ? '#d1ecf1' :
                        turno.estado === 'cancelado' ? '#f8d7da' : '#e2e3e5',
                      color:
                        turno.estado === 'completado' ? '#155724' :
                        turno.estado === 'reservado' ? '#0c5460' :
                        turno.estado === 'cancelado' ? '#721c24' : '#383d41',
                    }}>
                      {turno.estado === 'reservado' ? 'Reservado' :
                       turno.estado === 'completado' ? 'Completado' :
                       turno.estado === 'cancelado' ? 'Cancelado' : turno.estado}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón Ver Todos */}
              {hayMasTurnos && (
                <Link
                  to="/barbero/agenda"
                  className="btn-ver-todos"
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    color: '#007bff',
                    background: 'transparent',
                    border: '1px solid #007bff',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#007bff';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#007bff';
                  }}
                >
                  Ver todos ({turnosHoy.length} turnos)
                </Link>
              )}
            </>
          )}
        </div>

        {/* Próximo Turno */}
        {estadisticas.proximoTurno && (
          <div className="seccion">
            <div className="seccion-header" style={{ textAlign: 'center' }}>
              <h2>Próximo turno</h2>
            </div>
            <div className="proximo-turno-card">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '0.75rem',
              }}>
                {/* Hora */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.15rem',
                }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Hora
                  </span>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#212529',
                  }}>
                    {formatearHora(estadisticas.proximoTurno.hora)}
                  </span>
                </div>

                {/* Cliente */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #e9ecef',
                }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Cliente
                  </span>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#212529',
                  }}>
                    {estadisticas.proximoTurno.cliente?.nombre} {estadisticas.proximoTurno.cliente?.apellido}
                  </span>
                </div>

                {/* Servicio */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Servicio
                  </span>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#212529',
                  }}>
                    {estadisticas.proximoTurno.servicio?.nombre}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="acciones-rapidas acciones-rapidas-agenda">
          <Link to="/barbero/agenda" className="accion-card">
            <div>
              <h3>Ver Agenda</h3>
              <p>Agenda completa y turnos</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BarberoDashboard;

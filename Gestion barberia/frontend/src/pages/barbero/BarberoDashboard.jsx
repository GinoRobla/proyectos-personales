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
      const hoy = new Date().toISOString().split('T')[0];

      // Obtener turnos de hoy
      const response = await turnoService.obtenerMisTurnos({
        fecha: hoy,
        limite: 20,
      });

      const turnos = response.turnos || [];
      setTurnosHoy(turnos);

      // Calcular próximo turno
      const proximo = turnos
        .filter((t) => t.estado === 'confirmado')
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
            <div className="turnos-lista">
              {turnosHoy.map((turno) => (
                <div
                  key={turno._id}
                  className={`turno-card turno-${turno.estado}`}
                >
                  <div className="turno-header">
                    <div className="hora-card">
                      <span className="hora">{formatearHora(turno.hora)}</span>
                    </div>
                    <span className={`estado-badge estado-${turno.estado}`}>
                      {turno.estado === 'confirmado' && 'Reservado'}
                      {turno.estado === 'completado' && 'Completado'}
                      {turno.estado === 'cancelado' && 'Cancelado'}
                    </span>
                  </div>

                  <div className="turno-info">
                    <div className="cliente-info">
                      <div>
                        <h4>
                          {turno.cliente?.nombre} {turno.cliente?.apellido}
                        </h4>
                        <p className="cliente-telefono">
                          {turno.cliente?.telefono}
                        </p>
                      </div>
                    </div>

                    <div className="servicio-info">
                      <span className="servicio-nombre">
                        {turno.servicio?.nombre}
                      </span>
                      <span className="servicio-duracion">
                        {turno.servicio?.duracion} min
                      </span>
                    </div>
                  </div>

                  {turno.estado === 'confirmado' && (
                    <div className="turno-acciones">
                      <button
                        onClick={() => handleCompletarTurno(turno._id)}
                        className="btn btn-primary btn-sm"
                      >
                        Marcar como completado
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximo Turno */}
        {estadisticas.proximoTurno && (
          <div className="seccion">
            <div className="seccion-header">
              <h2>Próximo turno</h2>
            </div>
            <div className="proximo-turno-card">
              <div className="proximo-hora">
                {formatearHora(estadisticas.proximoTurno.hora)}
              </div>
              <div className="proximo-info">
                <h3>{estadisticas.proximoTurno.cliente?.nombre} {estadisticas.proximoTurno.cliente?.apellido}</h3>
                <p>{estadisticas.proximoTurno.servicio?.nombre}</p>
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="acciones-rapidas">
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

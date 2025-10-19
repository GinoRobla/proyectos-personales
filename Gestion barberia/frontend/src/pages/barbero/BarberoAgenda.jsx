import { useState, useEffect } from 'react';
import turnoService from '../../services/turnoService';
import './BarberoAgenda.css';

/**
 * Agenda del Barbero - Mobile-First
 * Vista completa de turnos con filtros por fecha y estado
 */

const BarberoAgenda = () => {
  // Helper para obtener fecha local en formato YYYY-MM-DD
  const obtenerFechaLocal = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [turnos, setTurnos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaLocal());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarTurnos();
  }, [fechaSeleccionada]);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        fecha: fechaSeleccionada,
      };

      const response = await turnoService.obtenerMisTurnos(params);

      setTurnos(response.datos || []);
    } catch (err) {
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarFecha = (e) => {
    setFechaSeleccionada(e.target.value);
  };

  const handleCompletarTurno = async (turnoId) => {
    if (!window.confirm('¿Marcar este turno como completado?')) {
      return;
    }

    try {
      await turnoService.actualizarEstado(turnoId, 'completado');
      cargarTurnos();
    } catch (err) {
      alert('Error al completar el turno');
    }
  };

  const handleCancelarTurno = async (turnoId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este turno?')) {
      return;
    }

    try {
      await turnoService.cancelarTurno(turnoId);
      cargarTurnos();
    } catch (err) {
      alert('Error al cancelar el turno');
    }
  };

  const handleDiaAnterior = () => {
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    fecha.setDate(fecha.getDate() - 1);
    setFechaSeleccionada(obtenerFechaLocal(fecha));
  };

  const handleDiaSiguiente = () => {
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    fecha.setDate(fecha.getDate() + 1);
    setFechaSeleccionada(obtenerFechaLocal(fecha));
  };

  const handleHoy = () => {
    setFechaSeleccionada(obtenerFechaLocal());
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatearHora = (hora) => {
    return hora.substring(0, 5); // HH:MM
  };

  const esHoy = () => {
    return fechaSeleccionada === obtenerFechaLocal();
  };

  return (
    <div className="barbero-agenda">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Mi Agenda</h1>
            <p>Gestiona tus turnos y horarios</p>
          </div>
        </div>

        {/* Selector de Fecha */}
        <div className="fecha-selector">
          <button onClick={handleDiaAnterior} className="btn-nav">
            ←
          </button>

          <div className="fecha-actual">
            <span className="fecha-texto">
              {formatearFecha(fechaSeleccionada)}
            </span>
          </div>

          <button onClick={handleDiaSiguiente} className="btn-nav">
            →
          </button>
        </div>

        {/* Selector de Fecha Manual y Botón Hoy */}
        <div className="fecha-manual-container">
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={handleCambiarFecha}
            className="input-fecha"
          />
          {!esHoy() && (
            <button onClick={handleHoy} className="btn-ir-hoy">
              Ir a hoy
            </button>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando turnos...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : turnos.length === 0 ? (
          <div className="empty-state">
            <h3>No hay turnos para esta fecha</h3>
            <p>No tienes turnos programados para este día</p>
          </div>
        ) : (
          <>
            {/* Lista de Turnos */}
            <div className="turnos-lista">
              {turnos.map((turno) => (
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

          </>
        )}
      </div>
    </div>
  );
};

export default BarberoAgenda;

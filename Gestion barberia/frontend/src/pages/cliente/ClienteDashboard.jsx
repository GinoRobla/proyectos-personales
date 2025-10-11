import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import turnoService from '../../services/turnoService';
import './ClienteDashboard.css';

/**
 * Dashboard del Cliente - Mobile-First
 * Vista general de próximos turnos y accesos rápidos
 */

const ClienteDashboard = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [proximosTurnos, setProximosTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [turnoCancelarId, setTurnoCancelarId] = useState(null);

  useEffect(() => {
    cargarProximosTurnos();
  }, []);

  const cargarProximosTurnos = async () => {
    try {
      setLoading(true);
      // Obtener solo los próximos 3 turnos
      const response = await turnoService.obtenerMisTurnos({
        pagina: 1,
        limite: 3,
        estado: 'confirmado',
      });

      // Ordenar de más próximo a más lejano
      const turnosOrdenados = (response.datos || response.turnos || []).sort((a, b) => {
        const fechaHoraA = new Date(`${a.fecha.split('T')[0]}T${a.hora}`);
        const fechaHoraB = new Date(`${b.fecha.split('T')[0]}T${b.hora}`);
        return fechaHoraA - fechaHoraB;
      });

      setProximosTurnos(turnosOrdenados);
    } catch (err) {
      setError('Error al cargar tus próximos turnos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCancelar = (turnoId) => {
    setTurnoCancelarId(turnoId);
    setMostrarModalCancelar(true);
  };

  const cerrarModalCancelar = () => {
    setMostrarModalCancelar(false);
    setTurnoCancelarId(null);
  };

  const handleCancelarTurno = async () => {
    try {
      await turnoService.cancelarTurno(turnoCancelarId);
      cerrarModalCancelar();
      cerrarModal();
      // Recargar turnos
      cargarProximosTurnos();
    } catch (err) {
      alert('Error al cancelar el turno');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatearFechaCorta = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const verDetalles = (turno) => {
    setTurnoSeleccionado(turno);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setTurnoSeleccionado(null);
  };

  return (
    <div className="cliente-dashboard">
      <div className="container">
        {/* Bienvenida */}
        <div className="bienvenida-card">
          <h1>¡Hola, {usuario?.nombre}!</h1>
          <p>Reservá tu próximo turno</p>
        </div>

        {/* Próximos Turnos */}
        <div className="seccion">
          <div className="seccion-header">
            <h2>Próximos Turnos</h2>
            <Link to="/reservar" className="btn-reservar-compacto">
              Reservar Turno
            </Link>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Cargando turnos...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : proximosTurnos.length === 0 ? (
            <div className="empty-state">
              <h3>No tienes turnos próximos</h3>
              <p>Reserva tu próximo turno ahora</p>
              <Link to="/reservar" className="btn btn-primary">
                Reservar Turno
              </Link>
            </div>
          ) : (
            <>
              <div className="turnos-lista">
                {proximosTurnos.map((turno) => (
                  <div key={turno._id} className="turno-card-simple">
                    <div className="turno-hora">
                      {turno.hora}
                    </div>
                    <div className="turno-fecha">
                      {formatearFechaCorta(turno.fecha)}
                    </div>
                    <button
                      onClick={() => verDetalles(turno)}
                      className="btn-ver-detalles"
                    >
                      Ver detalles
                    </button>
                  </div>
                ))}
              </div>
              <div className="seccion-footer">
                <Link to="/cliente/turnos" className="ver-todos-btn">
                  Ver todos los turnos →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Información de la Barbería */}
        <div className="info-barberia">
          <h3>Información de la Barbería</h3>
          <div className="info-lista">
            <div className="info-item-barberia">
              <strong>Ubicación:</strong>
              <span>Av. Principal 123, Centro - Buenos Aires, Argentina</span>
            </div>
            <div className="info-item-barberia">
              <strong>Horarios:</strong>
              <span>Lunes a Sábado de 9:00 a 18:00 hs</span>
            </div>
            <div className="info-item-barberia">
              <strong>Contacto:</strong>
              <span>+54 11 1234-5678 • info@barberiaGR.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Turno */}
      {mostrarModal && turnoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content-turno" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Turno</h2>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detalle-grupo">
                <label>Fecha</label>
                <span>{formatearFecha(turnoSeleccionado.fecha)}</span>
              </div>

              <div className="detalle-grupo">
                <label>Hora</label>
                <span>{turnoSeleccionado.hora}</span>
              </div>

              <div className="detalle-grupo">
                <label>Servicio</label>
                <span>{turnoSeleccionado.servicio?.nombre}</span>
              </div>

              <div className="detalle-grupo">
                <label>Barbero</label>
                <span>
                  {turnoSeleccionado.barbero
                    ? `${turnoSeleccionado.barbero.nombre} ${turnoSeleccionado.barbero.apellido}`
                    : 'Por asignar'}
                </span>
              </div>

              <div className="detalle-grupo">
                <label>Precio</label>
                <span className="precio">${turnoSeleccionado.servicio?.precioBase}</span>
              </div>

              <div className="detalle-grupo">
                <label>Estado</label>
                <span className={`estado-badge estado-${turnoSeleccionado.estado}`}>
                  {turnoSeleccionado.estado === 'pendiente' && 'Pendiente'}
                  {turnoSeleccionado.estado === 'confirmado' && 'Reservado'}
                  {turnoSeleccionado.estado === 'completado' && 'Completado'}
                  {turnoSeleccionado.estado === 'cancelado' && 'Cancelado'}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              {(turnoSeleccionado.estado === 'pendiente' || turnoSeleccionado.estado === 'confirmado') && (
                <>
                  <button
                    onClick={() => {
                      cerrarModal();
                      navigate(`/reservar?editar=${turnoSeleccionado._id}`);
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      abrirModalCancelar(turnoSeleccionado._id);
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cancelación */}
      {mostrarModalCancelar && (
        <div className="modal-overlay" onClick={cerrarModalCancelar}>
          <div className="modal-content-confirmar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Cancelación</h2>
              <button className="modal-close" onClick={cerrarModalCancelar}>✕</button>
            </div>

            <div className="modal-body">
              <p>¿Estás seguro de que deseas cancelar este turno?</p>
              <p className="advertencia">Esta acción no se puede deshacer.</p>
            </div>

            <div className="modal-footer">
              <button
                onClick={cerrarModalCancelar}
                className="btn btn-outline btn-sm"
              >
                No, mantener turno
              </button>
              <button
                onClick={handleCancelarTurno}
                className="btn btn-danger btn-sm"
              >
                Sí, cancelar turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteDashboard;

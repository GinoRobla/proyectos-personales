import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import turnoService from '../../services/turnoService';
import './ClienteTurnos.css';

/**
 * Página de Mis Turnos - Mobile-First
 * Historial completo de turnos del cliente con paginación
 */

const ClienteTurnos = () => {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [turnoCancelarId, setTurnoCancelarId] = useState(null);

  useEffect(() => {
    cargarTurnos();
  }, [paginacion.pagina]);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        pagina: paginacion.pagina,
        limite: paginacion.limite,
      };

      const response = await turnoService.obtenerMisTurnos(params);

      // Ordenar turnos: confirmados primero (por fecha), luego completados, luego cancelados
      const turnosOrdenados = (response.datos || response.turnos || []).sort((a, b) => {
        // Prioridad de estados
        const prioridadEstado = {
          'confirmado': 1,
          'completado': 2,
          'cancelado': 3,
          'pendiente': 0
        };

        const prioridadA = prioridadEstado[a.estado] || 99;
        const prioridadB = prioridadEstado[b.estado] || 99;

        // Si tienen diferente estado, ordenar por prioridad
        if (prioridadA !== prioridadB) {
          return prioridadA - prioridadB;
        }

        // Si tienen el mismo estado, ordenar por fecha y hora
        const fechaHoraA = new Date(`${a.fecha.split('T')[0]}T${a.hora}`);
        const fechaHoraB = new Date(`${b.fecha.split('T')[0]}T${b.hora}`);

        // Para confirmados: más próximo primero (ascendente)
        // Para completados y cancelados: más reciente primero (descendente)
        if (a.estado === 'confirmado') {
          return fechaHoraA - fechaHoraB;
        } else {
          return fechaHoraB - fechaHoraA;
        }
      });

      setTurnos(turnosOrdenados);
      setPaginacion({
        ...paginacion,
        total: response.paginacion?.total || response.total || 0,
        totalPaginas: response.paginacion?.totalPaginas || response.totalPaginas || 0,
      });
    } catch (err) {
      setError('Error al cargar tus turnos');
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
      cargarTurnos();
    } catch (err) {
      alert('Error al cancelar el turno');
    }
  };

  const handlePaginaSiguiente = () => {
    if (paginacion.pagina < paginacion.totalPaginas) {
      setPaginacion({ ...paginacion, pagina: paginacion.pagina + 1 });
    }
  };

  const handlePaginaAnterior = () => {
    if (paginacion.pagina > 1) {
      setPaginacion({ ...paginacion, pagina: paginacion.pagina - 1 });
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
    <div className="cliente-turnos">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Mis Turnos</h1>
            <p>Historial completo de tus reservas</p>
          </div>
          <Link to="/reservar" className="btn-reservar-header">
            Reservar Turno
          </Link>
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
            <h3>No se encontraron turnos</h3>
            <p>Aún no has reservado ningún turno</p>
            <Link to="/reservar" className="btn-reservar-header">
              Reservar Turno
            </Link>
          </div>
        ) : (
          <>
            {/* Lista de Turnos - Tabla */}
            <div className="turnos-tabla">
              <div className="tabla-header">
                <div className="th">Fecha y Hora</div>
                <div className="th">Servicio</div>
                <div className="th">Barbero</div>
                <div className="th">Estado</div>
                <div className="th">Acciones</div>
              </div>
              {turnos.map((turno) => (
                <div key={turno._id} className="tabla-row">
                  <div className="td fecha-hora-col">
                    <span className="fecha">{formatearFechaCorta(turno.fecha)}</span>
                    <span className="hora">{turno.hora}</span>
                  </div>
                  <div className="td servicio-col">
                    {turno.servicio?.nombre}
                  </div>
                  <div className="td barbero-col">
                    {turno.barbero
                      ? `${turno.barbero.nombre} ${turno.barbero.apellido}`
                      : 'Por asignar'}
                  </div>
                  <div className="td estado-col">
                    <span className={`estado-badge estado-${turno.estado}`}>
                      {turno.estado === 'confirmado' && 'Reservado'}
                      {turno.estado === 'completado' && 'Completado'}
                      {turno.estado === 'cancelado' && 'Cancelado'}
                      {turno.estado === 'pendiente' && 'Pendiente'}
                    </span>
                  </div>
                  <div className="td acciones-col">
                    <button
                      onClick={() => verDetalles(turno)}
                      className="btn-ver-detalles"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
              <div className="paginacion">
                <button
                  onClick={handlePaginaAnterior}
                  disabled={paginacion.pagina === 1}
                  className="btn btn-outline"
                >
                  ← Anterior
                </button>

                <span className="paginacion-info">
                  Página {paginacion.pagina} de {paginacion.totalPaginas}
                  <small>({paginacion.total} turnos en total)</small>
                </span>

                <button
                  onClick={handlePaginaSiguiente}
                  disabled={paginacion.pagina >= paginacion.totalPaginas}
                  className="btn btn-outline"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
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
                <span className="precio">${turnoSeleccionado.precio || turnoSeleccionado.servicio?.precioBase}</span>
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
              {turnoSeleccionado.estado === 'confirmado' && (
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

export default ClienteTurnos;

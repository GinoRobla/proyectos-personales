// frontend/src/pages/cliente/ClienteTurnos.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import turnoService from '../../services/turnoService';
import { obtenerTextoEstadoPago, obtenerColorEstadoPago } from '../../services/pagoService';
import useModal from '../../hooks/useModal';
import { formatearFechaCorta, formatearFechaLarga } from '../../utils/dateUtils';
import useApi from '../../hooks/useApi';
import './ClienteTurnos.css';

const ClienteTurnos = () => {
  const toast = useToast();
  const [turnos, setTurnos] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, limite: 10, total: 0, totalPaginas: 0 });
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [turnoCancelarId, setTurnoCancelarId] = useState(null);

  // Hooks de modales
  const { isOpen: detalleModalOpen, openModal: openDetalleModal, closeModal: closeDetalleModal } = useModal();
  const { isOpen: cancelarModalOpen, openModal: openCancelarModal, closeModal: closeCancelarModal } = useModal();

  // Hooks de API
  const { loading: loadingTurnos, request: cargarTurnosApi } = useApi(turnoService.obtenerMisTurnos);
  const { loading: loadingCancelar, request: cancelarTurnoApi } = useApi(turnoService.cancelarTurno);

  // Scroll al inicio cuando se monta el componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cargar turnos
  const cargarTurnos = useCallback(async () => {
    const params = { pagina: paginacion.pagina, limite: paginacion.limite };
    const { success, data, message } = await cargarTurnosApi(params);

    console.log('[DEBUG ClienteTurnos] Success:', success);
    console.log('[DEBUG ClienteTurnos] Data completa:', data);

    if (success) {
      // Si data es directamente un array, usarlo. Si no, buscar en data.datos o data.turnos
      const turnosArray = Array.isArray(data) ? data : (data?.datos || data?.turnos || []);
      console.log('[DEBUG ClienteTurnos] Turnos finales:', turnosArray);
      console.log('[DEBUG ClienteTurnos] Paginación recibida:', data?.paginacion);
      setTurnos(turnosArray);

      // Actualizar información de paginación
      if (!Array.isArray(data) && data?.paginacion) {
        const nuevaPaginacion = {
          ...paginacion,
          total: data.paginacion.total || 0,
          totalPaginas: data.paginacion.totalPaginas || 0,
        };
        console.log('[DEBUG ClienteTurnos] Nueva paginación:', nuevaPaginacion);
        console.log('[DEBUG ClienteTurnos] Total:', data.paginacion.total);
        console.log('[DEBUG ClienteTurnos] Total Páginas:', data.paginacion.totalPaginas);
        setPaginacion(nuevaPaginacion);
      }
    } else {
      toast.error(message || 'Error al cargar tus turnos', 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginacion.pagina, paginacion.limite]);

  useEffect(() => {
    cargarTurnos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginacion.pagina, paginacion.limite]);

  // Paginación
  const handlePaginaSiguiente = () => {
    if (paginacion.pagina < paginacion.totalPaginas) {
      setPaginacion(prev => ({ ...prev, pagina: prev.pagina + 1 }));
    }
  };

  const handlePaginaAnterior = () => {
    if (paginacion.pagina > 1) {
      setPaginacion(prev => ({ ...prev, pagina: prev.pagina - 1 }));
    }
  };

  // Modales
  const verDetalles = (turno) => {
    setTurnoSeleccionado(turno);
    openDetalleModal();
  };

  const cerrarModalDetalles = () => {
    closeDetalleModal();
    setTurnoSeleccionado(null);
  };

  const abrirModalCancelar = (turnoId) => {
    setTurnoCancelarId(turnoId);
    openCancelarModal();
  };

  const cerrarModalCancelar = () => {
    closeCancelarModal();
    setTurnoCancelarId(null);
  };

  const handleCancelarTurno = async () => {
    if (!turnoCancelarId) return;

    const { success, message, data } = await cancelarTurnoApi(turnoCancelarId);

    if (success) {
      // Mostrar mensaje apropiado dependiendo de si hubo devolución
      if (data?.devolucion) {
        if (data.devolucion.devuelto) {
          toast.success(message || 'Turno cancelado y seña devuelta exitosamente', 5000);
        } else if (data.devolucion.error) {
          toast.warning(message || 'Turno cancelado, pero no se pudo procesar la devolución automática', 5000);
        }
      } else {
        toast.success(message || 'Turno cancelado correctamente', 3000);
      }
      cerrarModalCancelar();
      cargarTurnos();
    } else {
      toast.error(message || 'No se pudo cancelar tu turno. Intenta de nuevo', 4000);
    }
  };

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'reservado': return 'estado-reservado';
      case 'completado': return 'estado-completado';
      case 'cancelado': return 'estado-cancelado';
      default: return '';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente de Pago';
      case 'reservado': return 'Reservado';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  // Log para debug de paginación
  console.log('[DEBUG RENDER] paginacion.totalPaginas:', paginacion.totalPaginas);
  console.log('[DEBUG RENDER] paginacion completa:', paginacion);

  return (
    <div className="cliente-turnos">
      <div className="container">
        <div className="header-turnos">
          <h1>Mis Turnos</h1>
          <Link to="/reservar" className="btn-reservar-header">Nuevo Turno</Link>
        </div>

        {loadingTurnos ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando turnos...</p>
          </div>
        ) : turnos.length === 0 ? (
          <div className="empty-state">
            <h3>No tienes turnos</h3>
            <p>Reserva tu primer turno</p>
            <Link to="/reservar" className="btn btn-primary">Reservar Turno</Link>
          </div>
        ) : (
          <>
            <div className="turnos-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((turno) => (
                    <tr key={turno._id}>
                      <td>{formatearFechaCorta(turno.fecha)}</td>
                      <td>{turno.hora}</td>
                      <td>
                        <span className={`estado-badge ${getEstadoBadgeClass(turno.estado)}`}>
                          {getEstadoTexto(turno.estado)}
                        </span>
                      </td>
                      <td>
                        {turno.requiereSena ? (
                          <span
                            className="pago-badge"
                            style={{ backgroundColor: obtenerColorEstadoPago(turno.estadoPago) }}
                          >
                            {obtenerTextoEstadoPago(turno.estadoPago)}
                          </span>
                        ) : (
                          <span className="pago-badge no-requiere">No requiere</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          {turno.estado === 'pendiente' && turno.pago?.urlPago ? (
                            <a
                              href={turno.pago.urlPago}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-pagar"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.6rem' }}
                            >
                              Completar Pago
                            </a>
                          ) : (
                            <button
                              onClick={() => verDetalles(turno)}
                              className="btn-ver-detalles"
                            >
                              Ver detalles
                            </button>
                          )}
                          {turno.estado === 'reservado' && (
                            <button
                              onClick={() => abrirModalCancelar(turno._id)}
                              className="btn-cancelar-turno-tabla"
                              disabled={loadingCancelar}
                            >
                              Cancelar turno
                            </button>
                          )}
                          {turno.estado === 'reservado' && turno.requiereSena && turno.estadoPago === 'pendiente' && turno.pago?.urlPago && (
                            <a
                              href={turno.pago.urlPago}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-pagar"
                            >
                              Completar Pago
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
              <div className="paginacion">
                <button
                  onClick={handlePaginaAnterior}
                  disabled={paginacion.pagina === 1}
                  className="btn-paginacion"
                >
                  ← Anterior
                </button>
                <span className="paginacion-info">
                  Página {paginacion.pagina} de {paginacion.totalPaginas}
                </span>
                <button
                  onClick={handlePaginaSiguiente}
                  disabled={paginacion.pagina >= paginacion.totalPaginas}
                  className="btn-paginacion"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Cancelar Turno */}
      {cancelarModalOpen && (
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
                disabled={loadingCancelar}
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelarTurno}
                className="btn btn-danger btn-sm"
                disabled={loadingCancelar}
              >
                {loadingCancelar ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {detalleModalOpen && turnoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModalDetalles}>
          <div className="modal-content-turno" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Turno</h2>
              <button className="modal-close" onClick={cerrarModalDetalles}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detalle-grupo">
                <label>Fecha</label>
                <span>{formatearFechaLarga(turnoSeleccionado.fecha)}</span>
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
                <span className={`estado-badge ${getEstadoBadgeClass(turnoSeleccionado.estado)}`}>
                  {getEstadoTexto(turnoSeleccionado.estado)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteTurnos;

import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { obtenerPagos, obtenerTextoEstadoPago, obtenerColorEstadoPago } from '../../services/pagoService';
import './GestionPagos.css';

const GestionPagos = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [pagos, setPagos] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [modalPago, setModalPago] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const pagosPorPagina = 10;

  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async (mantenerScroll = false) => {
    // Solo mostrar loading en la carga inicial
    if (!mantenerScroll) {
      setLoading(true);
    }
    try {
      const response = await obtenerPagos(filtros);
      if (response.success) {
        setPagos(response.data || []);
      } else {
        toast.error(response.message || 'Error al cargar pagos');
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      toast.error('Error al cargar pagos');
    } finally {
      if (!mantenerScroll) {
        setLoading(false);
      }
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAplicarFiltros = () => {
    setPaginaActual(1); // Resetear a página 1 al aplicar filtros
    cargarPagos(true); // Mantener scroll al aplicar filtros
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      estado: '',
      fechaDesde: '',
      fechaHasta: '',
    });
    setPaginaActual(1); // Resetear a página 1 al limpiar filtros
    setTimeout(() => cargarPagos(true), 0); // Mantener scroll al limpiar filtros
  };

  // Calcular paginación
  const indexUltimoPago = paginaActual * pagosPorPagina;
  const indexPrimerPago = indexUltimoPago - pagosPorPagina;
  const pagosPaginados = pagos.slice(indexPrimerPago, indexUltimoPago);
  const totalPaginas = Math.ceil(pagos.length / pagosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearMonto = (monto) => {
    return `$${monto.toLocaleString('es-AR')}`;
  };

  if (loading) {
    return (
      <div className="gestion-pagos-page">
        <div className="loading">Cargando pagos...</div>
      </div>
    );
  }

  return (
    <div className="gestion-pagos-page">
      <div className="page-header">
        <h1>Gestión de Pagos</h1>
        <p className="subtitle">Administra todos los pagos de señas del sistema</p>
      </div>

      {/* Filtros */}
      <div className="filtros-card">
        <h3>Filtros</h3>
        <div className="filtros-grid">
          <div className="input-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="input"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="devuelto">Devuelto</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="fechaDesde">Desde</label>
            <input
              type="date"
              id="fechaDesde"
              name="fechaDesde"
              value={filtros.fechaDesde}
              onChange={handleFiltroChange}
              className="input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="fechaHasta">Hasta</label>
            <input
              type="date"
              id="fechaHasta"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFiltroChange}
              className="input"
            />
          </div>
        </div>

        <div className="filtros-acciones">
          <button onClick={handleAplicarFiltros} className="btn btn-primary">
            Aplicar Filtros
          </button>
          <button onClick={handleLimpiarFiltros} className="btn btn-secondary">
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="pagos-card">
        <h3>Pagos ({pagos.length})</h3>

        {pagos.length === 0 ? (
          <div className="no-data">
            <p>No se encontraron pagos con los filtros seleccionados</p>
          </div>
        ) : (
          <>
            <div className="tabla-container">
              <table className="tabla-pagos">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosPaginados.map((pago) => (
                    <tr key={pago._id}>
                      <td>{formatearFecha(pago.createdAt)}</td>
                      <td>
                        {pago.turno?.cliente?.nombre} {pago.turno?.cliente?.apellido}
                      </td>
                      <td className="monto">{formatearMonto(pago.monto)}</td>
                      <td>
                        <span
                          className="badge-estado"
                          style={{ backgroundColor: obtenerColorEstadoPago(pago.estado) }}
                        >
                          {obtenerTextoEstadoPago(pago.estado)}
                        </span>
                      </td>
                      <td className="acciones">
                        <button
                          onClick={() => setModalPago(pago)}
                          className="btn-accion btn-ver"
                          title="Ver detalles del pago"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="paginacion">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="btn-paginacion"
                >
                  ← Anterior
                </button>

                <div className="paginas-numeros">
                  {[...Array(totalPaginas)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => cambiarPagina(index + 1)}
                      className={`btn-pagina ${paginaActual === index + 1 ? 'activo' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="btn-paginacion"
                >
                  Siguiente →
                </button>
              </div>
            )}

            <div className="info-paginacion">
              Mostrando {indexPrimerPago + 1} - {Math.min(indexUltimoPago, pagos.length)} de {pagos.length} pagos
            </div>
          </>
        )}
      </div>

      {/* Resumen */}
      <div className="resumen-card">
        <h3>Resumen</h3>
        <div className="resumen-grid">
          <div className="resumen-item">
            <span className="resumen-label">Total Pagos:</span>
            <span className="resumen-valor">{pagos.length}</span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Aprobados:</span>
            <span className="resumen-valor aprobado">
              {pagos.filter((p) => p.estado === 'aprobado').length}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Pendientes:</span>
            <span className="resumen-valor pendiente">
              {pagos.filter((p) => p.estado === 'pendiente').length}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Rechazados:</span>
            <span className="resumen-valor rechazado">
              {pagos.filter((p) => p.estado === 'rechazado').length}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Devueltos:</span>
            <span className="resumen-valor devuelto">
              {pagos.filter((p) => p.estado === 'devuelto').length}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Monto Total Aprobado:</span>
            <span className="resumen-valor">
              {formatearMonto(
                pagos
                  .filter((p) => p.estado === 'aprobado')
                  .reduce((sum, p) => sum + p.monto, 0)
              )}
            </span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Monto Total Devuelto:</span>
            <span className="resumen-valor">
              {formatearMonto(
                pagos
                  .filter((p) => p.estado === 'devuelto')
                  .reduce((sum, p) => sum + p.monto, 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Pago */}
      {modalPago && (
        <div className="modal-overlay" onClick={() => setModalPago(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles del Pago</h3>
              <button className="modal-close" onClick={() => setModalPago(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <span className="modal-label">Cliente:</span>
                <span className="modal-value">
                  {modalPago.turno?.cliente?.nombre} {modalPago.turno?.cliente?.apellido}
                </span>
              </div>
              <div className="modal-info">
                <span className="modal-label">Monto:</span>
                <span className="modal-value monto">{formatearMonto(modalPago.monto)}</span>
              </div>
              <div className="modal-info">
                <span className="modal-label">Estado:</span>
                <span
                  className="badge-estado"
                  style={{ backgroundColor: obtenerColorEstadoPago(modalPago.estado) }}
                >
                  {obtenerTextoEstadoPago(modalPago.estado)}
                </span>
              </div>
              <div className="modal-info">
                <span className="modal-label">Fecha:</span>
                <span className="modal-value">{formatearFecha(modalPago.createdAt)}</span>
              </div>
              <div className="modal-info">
                <span className="modal-label">ID Preferencia:</span>
                <span className="modal-value modal-id">{modalPago.preferenciaId}</span>
              </div>
            </div>
            <div className="modal-footer">
              {modalPago.urlPago && (
                <a
                  href={modalPago.urlPago}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Ir al Link de Pago
                </a>
              )}
              <button onClick={() => setModalPago(null)} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPagos;

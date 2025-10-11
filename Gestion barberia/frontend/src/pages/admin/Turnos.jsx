import { useState, useEffect } from 'react';
import turnoService from '../../services/turnoService';
import './Turnos.css';

/**
 * Gestión de Turnos Admin - Mobile-First
 * Vista completa de todos los turnos del sistema con paginación
 */

const AdminTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fecha: '',
    barbero: '',
  });
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarTurnos();
  }, [filtros, paginacion.pagina]);

  const cargarTurnos = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        pagina: paginacion.pagina,
        limite: paginacion.limite,
      };

      if (filtros.estado !== 'todos') {
        params.estado = filtros.estado;
      }

      if (filtros.fecha) {
        params.fecha = filtros.fecha;
      }

      if (filtros.barbero) {
        params.barberoId = filtros.barbero;
      }

      const response = await turnoService.obtenerTodos(params);

      setTurnos(response.turnos || []);
      setPaginacion({
        ...paginacion,
        total: response.total,
        totalPaginas: response.totalPaginas,
      });
    } catch (err) {
      setError('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarFiltro = (campo, valor) => {
    setFiltros({ ...filtros, [campo]: valor });
    setPaginacion({ ...paginacion, pagina: 1 });
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

  const handleCancelarTurno = async (turnoId) => {
    if (!window.confirm('¿Cancelar este turno?')) {
      return;
    }

    try {
      await turnoService.cancelarTurno(turnoId);
      cargarTurnos();
    } catch (err) {
      alert('Error al cancelar el turno');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="admin-turnos">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1>Gestionar Turnos</h1>
          <p>Todos los turnos del sistema</p>
        </div>

        {/* Filtros */}
        <div className="filtros-panel">
          <div className="filtros-row">
            <div className="filtro-group">
              <label>Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => handleCambiarFiltro('estado', e.target.value)}
                className="input"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmado">Reservados</option>
                <option value="completado">Completados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

            <div className="filtro-group">
              <label>Fecha</label>
              <input
                type="date"
                value={filtros.fecha}
                onChange={(e) => handleCambiarFiltro('fecha', e.target.value)}
                className="input"
              />
            </div>
          </div>
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
            <span className="empty-icon">📅</span>
            <h3>No se encontraron turnos</h3>
            <p>Intenta cambiar los filtros</p>
          </div>
        ) : (
          <>
            {/* Lista de Turnos */}
            <div className="turnos-lista">
              {turnos.map((turno) => (
                <div key={turno._id} className="turno-card">
                  <div className="turno-header">
                    <div className="fecha-hora">
                      <span className="fecha">{formatearFecha(turno.fecha)}</span>
                      <span className="hora">{turno.hora}</span>
                    </div>
                    <span className={`estado-badge estado-${turno.estado}`}>
                      {turno.estado === 'confirmado' ? 'Reservado' :
                       turno.estado === 'completado' ? 'Completado' :
                       turno.estado === 'cancelado' ? 'Cancelado' :
                       turno.estado === 'pendiente' ? 'Pendiente' :
                       turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                    </span>
                  </div>

                  <div className="turno-detalles">
                    <div className="detalle-item">
                      <span className="label">Cliente:</span>
                      <span className="valor">
                        {turno.cliente?.nombre} {turno.cliente?.apellido}
                      </span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Barbero:</span>
                      <span className="valor">
                        {turno.barbero
                          ? `${turno.barbero.nombre} ${turno.barbero.apellido}`
                          : 'No asignado'}
                      </span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Servicio:</span>
                      <span className="valor">{turno.servicio?.nombre}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">Precio:</span>
                      <span className="valor precio">${turno.servicio?.precio}</span>
                    </div>
                  </div>

                  {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                    <div className="turno-acciones">
                      <button
                        onClick={() => handleCancelarTurno(turno._id)}
                        className="btn btn-outline btn-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
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
    </div>
  );
};

export default AdminTurnos;

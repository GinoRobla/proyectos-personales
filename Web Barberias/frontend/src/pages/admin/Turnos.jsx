// frontend/src/pages/admin/Turnos.jsx

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext'; // Para mensajes de éxito
import turnoService from '../../services/turnoService';
import useApi from '../../hooks/useApi'; // <-- Importar useApi
import { formatearFechaCorta } from '../../utils/dateUtils'; // Usar utils centralizados
import './Turnos.css';

const AdminTurnos = () => {
  const toast = useToast(); // Hook para notificaciones
  const [turnos, setTurnos] = useState([]);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fecha: '',
    barbero: '', // Mantenemos por si se añade el filtro en el futuro
  });
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    limite: 10,
    total: 0,
    totalPaginas: 0,
  });

  // --- HOOKS DE API ---
  const { loading: loadingTurnos, request: cargarTurnosApi } = useApi(turnoService.obtenerTodos);
  const { loading: loadingCancelar, request: cancelarTurnoApi } = useApi(turnoService.cancelarTurno);

  // Combina estados de carga
  const isLoading = loadingTurnos || loadingCancelar;

  // --- CARGAR TURNOS ---
  const cargarTurnos = useCallback(async () => {
    const params = {
      pagina: paginacion.pagina,
      limite: paginacion.limite,
    };
    if (filtros.estado !== 'todos') params.estado = filtros.estado;
    if (filtros.fecha) params.fecha = filtros.fecha;
    if (filtros.barbero) params.barberoId = filtros.barbero;

    const { success, data, message } = await cargarTurnosApi(params);

    if (success) {
      setTurnos(data.datos || data.turnos || []); // Ajustado según la normalización de useApi
      setPaginacion(prev => ({
        ...prev,
        total: data.paginacion?.total || 0,
        totalPaginas: data.paginacion?.totalPaginas || 0,
      }));
    } else {
      toast.error(message || 'Error al cargar los turnos', 4000);
    }
  }, [filtros, paginacion.pagina, paginacion.limite, cargarTurnosApi, toast]);

  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]); // Se ejecuta al inicio y cuando cambian los filtros/página

  // --- MANEJO DE FILTROS Y PAGINACIÓN (sin cambios significativos) ---
  const handleCambiarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginacion(prev => ({ ...prev, pagina: 1 })); // Volver a pág 1 al filtrar
  };

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

  // --- CANCELAR TURNO ---
  const handleCancelarTurno = async (turnoId) => {
    if (!window.confirm('¿Estás seguro de cancelar este turno?')) return;

    const { success, message } = await cancelarTurnoApi(turnoId);
    if (success) {
      toast.success('Turno cancelado correctamente', 3000);
      cargarTurnos(); // Recargar la lista
    } else {
      toast.error(message || 'No se pudo cancelar el turno. Verifica su estado', 4000);
    }
  };

  // --- RENDERIZADO ---
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
                disabled={isLoading} // Deshabilitar mientras carga
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option> {/* Asumiendo que 'pendiente' es un estado posible */}
                <option value="reservado">Reservados</option>
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
                disabled={isLoading} // Deshabilitar mientras carga
              />
            </div>
            {/* Aquí podrías agregar un filtro de Barbero si es necesario */}
          </div>
        </div>

        {/* Contenido */}
        {loadingTurnos && !loadingCancelar ? ( // Mostrar spinner solo si carga la lista
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando turnos...</p>
          </div>
        ) : turnos.length === 0 && !isLoading ? ( // Mostrar empty state si no hay turnos y no está cargando
           <div className="empty-state">
            <span className="empty-icon">📅</span>
            <h3>No se encontraron turnos</h3>
            <p>Intenta cambiar los filtros o verifica si hay turnos registrados</p>
          </div>
        ) : (
          <>
            {/* Lista/Tabla de Turnos */}
            <div className="turnos-tabla">
              {/* Header de tabla (visible en desktop) */}
              <div className="tabla-header">
                <div className="th">Fecha/Hora</div>
                <div className="th">Servicio</div>
                <div className="th">Cliente</div>
                <div className="th">Barbero</div>
                <div className="th">Estado</div>
                <div className="th">Acciones</div>
              </div>
              {/* Filas de turnos */}
              {turnos.map((turno) => (
                <div key={turno._id} className="tabla-row">
                  <div className="td fecha-hora-col">
                    <span className="fecha">{formatearFechaCorta(turno.fecha)}</span>
                    <span className="hora">{turno.hora}</span>
                  </div>
                   <div className="td servicio-col">{turno.servicio?.nombre || 'N/A'}</div>
                  <div className="td cliente-col">
                    {turno.cliente ? `${turno.cliente.nombre} ${turno.cliente.apellido}` : 'N/A'}
                  </div>
                  <div className="td barbero-col">
                    {turno.barbero ? `${turno.barbero.nombre} ${turno.barbero.apellido}` : 'Sin asignar'}
                  </div>
                  <div className="td estado-col">
                     <span className={`estado-badge estado-${turno.estado}`}>
                      {turno.estado === 'reservado' ? 'Reservado' :
                       turno.estado === 'completado' ? 'Completado' :
                       turno.estado === 'cancelado' ? 'Cancelado' :
                       turno.estado === 'pendiente' ? 'Pendiente' :
                       turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1)}
                    </span>
                  </div>
                  <div className="td acciones-col">
                    {(turno.estado === 'reservado' || turno.estado === 'pendiente') && (
                       <button
                        onClick={() => handleCancelarTurno(turno._id)}
                        className="btn btn-danger btn-sm" // Cambiado a btn-danger
                        disabled={loadingCancelar} // Deshabilitar si se está cancelando otro turno
                      >
                        {loadingCancelar ? '...' : 'Cancelar'}
                      </button>
                    )}
                    {/* Aquí podrían ir otros botones como "Editar" o "Ver Detalles" */}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {paginacion.totalPaginas > 1 && (
              <div className="paginacion">
                <button
                  onClick={handlePaginaAnterior}
                  disabled={paginacion.pagina === 1 || isLoading}
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
                  disabled={paginacion.pagina >= paginacion.totalPaginas || isLoading}
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
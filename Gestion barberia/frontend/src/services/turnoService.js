/**
 * ============================================================================
 * SERVICIO: GESTIÓN DE TURNOS
 * ============================================================================
 *
 * Maneja todas las operaciones relacionadas con los turnos de la barbería.
 *
 * RESPONSABILIDADES:
 * - Obtener listado de turnos (todos o filtrados)
 * - Obtener turnos del usuario autenticado
 * - Crear nuevos turnos (reservas)
 * - Actualizar información de turnos
 * - Cambiar el estado de turnos
 * - Cancelar turnos
 * - Consultar horarios disponibles
 *
 * ENDPOINTS UTILIZADOS:
 * - GET /turnos - Listar todos los turnos (admin)
 * - GET /turnos/mis-turnos - Turnos del usuario autenticado
 * - GET /turnos/:id - Obtener un turno específico
 * - POST /turnos - Crear nuevo turno
 * - PUT /turnos/:id - Actualizar turno completo
 * - PATCH /turnos/:id/estado - Cambiar solo el estado
 * - PATCH /turnos/:id/cancelar - Cancelar turno
 * - GET /turnos/horarios-disponibles - Consultar disponibilidad
 */

import api from './api';

// ============================================================================
// DEFINICIÓN DEL SERVICIO
// ============================================================================

export const turnoService = {
  // ==========================================================================
  // OBTENER TODOS LOS TURNOS (ADMIN)
  // ==========================================================================
  /**
   * OBTENER TODOS LOS TURNOS
   *
   * Obtiene el listado completo de turnos con paginación y filtros.
   * Solo disponible para administradores.
   *
   * @param {Object} parametros - Parámetros de consulta opcionales
   * @param {number} parametros.pagina - Número de página
   * @param {number} parametros.limite - Cantidad de resultados por página
   * @param {string} parametros.estado - Filtrar por estado del turno
   * @param {string} parametros.fecha - Filtrar por fecha
   * @returns {Promise<Object>} Lista de turnos con metadatos de paginación
   */
  obtenerTodos: async (parametros = {}) => {
    const respuesta = await api.get('/turnos', { params: parametros });
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER MIS TURNOS (CLIENTE O BARBERO)
  // ==========================================================================
  /**
   * OBTENER MIS TURNOS
   *
   * Obtiene los turnos del usuario autenticado.
   * - Si es cliente: turnos donde es el cliente
   * - Si es barbero: turnos que tiene asignados
   *
   * @param {Object} parametros - Parámetros de consulta opcionales
   * @param {string} parametros.estado - Filtrar por estado
   * @param {string} parametros.fecha - Filtrar por fecha
   * @returns {Promise<Object>} Lista de turnos del usuario
   */
  obtenerMisTurnos: async (parametros = {}) => {
    const respuesta = await api.get('/turnos/mis-turnos', { params: parametros });
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER UN TURNO POR ID
  // ==========================================================================
  /**
   * OBTENER TURNO POR ID
   *
   * Obtiene los detalles completos de un turno específico.
   *
   * @param {string} idTurno - ID del turno a obtener
   * @returns {Promise<Object>} Datos completos del turno
   */
  obtenerTurnoPorId: async (idTurno) => {
    const respuesta = await api.get(`/turnos/${idTurno}`);
    return respuesta.data;
  },

  // ==========================================================================
  // CREAR NUEVO TURNO (RESERVAR)
  // ==========================================================================
  /**
   * CREAR TURNO
   *
   * Crea una nueva reserva de turno en el sistema.
   *
   * @param {Object} datosTurno - Información del turno a crear
   * @param {string} datosTurno.servicioId - ID del servicio a realizar
   * @param {string} datosTurno.fecha - Fecha del turno (YYYY-MM-DD)
   * @param {string} datosTurno.hora - Hora del turno (HH:MM)
   * @param {string} datosTurno.barberoId - ID del barbero (opcional)
   * @param {Object} datosTurno.clienteData - Datos del cliente si no está autenticado
   * @param {number} datosTurno.precio - Precio del servicio
   * @returns {Promise<Object>} Turno creado
   */
  crearTurno: async (datosTurno) => {
    const respuesta = await api.post('/turnos', datosTurno);
    return respuesta.data;
  },

  // ==========================================================================
  // ACTUALIZAR TURNO
  // ==========================================================================
  /**
   * ACTUALIZAR TURNO
   *
   * Actualiza la información completa de un turno existente.
   *
   * @param {string} idTurno - ID del turno a actualizar
   * @param {Object} datosActualizados - Nuevos datos del turno
   * @returns {Promise<Object>} Turno actualizado
   */
  actualizarTurno: async (idTurno, datosActualizados) => {
    const respuesta = await api.put(`/turnos/${idTurno}`, datosActualizados);
    return respuesta.data;
  },

  // ==========================================================================
  // ACTUALIZAR SOLO EL ESTADO DEL TURNO
  // ==========================================================================
  /**
   * ACTUALIZAR ESTADO
   *
   * Cambia únicamente el estado de un turno.
   * Estados: pendiente, confirmado, en_proceso, completado, cancelado
   *
   * @param {string} idTurno - ID del turno
   * @param {string} nuevoEstado - Nuevo estado del turno
   * @returns {Promise<Object>} Turno con estado actualizado
   */
  actualizarEstado: async (idTurno, nuevoEstado) => {
    const respuesta = await api.patch(`/turnos/${idTurno}/estado`, {
      estado: nuevoEstado,
    });
    return respuesta.data;
  },

  // ==========================================================================
  // CANCELAR TURNO
  // ==========================================================================
  /**
   * CANCELAR TURNO
   *
   * Marca un turno como cancelado.
   *
   * @param {string} idTurno - ID del turno a cancelar
   * @returns {Promise<Object>} Turno cancelado
   */
  cancelarTurno: async (idTurno) => {
    const respuesta = await api.patch(`/turnos/${idTurno}/cancelar`);
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER HORARIOS DISPONIBLES
  // ==========================================================================
  /**
   * OBTENER HORARIOS DISPONIBLES
   *
   * Consulta qué horarios están disponibles para reservar en una fecha específica.
   *
   * @param {Object} parametros - Parámetros de consulta
   * @param {string} parametros.fecha - Fecha a consultar (YYYY-MM-DD)
   * @param {string} parametros.servicioId - ID del servicio (para calcular duración)
   * @param {string} parametros.barberoId - ID del barbero específico (opcional)
   * @returns {Promise<Object>} Lista de horarios disponibles
   */
  obtenerHorariosDisponibles: async (parametros = {}) => {
    const respuesta = await api.get('/turnos/horarios-disponibles', {
      params: parametros,
    });
    return respuesta.data;
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default turnoService;

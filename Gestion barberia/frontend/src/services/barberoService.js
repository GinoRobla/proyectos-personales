/**
 * ============================================================================
 * SERVICIO: GESTIÓN DE BARBEROS
 * ============================================================================
 *
 * Maneja todas las operaciones relacionadas con los barberos de la barbería.
 *
 * RESPONSABILIDADES:
 * - Obtener listado de barberos
 * - Consultar disponibilidad de barberos
 * - Obtener información de un barbero específico
 * - Crear nuevos barberos (admin)
 * - Actualizar información de barberos (admin)
 * - Eliminar barberos (admin)
 *
 * ENDPOINTS UTILIZADOS:
 * - GET /barberos - Listar barberos
 * - GET /barberos/disponibles - Barberos disponibles en fecha/hora
 * - GET /barberos/:id - Obtener un barbero específico
 * - POST /barberos - Crear nuevo barbero
 * - PUT /barberos/:id - Actualizar barbero
 * - DELETE /barberos/:id - Eliminar barbero
 */

import api from './api';

// ============================================================================
// DEFINICIÓN DEL SERVICIO
// ============================================================================

export const barberoService = {
  // ==========================================================================
  // OBTENER LISTADO DE BARBEROS
  // ==========================================================================
  /**
   * OBTENER BARBEROS
   *
   * Obtiene el listado de barberos de la barbería.
   *
   * @param {boolean} soloActivos - Si es true, solo devuelve barberos activos
   * @returns {Promise<Object>} Lista de barberos
   */
  obtenerBarberos: async (soloActivos) => {
    const parametros = {};

    // Si se especifica filtro de activos, agregarlo a los parámetros
    if (soloActivos !== undefined) {
      parametros.activo = soloActivos;
    }

    const respuesta = await api.get('/barberos', { params: parametros });
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER BARBEROS DISPONIBLES
  // ==========================================================================
  /**
   * OBTENER BARBEROS DISPONIBLES
   *
   * Consulta qué barberos están disponibles en una fecha y hora específica.
   * Útil para saber quién puede atender un turno en un momento determinado.
   *
   * @param {string} fecha - Fecha a consultar (YYYY-MM-DD)
   * @param {string} hora - Hora a consultar (HH:MM)
   * @returns {Promise<Object>} Lista de barberos disponibles
   */
  obtenerBarberosDisponibles: async (fecha, hora) => {
    const parametros = {};

    // Agregar fecha si está definida
    if (fecha) {
      parametros.fecha = fecha;
    }

    // Agregar hora si está definida
    if (hora) {
      parametros.hora = hora;
    }

    const respuesta = await api.get('/barberos/disponibles', {
      params: parametros,
    });
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER UN BARBERO POR ID
  // ==========================================================================
  /**
   * OBTENER BARBERO POR ID
   *
   * Obtiene la información detallada de un barbero específico.
   *
   * @param {string} idBarbero - ID del barbero a obtener
   * @returns {Promise<Object>} Datos completos del barbero
   */
  obtenerBarberoPorId: async (idBarbero) => {
    const respuesta = await api.get(`/barberos/${idBarbero}`);
    return respuesta.data;
  },

  // ==========================================================================
  // CREAR NUEVO BARBERO (ADMIN)
  // ==========================================================================
  /**
   * CREAR BARBERO
   *
   * Crea un nuevo barbero en el sistema.
   * Solo disponible para administradores.
   *
   * @param {Object} datosBarbero - Información del barbero a crear
   * @param {string} datosBarbero.nombre - Nombre del barbero
   * @param {string} datosBarbero.apellido - Apellido del barbero
   * @param {string} datosBarbero.email - Email del barbero
   * @param {string} datosBarbero.telefono - Teléfono del barbero
   * @param {Array<string>} datosBarbero.especialidades - Lista de especialidades
   * @param {boolean} datosBarbero.activo - Si está activo o no
   * @returns {Promise<Object>} Barbero creado
   */
  crearBarbero: async (datosBarbero) => {
    const respuesta = await api.post('/barberos', datosBarbero);
    return respuesta.data;
  },

  // ==========================================================================
  // ACTUALIZAR BARBERO (ADMIN)
  // ==========================================================================
  /**
   * ACTUALIZAR BARBERO
   *
   * Actualiza la información de un barbero existente.
   * Solo disponible para administradores.
   *
   * @param {string} idBarbero - ID del barbero a actualizar
   * @param {Object} datosActualizados - Nuevos datos del barbero
   * @returns {Promise<Object>} Barbero actualizado
   */
  actualizarBarbero: async (idBarbero, datosActualizados) => {
    const respuesta = await api.put(`/barberos/${idBarbero}`, datosActualizados);
    return respuesta.data;
  },

  // ==========================================================================
  // ELIMINAR BARBERO (ADMIN)
  // ==========================================================================
  /**
   * ELIMINAR BARBERO
   *
   * Elimina un barbero del sistema (soft delete: marca como inactivo).
   * Solo disponible para administradores.
   *
   * @param {string} idBarbero - ID del barbero a eliminar
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  eliminarBarbero: async (idBarbero) => {
    const respuesta = await api.delete(`/barberos/${idBarbero}`);
    return respuesta.data;
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default barberoService;

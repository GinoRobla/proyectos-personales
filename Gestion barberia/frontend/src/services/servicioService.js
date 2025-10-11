/**
 * ============================================================================
 * SERVICIO: GESTIÓN DE SERVICIOS
 * ============================================================================
 *
 * Maneja todas las operaciones relacionadas con los servicios ofrecidos
 * por la barbería (cortes, coloración, afeitado, etc.).
 *
 * RESPONSABILIDADES:
 * - Obtener listado de servicios
 * - Obtener información de un servicio específico
 * - Crear nuevos servicios (admin)
 * - Actualizar información de servicios (admin)
 * - Eliminar servicios (admin)
 *
 * ENDPOINTS UTILIZADOS:
 * - GET /servicios - Listar servicios
 * - GET /servicios/:id - Obtener un servicio específico
 * - POST /servicios - Crear nuevo servicio
 * - PUT /servicios/:id - Actualizar servicio
 * - DELETE /servicios/:id - Eliminar servicio
 */

import api from './api';

// ============================================================================
// DEFINICIÓN DEL SERVICIO
// ============================================================================

export const servicioService = {
  // ==========================================================================
  // OBTENER LISTADO DE SERVICIOS
  // ==========================================================================
  /**
   * OBTENER SERVICIOS
   *
   * Obtiene el listado de servicios ofrecidos por la barbería.
   *
   * @param {boolean} soloActivos - Si es true, solo devuelve servicios activos (por defecto true)
   * @returns {Promise<Object>} Lista de servicios
   */
  obtenerServicios: async (soloActivos = true) => {
    const respuesta = await api.get('/servicios', {
      params: { activo: soloActivos },
    });
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER UN SERVICIO POR ID
  // ==========================================================================
  /**
   * OBTENER SERVICIO POR ID
   *
   * Obtiene la información detallada de un servicio específico.
   *
   * @param {string} idServicio - ID del servicio a obtener
   * @returns {Promise<Object>} Datos completos del servicio
   */
  obtenerServicioPorId: async (idServicio) => {
    const respuesta = await api.get(`/servicios/${idServicio}`);
    return respuesta.data;
  },

  // ==========================================================================
  // CREAR NUEVO SERVICIO (ADMIN)
  // ==========================================================================
  /**
   * CREAR SERVICIO
   *
   * Crea un nuevo servicio en el sistema.
   * Solo disponible para administradores.
   *
   * @param {Object} datosServicio - Información del servicio a crear
   * @param {string} datosServicio.nombre - Nombre del servicio
   * @param {string} datosServicio.descripcion - Descripción del servicio
   * @param {number} datosServicio.precioBase - Precio base del servicio
   * @param {number} datosServicio.duracion - Duración en minutos
   * @param {boolean} datosServicio.activo - Si está activo o no
   * @returns {Promise<Object>} Servicio creado
   */
  crearServicio: async (datosServicio) => {
    const respuesta = await api.post('/servicios', datosServicio);
    return respuesta.data;
  },

  // ==========================================================================
  // ACTUALIZAR SERVICIO (ADMIN)
  // ==========================================================================
  /**
   * ACTUALIZAR SERVICIO
   *
   * Actualiza la información de un servicio existente.
   * Solo disponible para administradores.
   *
   * @param {string} idServicio - ID del servicio a actualizar
   * @param {Object} datosActualizados - Nuevos datos del servicio
   * @returns {Promise<Object>} Servicio actualizado
   */
  actualizarServicio: async (idServicio, datosActualizados) => {
    const respuesta = await api.put(`/servicios/${idServicio}`, datosActualizados);
    return respuesta.data;
  },

  // ==========================================================================
  // ELIMINAR SERVICIO (ADMIN)
  // ==========================================================================
  /**
   * ELIMINAR SERVICIO
   *
   * Elimina un servicio del sistema (soft delete: marca como inactivo).
   * Solo disponible para administradores.
   *
   * @param {string} idServicio - ID del servicio a eliminar
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  eliminarServicio: async (idServicio) => {
    const respuesta = await api.delete(`/servicios/${idServicio}`);
    return respuesta.data;
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default servicioService;

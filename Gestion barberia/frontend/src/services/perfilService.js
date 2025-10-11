/**
 * ============================================================================
 * SERVICIO: PERFIL DE USUARIO
 * ============================================================================
 *
 * Maneja las operaciones relacionadas con la gestión del perfil del
 * usuario autenticado.
 *
 * RESPONSABILIDADES:
 * - Obtener información del perfil del usuario
 * - Actualizar datos del perfil
 * - Cambiar contraseña del usuario
 *
 * ENDPOINTS UTILIZADOS:
 * - GET /perfil - Obtener perfil del usuario autenticado
 * - PUT /perfil - Actualizar perfil
 * - PUT /perfil/password - Cambiar contraseña
 */

import api from './api';

// ============================================================================
// DEFINICIÓN DEL SERVICIO
// ============================================================================

const perfilService = {
  // ==========================================================================
  // OBTENER PERFIL DEL USUARIO AUTENTICADO
  // ==========================================================================
  /**
   * OBTENER MI PERFIL
   *
   * Obtiene toda la información del perfil del usuario actualmente autenticado.
   *
   * @returns {Promise<Object>} Datos del perfil del usuario
   */
  obtenerMiPerfil: async () => {
    try {
      const respuesta = await api.get('/perfil');
      return respuesta.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  },

  // ==========================================================================
  // ACTUALIZAR PERFIL DEL USUARIO
  // ==========================================================================
  /**
   * ACTUALIZAR MI PERFIL
   *
   * Actualiza la información del perfil del usuario autenticado.
   * Permite modificar nombre, apellido, teléfono, etc.
   *
   * @param {Object} datosActualizados - Nuevos datos del perfil
   * @param {string} datosActualizados.nombre - Nombre actualizado (opcional)
   * @param {string} datosActualizados.apellido - Apellido actualizado (opcional)
   * @param {string} datosActualizados.telefono - Teléfono actualizado (opcional)
   * @returns {Promise<Object>} Perfil actualizado
   */
  actualizarMiPerfil: async (datosActualizados) => {
    try {
      const respuesta = await api.put('/perfil', datosActualizados);
      return respuesta.data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  },

  // ==========================================================================
  // CAMBIAR CONTRASEÑA DEL USUARIO
  // ==========================================================================
  /**
   * CAMBIAR CONTRASEÑA
   *
   * Permite al usuario cambiar su contraseña actual por una nueva.
   * Requiere la contraseña actual para validar la operación.
   *
   * @param {string} contrasenaActual - Contraseña actual del usuario
   * @param {string} contrasenaNueva - Nueva contraseña deseada
   * @returns {Promise<Object>} Confirmación del cambio
   */
  cambiarPassword: async (contrasenaActual, contrasenaNueva) => {
    try {
      const respuesta = await api.put('/perfil/password', {
        passwordActual: contrasenaActual,
        passwordNuevo: contrasenaNueva,
      });
      return respuesta.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default perfilService;

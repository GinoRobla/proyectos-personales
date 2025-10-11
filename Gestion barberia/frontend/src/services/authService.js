/**
 * ============================================================================
 * SERVICIO: AUTENTICACIÓN
 * ============================================================================
 *
 * Maneja todas las operaciones relacionadas con autenticación y gestión
 * de perfiles de usuario.
 *
 * RESPONSABILIDADES:
 * - Registro de nuevos usuarios
 * - Inicio de sesión tradicional (email/contraseña)
 * - Inicio de sesión con Google OAuth
 * - Verificación de tokens JWT
 * - Gestión del perfil de usuario
 * - Cambio de contraseña
 *
 * ENDPOINTS UTILIZADOS:
 * - POST /auth/registro - Crear nueva cuenta
 * - POST /auth/login - Autenticar usuario
 * - GET /auth/verificar - Validar token JWT
 * - GET /auth/perfil - Obtener datos del perfil
 * - PUT /auth/perfil - Actualizar datos del perfil
 * - PUT /auth/cambiar-password - Cambiar contraseña
 */

import api from './api';

// ============================================================================
// DEFINICIÓN DEL SERVICIO
// ============================================================================

export const authService = {
  // ==========================================================================
  // REGISTRAR NUEVO USUARIO
  // ==========================================================================
  /**
   * REGISTRAR USUARIO
   *
   * Crea una nueva cuenta de usuario en el sistema.
   *
   * @param {Object} datosUsuario - Datos del nuevo usuario
   * @param {string} datosUsuario.nombre - Nombre del usuario
   * @param {string} datosUsuario.apellido - Apellido del usuario
   * @param {string} datosUsuario.email - Email del usuario
   * @param {string} datosUsuario.telefono - Teléfono del usuario
   * @param {string} datosUsuario.password - Contraseña del usuario
   * @param {string} datosUsuario.rol - Rol del usuario (cliente, barbero, admin)
   * @returns {Promise<Object>} Respuesta con token y datos del usuario
   */
  registro: async (datosUsuario) => {
    const respuesta = await api.post('/auth/registro', datosUsuario);
    return respuesta.data;
  },

  // ==========================================================================
  // INICIAR SESIÓN TRADICIONAL
  // ==========================================================================
  /**
   * INICIAR SESIÓN
   *
   * Autentica un usuario con email y contraseña.
   *
   * @param {string} correoElectronico - Email del usuario
   * @param {string} contrasena - Contraseña del usuario
   * @returns {Promise<Object>} Respuesta con token y datos del usuario
   */
  login: async (correoElectronico, contrasena) => {
    const respuesta = await api.post('/auth/login', {
      email: correoElectronico,
      password: contrasena,
    });
    return respuesta.data;
  },

  // ==========================================================================
  // VERIFICAR TOKEN
  // ==========================================================================
  /**
   * VERIFICAR TOKEN
   *
   * Valida si el token JWT actual sigue siendo válido.
   *
   * @returns {Promise<Object>} Respuesta con datos del usuario si el token es válido
   */
  verificarToken: async () => {
    const respuesta = await api.get('/auth/verificar');
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER PERFIL DEL USUARIO AUTENTICADO
  // ==========================================================================
  /**
   * OBTENER PERFIL
   *
   * Obtiene los datos del perfil del usuario autenticado actualmente.
   *
   * @returns {Promise<Object>} Datos del perfil del usuario
   */
  obtenerPerfil: async () => {
    const respuesta = await api.get('/auth/perfil');
    return respuesta.data;
  },

  // ==========================================================================
  // ACTUALIZAR PERFIL DEL USUARIO
  // ==========================================================================
  /**
   * ACTUALIZAR PERFIL
   *
   * Actualiza los datos del perfil del usuario autenticado.
   *
   * @param {Object} datosActualizados - Nuevos datos del perfil
   * @param {string} datosActualizados.nombre - Nombre actualizado (opcional)
   * @param {string} datosActualizados.apellido - Apellido actualizado (opcional)
   * @param {string} datosActualizados.telefono - Teléfono actualizado (opcional)
   * @returns {Promise<Object>} Datos actualizados del usuario
   */
  actualizarPerfil: async (datosActualizados) => {
    const respuesta = await api.put('/auth/perfil', datosActualizados);
    return respuesta.data;
  },

  // ==========================================================================
  // CAMBIAR CONTRASEÑA
  // ==========================================================================
  /**
   * CAMBIAR CONTRASEÑA
   *
   * Permite al usuario cambiar su contraseña actual por una nueva.
   *
   * @param {string} contrasenaActual - Contraseña actual del usuario
   * @param {string} contrasenaNueva - Nueva contraseña deseada
   * @returns {Promise<Object>} Confirmación del cambio de contraseña
   */
  cambiarPassword: async (contrasenaActual, contrasenaNueva) => {
    const respuesta = await api.put('/auth/cambiar-password', {
      passwordActual: contrasenaActual,
      passwordNuevo: contrasenaNueva,
    });
    return respuesta.data;
  },

  // ==========================================================================
  // OBTENER URL DE LOGIN CON GOOGLE
  // ==========================================================================
  /**
   * OBTENER URL DE GOOGLE OAUTH
   *
   * Genera la URL de autenticación con Google OAuth.
   *
   * @returns {string} URL completa para redireccionar al flujo de Google OAuth
   */
  getGoogleLoginUrl: () => {
    // Obtener la URL base del API desde variables de entorno
    const urlBaseApi = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Remover '/api' del final si existe y agregar el endpoint de Google OAuth
    const urlBase = urlBaseApi.replace('/api', '');

    return `${urlBase}/api/auth/google`;
  },
};

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default authService;

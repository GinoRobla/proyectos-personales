/**
 * ============================================================================
 * SERVICIO: CLIENTE HTTP (API)
 * ============================================================================
 *
 * Configuración centralizada del cliente HTTP basado en Axios para todas
 * las peticiones al backend.
 *
 * RESPONSABILIDADES:
 * - Crear instancia configurada de Axios con URL base
 * - Agregar automáticamente el token JWT a cada petición
 * - Manejar errores de autenticación globalmente
 * - Configurar headers por defecto
 *
 * INTERCEPTORES:
 * - Request: Agrega el token de autorización antes de cada petición
 * - Response: Maneja errores 401 (no autorizado) redirigiendo al login
 *
 * USO:
 * import api from './api';
 * const response = await api.get('/endpoint');
 * const response = await api.post('/endpoint', datos);
 */

import axios from 'axios';

// ============================================================================
// CONFIGURACIÓN DE LA URL BASE
// ============================================================================

// URL del backend obtenida desde variables de entorno
// Si no está definida, usar localhost como fallback
const URL_BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// CREACIÓN DE LA INSTANCIA DE AXIOS
// ============================================================================

/**
 * Instancia configurada de Axios para comunicación con el backend.
 *
 * Configuración:
 * - baseURL: URL base del API
 * - headers: Content-Type como JSON por defecto
 */
const api = axios.create({
  baseURL: URL_BASE_API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// INTERCEPTOR DE REQUEST
// ============================================================================

/**
 * INTERCEPTOR: Agregar token de autenticación
 *
 * Se ejecuta antes de cada petición HTTP.
 *
 * Proceso:
 * 1. Buscar el token en localStorage
 * 2. Si existe, agregarlo al header Authorization
 * 3. Enviar la petición con el token incluido
 */
api.interceptors.request.use(
  (configuracion) => {
    // Paso 1: Obtener el token guardado en localStorage
    const tokenGuardado = localStorage.getItem('token');

    // Paso 2: Si hay token, agregarlo a los headers
    if (tokenGuardado) {
      configuracion.headers.Authorization = `Bearer ${tokenGuardado}`;
    }

    // Paso 3: Retornar la configuración modificada
    return configuracion;
  },
  (error) => {
    // Si hay error en la preparación de la petición, rechazar
    return Promise.reject(error);
  }
);

// ============================================================================
// INTERCEPTOR DE RESPONSE
// ============================================================================

/**
 * INTERCEPTOR: Manejar errores de respuesta
 *
 * Se ejecuta después de recibir cada respuesta HTTP.
 *
 * Proceso:
 * 1. Si la respuesta es exitosa, pasarla sin modificar
 * 2. Si hay error 401 (No autorizado):
 *    - El token es inválido o expiró
 *    - Limpiar localStorage
 *    - Redirigir al usuario al login
 * 3. Para otros errores, rechazar la promesa normalmente
 */
api.interceptors.response.use(
  (respuesta) => {
    // Paso 1: Si la respuesta es exitosa, retornarla sin cambios
    return respuesta;
  },
  (error) => {
    // Paso 2: Si el error es 401 (No autorizado)
    if (error.response?.status === 401) {
      // El token expiró o es inválido
      // Limpiar datos de autenticación
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');

      // Redirigir al login
      window.location.href = '/login';
    }

    // Paso 3: Rechazar la promesa con el error
    return Promise.reject(error);
  }
);

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export default api;
